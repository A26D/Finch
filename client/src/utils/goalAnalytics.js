import { calculatePercentage, daysRemaining } from "./dateMath";

/**
 * Status-to-color mapping for goal statuses.
 * Kept as a plain export so React Native can later import the same
 * mapping and apply via StyleSheet instead of CSS className strings.
 */
export const GOAL_STATUS_COLORS = {
  on_track: "green",
  at_risk: "amber",
  behind: "orange",
  completed: "blue",
};

export const GOAL_STATUS_LABELS = {
  on_track: "On Track",
  at_risk: "At Risk",
  behind: "Behind",
  completed: "Completed",
};

/**
 * Percentage saved toward target.
 */
export function calculateGoalProgress(currentSaved, targetAmount) {
  return calculatePercentage(currentSaved, targetAmount);
}

/**
 * Amount still needed to reach target.
 */
export function calculateRemainingAmount(currentSaved, targetAmount) {
  return Math.max(0, targetAmount - currentSaved);
}

/**
 * Days remaining until target date (shared dateMath helper).
 */
export function calculateDaysRemaining(targetDate, today = new Date()) {
  if (!targetDate) return null;
  return daysRemaining(targetDate, today);
}

/**
 * Required daily saving to reach target by target_date.
 */
export function calculateRequiredDailySaving(remainingAmount, daysRemaining) {
  if (!daysRemaining || daysRemaining <= 0) return null;
  return Math.round((remainingAmount / daysRemaining) * 100) / 100;
}

/**
 * Required monthly saving to reach target by target_date.
 */
export function calculateRequiredMonthlySaving(remainingAmount, targetDate, today = new Date()) {
  if (!targetDate) return null;
  const days = daysRemaining(targetDate, today);
  if (days <= 0) return null;
  const months = Math.max(1, days / 30.44);
  return Math.round((remainingAmount / months) * 100) / 100;
}

/**
 * Projected completion date based on historical contribution rate.
 * Returns null when no rate is available — this is the seam where an
 * AI/statistical model will later supply a real projection instead.
 */
export function calculateProjectedCompletionDate(currentSaved, targetAmount, historicalContributionRate) {
  if (!historicalContributionRate || historicalContributionRate <= 0) return null;
  const remaining = calculateRemainingAmount(currentSaved, targetAmount);
  if (remaining <= 0) return new Date();
  const daysNeeded = Math.ceil(remaining / historicalContributionRate);
  const projected = new Date();
  projected.setDate(projected.getDate() + daysNeeded);
  return projected;
}

/**
 * Overall goal status based on progress, time remaining, and required pace.
 */
export function calculateGoalStatus(progress, daysRemaining, requiredDailySaving) {
  if (progress >= 100) return "completed";
  if (daysRemaining === null || daysRemaining === undefined) return "on_track";
  if (daysRemaining <= 0) {
    // Past deadline
    return progress >= 100 ? "completed" : "behind";
  }
  if (requiredDailySaving === null || requiredDailySaving === undefined) return "on_track";
  return "at_risk";
}
