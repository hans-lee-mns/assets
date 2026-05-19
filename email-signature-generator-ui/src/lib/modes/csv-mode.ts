/**
 * CSV Upload mode — handles drop zone, parsing, validation, batch generation.
 * Supports uploading one or many CSV files at once. When multiple CSVs are
 * provided, each becomes a subfolder (named after the CSV stem) inside the
 * downloaded ZIP. When a single CSV is uploaded the ZIP is named after it.
 */

import { parseCsv, type CsvParseResult, type ParsedUser } from '../csv-parser';
import { renderTemplate } from '../template-renderer';
import { safeFilename, zipNameFromCsvFilename } from '../filename';
import { generateZip, downloadBlob } from '../zip-generator';
import { validateColumns } from '../validation';
import { $, showMessage, clearMessages, setActiveSteps } from '../dom';

const REQUIRED_FIELDS = ['FirstName', 'LastName', 'Mail'];
const DEFAULT_ZIP_NAME = 'email-signatures.zip';

interface CsvEntry {
  id: string;
  file: File;
  /** Stem name (no .csv extension) — used as the in-zip folder name. */
  stem: string;
  data: CsvParseResult;
}

export interface CsvModeDeps {
  /** Returns the latest template HTML (already loaded). */
  getTemplateHtml: () => string;
  /** Steps indicator pills (shared with single mode). */
  steps: HTMLElement[];
}

