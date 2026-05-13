/**
 * Template Loader — fetches the HTML template (cache-busted) and renders the
 * preview iframe. Optionally renders user data into the preview.
 */

import { renderTemplate } from './template-renderer';
import type { ParsedUser } from './csv-parser';

const PREVIEW_CENTER_STYLE =
  '<style>body{display:flex;flex-direction:column;align-items:center;}</style>';


/** Fetch the template at `url`, bypassing browser cache. */
export async function fetchTemplate(url: string): Promise<string> {
  const bust = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  const res = await fetch(bust, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load template: ${res.status} ${res.statusText}`);
  return res.text();
}

/**
 * Render the template into the preview iframe.
 * - Cache-busts <img src> URLs (preview-only, not the generated output)
 * - Injects centering styles
 * - If `user` is provided, runs renderTemplate so the preview reflects form data
 */
export function renderPreview(
  iframe: HTMLIFrameElement,
  templateHtml: string,
  user?: ParsedUser
): void {
  const baseHtml = user ? renderTemplate(templateHtml, user) : templateHtml;
  const withCacheBust = baseHtml.replace(
    /(<img[^>]+src=["'])([^"']+)(["'])/gi,
    (_m, p1, src, p3) => `${p1}${addCacheBust(src)}${p3}`
  );
  const centered = withCacheBust.includes('</head>')
    ? withCacheBust.replace('</head>', `${PREVIEW_CENTER_STYLE}</head>`)
    : `${PREVIEW_CENTER_STYLE}${withCacheBust}`;
  iframe.srcdoc = centered;
}

function addCacheBust(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}cb=${Date.now()}`;
}

