import { describe, it, expect } from "vitest";
import {
  calculateMonthlyRecurringExpenses,
  calculateMonthlyRecurringIncome,
  calculateUpcomingBills,
  calculateAverageRecurringSpend,
  calculateRecurringRatio,
} from "../recurringAnalytics";

const sampleTransactions = [
  { id: "1", name: "Netflix", amount: 500, type: "expense", frequency: "monthly", interval_value: 1, status: "active", next_run_date: "2026-07-01" },
  { id: "2", name: "Rent", amount: 15000, type: "expense", frequency: "monthly", interval_value: 1, status: "active", next_run_date: "2026-07-01" },
  { id: "3", name: "Salary", amount: 50000, type: "income", frequency: "monthly", interval_value: 1, status: "active", next_run_date: "2026-07-01" },
  { id: "4", name: "Freelance", amount: 10000, type: "income", frequency: "monthly", interval_value: 1, status: "active", next_run_date: "2026-07-15" },
  { id: "5", name: "Gym", amount: 2000, type: "expense", frequency: "monthly", interval_value: 1, status: "paused", next_run_date: "2026-08-01" },
  { id: "6", name: "Spotify", amount: 200, type: "expense", frequency: "monthly", interval_value: 1, status: "active", next_run_date: "2026-06-28" },
];

describe("calculateMonthlyRecurringExpenses", () => {
  it("sums monthly equivalent for active expenses", () => {
    const result = calculateMonthlyRecurringExpenses(sampleTransactions);
    expect(result).toBeCloseTo(500 + 15000 + 200, 1);
  });

  it("returns 0 when no active expenses", () => {
    const result = calculateMonthlyRecurringExpenses([]);
    expect(result).toBe(0);
  });
});

describe("calculateMonthlyRecurringIncome", () => {
  it("sums monthly equivalent for active income", () => {
    const result = calculateMonthlyRecurringIncome(sampleTransactions);
    expect(result).toBeCloseTo(50000 + 10000, 1);
  });

  it("returns 0 when no active income", () => {
    const result = calculateMonthlyRecurringIncome([]);
    expect(result).toBe(0);
  });
});

describe("calculateUpcomingBills", () => {
  it("returns next N due bills sorted by proximity", () => {
    const bills = calculateUpcomingBills(sampleTransactions, 3);
    expect(bills).toHaveLength(3);
    expect(bills[0].daysUntilDue <= bills[1].daysUntilDue).toBe(true);
  });

  it("returns all when fewer than limit", () => {
    const bills = calculateUpcomingBills(sampleTransactions, 10);
    expect(bills).toHaveLength(3); // 3 active expenses
  });

  it("excludes paused transactions", () => {
    const bills = calculateUpcomingBills(sampleTransactions, 10);
    const gym = bills.find((b) => b.name === "Gym");
    expect(gym).toBeUndefined();
  });
});

describe("calculateAverageRecurringSpend", () => {
  it("returns average of active expense amounts", () => {
    const result = calculateAverageRecurringSpend(sampleTransactions);
    expect(result).toBeCloseTo((500 + 15000 + 200) / 3, 1);
  });

  it("returns 0 when no active expenses", () => {
    const result = calculateAverageRecurringSpend([]);
    expect(result).toBe(0);
  });
});

describe("calculateRecurringRatio", () => {
  it("returns percentage of recurring vs total expenses", () => {
    const result = calculateRecurringRatio(10000, 20000);
    expect(result).toBe(50);
  });

  it("returns null when total is 0", () => {
    expect(calculateRecurringRatio(1000, 0)).toBe(null);
  });

  it("returns null when total is negative", () => {
    expect(calculateRecurringRatio(1000, -500)).toBe(null);
  });
});
