/**
 * Filename utilities — generate safe filenames from user data or email.
 */

/**
 * Lowercase, replace non-word chars with `_`, collapse repeats, trim edges.
 * Used as the canonical "slug" for both HTML filenames and ZIP names.
 */
export function sanitizeSlug(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join('_')
    .toLowerCase()
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Build a filesystem-safe HTML filename from name parts.
 * Example: safeFilename("Akash", "Gangoo") → "akash_gangoo.html"
 */
export function safeFilename(...parts: string[]): string {
  const slug = sanitizeSlug(...parts);
  return slug ? `${slug}.html` : 'unknown.html';
}

/**
 * Build a slug from an email address (no extension).
 *
 * Rules (matches the documented example):
 *   - Lowercase the whole address
 *   - Preserve dots in the local-part (before `@`)
 *   - Replace `@` and any dots/special chars in the domain with `_`
 *   - Collapse repeated `_` and trim edges
 *
 * Example: slugFromEmail("Akash.Gangoo@mns.mu") → "akash.gangoo_mns_mu"
 *          slugFromEmail("no-at-sign")           → "no_at_sign"
 */
export function slugFromEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const atIdx = lower.indexOf('@');

  let normalized: string;
  if (atIdx === -1) {
    // No @ — treat the entire string as a generic slug
    normalized = lower.replace(/[^a-z0-9]+/g, '_');
  } else {
    const local = lower.slice(0, atIdx).replace(/[^a-z0-9.]+/g, '_');
    const domain = lower.slice(atIdx + 1).replace(/[^a-z0-9]+/g, '_');
    normalized = `${local}_${domain}`;
  }

  const cleaned = normalized.replace(/_+/g, '_').replace(/^_|_$/g, '');
  return cleaned || 'signature';
}

/**
 * HTML filename derived from an email address.
 * Example: "akash.gangoo@mns.mu" → "akash.gangoo_mns_mu.html"
 */
export function filenameFromEmail(email: string): string {
  return `${slugFromEmail(email)}.html`;
}

/**
 * ZIP filename derived from an email address.
 * Example: "akash.gangoo@mns.mu" → "akash.gangoo_mns_mu.zip"
 */
export function zipNameFromEmail(email: string): string {
  return `${slugFromEmail(email)}.zip`;
}
