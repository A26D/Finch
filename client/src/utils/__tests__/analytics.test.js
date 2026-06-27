import { describe, it, expect } from "vitest";
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateCurrentBalance,
  calculateAverageDailySpend,
  calculateAverageMonthlySpend,
  calculateLargestExpense,
  calculateLargestIncome,
  calculateTopCategories,
  calculateMonthlySavingsRate,
  calculateNetCashFlow,
  calculateSpendingTrend,
  calculateIncomeTrend,
} from "../analytics";

const txns = [
  { amount: 50000, date: "2026-06-01", category_name: "Salary" },
  { amount: -2500, date: "2026-06-05", category_name: "Groceries" },
  { amount: -1200, date: "2026-06-10", category_name: "Food" },
  { amount: 15000, date: "2026-05-15", category_name: "Freelance" },
  { amount: -3000, date: "2026-05-20", category_name: "Rent" },
  { amount: -450, date: "2026-06-12", category_name: "Transport" },
];

describe("analytics", () => {
  describe("calculateTotalIncome", () => {
    it("sums all positive amounts", () => {
      expect(calculateTotalIncome(txns)).toBe(65000);
    });

    it("returns 0 for empty array", () => {
      expect(calculateTotalIncome([])).toBe(0);
    });

    it("returns 0 when no income", () => {
      expect(calculateTotalIncome([{ amount: -100 }])).toBe(0);
    });
  });

  describe("calculateTotalExpenses", () => {
    it("sums absolute values of negative amounts", () => {
      expect(calculateTotalExpenses(txns)).toBe(7150);
    });

    it("returns 0 for empty array", () => {
      expect(calculateTotalExpenses([])).toBe(0);
    });
  });

  describe("calculateCurrentBalance", () => {
    it("returns income minus expenses", () => {
      expect(calculateCurrentBalance(txns)).toBe(57850);
    });
  });

  describe("calculateAverageDailySpend", () => {
    it("computes daily average over date range", () => {
      const result = calculateAverageDailySpend(txns);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(500);
    });

    it("returns 0 for empty array", () => {
      expect(calculateAverageDailySpend([])).toBe(0);
    });

    it("returns expenses divided by 1 day for single transaction", () => {
      expect(calculateAverageDailySpend([{ amount: -100, date: "2026-06-01" }])).toBe(100);
    });

    it("returns total expenses for single-day range", () => {
      const single = [
        { amount: -1000, date: "2026-06-01" },
        { amount: -2000, date: "2026-06-01" },
      ];
      expect(calculateAverageDailySpend(single)).toBe(3000);
    });
  });

  describe("calculateAverageMonthlySpend", () => {
    it("computes monthly average", () => {
      const result = calculateAverageMonthlySpend(txns);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(3575, 0);
    });

    it("returns 0 for empty array", () => {
      expect(calculateAverageMonthlySpend([])).toBe(0);
    });
  });

  describe("calculateLargestExpense", () => {
    it("returns the transaction with largest absolute expense", () => {
      const result = calculateLargestExpense(txns);
      expect(result.amount).toBe(-3000);
      expect(result.category_name).toBe("Rent");
    });

    it("returns null when no expenses", () => {
      expect(calculateLargestExpense([])).toBeNull();
      expect(calculateLargestExpense([{ amount: 100 }])).toBeNull();
    });
  });

  describe("calculateLargestIncome", () => {
    it("returns the transaction with largest income", () => {
      const result = calculateLargestIncome(txns);
      expect(result.amount).toBe(50000);
    });

    it("returns null when no income", () => {
      expect(calculateLargestIncome([])).toBeNull();
    });
  });

  describe("calculateTopCategories", () => {
    it("returns top N expense categories by amount", () => {
      const result = calculateTopCategories(txns, 2);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Rent");
      expect(result[0].amount).toBe(3000);
      expect(result[1].name).toBe("Groceries");
    });

    it("skips income transactions", () => {
      const result = calculateTopCategories(txns);
      const salaries = result.filter((c) => c.name === "Salary");
      expect(salaries).toHaveLength(0);
    });

    it("returns empty array for empty input", () => {
      expect(calculateTopCategories([])).toEqual([]);
    });
  });

  describe("calculateMonthlySavingsRate", () => {
    it("computes savings rate as percentage", () => {
      const result = calculateMonthlySavingsRate(txns);
      expect(result).toBeCloseTo(89.0, 0);
    });

    it("returns 0 when income is 0", () => {
      expect(calculateMonthlySavingsRate([{ amount: -100 }])).toBe(0);
    });
  });

  describe("calculateNetCashFlow", () => {
    it("returns income minus expenses", () => {
      const result = calculateNetCashFlow(txns);
      expect(result).toBe(57850);
    });

    it("returns 0 for empty array", () => {
      expect(calculateNetCashFlow([])).toBe(0);
    });
  });

  describe("calculateSpendingTrend", () => {
    it("returns stable for fewer than 2 months", () => {
      expect(calculateSpendingTrend([]).direction).toBe("stable");
      expect(calculateSpendingTrend([{ amount: -100, date: "2026-06-01" }]).direction).toBe("stable");
    });

    it("returns direction based on month-over-month change", () => {
      const result = calculateSpendingTrend(txns);
      expect(["up", "down", "stable"]).toContain(result.direction);
      expect(typeof result.percent).toBe("number");
    });

    it("returns stable when previous month has no spending", () => {
      const data = [
        { amount: -100, date: "2026-06-01" },
        { amount: -200, date: "2026-06-05" },
      ];
      const result = calculateSpendingTrend(data);
      expect(result.direction).toBe("stable");
    });
  });

  describe("calculateIncomeTrend", () => {
    it("returns stable for fewer than 2 months", () => {
      expect(calculateIncomeTrend([]).direction).toBe("stable");
    });

    it("returns direction based on month-over-month change", () => {
      const result = calculateIncomeTrend(txns);
      expect(["up", "down", "stable"]).toContain(result.direction);
    });
  });
});
