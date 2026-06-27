/**
 * Report Service
 *
 * Orchestrates multi-source data fetching and pipes results through
 * pure analytics functions. Reports are read-only — no writes.
 *
 * ── Performance Notes ──
 * - Batch queries run in parallel via Promise.all to avoid sequential
 *   round-trips.
 * - All analytics functions are O(n) over their input arrays.
 * - The service layer is the only place that touches the database.
 */

import pool from "../db.js";
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateCurrentBalance,
  calculateMonthlyTotals,
  calculateYearlyTotals,
  calculateCategoryBreakdown,
  calculateIncomeExpenseTrend,
  calculateCashFlow,
  calculateAverageDailySpend,
  calculateAverageMonthlySpend,
  calculateHighestSpendingMonth,
  calculateLowestSpendingMonth,
  calculateLargestExpense,
  calculateLargestIncome,
  calculateSavingsRate,
  calculateBudgetPerformance,
  calculateGoalCompletionRate,
  calculateRecurringExpenseRatio,
  calculateTopCategories,
  calculateNetWorthTrend,
  calculateMonthlyGrowth,
  calculateExpenseGrowth,
  calculateIncomeGrowth,
} from "../utils/reportAnalytics.js";

// ── Query Helpers ──

export async function fetchTransactions(userId, filters = {}) {
  const conditions = ["t.user_id = $1"];
  const params = [userId];
  let idx = 2;

  if (filters.start_date) {
    conditions.push(`t.date >= $${idx++}`);
    params.push(filters.start_date);
  }
  if (filters.end_date) {
    conditions.push(`t.date <= $${idx++}`);
    params.push(filters.end_date);
  }
  if (filters.category_id) {
    conditions.push(`t.category_id = $${idx++}`);
    params.push(filters.category_id);
  }
  if (filters.account_id) {
    conditions.push(`t.account_id = $${idx++}`);
    params.push(filters.account_id);
  }
  if (filters.type === "income") {
    conditions.push("t.amount > 0");
  } else if (filters.type === "expense") {
    conditions.push("t.amount < 0");
  }

  const { rows } = await pool.query(
    `SELECT t.*, c.name AS category_name, a.name AS account_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN accounts a ON a.id = t.account_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY t.date DESC`,
    params
  );
  return rows;
}

async function fetchBudgets(userId) {
  const { rows } = await pool.query(
    `SELECT b.* FROM budgets b
     WHERE b.user_id = $1 AND b.archived_at IS NULL
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return rows;
}

async function fetchGoals(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM goals
     WHERE user_id = $1 AND archived_at IS NULL
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function fetchRecurring(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM recurring_transactions
     WHERE user_id = $1 AND archived_at IS NULL
     ORDER BY next_run_date ASC`,
    [userId]
  );
  return rows;
}

// ── Public API ──

