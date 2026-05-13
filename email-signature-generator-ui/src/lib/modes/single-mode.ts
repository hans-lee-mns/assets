/**
 * Single User Form mode — manual entry, live validation, single-file ZIP.
 */

import { renderTemplate } from '../template-renderer';
import { renderPreview } from '../template-loader';
import { filenameFromEmail, zipNameFromEmail } from '../filename';
import { generateZip, downloadBlob } from '../zip-generator';
import { validateForm, type FieldErrors, type FieldRule } from '../validation';
import { $, showMessage, setMessage, clearMessages, setActiveSteps } from '../dom';

const FIELDS = ['FirstName', 'LastName', 'Mail', 'Title', 'MobilePhone'] as const;
type FieldName = (typeof FIELDS)[number];

const RULES: Record<string, FieldRule> = {
  FirstName: { required: true, label: 'First name' },
  LastName: { required: true, label: 'Last name' },
  Mail: { required: true, email: true, label: 'Email' },
  Title: { required: true, label: 'Title' },
  MobilePhone: { label: 'Mobile phone' },
};

export interface SingleModeDeps {
  /** Returns the latest template HTML (already loaded). */
  getTemplateHtml: () => string;
  /** Preview iframe shared across modes. */
  previewIframe: HTMLIFrameElement;
  steps: HTMLElement[];
}

export function initSingleMode(deps: SingleModeDeps): {
  reset: () => void;
  refreshPreview: () => void;
} {
  // ── DOM ──────────────────────────────────────────────────────────
  const form = $<HTMLFormElement>('single-form');
  const inputs: Record<FieldName, HTMLInputElement> = {
    FirstName: $<HTMLInputElement>('single-FirstName'),
    LastName: $<HTMLInputElement>('single-LastName'),
    Mail: $<HTMLInputElement>('single-Mail'),
    Title: $<HTMLInputElement>('single-Title'),
    MobilePhone: $<HTMLInputElement>('single-MobilePhone'),
  };
  const errorEls: Record<FieldName, HTMLElement> = {
    FirstName: $('err-FirstName'),
    LastName: $('err-LastName'),
    Mail: $('err-Mail'),
    Title: $('err-Title'),
    MobilePhone: $('err-MobilePhone'),
  };
  const btnGenerate = $<HTMLButtonElement>('single-btn-generate');
  const genMessages = $('single-gen-messages');
  const cardResult = $('single-card-result');
  const resultLabel = $('single-result-label');
  const btnDownload = $('single-btn-download');

  let zipBlob: Blob | null = null;
  let zipFilename = 'signature.zip';

  // ── Helpers ──────────────────────────────────────────────────────
  function readFormData(): Record<string, string> {
    const data: Record<string, string> = {};
    for (const f of FIELDS) data[f] = inputs[f].value.trim();
    return data;
  }

  function showFieldErrors(errors: FieldErrors) {
    for (const f of FIELDS) {
      const msg = errors[f] ?? '';
      errorEls[f].textContent = msg;
      inputs[f].classList.toggle('input-error', Boolean(msg));
    }
  }

  function validate(): { data: Record<string, string>; errors: FieldErrors } {
    const data = readFormData();
    const errors = validateForm(data, RULES);
    return { data, errors };
  }

  function refreshPreview() {
    const html = deps.getTemplateHtml();
    if (!html) return;
    // Use form data as preview values; empty fields render as empty (template
    // renderer already strips unmatched placeholders + the "m." prefix).
    renderPreview(deps.previewIframe, html, readFormData());
  }

  function onInput() {
    const { errors } = validate();
    showFieldErrors(errors);
    btnGenerate.disabled = Object.keys(errors).length > 0;
    refreshPreview();

    // Step 2 lights up as soon as the form becomes fully valid.
    setActiveSteps(deps.steps, Object.keys(errors).length === 0 ? 2 : 1);
  }

  // ── Wire inputs ──────────────────────────────────────────────────
  for (const f of FIELDS) {
    inputs[f].addEventListener('input', onInput);
    inputs[f].addEventListener('blur', onInput);
  }

  form.addEventListener('submit', (e) => e.preventDefault());

  // ── Generate ─────────────────────────────────────────────────────
  btnGenerate.addEventListener('click', async () => {
    const templateHtml = deps.getTemplateHtml();
    if (!templateHtml) return;

    const { data, errors } = validate();
    showFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMessage(genMessages, 'error', 'Please fix the highlighted fields.');
      return;
    }

    clearMessages(genMessages);
    btnGenerate.disabled = true;
    setActiveSteps(deps.steps, 3);

    try {
      const html = renderTemplate(templateHtml, data);
      const htmlName = filenameFromEmail(data.Mail);
      zipFilename = zipNameFromEmail(data.Mail);
      zipBlob = await generateZip([{ filename: htmlName, content: html }]);

      resultLabel.textContent = `Signature ready for ${data.Mail}`;
      cardResult.classList.add('visible');
      showMessage(genMessages, 'success', `✓ Generated ${htmlName} → ${zipFilename}`);
    } catch (err: any) {
      showMessage(genMessages, 'error', err?.message ?? 'Failed to generate signature.');
    } finally {
      btnGenerate.disabled = false;
    }
  });

  btnDownload.addEventListener('click', () => {
    if (zipBlob) downloadBlob(zipBlob, zipFilename);
  });

  function reset() {
    for (const f of FIELDS) {
      inputs[f].value = '';
      inputs[f].classList.remove('input-error');
      errorEls[f].textContent = '';
    }
    zipBlob = null;
    zipFilename = 'signature.zip';
    cardResult.classList.remove('visible');
    clearMessages(genMessages);
    btnGenerate.disabled = true;
  }

  // Initial state
  reset();

  return { reset, refreshPreview };
}

