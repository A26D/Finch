import { describe, it, expect } from "vitest";
import {
  calculateNextRunDate,
  isTransactionDue,
  generateTransaction,
  generateAllDueTransactions,
} from "../src/utils/recurrence.js";

describe("calculateNextRunDate", () => {
  it("returns start date if it's in the future", () => {
    const result = calculateNextRunDate("2026-12-31", "monthly", 1, new Date("2026-06-15"));
    expect(result).toEqual(new Date("2026-12-31"));
  });

  it("returns next daily occurrence", () => {
    const result = calculateNextRunDate("2026-06-01", "daily", 1, new Date("2026-06-15"));
    expect(result).toEqual(new Date("2026-06-16"));
  });

  it("returns next occurrence for every 3 days", () => {
    const result = calculateNextRunDate("2026-06-01", "daily", 3, new Date("2026-06-15"));
    // June 1 + ceil((14 days diff)/3)*3 = June 1 + 5*3 = June 16
    expect(result).toEqual(new Date("2026-06-16"));
  });

  it("returns next weekly occurrence", () => {
    const result = calculateNextRunDate("2026-06-01", "weekly", 1, new Date("2026-06-15"));
    // June 1 (Mon) + 3 weeks = June 22
    expect(result).toEqual(new Date("2026-06-22"));
  });

  it("returns next monthly occurrence", () => {
    const result = calculateNextRunDate("2026-01-15", "monthly", 1, new Date("2026-06-15"));
    // Jan 15 + 5 months = June 15, next is July 15
    expect(result).toEqual(new Date("2026-07-15"));
  });

  it("handles interval > 1 for monthly", () => {
    const result = calculateNextRunDate("2026-01-15", "monthly", 3, new Date("2026-06-15"));
    // Jan 15 + 1 quarter = Apr 15, +1 quarter = Jul 15
    expect(result).toEqual(new Date("2026-07-15"));
  });

  it("returns next yearly occurrence", () => {
    const result = calculateNextRunDate("2020-06-15", "yearly", 1, new Date("2026-06-15"));
    expect(result).toEqual(new Date("2027-06-15"));
  });

  it("returns null for invalid frequency", () => {
    const result = calculateNextRunDate("2026-06-01", "invalid", 1, new Date("2026-06-15"));
    expect(result).toBe(null);
  });
});

describe("isTransactionDue", () => {
  it("returns true when next run date is before reference", () => {
    expect(isTransactionDue("2026-06-10", new Date("2026-06-15"))).toBe(true);
  });

  it("returns true when next run date is same as reference", () => {
    expect(isTransactionDue("2026-06-15", new Date("2026-06-15"))).toBe(true);
  });

  it("returns false when next run date is after reference", () => {
    expect(isTransactionDue("2026-06-20", new Date("2026-06-15"))).toBe(false);
  });
});

describe("generateTransaction", () => {
  it("generates expense transaction with negative amount", () => {
    const rt = {
      user_id: "u1",
      account_id: "a1",
      category_id: "c1",
      amount: "500",
      type: "expense",
      next_run_date: "2026-07-01",
      name: "Netflix",
      payment_method: "card",
    };
    const tx = generateTransaction(rt);
    expect(tx.amount).toBe(-500);
    expect(tx.description).toBe("Netflix");
    expect(tx.date).toBe("2026-07-01");
  });

  it("generates income transaction with positive amount", () => {
    const rt = {
      user_id: "u1",
      account_id: "a1",
      category_id: null,
      amount: "50000",
      type: "income",
      next_run_date: "2026-07-01",
      name: "Salary",
      payment_method: "bank_transfer",
    };
    const tx = generateTransaction(rt);
    expect(tx.amount).toBe(50000);
    expect(tx.description).toBe("Salary");
  });
});

describe("generateAllDueTransactions", () => {
  it("returns empty when no transactions are due", () => {
    const result = generateAllDueTransactions(
      [{ status: "active", next_run_date: "2026-12-31", start_date: "2026-01-01", frequency: "monthly", interval_value: 1, type: "expense", amount: "100", user_id: "u1", account_id: null, category_id: null, payment_method: null, name: "Test", end_date: null }],
      new Date("2026-06-15")
    );
    expect(result).toHaveLength(0);
  });

  it("returns due transactions and calculates next run date", () => {
    const rt = {
      id: "rt1",
      user_id: "u1",
      account_id: null,
      category_id: null,
      amount: "100",
      type: "expense",
      next_run_date: "2026-06-10",
      start_date: "2026-01-01",
      frequency: "monthly",
      interval_value: 1,
      name: "Test Bill",
      payment_method: null,
      status: "active",
      end_date: null,
    };
    const result = generateAllDueTransactions([rt], new Date("2026-06-15"));
    expect(result).toHaveLength(1);
    expect(result[0].transaction.description).toBe("Test Bill");
    expect(result[0].nextRunDate).toBeInstanceOf(Date);
  });

  it("skips paused transactions", () => {
    const rt = {
      id: "rt1",
      user_id: "u1",
      account_id: null,
      category_id: null,
      amount: "100",
      type: "expense",
      next_run_date: "2026-06-10",
      start_date: "2026-01-01",
      frequency: "monthly",
      interval_value: 1,
      name: "Test",
      payment_method: null,
      status: "paused",
      end_date: null,
    };
    const result = generateAllDueTransactions([rt], new Date("2026-06-15"));
    expect(result).toHaveLength(0);
  });

  it("returns null nextRunDate when schedule has ended", () => {
    const rt = {
      id: "rt1",
      user_id: "u1",
      account_id: null,
      category_id: null,
      amount: "100",
      type: "expense",
      next_run_date: "2026-06-10",
      start_date: "2025-01-01",
      frequency: "monthly",
      interval_value: 1,
      name: "Expired",
      payment_method: null,
      status: "active",
      end_date: "2026-06-11",
    };
    const result = generateAllDueTransactions([rt], new Date("2026-06-15"));
    expect(result).toHaveLength(1);
    expect(result[0].nextRunDate).toBe(null);
  });
});
