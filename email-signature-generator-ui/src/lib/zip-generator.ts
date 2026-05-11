/**
 * ZIP Generator — creates a ZIP file in the browser using JSZip (loaded via CDN).
 * Falls back to a simple Blob-based download if JSZip is unavailable.
 */

declare const JSZip: any;

export interface GeneratedFile {
  filename: string;
  content: string;
}

/**
 * Generate a ZIP blob from an array of files.
 */
export async function generateZip(files: GeneratedFile[]): Promise<Blob> {
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip library not loaded. Please check your internet connection.');
  }

  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.filename, file.content);
  }

  const blob: Blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

/**
 * Trigger a browser download for a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

