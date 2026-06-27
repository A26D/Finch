import { describe, it, expect } from "vitest";
import filterTransactions from "../filterTransactions";

const today = new Date().toISOString().slice(0, 10);

const txns = [
  { id: "1", description: "Groceries", amount: -2500, category_id: "cat1", category_name: "Food", account_id: "acct1", account_name: "Checking", payment_method: "upi", date: "2026-06-15" },
  { id: "2", description: "Salary", amount: 50000, category_id: "cat2", category_name: "Income", account_id: "acct1", account_name: "Checking", payment_method: "bank_transfer", date: "2026-06-01" },
  { id: "3", description: "Uber ride", amount: -450, category_id: "cat3", category_name: "Transport", account_id: "acct2", account_name: "Savings", payment_method: "card", date: "2026-06-10" },
  { id: "4", description: "Restaurant", amount: -1200, category_id: "cat1", category_name: "Food", account_id: "acct1", account_name: "Checking", payment_method: "upi", date: "2026-06-20" },
  { id: "5", description: "Freelance", amount: 15000, category_id: "cat2", category_name: "Income", account_id: "acct2", account_name: "Savings", payment_method: "bank_transfer", date: "2026-05-15" },
];

describe("filterTransactions", () => {
  const defaults = { search: "", filters: {}, sort: {} };

  it("returns all transactions with no filters", () => {
    const result = filterTransactions(txns, defaults);
    expect(result).toHaveLength(5);
  });

  describe("search", () => {
    it("filters by description (case-insensitive)", () => {
      const result = filterTransactions(txns, { ...defaults, search: "uber" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });

    it("filters by category name", () => {
      const result = filterTransactions(txns, { ...defaults, search: "transport" });
      expect(result).toHaveLength(1);
    });

    it("filters by account name", () => {
      const result = filterTransactions(txns, { ...defaults, search: "savings" });
      expect(result).toHaveLength(2);
    });

    it("filters by payment method", () => {
      const result = filterTransactions(txns, { ...defaults, search: "card" });
      expect(result).toHaveLength(1);
    });

    it("returns empty array for no match", () => {
      const result = filterTransactions(txns, { ...defaults, search: "xyznonexistent" });
      expect(result).toHaveLength(0);
    });

    it("does not trim whitespace from search query", () => {
      const result = filterTransactions(txns, { ...defaults, search: "  groceries  " });
      expect(result).toHaveLength(0);
    });
  });

  describe("category filter", () => {
    it("filters by single category", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { categories: ["cat1"] } });
      expect(result).toHaveLength(2);
    });

    it("filters by multiple categories", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { categories: ["cat1", "cat3"] } });
      expect(result).toHaveLength(3);
    });
  });

  describe("account filter", () => {
    it("filters by account", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { accounts: ["acct2"] } });
      expect(result).toHaveLength(2);
    });
  });

  describe("type filter", () => {
    it("returns only expenses", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { type: "expense" } });
      expect(result.every((t) => Number(t.amount) < 0)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it("returns only income", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { type: "income" } });
      expect(result.every((t) => Number(t.amount) > 0)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });

  describe("payment method filter", () => {
    it("filters by payment method", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { paymentMethods: ["upi"] } });
      expect(result).toHaveLength(2);
    });
  });

  describe("date range filter", () => {
    it("filters by start date", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { dateRange: { start: "2026-06-10" } } });
      expect(result.every((t) => t.date >= "2026-06-10")).toBe(true);
      expect(result).toHaveLength(3);
    });

    it("filters by end date", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { dateRange: { end: "2026-06-10" } } });
      expect(result.every((t) => t.date <= "2026-06-10")).toBe(true);
      expect(result).toHaveLength(3);
    });

    it("filters by both start and end date", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { dateRange: { start: "2026-06-05", end: "2026-06-18" } } });
      expect(result).toHaveLength(2);
    });
  });

  describe("amount range filter", () => {
    it("filters by min amount", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { minAmount: 2000 } });
      expect(result.every((t) => Math.abs(Number(t.amount)) >= 2000)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it("filters by max amount", () => {
      const result = filterTransactions(txns, { ...defaults, filters: { maxAmount: 1000 } });
      expect(result.every((t) => Math.abs(Number(t.amount)) <= 1000)).toBe(true);
      expect(result).toHaveLength(1);
    });
  });

  describe("sort", () => {
    it("sorts by date descending by default", () => {
      const result = filterTransactions(txns, defaults);
      expect(result[0].date >= result[1].date).toBe(true);
    });

    it("sorts by date ascending", () => {
      const result = filterTransactions(txns, { ...defaults, sort: { field: "date", direction: "asc" } });
      expect(result[0].date <= result[result.length - 1].date).toBe(true);
    });

    it("sorts by amount descending", () => {
      const result = filterTransactions(txns, { ...defaults, sort: { field: "amount", direction: "desc" } });
      const amounts = result.map((t) => Number(t.amount));
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i] <= amounts[i - 1]).toBe(true);
      }
    });

    it("sorts by description ascending", () => {
      const result = filterTransactions(txns, { ...defaults, sort: { field: "description", direction: "asc" } });
      expect(result[0].description.localeCompare(result[result.length - 1].description)).toBeLessThanOrEqual(0);
    });
  });

  it("applies search and filters together", () => {
    const result = filterTransactions(txns, {
      search: "groceries",
      filters: { categories: ["cat1"] },
      sort: { field: "date", direction: "asc" },
    });
    expect(result).toHaveLength(1);
  });
});
