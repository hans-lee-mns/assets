/**
 * Validation utilities for CSV data.
 */

import type { ParsedUser } from './csv-parser';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validate that required fields exist in the CSV columns.
 */
export function validateColumns(
  columns: string[],
  requiredFields: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const field of requiredFields) {
    if (!columns.includes(field)) {
      errors.push(`Required column "${field}" is missing from the CSV.`);
    }
  }

  return { valid: errors.length === 0, warnings, errors };
}

/**
 * Validate a single user row.
 */
export function validateUser(
  user: ParsedUser,
  requiredFields: string[],
  rowIndex: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const field of requiredFields) {
    if (!user[field] || user[field].trim() === '') {
      warnings.push(`Row ${rowIndex}: missing required field "${field}"`);
    }
  }

  return { valid: errors.length === 0, warnings, errors };
}

