/**
 * Recurring Transaction Service
 *
 * ── Future AI Extension Points ──
 *
 * TODO(ai-recurring-detection): AI will analyse transaction history to
 * suggest recurring templates. Call createRecurringTransaction() with
 * AI-generated data after user confirmation.
 *
 * TODO(subscription-detection): AI will use getRecurringTransactions()
 * filtered by 'expense' + frequency analysis to identify subscriptions.
 *
 * TODO(bill-reminder-notifications): AI will query due transactions via
 * getAllActive() and isTransactionDue() to trigger push notifications.
 *
 * TODO(cash-flow-forecasting): AI will use runAllDue() results combined
 * with actual spend data to project future balances.
 *
 * TODO(missed-payment-prediction): AI will compare last_run_date against
 * expected next_run_date to detect and alert on missed payments.
 */

import { z } from "zod";
import { calculateNextRunDate, isTransactionDue, generateAllDueTransactions } from "../utils/recurrence.js";

const uuidStr = z.string().uuid();

export const createRecurringSchema = z.object({
  user_id: uuidStr.optional(),
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category_id: uuidStr.nullable().optional(),
  account_id: uuidStr.nullable().optional(),
  payment_method: z.string().max(50).nullable().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval_value: z.number().int().positive().default(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  auto_create: z.boolean().default(true),
  status: z.enum(["active", "paused"]).default("active"),
});

export const updateRecurringSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense"]).optional(),
  category_id: uuidStr.nullable().optional(),
  account_id: uuidStr.nullable().optional(),
  payment_method: z.string().max(50).nullable().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  interval_value: z.number().int().positive().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  auto_create: z.boolean().optional(),
  status: z.enum(["active", "paused"]).optional(),
});

