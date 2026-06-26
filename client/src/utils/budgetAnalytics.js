/**
 * Calculate percentage of budget used.
 */
export function calculateBudgetProgress(spent, amount) {
  if (amount <= 0) return 0;
  return Math.round((spent / amount) * 10000) / 100;
}

/**
 * Calculate remaining budget.
 */
export function calculateRemainingBudget(spent, amount) {
  return Math.max(0, amount - spent);
}

/**
 * Project what total spend would be if current rate continues.
 * daysElapsed: number of days into the period so far.
 * daysTotal: total number of days in the period.
 */
export function calculateProjectedOverspend(spent, amount, daysElapsed, daysTotal) {
  if (daysElapsed <= 0 || daysTotal <= 0) return 0;
  const dailyRate = spent / daysElapsed;
  const projected = dailyRate * daysTotal;
  return Math.max(0, Math.round((projected - amount) * 100) / 100);
}

/**
 * Number of days remaining in the period.
 */
export function calculateDaysRemaining(periodEnd, today = new Date()) {
  const end = new Date(periodEnd);
  const diff = end - today;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * How much can be spent per day to stay within budget.
 */
export function calculateDailySafeSpend(remaining, daysRemaining) {
  if (daysRemaining <= 0) return 0;
  return Math.round((remaining / daysRemaining) * 100) / 100;
}

/**
 * Budget status based on utilization vs alert threshold.
 */
export function calculateBudgetStatus(percentUsed, alertThreshold) {
  if (percentUsed >= 110) return "exceeded";
  if (percentUsed >= 100) return "critical";
  if (percentUsed >= alertThreshold * 100) return "warning";
  return "safe";
}