export function initCsvMode(deps: CsvModeDeps): { reset: () => void } {
  // ── State ────────────────────────────────────────────────────────
  const entries: CsvEntry[] = [];
  let zipBlob: Blob | null = null;
  let zipFilename = DEFAULT_ZIP_NAME;

  // ── DOM ──────────────────────────────────────────────────────────
  const dropZone = $('drop-zone');
  const csvInput = $<HTMLInputElement>('csv-input');
  const fileListEl = $('file-list');
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
    if (e.dataTransfer?.files.length) handleFiles(e.dataTransfer.files);
  });
  csvInput.addEventListener('change', () => {
    if (csvInput.files?.length) handleFiles(csvInput.files);
    csvInput.value = ''; // allow re-selecting same file
  });

  function handleFiles(list: FileList) {
    const files = Array.from(list);
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        showMessage(csvMessages, 'error', `"${file.name}" is not a .csv file — skipped.`);
        continue;
      }
      const dup = entries.find(
        (e) => e.file.name === file.name && e.file.size === file.size
      );
      if (dup) {
        showMessage(csvMessages, 'warning', `"${file.name}" is already in the list — skipped.`);
        continue;
      }
      readAndAddFile(file);
    }
  }

  function readAndAddFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsv(text);

      if (result.errors.length) {
        result.errors.forEach((err) =>
          showMessage(csvMessages, 'error', `"${file.name}": ${err}`)
        );
        return;
      }

      const stem = file.name.replace(/\.csv$/i, '').trim() || 'signatures';
      entries.push({
        id: `${file.name}__${file.size}__${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        file,
        stem,
        data: result,
      });

      // Show columns of the *latest* file
      renderColumnMapping(result.columns);

      const validation = validateColumns(result.columns, REQUIRED_FIELDS);
      if (validation.errors.length) {
        validation.errors.forEach((err) =>
          showMessage(csvMessages, 'warning', `"${file.name}": ${err}`)
        );
      }

      refreshFileList();
      btnGenerate.disabled = entries.length === 0;
      setActiveSteps(deps.steps, 2);
      showMessage(
        csvMessages,
        'success',
        `✓ Loaded ${result.users.length} user(s) from ${file.name}`
      );
    };
    reader.readAsText(file);
  }

  function renderColumnMapping(columns: string[]) {
    const colTags = columns
      .map((c) => {
        const code = document.createElement('code');
        code.textContent = '{{' + c + '}}';
        return code.outerHTML;
      })
      .join(' ');
    columnMapping.innerHTML = '<strong>Columns detected:</strong> ' + colTags;
  }

  function refreshFileList() {
    fileListEl.innerHTML = '';
    if (entries.length === 0) {
      fileListEl.style.display = 'none';
      dropZone.style.display = '';
      columnMapping.innerHTML = '';
      return;
    }

    fileListEl.style.display = 'flex';
    // Keep drop zone visible so users can add more files
    dropZone.style.display = '';

    for (const entry of entries) {
      const row = document.createElement('div');
      row.className = 'file-info';

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = entry.file.name;

      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = `${entry.data.users.length} users · ${entry.data.columns.length} cols`;

      const remove = document.createElement('span');
      remove.className = 'remove';
      remove.textContent = '✕ Remove';
      remove.addEventListener('click', () => removeEntry(entry.id));

      row.appendChild(name);
      row.appendChild(meta);
      row.appendChild(remove);
      fileListEl.appendChild(row);
    }
  }

  function removeEntry(id: string) {
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return;
    entries.splice(idx, 1);

    if (entries.length === 0) {
      reset();
      return;
    }
    renderColumnMapping(entries[entries.length - 1].data.columns);
    refreshFileList();
  }

  function reset() {
    entries.length = 0;
    zipBlob = null;
    zipFilename = DEFAULT_ZIP_NAME;
    fileListEl.innerHTML = '';
    fileListEl.style.display = 'none';
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
    if (entries.length === 0 || !templateHtml) return;

    btnGenerate.disabled = true;
    clearMessages(genMessages);
    progressContainer.classList.add('visible');
    cardResult.classList.remove('visible');
    setActiveSteps(deps.steps, 3);

    const files: { filename: string; content: string }[] = [];
    const total = entries.reduce((sum, e) => sum + e.data.users.length, 0);
    let processed = 0;
    let warnings = 0;

    // Handle duplicate stems across CSV files
    const stemCounts = new Map<string, number>();
    const folderForEntry = (entry: CsvEntry): string => {
      if (entries.length === 1) return ''; // flat ZIP for a single CSV
      const base = entry.stem;
      const count = stemCounts.get(base) ?? 0;
      stemCounts.set(base, count + 1);
      return count === 0 ? `${base}/` : `${base} (${count + 1})/`;
    };

    for (const entry of entries) {
      const folder = folderForEntry(entry);
      const usedNames = new Set<string>();

      for (const user of entry.data.users as ParsedUser[]) {
        const html = renderTemplate(templateHtml, user);
        let fname = safeFilename(user['FirstName'] || '', user['LastName'] || '');

        // De-duplicate within the same folder
        if (usedNames.has(fname)) {
          const dot = fname.lastIndexOf('.');
          const stem = dot === -1 ? fname : fname.slice(0, dot);
          const ext = dot === -1 ? '' : fname.slice(dot);
          let i = 2;
          while (usedNames.has(`${stem}_${i}${ext}`)) i++;
          fname = `${stem}_${i}${ext}`;
        }
        usedNames.add(fname);

        files.push({ filename: `${folder}${fname}`, content: html });
        processed++;

        if (!user['FirstName'] || !user['LastName']) warnings++;

        const pct = Math.round((processed / total) * 100);
        progressFill.style.width = `${pct}%`;
        progressText.textContent = `${processed} / ${total}`;

        if (processed % 10 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    }

    // ZIP name
    zipFilename =
      entries.length === 1
        ? zipNameFromCsvFilename(entries[0].file.name)
        : DEFAULT_ZIP_NAME;

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
    const fromCsv =
      entries.length === 1 ? entries[0].file.name : `${entries.length} CSV files`;
    showMessage(
      genMessages,
      'success',
      `✓ ${processed} signature(s) from ${fromCsv} ready for download.`
    );

    btnGenerate.disabled = false;
  });

  btnDownload.addEventListener('click', () => {
    if (zipBlob) downloadBlob(zipBlob, zipFilename);
  });

  return { reset };
}
