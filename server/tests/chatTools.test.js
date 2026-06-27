import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeTool, toolDefinitions } from "../src/services/chatTools.js";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

vi.mock("../src/db.js", () => ({
  default: { query: vi.fn() },
}));

vi.mock("../src/services/reportService.js", () => ({
  getSummary: vi.fn(),
  getMonthlyReport: vi.fn(),
  getCategoryReport: vi.fn(),
}));

vi.mock("../src/services/budgetService.js", () => ({
  getBudgetsWithProgress: vi.fn(),
}));

vi.mock("../src/services/goalService.js", () => ({
  getGoalsWithProgress: vi.fn(),
}));

vi.mock("../src/services/recurringTransactionService.js", () => ({
  getAllActive: vi.fn(),
}));

const reportService = await import("../src/services/reportService.js");
const budgetService = await import("../src/services/budgetService.js");
const goalService = await import("../src/services/goalService.js");
const recurringService = await import("../src/services/recurringTransactionService.js");
const db = await import("../src/db.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toolDefinitions", () => {
  it("exports an array of 10 tools", () => {
    expect(Array.isArray(toolDefinitions)).toBe(true);
    expect(toolDefinitions).toHaveLength(10);
  });

  it("each tool has name, description, input_schema", () => {
    for (const tool of toolDefinitions) {
      expect(tool).toHaveProperty("name");
      expect(tool).toHaveProperty("description");
      expect(tool).toHaveProperty("input_schema");
    }
  });

  it("getCurrentDate has no required params", () => {
    const tool = toolDefinitions.find((t) => t.name === "getCurrentDate");
    expect(tool.input_schema.required).toEqual([]);
  });
});

describe("executeTool — validation", () => {
  it("returns error for unknown tool name", async () => {
    const result = await executeTool("unknownTool", {}, USER_ID);
    expect(result.error).toContain("Unknown tool");
  });

  it("returns error for missing required params", async () => {
    const result = await executeTool("getSpendingSummary", {}, USER_ID);
    expect(result.error).toContain("Invalid parameters");
  });

  it("returns error for invalid param types", async () => {
    const result = await executeTool("getSpendingSummary", { startDate: 123, endDate: "bad" }, USER_ID);
    expect(result.error).toContain("Invalid parameters");
  });
});

