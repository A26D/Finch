const toNum = (v) => Number(v);

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
  return (
    calculateTotalIncome(transactions) - calculateTotalExpenses(transactions)
  );
}

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

export function calculateAverageDailySpend(transactions) {
  const expenses = calculateTotalExpenses(transactions);
  const { days } = getDateRange(transactions);
  return days ? expenses / days : 0;
}

export function calculateAverageMonthlySpend(transactions) {
  const expenses = calculateTotalExpenses(transactions);
  const months = getMonthCount(transactions);
  return expenses / months;
}

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

export function calculateMonthlySavingsRate(transactions) {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  if (income === 0) return 0;
  return Math.round(((income - expenses) / income) * 100 * 100) / 100;
}

export function calculateNetCashFlow(transactions) {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  return Math.round((income - expenses) * 100) / 100;
}

export function calculateSpendingTrend(transactions) {
  const months = {};
  for (const t of transactions) {
    if (toNum(t.amount) >= 0) continue;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months[key] = (months[key] || 0) + Math.abs(toNum(t.amount));
  }
  const sorted = Object.entries(months).sort(([a], [b]) => a.localeCompare(b));
  if (sorted.length < 2) return { direction: "stable", percent: 0 };
  const [prevMonth, currMonth] = sorted.slice(-2);
  const prev = prevMonth[1];
  const curr = currMonth[1];
  if (prev === 0) return { direction: "stable", percent: 0 };
  const change = ((curr - prev) / prev) * 100;
  return {
    direction: change > 1 ? "up" : change < -1 ? "down" : "stable",
    percent: Math.round(change * 100) / 100,
  };
}

export function calculateIncomeTrend(transactions) {
  const months = {};
  for (const t of transactions) {
    if (toNum(t.amount) <= 0) continue;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months[key] = (months[key] || 0) + toNum(t.amount);
  }
  const sorted = Object.entries(months).sort(([a], [b]) => a.localeCompare(b));
  if (sorted.length < 2) return { direction: "stable", percent: 0 };
  const [prevMonth, currMonth] = sorted.slice(-2);
  const prev = prevMonth[1];
  const curr = currMonth[1];
  if (prev === 0) return { direction: "stable", percent: 0 };
  const change = ((curr - prev) / prev) * 100;
  return {
    direction: change > 1 ? "up" : change < -1 ? "down" : "stable",
    percent: Math.round(change * 100) / 100,
  };
}
