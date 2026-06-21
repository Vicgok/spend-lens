/**
 * Shared metric computation utilities.
 */

/**
 * Computes a percentage rounded to 2 decimal places.
 * Returns 0 if denominator is 0.
 */
export function calcPercent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

/**
 * Computes F1-score given precision and recall (both as 0-100 percentages).
 * Returns 0 if both are 0.
 */
export function calcF1(precision: number, recall: number): number {
  if (precision + recall === 0) return 0;
  return Number(((2 * precision * recall) / (precision + recall)).toFixed(2));
}

/**
 * Formats a numeric value as a percentage string, e.g. "97.28%".
 */
export function formatPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}
