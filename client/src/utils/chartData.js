export const COLORS = {
  income: "#10B981",
  expense: "#EF4444",
  balance: "#3B82F6",
  savings: "#8B5CF6",
  budget: "#F59E0B",
};

export const CATEGORY_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
  "#06B6D4", "#D946EF", "#0EA5E9", "#22C55E", "#EAB308",
];

const toNum = (v) => Number(v);

export function groupByCategory(transactions) {
  const map = {};

  for (const t of transactions) {
    if (toNum(t.amount) >= 0) continue;
    const name = t.category_name || "Uncategorized";
    map[name] = (map[name] || 0) + Math.abs(toNum(t.amount));
  }

  return Object.entries(map)
    .map(([name, value], i) => ({ name, value: Math.round(value * 100) / 100, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
    .sort((a, b) => b.value - a.value);
}

export function groupByMonth(transactions, type = "expense") {
  const map = {};

  for (const t of transactions) {
    const isExpense = toNum(t.amount) < 0;
    if (type === "expense" && !isExpense) continue;
    if (type === "income" && isExpense) continue;

    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortMonth = d.toLocaleString("default", { month: "short" });
    map[key] = map[key] || { month: shortMonth, amount: 0, full: key };
    map[key].amount += Math.abs(toNum(t.amount));
  }

  return Object.values(map)
    .map((m) => ({ ...m, amount: Math.round(m.amount * 100) / 100 }))
    .sort((a, b) => a.full.localeCompare(b.full));
}

export function incomeVsExpense(transactions) {
  const map = {};

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortMonth = d.toLocaleString("default", { month: "short" });

    if (!map[key]) {
      map[key] = { month: shortMonth, income: 0, expense: 0, full: key };
    }
    const amount = toNum(t.amount);
    if (amount >= 0) {
      map[key].income += amount;
    } else {
      map[key].expense += Math.abs(amount);
    }
  }

  return Object.values(map)
    .map((m) => ({
      ...m,
      income: Math.round(m.income * 100) / 100,
      expense: Math.round(m.expense * 100) / 100,
    }))
    .sort((a, b) => a.full.localeCompare(b.full));
}