export const runDueSchema = z.object({
  reference_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ── Validation ──

export function validateStartBeforeEnd(startDate, endDate) {
  if (!endDate) return null;
  if (new Date(endDate) <= new Date(startDate)) {
    return "end_date must be after start_date";
  }
  return null;
}

// ── Pure Service Functions ──

/**
 * Fetch all non-archived recurring transactions for a user.
 */
export async function getAllActive(userId, pool) {
  const { rows } = await pool.query(
    `SELECT rt.*, c.name AS category_name, a.name AS account_name
     FROM recurring_transactions rt
     LEFT JOIN categories c ON c.id = rt.category_id
     LEFT JOIN accounts a ON a.id = rt.account_id
     WHERE rt.user_id = $1 AND rt.archived_at IS NULL
     ORDER BY rt.next_run_date ASC, rt.created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Fetch a single recurring transaction by ID.
 */
export async function getById(id, userId, pool) {
  const { rows } = await pool.query(
    `SELECT rt.*, c.name AS category_name, a.name AS account_name
     FROM recurring_transactions rt
     LEFT JOIN categories c ON c.id = rt.category_id
     LEFT JOIN accounts a ON a.id = rt.account_id
     WHERE rt.id = $1 AND rt.user_id = $2 AND rt.archived_at IS NULL`,
    [id, userId]
  );
  return rows[0] || null;
}

/**
 * Create a recurring transaction.
 */
export async function create(data, pool) {
  const nextRunDate = calculateNextRunDate(data.start_date, data.frequency, data.interval_value);
  if (!nextRunDate) throw new Error("Failed to calculate next run date");

  const { rows } = await pool.query(
    `INSERT INTO recurring_transactions
       (user_id, name, amount, type, category_id, account_id, payment_method,
        frequency, interval_value, start_date, end_date, next_run_date, auto_create, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      data.user_id,
      data.name,
      data.amount,
      data.type,
      data.category_id || null,
      data.account_id || null,
      data.payment_method || null,
      data.frequency,
      data.interval_value,
      data.start_date,
      data.end_date || null,
      nextRunDate,
      data.auto_create,
      data.status,
    ]
  );

  return rows[0];
}

/**
 * Update a recurring transaction.
 * Recalculates next_run_date if frequency, interval, start_date, or end_date changed.
 */
export async function update(id, data, pool) {
  const fields = [];
  const params = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${idx++}`);
    params.push(value === undefined ? null : value);
  }

  if (!fields.length) return null;

  // Recalculate next_run_date if schedule-affecting fields changed
  if (data.frequency || data.interval_value || data.start_date) {
    const { rows: existing } = await pool.query(
      `SELECT start_date, frequency, interval_value, end_date FROM recurring_transactions WHERE id = $1`,
      [id]
    );
    if (existing.length) {
      const rt = existing[0];
      const frequency = data.frequency || rt.frequency;
      const intervalValue = data.interval_value || rt.interval_value;
      const startDate = data.start_date || rt.start_date;
      const nextRun = calculateNextRunDate(startDate, frequency, intervalValue);
      if (nextRun) {
        fields.push(`next_run_date = $${idx++}`);
        params.push(nextRun);
      }
    }
  }

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE recurring_transactions
     SET ${fields.join(", ")}, updated_at = NOW()
     WHERE id = $${idx} AND archived_at IS NULL
     RETURNING *`,
    params
  );

  return rows[0] || null;
}

/**
 * Soft-delete a recurring transaction.
 */
export async function archive(id, pool) {
  const { rows } = await pool.query(
    `UPDATE recurring_transactions
     SET archived_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND archived_at IS NULL
     RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Pause a recurring transaction.
 */
export async function pauseRecurringTransaction(id, pool) {
  const { rows } = await pool.query(
    `UPDATE recurring_transactions
     SET status = 'paused', updated_at = NOW()
     WHERE id = $1 AND archived_at IS NULL AND status = 'active'
     RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Resume a recurring transaction.
 * Also recalculates next_run_date from today.
 */
export async function resumeRecurringTransaction(id, pool) {
  // Fetch existing to compute next_run_date in JS
  const { rows: existing } = await pool.query(
    `SELECT * FROM recurring_transactions WHERE id = $1 AND archived_at IS NULL AND status = 'paused'`,
    [id]
  );
  if (!existing.length) return null;

  const rt = existing[0];
  const nextRun = calculateNextRunDate(rt.start_date, rt.frequency, rt.interval_value);

  const { rows } = await pool.query(
    `UPDATE recurring_transactions
     SET status = 'active',
         next_run_date = $1,
         updated_at = NOW()
     WHERE id = $2 AND archived_at IS NULL
     RETURNING *`,
    [nextRun, id]
  );
  return rows[0] || null;
}

/**
 * Process all due recurring transactions.
 * Creates actual transaction rows and advances next_run_date.
 *
 * @param {Date} [referenceDate] - Defaults to today.
 * @param {import("pg").Pool} pool
 * @returns {Promise<Array<{transaction: Object}>>}
 */
export async function runAllDue(referenceDate, pool) {
  const ref = referenceDate ? new Date(referenceDate) : new Date();

  const { rows: allActive } = await pool.query(
    `SELECT * FROM recurring_transactions
     WHERE status = 'active' AND archived_at IS NULL
       AND next_run_date <= $1
       AND (end_date IS NULL OR next_run_date <= end_date)`,
    [ref]
  );

  const dueItems = generateAllDueTransactions(allActive, ref);
  const created = [];

  for (const item of dueItems) {
    if (!item.nextRunDate) {
      // Schedule ended — archive it
      await pool.query(
        `UPDATE recurring_transactions
         SET status = 'paused', updated_at = NOW()
         WHERE id = $1`,
        [item.recurringTx.id]
      );
      continue;
    }

    // Create the actual transaction
    const tx = item.transaction;
    const { rows: txRows } = await pool.query(
      `INSERT INTO transactions (user_id, account_id, category_id, amount, date, description, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tx.user_id, tx.account_id, tx.category_id, tx.amount, tx.date, tx.description, tx.payment_method]
    );

    // Advance next_run_date
    await pool.query(
      `UPDATE recurring_transactions
       SET next_run_date = $1, last_run_date = $2, updated_at = NOW()
       WHERE id = $3`,
      [item.nextRunDate, ref, item.recurringTx.id]
    );

    created.push({ transaction: txRows[0] });
  }

  return created;
}
