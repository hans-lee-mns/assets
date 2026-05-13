/**
 * Validation utilities — used by both CSV mode and Single User Form mode.
 */

import type { ParsedUser } from './csv-parser';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/** Field-level errors for a form (key = field name, value = first error message). */
export type FieldErrors = Record<string, string>;

/** Per-field validation rule. */
export interface FieldRule {
  required?: boolean;
  email?: boolean;
  label?: string; // human-friendly label used in messages
}

/** Loose RFC-ish email check — fine for client-side UX validation. */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
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
 * Validate a single CSV row (used during generation to flag missing data).
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

/**
 * Validate a single-user form against a rules map.
 * Returns a per-field error map. Empty map = valid.
 */
export function validateForm(
  data: Record<string, string>,
  rules: Record<string, FieldRule>
): FieldErrors {
  const errors: FieldErrors = {};

  for (const [field, rule] of Object.entries(rules)) {
    const raw = (data[field] ?? '').trim();
    const label = rule.label ?? field;

    if (rule.required && raw === '') {
      errors[field] = `${label} is required.`;
      continue;
    }

    if (rule.email && raw !== '' && !isValidEmail(raw)) {
      errors[field] = `${label} must be a valid email address.`;
    }
  }

  return errors;
}
