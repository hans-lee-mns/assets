/**
 * CSV Parser — Client-side CSV to array of objects.
 * Uses Papa Parse (loaded via CDN in the page).
 */

export interface ParsedUser {
  [key: string]: string;
}

export interface CsvParseResult {
  users: ParsedUser[];
  columns: string[];
  errors: string[];
}

/**
 * Parse a CSV string into an array of user objects.
 */
export function parseCsv(csvText: string): CsvParseResult {
  const lines = csvText.trim().split(/\r?\n/);
  const errors: string[] = [];

  if (lines.length < 2) {
    return { users: [], columns: [], errors: ['CSV file must have a header row and at least one data row.'] };
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim());

  if (headers.length === 0 || headers.every(h => h === '')) {
    return { users: [], columns: [], errors: ['CSV header row is empty.'] };
  }

  const users: ParsedUser[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip blank lines

    const values = parseCsvLine(line);
    const user: ParsedUser = {};

    for (let j = 0; j < headers.length; j++) {
      user[headers[j]] = (values[j] || '').trim();
    }

    // Skip entirely empty rows
    if (Object.values(user).some(v => v !== '')) {
      users.push(user);
    }
  }

  if (users.length === 0) {
    errors.push('No data rows found in the CSV file.');
  }

  return { users, columns: headers, errors };
}

/**
 * Parse a single CSV line handling quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

