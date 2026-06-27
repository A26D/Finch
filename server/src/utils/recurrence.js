/**
 * Recurrence utility for calculating recurring transaction schedules.
 *
 * All functions are pure — no side effects, no DB calls.
 *
 * ── Future AI Extension Points ──
 *
 * TODO(ai-recurring-detection): AI will analyse transaction history to
 * suggest recurring templates. This utility will generate the candidate
 * next_run_date for user confirmation.
 *
 * TODO(subscription-detection): AI will use calculateNextRunDate to
 * identify regular subscription charges from transaction descriptions
 * and amounts.
 */

/**
 * Add months to a date, handling month-overflow by clamping to last day.
 */
function addMonths(date, n) {
  const d = new Date(date);
  const targetMonth = d.getMonth() + n;
  d.setMonth(targetMonth);
  // If setMonth overflowed into next month, clamp to last day of target month
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    d.setDate(0);
  }
  return d;
}

/**
 * Calculate the next occurrence date for a recurring schedule.
 *
 * @param {Date|string} startDate - When the recurring schedule starts.
 * @param {'daily'|'weekly'|'monthly'|'yearly'} frequency
 * @param {number} interval - How many units between occurrences (default 1).
 * @param {Date} [fromDate] - Reference date (defaults to today).
 * @returns {Date|null} The next run date, or null if the schedule has ended.
 */
export function calculateNextRunDate(startDate, frequency, interval = 1, fromDate = new Date()) {
  const start = new Date(startDate);
  const ref = new Date(fromDate);

  // If start is in the future, the next run is the start
  if (start > ref) return new Date(start);

  let next;

  switch (frequency) {
    case "daily": {
      const diffDays = Math.floor((ref - start) / (1000 * 60 * 60 * 24));
      const periods = Math.floor(diffDays / interval) + 1;
      next = new Date(start);
      next.setDate(next.getDate() + periods * interval);
      break;
    }
    case "weekly": {
      const diffDays = Math.floor((ref - start) / (1000 * 60 * 60 * 24));
      const periods = Math.floor(diffDays / (7 * interval)) + 1;
      next = new Date(start);
      next.setDate(next.getDate() + periods * 7 * interval);
      break;
    }
    case "monthly": {
      let diffMonths =
        (ref.getFullYear() - start.getFullYear()) * 12 +
        (ref.getMonth() - start.getMonth());
      // If ref is before the start day this month, subtract one period
      if (ref.getDate() < start.getDate()) {
        diffMonths--;
      }
      const periods = Math.floor(diffMonths / interval) + 1;
      next = addMonths(start, periods * interval);
      break;
    }
    case "yearly": {
      let diffYears = ref.getFullYear() - start.getFullYear();
      const monthDiff = ref.getMonth() - start.getMonth();
      const dayDiff = ref.getDate() - start.getDate();
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        diffYears--;
      }
      const periods = Math.floor(diffYears / interval) + 1;
      next = new Date(start);
      next.setFullYear(start.getFullYear() + periods * interval);
      break;
    }
    default:
      return null;
  }

  return next;
}

/**
 * Check whether a recurring transaction is due on or before a reference date.
 *
 * @param {Date|string} nextRunDate
 * @param {Date} [referenceDate] - Defaults to today.
 * @returns {boolean}
 */
export function isTransactionDue(nextRunDate, referenceDate = new Date()) {
  const next = new Date(nextRunDate);
  const ref = new Date(referenceDate);
  // Due if next run is <= reference date (start of day comparison)
  next.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  return next <= ref;
}

/**
 * Generate a transaction object from a recurring template.
 *
 * @param {Object} rt - Recurring transaction row.
 * @returns {Object} A transaction-like object (without id/timestamps).
 */
export function generateTransaction(rt) {
  return {
    user_id: rt.user_id,
    account_id: rt.account_id,
    category_id: rt.category_id,
    amount: rt.type === "expense" ? -Math.abs(Number(rt.amount)) : Math.abs(Number(rt.amount)),
    date: rt.next_run_date,
    description: rt.name,
    payment_method: rt.payment_method,
  };
}

/**
 * Find all due recurring transactions and generate their transaction objects.
 *
 * @param {Array} recurringTransactions - Array of recurring transaction rows.
 * @param {Date} [referenceDate] - Defaults to today.
 * @returns {Array<{transaction: Object, recurringTx: Object}>}
 */
export function generateAllDueTransactions(recurringTransactions, referenceDate = new Date()) {
  const due = [];

  for (const rt of recurringTransactions) {
    if (rt.status !== "active") continue;
    if (!isTransactionDue(rt.next_run_date, referenceDate)) continue;

    const transaction = generateTransaction(rt);

    // Calculate the next run date after this one
    const nextRunDate = calculateNextRunDate(
      rt.start_date,
      rt.frequency,
      rt.interval_value,
      new Date(rt.next_run_date)
    );

    // Check if the schedule has ended
    if (rt.end_date && nextRunDate > new Date(rt.end_date)) {
      due.push({ transaction, recurringTx: rt, nextRunDate: null });
    } else {
      due.push({ transaction, recurringTx: rt, nextRunDate });
    }
  }

  return due;
}
