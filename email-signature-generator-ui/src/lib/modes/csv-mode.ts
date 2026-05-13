/**
 * CSV Upload mode — handles drop zone, parsing, validation, batch generation.
 */

import { parseCsv, type CsvParseResult } from '../csv-parser';
import { renderTemplate } from '../template-renderer';
import { safeFilename } from '../filename';
import { generateZip, downloadBlob } from '../zip-generator';
import { validateColumns } from '../validation';
import { $, showMessage, setMessage, clearMessages, setActiveSteps } from '../dom';

const REQUIRED_FIELDS = ['FirstName', 'LastName', 'Mail'];

export interface CsvModeDeps {
  /** Returns the latest template HTML (already loaded). */
  getTemplateHtml: () => string;
  /** Steps indicator pills (shared with single mode). */
  steps: HTMLElement[];
}

export function initCsvMode(deps: CsvModeDeps): { reset: () => void } {
  // ── State ────────────────────────────────────────────────────────
  let csvData: CsvParseResult | null = null;
  let zipBlob: Blob | null = null;

  // ── DOM ──────────────────────────────────────────────────────────
  const dropZone = $('drop-zone');
  const csvInput = $<HTMLInputElement>('csv-input');
  const fileInfo = $('file-info');
  const fileName = $('file-name');
  const fileRemove = $('file-remove');
  const csvMessages = $('csv-messages');
  const columnMapping = $('column-mapping');
  const btnGenerate = $<HTMLButtonElement>('csv-btn-generate');
  const progressContainer = $('csv-progress-container');
  const progressFill = $('csv-progress-fill');
  const progressText = $('csv-progress-text');
  const genMessages = $('csv-gen-messages');
  const cardResult = $('csv-card-result');
  const resultCount = $('csv-result-count');
  const btnDownload = $('csv-btn-download');

  // ── Upload wiring ────────────────────────────────────────────────
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
  fileRemove.addEventListener('click', reset);

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setMessage(csvMessages, 'error', 'Please upload a .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsv(text);

      clearMessages(csvMessages);

      if (result.errors.length) {
        result.errors.forEach((err) => showMessage(csvMessages, 'error', err));
        return;
      }

      csvData = result;
      fileName.textContent = `${file.name} (${result.users.length} users, ${result.columns.length} columns)`;
      fileInfo.style.display = 'flex';
      dropZone.style.display = 'none';

      // Column mapping + validation
      const validation = validateColumns(result.columns, REQUIRED_FIELDS);

      const colTags = result.columns
        .map((c) => {
          const code = document.createElement('code');
          code.textContent = '{{' + c + '}}';
          return code.outerHTML;
        })
        .join(' ');
      columnMapping.innerHTML = '<strong>Columns detected:</strong> ' + colTags;

      if (validation.errors.length) {
        validation.errors.forEach((err) => showMessage(csvMessages, 'warning', err));
      }

      btnGenerate.disabled = false;
      setActiveSteps(deps.steps, 2);
      showMessage(
        csvMessages,
        'success',
        `✓ Loaded ${result.users.length} user(s) from ${file.name}`
      );
    };
    reader.readAsText(file);
  }

  function reset() {
    csvData = null;
    zipBlob = null;
    fileInfo.style.display = 'none';
    dropZone.style.display = '';
    csvInput.value = '';
    clearMessages(csvMessages);
    columnMapping.innerHTML = '';
    btnGenerate.disabled = true;
    cardResult.classList.remove('visible');
    progressContainer.classList.remove('visible');
    clearMessages(genMessages);
    setActiveSteps(deps.steps, 1);
  }

  // ── Generate ─────────────────────────────────────────────────────
  btnGenerate.addEventListener('click', async () => {
    const templateHtml = deps.getTemplateHtml();
    if (!csvData || !templateHtml) return;

    btnGenerate.disabled = true;
    clearMessages(genMessages);
    progressContainer.classList.add('visible');
    cardResult.classList.remove('visible');
    setActiveSteps(deps.steps, 3);

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

      const pct = Math.round((processed / total) * 100);
      progressFill.style.width = `${pct}%`;
      progressText.textContent = `${processed} / ${total}`;

      if (processed % 10 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    progressText.textContent = 'Creating ZIP...';
    try {
      zipBlob = await generateZip(files);
    } catch (err: any) {
      showMessage(genMessages, 'error', err.message);
      btnGenerate.disabled = false;
      return;
    }

    progressText.textContent = `${processed} / ${total} — Done!`;
    resultCount.textContent = processed.toString();
    cardResult.classList.add('visible');

    if (warnings > 0) {
      showMessage(genMessages, 'warning', `${warnings} user(s) had missing name fields.`);
    }
    showMessage(genMessages, 'success', `✓ ${processed} signature(s) ready for download.`);

    btnGenerate.disabled = false;
  });

  btnDownload.addEventListener('click', () => {
    if (zipBlob) downloadBlob(zipBlob, 'email-signatures.zip');
  });

  return { reset };
}