describe("executeTool — getCurrentDate", () => {
  it("returns today's date in YYYY-MM-DD format", async () => {
    const result = await executeTool("getCurrentDate", {}, USER_ID);
    expect(result.result.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("executeTool — getSpendingSummary", () => {
  it("calls reportService.getSummary with userId and filters", async () => {
    reportService.getSummary.mockResolvedValue({ totalIncome: 50000, totalExpenses: 20000, currentBalance: 30000 });

    const result = await executeTool("getSpendingSummary", { startDate: "2026-01-01", endDate: "2026-06-30" }, USER_ID);

    expect(reportService.getSummary).toHaveBeenCalledWith(USER_ID, { start_date: "2026-01-01", end_date: "2026-06-30" });
    expect(result.result.totalIncome).toBe(50000);
  });

  it("passes type filter when provided", async () => {
    reportService.getSummary.mockResolvedValue({ totalIncome: 0, totalExpenses: 0, currentBalance: 0 });

    await executeTool("getSpendingSummary", { startDate: "2026-01-01", endDate: "2026-06-30", type: "expense" }, USER_ID);

    expect(reportService.getSummary).toHaveBeenCalledWith(USER_ID, {
      start_date: "2026-01-01",
      end_date: "2026-06-30",
      type: "expense",
    });
  });
});

describe("executeTool — getCategorySpending", () => {
  it("calls reportService.getCategoryReport with userId and filters", async () => {
    reportService.getCategoryReport.mockResolvedValue({ categories: [], total: 0, highest: null, lowest: null });

    await executeTool("getCategorySpending", { startDate: "2026-01-01", endDate: "2026-06-30" }, USER_ID);

    expect(reportService.getCategoryReport).toHaveBeenCalledWith(USER_ID, {
      start_date: "2026-01-01",
      end_date: "2026-06-30",
    });
  });

  it("filters by category name when provided", async () => {
    reportService.getCategoryReport.mockResolvedValue({
      categories: [
        { name: "Food", amount: 500 },
        { name: "Transport", amount: 200 },
      ],
      total: 700,
      highest: { name: "Food", amount: 500 },
      lowest: { name: "Transport", amount: 200 },
    });

    const result = await executeTool("getCategorySpending", {
      startDate: "2026-01-01",
      endDate: "2026-06-30",
      category: "Food",
    }, USER_ID);

    expect(result.result.categories).toHaveLength(1);
    expect(result.result.categories[0].name).toBe("Food");
  });
});

describe("executeTool — comparePeriods", () => {
  it("calls reportService.getSummary twice and computes diff", async () => {
    reportService.getSummary
      .mockResolvedValueOnce({ totalIncome: 50000, totalExpenses: 20000, currentBalance: 30000 })
      .mockResolvedValueOnce({ totalIncome: 60000, totalExpenses: 25000, currentBalance: 35000 });

    const result = await executeTool("comparePeriods", {
      period1Start: "2026-01-01",
      period1End: "2026-03-31",
      period2Start: "2026-04-01",
      period2End: "2026-06-30",
    }, USER_ID);

    expect(reportService.getSummary).toHaveBeenCalledTimes(2);
    expect(result.result.period1.totalIncome).toBe(50000);
    expect(result.result.period2.totalIncome).toBe(60000);
    expect(result.result.difference.incomeChange).toBe(10000);
    expect(result.result.difference.incomePercent).toBe(20);
  });

  it("returns null percent when period1 has zero values", async () => {
    reportService.getSummary
      .mockResolvedValueOnce({ totalIncome: 0, totalExpenses: 0, currentBalance: 0 })
      .mockResolvedValueOnce({ totalIncome: 5000, totalExpenses: 3000, currentBalance: 2000 });

    const result = await executeTool("comparePeriods", {
      period1Start: "2026-01-01",
      period1End: "2026-03-31",
      period2Start: "2026-04-01",
      period2End: "2026-06-30",
    }, USER_ID);

    expect(result.result.difference.incomePercent).toBeNull();
    expect(result.result.difference.expensePercent).toBeNull();
  });
});

describe("executeTool — getBudgetStatus", () => {
  it("calls budgetService.getBudgetsWithProgress", async () => {
    budgetService.getBudgetsWithProgress.mockResolvedValue([
      { id: "b1", name: "Monthly Budget", amount: 5000, spent: 2000 },
    ]);

    const result = await executeTool("getBudgetStatus", {}, USER_ID);

    expect(budgetService.getBudgetsWithProgress).toHaveBeenCalledWith(USER_ID, db.default);
    expect(result.result.budgets).toHaveLength(1);
  });

  it("filters by budgetName when provided", async () => {
    budgetService.getBudgetsWithProgress.mockResolvedValue([
      { id: "b1", name: "Groceries", amount: 5000, spent: 2000 },
      { id: "b2", name: "Eating Out", amount: 3000, spent: 1500 },
    ]);

    const result = await executeTool("getBudgetStatus", { budgetName: "Eating Out" }, USER_ID);

    expect(result.result.budgets).toHaveLength(1);
    expect(result.result.budgets[0].name).toBe("Eating Out");
  });
});

describe("executeTool — getGoalProgress", () => {
  it("calls goalService.getGoalsWithProgress", async () => {
    goalService.getGoalsWithProgress.mockResolvedValue([
      { id: "g1", name: "Emergency Fund", target_amount: 10000, current_saved_amount: 5000 },
    ]);

    const result = await executeTool("getGoalProgress", {}, USER_ID);

    expect(goalService.getGoalsWithProgress).toHaveBeenCalledWith(USER_ID, db.default);
    expect(result.result.goals).toHaveLength(1);
  });

  it("filters by goalName when provided", async () => {
    goalService.getGoalsWithProgress.mockResolvedValue([
      { id: "g1", name: "Vacation", target_amount: 5000, current_saved_amount: 2500 },
      { id: "g2", name: "New Car", target_amount: 30000, current_saved_amount: 10000 },
    ]);

    const result = await executeTool("getGoalProgress", { goalName: "Vacation" }, USER_ID);

    expect(result.result.goals).toHaveLength(1);
    expect(result.result.goals[0].name).toBe("Vacation");
  });
});

describe("executeTool — getRecurringExpenses", () => {
  it("calls recurringService.getAllActive", async () => {
    recurringService.getAllActive.mockResolvedValue([
      { id: "rt1", name: "Netflix", amount: 500, status: "active", next_run_date: "2026-07-01" },
    ]);

    const result = await executeTool("getRecurringExpenses", { upcoming: false }, USER_ID);

    expect(recurringService.getAllActive).toHaveBeenCalledWith(USER_ID, db.default);
    expect(result.result.recurringItems).toHaveLength(1);
  });

  it("filters to upcoming items when requested", async () => {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    recurringService.getAllActive.mockResolvedValue([
      { id: "rt1", name: "Due Soon", amount: 500, status: "active", next_run_date: fmt(today) },
      { id: "rt2", name: "Far Away", amount: 200, status: "active", next_run_date: fmt(new Date(sevenDaysLater.getTime() + 86400000 * 10)) },
      { id: "rt3", name: "Paused", amount: 300, status: "paused", next_run_date: fmt(today) },
    ]);

    const result = await executeTool("getRecurringExpenses", { upcoming: true }, USER_ID);

    expect(result.result.recurringItems).toHaveLength(1);
    expect(result.result.recurringItems[0].name).toBe("Due Soon");
  });
});

describe("executeTool — getMonthlyTrend", () => {
  it("calls reportService.getMonthlyReport with provided dates", async () => {
    reportService.getMonthlyReport.mockResolvedValue([
      { month: "2026-01", income: 50000, expenses: 20000 },
    ]);

    await executeTool("getMonthlyTrend", { startDate: "2026-01-01", endDate: "2026-06-30" }, USER_ID);

    expect(reportService.getMonthlyReport).toHaveBeenCalledWith(USER_ID, {
      start_date: "2026-01-01",
      end_date: "2026-06-30",
    });
  });
});

describe("executeTool — getTopMerchants", () => {
  it("queries pool and returns aggregated merchant data", async () => {
    db.default.query.mockResolvedValue({
      rows: [
        { merchant: "Amazon", transaction_count: "5", total_spend: "25000" },
        { merchant: "Walmart", transaction_count: "3", total_spend: "15000" },
      ],
    });

    const result = await executeTool("getTopMerchants", { startDate: "2026-01-01", endDate: "2026-06-30", limit: 10 }, USER_ID);

    expect(db.default.query).toHaveBeenCalled();
    expect(result.result.merchants).toHaveLength(2);
    expect(result.result.merchants[0].merchant).toBe("Amazon");
    expect(result.result.merchants[0].totalSpend).toBe(25000);
    expect(result.result.merchants[0].percentageOfTotal).toBeGreaterThan(0);
  });
});

describe("executeTool — getLargestExpense", () => {
  it("queries pool and returns the largest expense", async () => {
    db.default.query.mockResolvedValue({
      rows: [
        { id: "t1", amount: -50000, date: "2026-06-15", description: "MacBook Pro", category_name: "Electronics" },
      ],
    });

    const result = await executeTool("getLargestExpense", { startDate: "2026-01-01", endDate: "2026-06-30" }, USER_ID);

    expect(db.default.query).toHaveBeenCalled();
    expect(result.result.expense).toBeDefined();
    expect(result.result.expense.amount).toBe(50000);
    expect(result.result.expense.description).toBe("MacBook Pro");
    expect(result.result.expense.category).toBe("Electronics");
  });

  it("returns null expense when no transactions found", async () => {
    db.default.query.mockResolvedValue({ rows: [] });

    const result = await executeTool("getLargestExpense", { startDate: "2026-01-01", endDate: "2026-06-30" }, USER_ID);

    expect(result.result.expense).toBeNull();
  });
});

describe("executeTool — error handling", () => {
  it("returns error when service throws", async () => {
    reportService.getSummary.mockRejectedValue(new Error("DB connection failed"));

    const result = await executeTool("getSpendingSummary", { startDate: "2026-01-01", endDate: "2026-06-30" }, USER_ID);

    expect(result.error).toContain("Error executing");
    expect(result.error).toContain("DB connection failed");
  });
});
