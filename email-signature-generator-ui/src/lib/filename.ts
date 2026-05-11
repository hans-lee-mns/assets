/**
 * Filename utilities — generate safe filenames from user data.
 */

/**
 * Build a filesystem-safe HTML filename from name parts.
 * Example: safeFilename("Akash", "Gangoo") → "akash_gangoo.html"
 */
export function safeFilename(...parts: string[]): string {
  const combined = parts
    .filter(Boolean)
    .join('_')
    .toLowerCase()
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return combined ? `${combined}.html` : 'unknown.html';
}

