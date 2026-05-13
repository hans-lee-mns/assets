/**
 * Application bootstrap — mode switch + shared template loading.
 *
 * Architecture:
 *   - Mode switch toggles visibility of CSV vs Single sections.
 *   - Template select + preview iframe are shared.
 *   - Each mode (csv-mode, single-mode) wires its own DOM and exposes a reset().
 */

import { fetchTemplate, renderPreview } from './template-loader';
import { initCsvMode } from './modes/csv-mode';
import { initSingleMode } from './modes/single-mode';
import { $, setActiveSteps } from './dom';

type Mode = 'csv' | 'single';

// ── Shared DOM ─────────────────────────────────────────────────────
const templateSelect = $<HTMLSelectElement>('template-select');
const previewIframe = $<HTMLIFrameElement>('preview-iframe');
const modeRadios = Array.from(
  document.querySelectorAll<HTMLInputElement>('input[name="mode"]')
);
const sections = {
  csv: Array.from(document.querySelectorAll<HTMLElement>('[data-mode="csv"]')),
  single: Array.from(document.querySelectorAll<HTMLElement>('[data-mode="single"]')),
};
const steps = [$('step-1'), $('step-2'), $('step-3')];

// ── Shared state ───────────────────────────────────────────────────
let templateHtml = '';
let currentMode: Mode = 'csv';

const getTemplateHtml = () => templateHtml;

// ── Init modes (must happen before loadTemplate uses `single`) ─────
const csv = initCsvMode({ getTemplateHtml, steps });
const single = initSingleMode({ getTemplateHtml, previewIframe, steps });

// ── Template loading ───────────────────────────────────────────────
async function loadTemplate() {
  templateHtml = await fetchTemplate(templateSelect.value);
  if (currentMode === 'csv') {
    renderPreview(previewIframe, templateHtml);
  } else {
    single.refreshPreview();
  }
}

// ── Mode switching ─────────────────────────────────────────────────
function applyMode(mode: Mode) {
  currentMode = mode;
  for (const el of sections.csv) el.style.display = mode === 'csv' ? '' : 'none';
  for (const el of sections.single) el.style.display = mode === 'single' ? '' : 'none';
  setActiveSteps(steps, 1);

  if (mode === 'single') {
    single.refreshPreview();
  } else if (templateHtml) {
    renderPreview(previewIframe, templateHtml);
  }
}

// ── Wire shared controls ───────────────────────────────────────────
templateSelect.addEventListener('change', loadTemplate);

modeRadios.forEach((r) =>
  r.addEventListener('change', () => {
    if (r.checked) applyMode(r.value as Mode);
  })
);

// Default mode = CSV (also reflected in HTML `checked` attribute).
const defaultMode = (modeRadios.find((r) => r.checked)?.value as Mode) ?? 'csv';
applyMode(defaultMode);

// Kick off initial template load
loadTemplate().catch((err) => {
  console.error('[template] load failed:', err);
});

// Expose for debugging in dev console
(window as unknown as { __app: unknown }).__app = { csv, single, getTemplateHtml };

