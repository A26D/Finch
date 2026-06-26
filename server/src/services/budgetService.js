/**
 * Budget Service
 *
 * v1: Only 'fixed' type budgets are implemented.
 * 'percent_of_income' and 'rolling_average' types are schema-only (never hit in v1).
 * rollover_enabled is stored but not acted on.
 *
 * ── Extension Points for v2 ──
 *
 * 1. computeCurrentPeriodAmount():
 *    v1 returns budget.amount unconditionally.
 *    v2 branches on budget.type and calls different calculators.
 *    Callers never change.
 *
 * 2. getCurrentPeriodWindow():
 *    v1 computes on the fly from start_date + period + today.
 *    v2 will look up a materialized budget_periods row first (for rollover state),
 *    then fall back to on-the-fly for backward compat.
 *    Callers never change.
 *
 * 3. budget_periods table (v2):
 *    When rollover or rule-based amounts are implemented, a migration creates:
 *      budget_periods(id, budget_id FK, period_start, period_end,
 *                     budgeted_amount, rollover_from_previous, total_available,
 *                     spent, remaining, status)
 *    This materialized table gives AI clean per-period snapshots for training
 *    and allows safe mutation of historical period data without affecting
 *    aggregate transaction queries.
 */

import { z } from "zod";

// ── Period Window Calculation ──

/**
 * Given a budget and today's date, compute the current period's start/end.
 *
 * v1: on-the-fly from start_date + period.
 * v2: checks budget_periods table first.
 */
export function getCurrentPeriodWindow(budget, today = new Date()) {
  const y = today.getFullYear();
  const m = today.getMonth();

  let start, end;

  if (budget.period === "monthly") {
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0);
  } else if (budget.period === "weekly") {
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(y, m, diff);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
  } else {
    // yearly
    start = new Date(y, 0, 1);
    end = new Date(y, 11, 31);
  }

  return {
    periodStart: toDateStr(start),
    periodEnd: toDateStr(end),
  };
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Amount Calculation ──

/**
 * Return the budgeted amount for the current period.
 *
 * v1: always returns budget.amount (fixed).
 * v2: branches on budget.type:
 *   'fixed'              → budget.amount
 *   'percent_of_income'  → calculatePercentOfIncome(budget, userId, pool)
 *   'rolling_average'    → calculateRollingAverage(budget, userId, pool)
 */
export function computeCurrentPeriodAmount(budget) {
  return Number(budget.amount);
}

// ── Spend Queries ──

/**
 * Query total spend (absolute sum of expense amounts) within the period window,
 * constrained to the budget's date bounds and category filter.
 */
export async function getSpentAmountForPeriod(
  budget,
  periodStart,
  periodEnd,
  pool
) {
  const params = [budget.user_id];
  let idx = 2;

  // Clamp period to budget's actual active window
  const effectiveStart =
    periodStart < toDateStr(budget.start_date)
      ? toDateStr(budget.start_date)
      : periodStart;
  const effectiveEnd = budget.end_date
    ? periodEnd > toDateStr(budget.end_date)
      ? toDateStr(budget.end_date)
      : periodEnd
    : periodEnd;

  params.push(effectiveStart, effectiveEnd);
  let categoryJoin = "";
  let categoryFilter = "";

  if (budget.categoryIds && budget.categoryIds.length) {
    // Budget is scoped to specific categories
    categoryJoin =
      "JOIN budget_categories bc ON bc.budget_id = $4 AND bc.category_id = t.category_id";
    params.push(budget.id);
    idx = 5;
  }

  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(ABS(t.amount)), 0) AS spent
     FROM transactions t
     ${categoryJoin}
     WHERE t.user_id = $1
       AND t.date >= $2
       AND t.date <= $3
       AND t.amount < 0
       ${categoryJoin ? "" : ""}`,
    params
  );

  return Number(rows[0].spent);
}

// ── Enrichment ──

/**
 * Fetch all active (non-archived) budgets for a user with current-period progress.
 */
export async function getBudgetsWithProgress(userId, pool) {
  const { rows: budgets } = await pool.query(
    `SELECT b.* FROM budgets b
     WHERE b.user_id = $1 AND b.archived_at IS NULL
     ORDER BY b.created_at DESC`,
    [userId]
  );

  const enriched = [];
  for (const b of budgets) {
    const { rows: cats } = await pool.query(
      `SELECT c.id, c.name FROM budget_categories bc
       JOIN categories c ON c.id = bc.category_id
       WHERE bc.budget_id = $1`,
      [b.id]
    );
    b.categories = cats;
    b.categoryIds = cats.map((c) => c.id);

    const enrichedBudget = await enrichBudgetWithProgress(b, pool);
    enriched.push(enrichedBudget);
  }

  return enriched;
}

/**
 * Enrich a single budget row with current-period progress.
 */
export async function enrichBudgetWithProgress(budget, pool) {
  const window = getCurrentPeriodWindow(budget, new Date());
  const spent = await getSpentAmountForPeriod(
    budget,
    window.periodStart,
    window.periodEnd,
    pool
  );
  const currentAmount = computeCurrentPeriodAmount(budget);
  const remaining = Math.max(0, currentAmount - spent);
  const percentUsed = currentAmount > 0 ? spent / currentAmount : 0;

  return {
    ...budget,
    amount: currentAmount,
    periodStart: window.periodStart,
    periodEnd: window.periodEnd,
    spent,
    remaining,
    percentUsed: Math.round(percentUsed * 10000) / 10000,
  };
}

// ── Category Validation ──

/**
 * Check that all provided category IDs belong to the user.
 */
export async function validateBudgetCategories(categoryIds, userId, pool) {
  if (!categoryIds || !categoryIds.length) return true;
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS cnt FROM categories
     WHERE id = ANY($1::uuid[]) AND user_id = $2`,
    [categoryIds, userId]
  );
  return Number(rows[0].cnt) === categoryIds.length;
}

// ── Zod Schema ──

const uuidStr = z.string().uuid();

export const createBudgetSchema = z.object({
  user_id: uuidStr,
  name: z.string().min(1).max(100),
  type: z.enum(["fixed", "percent_of_income", "rolling_average"]).default("fixed"),
  amount: z.number().positive(),
  period: z.enum(["weekly", "monthly", "yearly"]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  rollover_enabled: z.boolean().default(false),
  strictness: z.enum(["hard", "soft"]).default("hard"),
  alert_threshold: z.number().min(0).max(1).default(0.8),
  category_ids: z.array(uuidStr).optional(),
});

export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["fixed", "percent_of_income", "rolling_average"]).optional(),
  amount: z.number().positive().optional(),
  period: z.enum(["weekly", "monthly", "yearly"]).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  rollover_enabled: z.boolean().optional(),
  strictness: z.enum(["hard", "soft"]).optional(),
  alert_threshold: z.number().min(0).max(1).optional(),
  category_ids: z.array(uuidStr).optional(),
});
