/**
 * Template Renderer — replaces {{Placeholder}} tokens with user data.
 */

import type { ParsedUser } from './csv-parser';

/**
 * Render a template by replacing all {{ColumnName}} placeholders with user values.
 */
export function renderTemplate(template: string, user: ParsedUser): string {
  let result = template;

  // Replace each known field. LastName is rendered in UPPERCASE in the signature.
  for (const [key, rawValue] of Object.entries(user)) {
    const placeholder = `{{${key}}}`;
    const value = key === 'LastName' ? (rawValue ?? '').toLocaleUpperCase() : rawValue;
    result = result.replaceAll(placeholder, value);
  }

  // Remove "m. " prefix when mobile phone is empty (leaves just the landline)
  result = result.replace(/\s*m\.\s*(?=<br>|<br\/>|<br \/>)/gi, '');

  // Strip any remaining unreplaced placeholders
  result = result.replace(/\{\{.*?\}\}/g, '');

  return result;
}

