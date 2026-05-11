/**
 * Main application logic — runs entirely in the browser.
 */

import { parseCsv, type CsvParseResult } from './csv-parser';
import { renderTemplate } from './template-renderer';
import { safeFilename } from './filename';
import { generateZip, downloadBlob } from './zip-generator';
import { validateColumns } from './validation';

// ── State ──────────────────────────────────────────────────────────
let csvData: CsvParseResult | null = null;
let templateHtml = '';
let zipBlob: Blob | null = null;

// ── DOM Elements ───────────────────────────────────────────────────
const dropZone = document.getElementById('drop-zone')!;
const csvInput = document.getElementById('csv-input') as HTMLInputElement;
const fileInfo = document.getElementById('file-info')!;
const fileName = document.getElementById('file-name')!;
const fileRemove = document.getElementById('file-remove')!;
const csvMessages = document.getElementById('csv-messages')!;
const templateSelect = document.getElementById('template-select') as HTMLSelectElement;
const previewIframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
const columnMapping = document.getElementById('column-mapping')!;
const btnGenerate = document.getElementById('btn-generate') as HTMLButtonElement;
const progressContainer = document.getElementById('progress-container')!;
const progressFill = document.getElementById('progress-fill')!;
const progressText = document.getElementById('progress-text')!;
const genMessages = document.getElementById('gen-messages')!;
const cardResult = document.getElementById('card-result')!;
const resultCount = document.getElementById('result-count')!;
const btnDownload = document.getElementById('btn-download')!;
const steps = [
  document.getElementById('step-1')!,
  document.getElementById('step-2')!,
  document.getElementById('step-3')!,
];

// ── Template Loading ───────────────────────────────────────────────
async function loadTemplate() {
  const url = templateSelect.value;
  const res = await fetch(url);
  templateHtml = await res.text();
  previewIframe.srcdoc = templateHtml;
}

loadTemplate();
templateSelect.addEventListener('change', loadTemplate);

// ── CSV Upload ─────────────────────────────────────────────────────
dropZone.addEventListener('click', () => csvInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer?.files.length) handleFile(e.dataTransfer.files[0]);
});
csvInput.addEventListener('change', () => {
  if (csvInput.files?.length) handleFile(csvInput.files[0]);
});
fileRemove.addEventListener('click', resetCsv);

function handleFile(file: File) {
  if (!file.name.endsWith('.csv')) {
    showMessage(csvMessages, 'error', 'Please upload a .csv file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const result = parseCsv(text);

    csvMessages.innerHTML = '';

    if (result.errors.length) {
      result.errors.forEach(err => showMessage(csvMessages, 'error', err));
      return;
    }

    csvData = result;
    fileName.textContent = `${file.name} (${result.users.length} users, ${result.columns.length} columns)`;
    fileInfo.style.display = 'flex';
    dropZone.style.display = 'none';

    // Show column mapping
    const requiredFields = ['FirstName', 'LastName', 'Mail'];
    const validation = validateColumns(result.columns, requiredFields);

    const colTags = result.columns.map(c => {
      const code = document.createElement('code');
      code.textContent = '{{' + c + '}}';
      return code.outerHTML;
    }).join(' ');
    columnMapping.innerHTML = '<strong>Columns detected:</strong> ' + colTags;

    if (validation.errors.length) {
      validation.errors.forEach(err => showMessage(csvMessages, 'warning', err));
    }

    btnGenerate.disabled = false;
    updateSteps(2);
    showMessage(csvMessages, 'success', `✓ Loaded ${result.users.length} user(s) from ${file.name}`);
  };
  reader.readAsText(file);
}

function resetCsv() {
  csvData = null;
  fileInfo.style.display = 'none';
  dropZone.style.display = '';
  csvInput.value = '';
  csvMessages.innerHTML = '';
  columnMapping.innerHTML = '';
  btnGenerate.disabled = true;
  cardResult.classList.remove('visible');
  progressContainer.classList.remove('visible');
  genMessages.innerHTML = '';
  updateSteps(1);
}

// ── Generation ─────────────────────────────────────────────────────
btnGenerate.addEventListener('click', async () => {
  if (!csvData || !templateHtml) return;

  btnGenerate.disabled = true;
  genMessages.innerHTML = '';
  progressContainer.classList.add('visible');
  cardResult.classList.remove('visible');
  updateSteps(3);

  const files: { filename: string; content: string }[] = [];
  const total = csvData.users.length;
  let processed = 0;
  let warnings = 0;

  for (const user of csvData.users) {
    const html = renderTemplate(templateHtml, user);
    const fname = safeFilename(user['FirstName'] || '', user['LastName'] || '');

    files.push({ filename: fname, content: html });
    processed++;

    if (!user['FirstName'] || !user['LastName']) warnings++;

    // Update progress
    const pct = Math.round((processed / total) * 100);
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${processed} / ${total}`;

    // Yield to UI every 10 rows for large files
    if (processed % 10 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // Generate ZIP
  progressText.textContent = 'Creating ZIP...';
  try {
    zipBlob = await generateZip(files);
  } catch (err: any) {
    showMessage(genMessages, 'error', err.message);
    btnGenerate.disabled = false;
    return;
  }

  // Done
  progressText.textContent = `${processed} / ${total} — Done!`;
  resultCount.textContent = processed.toString();
  cardResult.classList.add('visible');

  if (warnings > 0) {
    showMessage(genMessages, 'warning', `${warnings} user(s) had missing name fields.`);
  }
  showMessage(genMessages, 'success', `✓ ${processed} signature(s) ready for download.`);

  btnGenerate.disabled = false;
});

// ── Download ───────────────────────────────────────────────────────
btnDownload.addEventListener('click', () => {
  if (zipBlob) {
    downloadBlob(zipBlob, 'email-signatures.zip');
  }
});

// ── Helpers ────────────────────────────────────────────────────────
function showMessage(container: HTMLElement, type: string, text: string) {
  const div = document.createElement('div');
  div.className = `msg msg-${type}`;
  div.textContent = text;
  container.appendChild(div);
}

function updateSteps(activeStep: number) {
  steps.forEach((step, i) => {
    step.classList.toggle('active', i < activeStep);
  });
}

