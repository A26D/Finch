/**
 * Report Analytics
 *
 * Pure functions only — no DB, no Express, no React.
 * All functions operate on plain arrays of records.
 * Portable to React Native unchanged.
 *
 * ── Future AI Extension Points ──
 *
 * TODO(ai-monthly-summaries): NLP generates "You spent 15% less on dining out
 * this month compared to your 3-month average."
 *
 * TODO(ai-forecasted-spending): Time-series model predicts next month's
 * category-level spending based on historical patterns.
 *
 * TODO(ai-budget-optimization): Recommends reallocation of budget caps based
 * on actual vs budgeted spending patterns.
 *
 * TODO(ai-goal-recommendations): Suggests target amounts and timelines based
 * on income patterns and spending history.
 *
 * TODO(ai-category-anomaly): Flags categories where current-month spend
 * deviates significantly from the rolling 6-month average.
 *
 * TODO(ai-financial-health-score): Composite score combining savings rate,
 * budget adherence, goal progress, debt ratio, and recurring coverage.
 *
 * TODO(ai-natural-language-reports): LLM generates paragraph summaries of
 * any report section on demand.
 */

// ── Helpers ──

const toNum = (v) => Number(v);

function getDateRange(transactions) {
  if (!transactions.length) return { first: null, last: null, days: 0 };
  const dates = transactions.map((t) => new Date(t.date));
  const first = new Date(Math.min(...dates));
  const last = new Date(Math.max(...dates));
  const days = Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));
  return { first, last, days };
}

function getMonthCount(transactions) {
  if (!transactions.length) return 1;
  const months = new Set(
    transactions.map((t) => {
      const d = new Date(t.date);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })
  );
  return months.size || 1;
}

// ── Transaction Aggregations ──

export function calculateTotalIncome(transactions) {
  return transactions
    .filter((t) => toNum(t.amount) > 0)
    .reduce((sum, t) => sum + toNum(t.amount), 0);
}

export function calculateTotalExpenses(transactions) {
  return transactions
    .filter((t) => toNum(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(toNum(t.amount)), 0);
}

export function calculateCurrentBalance(transactions) {
  return calculateTotalIncome(transactions) - calculateTotalExpenses(transactions);
}

// ── Monthly / Yearly ──

export function calculateMonthlyTotals(transactions) {
  const map = {};
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortMonth = d.toLocaleString("default", { month: "short" });
    if (!map[key]) {
      map[key] = { month: shortMonth, full: key, income: 0, expenses: 0, net: 0 };
    }
    const amount = toNum(t.amount);
    if (amount > 0) map[key].income += amount;
    else map[key].expenses += Math.abs(amount);
    map[key].net = map[key].income - map[key].expenses;
  }
  return Object.values(map)
    .map((m) => ({
      ...m,
      income: Math.round(m.income * 100) / 100,
      expenses: Math.round(m.expenses * 100) / 100,
      net: Math.round(m.net * 100) / 100,
    }))
    .sort((a, b) => a.full.localeCompare(b.full));
}

export function calculateYearlyTotals(transactions) {
  const map = {};
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = String(d.getFullYear());
    if (!map[key]) {
      map[key] = { year: key, income: 0, expenses: 0, net: 0 };
    }
    const amount = toNum(t.amount);
    if (amount > 0) map[key].income += amount;
    else map[key].expenses += Math.abs(amount);
    map[key].net = map[key].income - map[key].expenses;
  }
  return Object.values(map)
    .map((m) => ({
      ...m,
      income: Math.round(m.income * 100) / 100,
      expenses: Math.round(m.expenses * 100) / 100,
      net: Math.round(m.net * 100) / 100,
    }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

// ── Category Breakdown ──

export function calculateCategoryBreakdown(transactions) {
  const map = {};
  for (const t of transactions) {
    if (toNum(t.amount) >= 0) continue;
    const name = t.category_name || "Uncategorized";
    map[name] = (map[name] || 0) + Math.abs(toNum(t.amount));
  }

  const total = Object.values(map).reduce((s, v) => s + v, 0);
  const categories = Object.entries(map)
    .map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100,
      percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    categories,
    total: Math.round(total * 100) / 100,
    highest: categories.length ? categories[0] : null,
    lowest: categories.length ? categories[categories.length - 1] : null,
  };
}

// ── Income / Expense Trend ──

export function calculateIncomeExpenseTrend(transactions) {
  return calculateMonthlyTotals(transactions);
}

// ── Cash Flow ──

export function calculateCashFlow(transactions) {
  return calculateMonthlyTotals(transactions);
}

// ── Averages ──

export function calculateAverageDailySpend(transactions) {
  const expenses = calculateTotalExpenses(transactions);
  const { days } = getDateRange(transactions);
  return days ? Math.round((expenses / days) * 100) / 100 : 0;
}

export function calculateAverageMonthlySpend(transactions) {
  const expenses = calculateTotalExpenses(transactions);
  const months = getMonthCount(transactions);
  return months ? Math.round((expenses / months) * 100) / 100 : 0;
}

// ── Highest / Lowest ──

export function calculateHighestSpendingMonth(transactions) {
  const monthly = calculateMonthlyTotals(transactions);
  if (!monthly.length) return null;
  return monthly.reduce((max, m) => (m.expenses > max.expenses ? m : max));
}

export function calculateLowestSpendingMonth(transactions) {
  const monthly = calculateMonthlyTotals(transactions);
  if (!monthly.length) return null;
  return monthly.reduce((min, m) => (m.expenses < min.expenses ? m : min));
}

// ── Largest Transactions ──

export function calculateLargestExpense(transactions) {
  const expenses = transactions.filter((t) => toNum(t.amount) < 0);
  if (!expenses.length) return null;
  return expenses.reduce((max, t) =>
    Math.abs(toNum(t.amount)) > Math.abs(toNum(max.amount)) ? t : max
  );
}

export function calculateLargestIncome(transactions) {
  const incomes = transactions.filter((t) => toNum(t.amount) > 0);
  if (!incomes.length) return null;
  return incomes.reduce((max, t) =>
    toNum(t.amount) > toNum(max.amount) ? t : max
  );
}

// ── Savings ──

export function calculateSavingsRate(transactions) {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  if (income === 0) return 0;
  return Math.round(((income - expenses) / income) * 10000) / 100;
}

// ── Budget Performance ──

export function calculateBudgetPerformance(budgets) {
  const total = budgets.length;
  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent || 0), 0);
  const warning = budgets.filter(
    (b) => Number(b.percentUsed || 0) >= Number(b.alert_threshold || 0.8) && Number(b.percentUsed || 0) < 1
  ).length;
  const exceeded = budgets.filter((b) => Number(b.percentUsed || 0) >= 1).length;

  return {
    total,
    totalBudgeted: Math.round(totalBudgeted * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalRemaining: Math.round(Math.max(0, totalBudgeted - totalSpent) * 100) / 100,
    utilization: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 10000) / 100 : 0,
    warningCount: warning,
    exceededCount: exceeded,
    onTrack: total - warning - exceeded,
  };
}

