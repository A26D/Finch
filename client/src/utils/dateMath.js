/**
 * Shared date-math and percentage utilities.
 *
 * Extracted from budgetAnalytics.js so that goalAnalytics.js can reuse
 * the same logic without duplication. Both modules import from here.
 */

/**
 * Number of days between two dates.
 */
export function daysBetween(start, end) {
  const diff = new Date(end) - new Date(start);
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Number of days remaining until a target date.
 */
export function daysRemaining(targetDate, today = new Date()) {
  return daysBetween(today, targetDate);
}

/**
 * Calculate percentage (spent / total * 100), rounded to 2 decimals.
 */
export function calculatePercentage(value, total) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 10000) / 100;
}

/**
 * Format a Date or date string to YYYY-MM-DD.
 */
export function toDateStr(d) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
