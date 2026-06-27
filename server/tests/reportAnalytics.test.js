import { describe, it, expect } from "vitest";
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateCurrentBalance,
  calculateMonthlyTotals,
  calculateYearlyTotals,
  calculateCategoryBreakdown,
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
} from "../src/utils/reportAnalytics.js";

const txns = [
  { id: "1", amount: 50000, date: "2026-06-01", category_name: "Salary" },
  { id: "2", amount: -2500, date: "2026-06-05", category_name: "Food" },
  { id: "3", amount: -1500, date: "2026-06-10", category_name: "Transport" },
  { id: "4", amount: -3000, date: "2026-06-15", category_name: "Food" },
  { id: "5", amount: 15000, date: "2026-05-15", category_name: "Freelance" },
  { id: "6", amount: -1200, date: "2026-05-20", category_name: "Entertainment" },
];

describe("calculateTotalIncome", () => {
  it("sums all positive amounts", () => {
    expect(calculateTotalIncome(txns)).toBe(65000);
  });

  it("returns 0 for empty array", () => {
    expect(calculateTotalIncome([])).toBe(0);
  });
});

describe("calculateTotalExpenses", () => {
  it("sums absolute values of negative amounts", () => {
    expect(calculateTotalExpenses(txns)).toBe(8200);
  });

  it("returns 0 for empty array", () => {
    expect(calculateTotalExpenses([])).toBe(0);
  });
});

describe("calculateCurrentBalance", () => {
  it("returns income minus expenses", () => {
    expect(calculateCurrentBalance(txns)).toBe(56800);
  });
});

describe("calculateMonthlyTotals", () => {
  it("groups transactions by month", () => {
    const result = calculateMonthlyTotals(txns);
    expect(result).toHaveLength(2);
    expect(result[0].month).toBeDefined();
    expect(result[0].income).toBeGreaterThan(0);
    expect(result[0].expenses).toBeGreaterThan(0);
  });

  it("sorts chronologically", () => {
    const result = calculateMonthlyTotals(txns);
    expect(result[0].full.localeCompare(result[1].full)).toBeLessThan(0);
  });
});

describe("calculateYearlyTotals", () => {
  it("groups transactions by year", () => {
    const result = calculateYearlyTotals(txns);
    expect(result).toHaveLength(1);
    expect(result[0].year).toBe("2026");
  });
});

describe("calculateCategoryBreakdown", () => {
  it("returns categories with amounts and percentages", () => {
    const result = calculateCategoryBreakdown(txns);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.total).toBe(8200);
    expect(result.highest).toBeDefined();
    expect(result.lowest).toBeDefined();
  });
});

describe("calculateCashFlow", () => {
  it("returns monthly cash flow data", () => {
    const result = calculateCashFlow(txns);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("income");
    expect(result[0]).toHaveProperty("expenses");
    expect(result[0]).toHaveProperty("net");
  });
});

describe("calculateAverageDailySpend", () => {
  it("returns average daily spend", () => {
    const result = calculateAverageDailySpend(txns);
    expect(result).toBeGreaterThan(0);
  });

  it("returns 0 for empty transactions", () => {
    expect(calculateAverageDailySpend([])).toBe(0);
  });
});

describe("calculateAverageMonthlySpend", () => {
  it("returns average monthly spend", () => {
    const result = calculateAverageMonthlySpend(txns);
    expect(result).toBe(4100);
  });
});

describe("calculateHighestSpendingMonth", () => {
  it("returns the month with highest expenses", () => {
    const result = calculateHighestSpendingMonth(txns);
    expect(result).toBeDefined();
    expect(result.expenses).toBeGreaterThan(0);
  });

  it("returns null for empty data", () => {
    expect(calculateHighestSpendingMonth([])).toBe(null);
  });
});

describe("calculateLowestSpendingMonth", () => {
  it("returns the month with lowest expenses", () => {
    const result = calculateLowestSpendingMonth(txns);
    expect(result).toBeDefined();
  });
});

describe("calculateLargestExpense", () => {
  it("returns the largest expense transaction", () => {
    const result = calculateLargestExpense(txns);
    expect(result.amount).toBe(-3000);
  });

  it("returns null for no expenses", () => {
    expect(calculateLargestExpense([])).toBe(null);
  });
});

describe("calculateLargestIncome", () => {
  it("returns the largest income transaction", () => {
    const result = calculateLargestIncome(txns);
    expect(result.amount).toBe(50000);
  });
});

describe("calculateSavingsRate", () => {
  it("returns savings as percentage of income", () => {
    const result = calculateSavingsRate(txns);
    expect(result).toBeGreaterThan(0);
  });

  it("returns 0 when no income", () => {
    expect(calculateSavingsRate([])).toBe(0);
  });
});

describe("calculateBudgetPerformance", () => {
  it("returns budget statistics", () => {
    const budgets = [
      { amount: 5000, spent: 2000, percentUsed: 0.4, alert_threshold: 0.8 },
      { amount: 10000, spent: 9000, percentUsed: 0.9, alert_threshold: 0.8 },
      { amount: 3000, spent: 3000, percentUsed: 1, alert_threshold: 0.8 },
    ];
    const result = calculateBudgetPerformance(budgets);
    expect(result.total).toBe(3);
    expect(result.warningCount).toBe(1);
    expect(result.exceededCount).toBe(1);
    expect(result.onTrack).toBe(1);
  });
});

describe("calculateGoalCompletionRate", () => {
  it("returns goal statistics", () => {
    const goals = [
      { status: "completed", target_amount: 10000, current_saved_amount: 10000 },
      { status: "active", target_amount: 50000, current_saved_amount: 25000 },
      { status: "active", target_amount: 20000, current_saved_amount: 5000 },
    ];
    const result = calculateGoalCompletionRate(goals);
    expect(result.total).toBe(3);
    expect(result.completed).toBe(1);
    expect(result.completionRate).toBeCloseTo(33.33, 1);
  });
});

describe("calculateRecurringExpenseRatio", () => {
  it("returns recurring stats", () => {
    const recurring = [
      { type: "expense", status: "active", amount: 500, frequency: "monthly", interval_value: 1 },
      { type: "income", status: "active", amount: 50000, frequency: "monthly", interval_value: 1 },
    ];
    const result = calculateRecurringExpenseRatio(recurring, 20000);
    expect(result.monthlyRecurringExpenses).toBe(500);
    expect(result.monthlyRecurringIncome).toBe(50000);
    expect(result.ratio).toBe(2.5);
  });

  it("returns null ratio when total is 0", () => {
    expect(calculateRecurringExpenseRatio([], 0).ratio).toBe(null);
  });
});

describe("calculateTopCategories", () => {
  it("returns top N categories by spend", () => {
    const result = calculateTopCategories(txns, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });
});

describe("calculateNetWorthTrend", () => {
  it("returns running balance over months", () => {
    const result = calculateNetWorthTrend(txns);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("netWorth");
  });
});

describe("calculateMonthlyGrowth", () => {
  it("returns growth from previous month", () => {
    const result = calculateMonthlyGrowth(txns);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("growth");
  });
});

describe("calculateExpenseGrowth", () => {
  it("returns expense growth from previous month", () => {
    const result = calculateExpenseGrowth(txns);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("calculateIncomeGrowth", () => {
  it("returns income growth from previous month", () => {
    const result = calculateIncomeGrowth(txns);
    expect(result.length).toBeGreaterThan(0);
  });
});