// ── Goal Completion ──

export function calculateGoalCompletionRate(goals) {
  const total = goals.length;
  const completed = goals.filter((g) => g.status === "completed").length;
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_saved_amount), 0);

  return {
    total,
    completed,
    inProgress: total - completed,
    completionRate: total > 0 ? Math.round((completed / total) * 10000) / 100 : 0,
    totalTarget: Math.round(totalTarget * 100) / 100,
    totalSaved: Math.round(totalSaved * 100) / 100,
    totalRemaining: Math.round(Math.max(0, totalTarget - totalSaved) * 100) / 100,
    averageCompletion:
      total > 0
        ? Math.round(
            goals.reduce((s, g) => s + (Number(g.current_saved_amount) / Number(g.target_amount)) * 100, 0) / total
              * 100
          ) / 100
        : 0,
  };
}

// ── Recurring ──

export function calculateRecurringExpenseRatio(recurringTransactions, totalMonthlyExpenses) {
  const monthlyRecurring = recurringTransactions
    .filter((rt) => rt.type === "expense" && rt.status === "active")
    .reduce((sum, rt) => sum + monthlyEquivalent(rt), 0);

  return {
    monthlyRecurringExpenses: Math.round(monthlyRecurring * 100) / 100,
    monthlyRecurringIncome: Math.round(
      recurringTransactions
        .filter((rt) => rt.type === "income" && rt.status === "active")
        .reduce((sum, rt) => sum + monthlyEquivalent(rt), 0) * 100
    ) / 100,
    ratio: totalMonthlyExpenses > 0
      ? Math.round((monthlyRecurring / totalMonthlyExpenses) * 10000) / 100
      : null,
  };
}

function monthlyEquivalent(rt) {
  const amount = Number(rt.amount);
  const interval = rt.interval_value || 1;
  switch (rt.frequency) {
    case "daily": return (amount / interval) * 30.44;
    case "weekly": return (amount / (interval * 7)) * 30.44;
    case "monthly": return amount / interval;
    case "yearly": return amount / (interval * 12);
    default: return 0;
  }
}

// ── Top Categories ──

export function calculateTopCategories(transactions, limit = 5) {
  const map = {};
  for (const t of transactions) {
    if (toNum(t.amount) >= 0) continue;
    const name = t.category_name || "Uncategorized";
    map[name] = (map[name] || 0) + Math.abs(toNum(t.amount));
  }
  return Object.entries(map)
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

// ── Net Worth / Growth ──

export function calculateNetWorthTrend(transactions) {
  const monthly = calculateMonthlyTotals(transactions);
  let runningBalance = 0;
  return monthly.map((m) => {
    runningBalance += m.net;
    return { month: m.month, full: m.full, netWorth: Math.round(runningBalance * 100) / 100 };
  });
}

export function calculateMonthlyGrowth(transactions) {
  const monthly = calculateMonthlyTotals(transactions);
  return monthly.map((m, i) => {
    if (i === 0) return { ...m, growth: 0, growthPercent: 0 };
    const prev = monthly[i - 1].net;
    const growth = Math.round((m.net - prev) * 100) / 100;
    const growthPercent = prev !== 0 ? Math.round((growth / Math.abs(prev)) * 10000) / 100 : 0;
    return { ...m, growth, growthPercent };
  });
}

export function calculateExpenseGrowth(transactions) {
  const monthly = calculateMonthlyTotals(transactions);
  return monthly.map((m, i) => {
    if (i === 0) return { ...m, growth: 0, growthPercent: 0 };
    const prev = monthly[i - 1].expenses;
    const growth = Math.round((m.expenses - prev) * 100) / 100;
    const growthPercent = prev !== 0 ? Math.round((growth / prev) * 10000) / 100 : 0;
    return { ...m, growth, growthPercent };
  });
}

export function calculateIncomeGrowth(transactions) {
  const monthly = calculateMonthlyTotals(transactions);
  return monthly.map((m, i) => {
    if (i === 0) return { ...m, growth: 0, growthPercent: 0 };
    const prev = monthly[i - 1].income;
    const growth = Math.round((m.income - prev) * 100) / 100;
    const growthPercent = prev !== 0 ? Math.round((growth / prev) * 10000) / 100 : 0;
    return { ...m, growth, growthPercent };
  });
}
