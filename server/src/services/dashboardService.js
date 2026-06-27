import pool from "../db.js";
import { getBudgetsWithProgress } from "./budgetService.js";
import { getGoalsWithProgress } from "./goalService.js";
import { getAllActive } from "./recurringTransactionService.js";
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateCurrentBalance,
  calculateAverageDailySpend,
  calculateAverageMonthlySpend,
  calculateLargestExpense,
  calculateLargestIncome,
  calculateSavingsRate,
  calculateRecurringExpenseRatio,
} from "../utils/reportAnalytics.js";

async function fetchTransactions(userId) {
  const { rows } = await pool.query(
    `SELECT t.*, c.name AS category_name, a.name AS account_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN accounts a ON a.id = t.account_id
     WHERE t.user_id = $1
     ORDER BY t.date DESC`,
    [userId]
  );
  return rows;
}

export async function getDashboardData(userId, settings) {
  const [transactions, budgets, goals, recurring] = await Promise.all([
    fetchTransactions(userId),
    getBudgetsWithProgress(userId, pool),
    getGoalsWithProgress(userId, pool),
    getAllActive(userId, pool),
  ]);

  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const avgMonthlySpend = calculateAverageMonthlySpend(transactions);
  const recurringStats = calculateRecurringExpenseRatio(recurring, avgMonthlySpend);
  const compactMode = settings?.dashboard_compact_mode === true;
  const round = compactMode
    ? (v) => Math.round(v)
    : (v) => Math.round(v * 100) / 100;

  return {
    totalIncome: round(totalIncome),
    totalExpenses: round(totalExpenses),
    currentBalance: round(calculateCurrentBalance(transactions)),
    savingsRate: calculateSavingsRate(transactions),
    averageDailySpend: calculateAverageDailySpend(transactions),
    averageMonthlySpend: avgMonthlySpend,
    largestExpense: calculateLargestExpense(transactions),
    largestIncome: calculateLargestIncome(transactions),
    recurringMonthlyExpenses: recurringStats.monthlyRecurringExpenses,
    recurringMonthlyIncome: recurringStats.monthlyRecurringIncome,
    activeBudgets: budgets.length,
    activeGoals: goals.length,
  };
}
