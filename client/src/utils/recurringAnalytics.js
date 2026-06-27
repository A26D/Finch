/**
 * Recurring Transactions Analytics
 *
 * Pure functions with no React dependencies — portable to React Native.
 *
 * ── Future AI Extension Points ──
 *
 * TODO(ai-recurring-detection): AI will call calculateMonthlyRecurringExpenses
 * with candidate transactions to validate against historical spending patterns.
 *
 * TODO(subscription-detection): AI will use getActiveByType('expense') combined
 * with description similarity scoring to flag subscription charges.
 *
 * TODO(bill-reminder-notifications): AI will use calculateUpcomingBills to
 * determine optimal reminder timing.
 *
 * TODO(cash-flow-forecasting): AI will project future balances by combining
 * calculateMonthlyRecurringExpenses + calculateMonthlyRecurringIncome with
 * actual transaction history.
 *
 * TODO(missed-payment-prediction): AI will compare expected recurring
 * transactions against actual posted transactions and flag discrepancies.
 */

/**
 * Calculate total monthly recurring expenses.
 */
export function calculateMonthlyRecurringExpenses(recurringTransactions) {
  return recurringTransactions
    .filter((rt) => rt.type === "expense" && rt.status === "active")
    .reduce((sum, rt) => sum + monthlyEquivalent(rt), 0);
}

/**
 * Calculate total monthly recurring income.
 */
export function calculateMonthlyRecurringIncome(recurringTransactions) {
  return recurringTransactions
    .filter((rt) => rt.type === "income" && rt.status === "active")
    .reduce((sum, rt) => sum + monthlyEquivalent(rt), 0);
}

/**
 * Compute the monthly equivalent amount for a recurring transaction.
 */
function monthlyEquivalent(rt) {
  const amount = Number(rt.amount);
  const interval = rt.interval_value || 1;

  switch (rt.frequency) {
    case "daily":
      return (amount / interval) * 30.44;
    case "weekly":
      return (amount / (interval * 7)) * 30.44;
    case "monthly":
      return amount / interval;
    case "yearly":
      return amount / (interval * 12);
    default:
      return 0;
  }
}

/**
 * Get upcoming bills — next N due recurring expenses sorted by next_run_date.
 *
 * @param {Array} recurringTransactions
 * @param {number} [limit=5]
 * @returns {Array<{id: string, name: string, amount: number, nextRunDate: string, daysUntilDue: number}>}
 */
export function calculateUpcomingBills(recurringTransactions, limit = 5) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return recurringTransactions
    .filter((rt) => rt.type === "expense" && rt.status === "active")
    .map((rt) => {
      const nextDate = new Date(rt.next_run_date);
      const diffTime = nextDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        id: rt.id,
        name: rt.name,
        amount: Number(rt.amount),
        nextRunDate: rt.next_run_date,
        daysUntilDue,
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, limit);
}

/**
 * Calculate average recurring spend per transaction.
 */
export function calculateAverageRecurringSpend(recurringTransactions) {
  const expenses = recurringTransactions.filter(
    (rt) => rt.type === "expense" && rt.status === "active"
  );
  if (!expenses.length) return 0;
  const total = expenses.reduce((sum, rt) => sum + Number(rt.amount), 0);
  return Math.round((total / expenses.length) * 100) / 100;
}

/**
 * Calculate the ratio of recurring expenses to total expenses.
 *
 * @param {number} monthlyRecurringExpenses
 * @param {number} totalMonthlyExpenses
 * @returns {number} Percentage (0–100), or null if total is 0.
 */
export function calculateRecurringRatio(monthlyRecurringExpenses, totalMonthlyExpenses) {
  if (!totalMonthlyExpenses || totalMonthlyExpenses <= 0) return null;
  return Math.round((monthlyRecurringExpenses / totalMonthlyExpenses) * 10000) / 100;
}
