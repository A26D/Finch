import { z } from "zod";

// ── Zod Schemas ──

const uuidStr = z.string().uuid();

export const createGoalSchema = z.object({
  user_id: uuidStr,
  name: z.string().min(1).max(200),
  target_amount: z.number().positive(),
  current_saved_amount: z.number().min(0).default(0),
  target_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["active", "completed", "paused"]).default("active"),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  target_amount: z.number().positive().optional(),
  current_saved_amount: z.number().min(0).optional(),
  target_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["active", "completed", "paused"]).optional(),
});

export const contributeSchema = z.object({
  amount: z.number().positive(),
});

// ── Pure Functions ──

/**
 * Compute goal progress as percentage saved (0–100).
 */
export function computeGoalProgress(goal) {
  const saved = Number(goal.current_saved_amount);
  const target = Number(goal.target_amount);
  if (target <= 0) return 0;
  return Math.min(100, Math.round((saved / target) * 10000) / 100);
}

/**
 * Get linked budgets that fund this goal.
 * AI_HOOK: budget-to-goal reallocation suggestions will read
 * budgetService utilization data + this function's output to recommend
 * "underspend on Dining Out → reallocate $X to this goal."
 */
export async function getLinkedBudgetsForGoal(goalId, pool) {
  const { rows } = await pool.query(
    `SELECT id, name, amount, period
     FROM budgets
     WHERE goal_id = $1 AND archived_at IS NULL
     ORDER BY created_at DESC`,
    [goalId]
  );
  return rows;
}

/**
 * Contribute an amount to a goal's current_saved_amount.
 * Returns the updated goal. Auto-sets status to 'completed' if
 * current_saved_amount reaches or exceeds target_amount.
 * Does NOT hard-delete — archived goals are skipped by the WHERE clause.
 */
export async function contributeToGoal(goalId, amount, pool) {
  const { rows } = await pool.query(
    `UPDATE goals
     SET
       current_saved_amount = current_saved_amount + $1,
       status = CASE
         WHEN current_saved_amount + $1 >= target_amount THEN 'completed'
         ELSE status
       END,
       updated_at = NOW()
     WHERE id = $2 AND archived_at IS NULL
     RETURNING *`,
    [amount, goalId]
  );

  if (!rows.length) return null;

  return rows[0];
}

/**
 * Enrich a goal row with computed progress.
 */
export function enrichGoalWithProgress(goal) {
  return {
    ...goal,
    progress: computeGoalProgress(goal),
    remaining: Math.max(0, Number(goal.target_amount) - Number(goal.current_saved_amount)),
  };
}

/**
 * Fetch all non-archived goals for a user, enriched with progress.
 */
export async function getGoalsWithProgress(userId, pool) {
  const { rows } = await pool.query(
    `SELECT * FROM goals
     WHERE user_id = $1 AND archived_at IS NULL
     ORDER BY
       CASE status
         WHEN 'active' THEN 0
         WHEN 'paused' THEN 1
         WHEN 'completed' THEN 2
       END,
       priority DESC,
       created_at DESC`,
    [userId]
  );

  return rows.map(enrichGoalWithProgress);
}

// ── Validation Helpers ──

export function validateCurrentSavedAmount(currentSaved, targetAmount) {
  if (currentSaved > targetAmount) {
    return "current_saved_amount cannot exceed target_amount";
  }
  return null;
}