export async function getSummary(userId, filters = {}) {
  const [transactions, budgets, goals, recurring] = await Promise.all([
    fetchTransactions(userId, filters),
    fetchBudgets(userId),
    fetchGoals(userId),
    fetchRecurring(userId),
  ]);

  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const avgMonthlySpend = calculateAverageMonthlySpend(transactions);
  const recurringStats = calculateRecurringExpenseRatio(recurring, avgMonthlySpend);

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    currentBalance: Math.round(calculateCurrentBalance(transactions) * 100) / 100,
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

export async function getMonthlyReport(userId, filters = {}) {
  const transactions = await fetchTransactions(userId, filters);
  return calculateMonthlyTotals(transactions);
}

export async function getYearlyReport(userId, filters = {}) {
  const transactions = await fetchTransactions(userId, filters);
  return calculateYearlyTotals(transactions);
}

export async function getCategoryReport(userId, filters = {}) {
  const transactions = await fetchTransactions(userId, filters);
  const breakdown = calculateCategoryBreakdown(transactions);
  const topCategories = calculateTopCategories(transactions, 5);
  return { ...breakdown, topCategories };
}

export async function getCashFlowReport(userId, filters = {}) {
  const transactions = await fetchTransactions(userId, filters);
  return {
    monthly: calculateCashFlow(transactions),
    netWorth: calculateNetWorthTrend(transactions),
    monthlyGrowth: calculateMonthlyGrowth(transactions),
    expenseGrowth: calculateExpenseGrowth(transactions),
    incomeGrowth: calculateIncomeGrowth(transactions),
  };
}

export async function getBudgetReport(userId) {
  const budgets = await fetchBudgets(userId);
  return calculateBudgetPerformance(budgets);
}

export async function getGoalReport(userId) {
  const goals = await fetchGoals(userId);
  return calculateGoalCompletionRate(goals);
}

export async function getRecurringReport(userId) {
  const [recurring, transactions] = await Promise.all([
    fetchRecurring(userId),
    fetchTransactions(userId),
  ]);

  const avgMonthlySpend = calculateAverageMonthlySpend(transactions);
  const stats = calculateRecurringExpenseRatio(recurring, avgMonthlySpend);

  // Upcoming bills (next 5 due recurring expenses)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = recurring
    .filter((rt) => rt.type === "expense" && rt.status === "active")
    .map((rt) => {
      const nextDate = new Date(rt.next_run_date);
      const daysUntilDue = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { id: rt.id, name: rt.name, amount: Number(rt.amount), nextRunDate: rt.next_run_date, daysUntilDue };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 5);

  return { ...stats, upcoming };
}

// ── Export ──

function escapeCSV(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers, rows) {
  const lines = [headers.map(escapeCSV).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCSV(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function exportCSV(userId, filters = {}, settings) {
  const currency = settings?.currency || "INR";
  const locale = settings?.locale || "en-IN";

  const [summary, monthly, yearly, categories, cashflow, budgets, goals, recurring] =
    await Promise.all([
      getSummary(userId, filters),
      getMonthlyReport(userId, filters),
      getYearlyReport(userId, filters),
      getCategoryReport(userId, filters),
      getCashFlowReport(userId, filters),
      getBudgetReport(userId),
      getGoalReport(userId),
      getRecurringReport(userId),
    ]);

  const parts = [];

  // Summary
  parts.push("=== SUMMARY ===");
  parts.push(
    toCSV(
      ["metric", "value"],
      [
        { metric: "Total Income", value: summary.totalIncome },
        { metric: "Total Expenses", value: summary.totalExpenses },
        { metric: "Current Balance", value: summary.currentBalance },
        { metric: "Savings Rate (%)", value: summary.savingsRate },
        { metric: "Avg Daily Spend", value: summary.averageDailySpend },
        { metric: "Avg Monthly Spend", value: summary.averageMonthlySpend },
        { metric: "Active Budgets", value: summary.activeBudgets },
        { metric: "Active Goals", value: summary.activeGoals },
        { metric: "Recurring Monthly Expenses", value: summary.recurringMonthlyExpenses },
        { metric: "Recurring Monthly Income", value: summary.recurringMonthlyIncome },
      ]
    )
  );

  // Monthly
  parts.push("\n=== MONTHLY BREAKDOWN ===");
  parts.push(toCSV(["month", "income", "expenses", "net"], monthly));

  // Yearly
  parts.push("\n=== YEARLY BREAKDOWN ===");
  parts.push(toCSV(["year", "income", "expenses", "net"], yearly));

  // Categories
  parts.push("\n=== CATEGORY BREAKDOWN ===");
  parts.push(toCSV(["name", "amount", "percentage"], categories.categories));

  // Budgets
  parts.push("\n=== BUDGETS ===");
  parts.push(
    toCSV(
      ["metric", "value"],
      [
        { metric: "Total Budgets", value: budgets.total },
        { metric: "Total Budgeted", value: budgets.totalBudgeted },
        { metric: "Total Spent", value: budgets.totalSpent },
        { metric: "Utilization (%)", value: budgets.utilization },
        { metric: "Warning", value: budgets.warningCount },
        { metric: "Exceeded", value: budgets.exceededCount },
      ]
    )
  );

  // Goals
  parts.push("\n=== GOALS ===");
  parts.push(
    toCSV(
      ["metric", "value"],
      [
        { metric: "Total Goals", value: goals.total },
        { metric: "Completed", value: goals.completed },
        { metric: "Completion Rate (%)", value: goals.completionRate },
        { metric: "Total Target", value: goals.totalTarget },
        { metric: "Total Saved", value: goals.totalSaved },
      ]
    )
  );

  return parts.join("\n");
}

export async function exportPDF(userId, filters = {}, settings) {
  const currency = settings?.currency || "INR";
  const locale = settings?.locale || "en-IN";
  const currencySymbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
  const sym = currencySymbols[currency] || currency;

  const [summary, monthly, yearly, categories, cashflow, budgets, goals, recurring] =
    await Promise.all([
      getSummary(userId, filters),
      getMonthlyReport(userId, filters),
      getYearlyReport(userId, filters),
      getCategoryReport(userId, filters),
      getCashFlowReport(userId, filters),
      getBudgetReport(userId),
      getGoalReport(userId),
      getRecurringReport(userId),
    ]);

  const fmt = (n) => `${sym}${Number(n).toLocaleString(locale)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Expense Tracker — Full Report</title>
<style>
  body { font-family: -apple-system, sans-serif; color: #1f2937; padding: 40px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  h2 { font-size: 18px; margin-top: 32px; color: #374151; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  th { background: #f9fafb; font-weight: 600; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .card h3 { font-size: 13px; color: #6b7280; margin: 0 0 4px; }
  .card .value { font-size: 20px; font-weight: 700; }
  .green { color: #059669; } .red { color: #dc2626; } .blue { color: #2563eb; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>Expense Tracker — Full Report</h1>
<p style="color: #6b7280;">Generated ${new Date().toLocaleDateString()}</p>

<h2>Summary</h2>
<div class="grid">
  <div class="card"><h3>Total Income</h3><div class="value green">${fmt(summary.totalIncome)}</div></div>
  <div class="card"><h3>Total Expenses</h3><div class="value red">${fmt(summary.totalExpenses)}</div></div>
  <div class="card"><h3>Current Balance</h3><div class="value blue">${fmt(summary.currentBalance)}</div></div>
  <div class="card"><h3>Savings Rate</h3><div class="value">${summary.savingsRate}%</div></div>
  <div class="card"><h3>Avg Daily Spend</h3><div class="value">${fmt(summary.averageDailySpend)}</div></div>
  <div class="card"><h3>Avg Monthly Spend</h3><div class="value">${fmt(summary.averageMonthlySpend)}</div></div>
</div>

<h2>Monthly Breakdown</h2>
<table><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th></tr>
${monthly.map((m) => `<tr><td>${m.month}</td><td class="green">${fmt(m.income)}</td><td class="red">${fmt(m.expenses)}</td><td>${fmt(m.net)}</td></tr>`).join("")}
</table>

<h2>Yearly Breakdown</h2>
<table><tr><th>Year</th><th>Income</th><th>Expenses</th><th>Net</th></tr>
${yearly.map((y) => `<tr><td>${y.year}</td><td class="green">${fmt(y.income)}</td><td class="red">${fmt(y.expenses)}</td><td>${fmt(y.net)}</td></tr>`).join("")}
</table>

<h2>Category Breakdown</h2>
<table><tr><th>Category</th><th>Amount</th><th>%</th></tr>
${categories.categories.map((c) => `<tr><td>${c.name}</td><td>${fmt(c.amount)}</td><td>${c.percentage}%</td></tr>`).join("")}
</table>

<h2>Budgets</h2>
<div class="grid">
  <div class="card"><h3>Active Budgets</h3><div class="value">${budgets.total}</div></div>
  <div class="card"><h3>Utilization</h3><div class="value">${budgets.utilization}%</div></div>
  <div class="card"><h3>Warning</h3><div class="value">${budgets.warningCount}</div></div>
  <div class="card"><h3>Exceeded</h3><div class="value">${budgets.exceededCount}</div></div>
</div>

<h2>Goals</h2>
<div class="grid">
  <div class="card"><h3>Completion Rate</h3><div class="value">${goals.completionRate}%</div></div>
  <div class="card"><h3>Completed</h3><div class="value">${goals.completed}/${goals.total}</div></div>
  <div class="card"><h3>Total Saved</h3><div class="value green">${fmt(goals.totalSaved)}</div></div>
  <div class="card"><h3>Remaining</h3><div class="value red">${fmt(goals.totalRemaining)}</div></div>
</div>

<h2>Recurring</h2>
<div class="grid">
  <div class="card"><h3>Monthly Recurring Expenses</h3><div class="value red">${fmt(recurring.monthlyRecurringExpenses)}</div></div>
  <div class="card"><h3>Monthly Recurring Income</h3><div class="value green">${fmt(recurring.monthlyRecurringIncome)}</div></div>
</div>
</body>
</html>`;
}
