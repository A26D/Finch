import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

vi.mock("../src/services/chatTools.js", () => ({
  executeTool: vi.fn(),
  toolDefinitions: [],
}));

const { executeTool } = await import("../src/services/chatTools.js");
const { processMessage } = await import("../src/services/chatService.js");

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ANTHROPIC_API_KEY;
});

afterAll(() => {
  if (ORIGINAL_KEY) process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
});

describe("fallback intent routing", () => {
  it("OVERVIEW — 'How much did I spend this month?' calls getSpendingSummary", async () => {
    executeTool.mockResolvedValue({ result: { totalIncome: 5000, totalExpenses: 2000, currentBalance: 3000, savingsRate: 60 } });
    await processMessage("How much did I spend this month?", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getSpendingSummary", expect.any(Object), "user-1");
  });

  it("CATEGORY_SPENDING — 'What category did I spend the most on?' calls getCategorySpending", async () => {
    executeTool.mockResolvedValue({ result: { categories: [{ name: "Food", amount: 500 }], total: 500 } });
    await processMessage("What category did I spend the most on?", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getCategorySpending", expect.any(Object), "user-1");
  });

  it("TOP_MERCHANT — 'Which merchant got the most money?' calls getTopMerchants", async () => {
    executeTool.mockResolvedValue({ result: { merchants: [{ merchant: "Amazon", totalSpend: 500, transactionCount: 2 }] } });
    await processMessage("Which merchant got the most money?", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getTopMerchants", expect.any(Object), "user-1");
  });

  it("LARGEST_EXPENSE — 'What was my biggest expense?' calls getLargestExpense", async () => {
    executeTool.mockResolvedValue({ result: { expense: { amount: 500, description: "Test", date: "2026-06-01" } } });
    await processMessage("What was my biggest expense?", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getLargestExpense", expect.any(Object), "user-1");
  });

  it("BUDGETS — 'Which budgets are close to exceeding?' calls getBudgetStatus", async () => {
    executeTool.mockResolvedValue({ result: { budgets: [] } });
    await processMessage("Which budgets are close to exceeding?", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getBudgetStatus", expect.any(Object), "user-1");
  });

  it("GOALS — 'How are my goals doing?' calls getGoalProgress", async () => {
    executeTool.mockResolvedValue({ result: { goals: [] } });
    await processMessage("How are my goals doing?", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getGoalProgress", expect.any(Object), "user-1");
  });

  it("COMPARE — 'Compare this month with last month.' calls comparePeriods", async () => {
    executeTool.mockResolvedValue({ result: { period1: {}, period2: {}, difference: { incomeChange: 0, expenseChange: 0, balanceChange: 0, incomePercent: null, expensePercent: null } } });
    await processMessage("Compare this month with last month.", "user-1");
    expect(executeTool).toHaveBeenCalledWith("comparePeriods", expect.any(Object), "user-1");
  });

  it("RECURRING — 'What recurring payments are coming up?' calls getRecurringExpenses", async () => {
    executeTool.mockResolvedValue({ result: { recurringItems: [] } });
    await processMessage("What recurring payments are coming up?", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getRecurringExpenses", expect.any(Object), "user-1");
  });

  it("LARGEST_EXPENSE — 'largest expense' keyword routes correctly", async () => {
    executeTool.mockResolvedValue({ result: { expense: { amount: 100, date: "2026-06-01" } } });
    await processMessage("largest expense", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getLargestExpense", expect.any(Object), "user-1");
  });

  it("LARGEST_EXPENSE — 'costliest transaction' keyword routes correctly", async () => {
    executeTool.mockResolvedValue({ result: { expense: { amount: 100, date: "2026-06-01" } } });
    await processMessage("costliest transaction", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getLargestExpense", expect.any(Object), "user-1");
  });

  it("CATEGORY_SPENDING — 'breakdown by category' keyword routes correctly", async () => {
    executeTool.mockResolvedValue({ result: { categories: [], total: 0 } });
    await processMessage("breakdown by category", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getCategorySpending", expect.any(Object), "user-1");
  });

  it("TOP_MERCHANT — 'top store' keyword routes correctly", async () => {
    executeTool.mockResolvedValue({ result: { merchants: [] } });
    await processMessage("top store", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getTopMerchants", expect.any(Object), "user-1");
  });

  it("OVERVIEW — fallback for unrecognized message calls getSpendingSummary", async () => {
    executeTool.mockResolvedValue({ result: { totalIncome: 0, totalExpenses: 0, currentBalance: 0, savingsRate: 0 } });
    await processMessage("hello", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getSpendingSummary", expect.any(Object), "user-1");
  });

  it("LARGEST_EXPENSE routes before OVERVIEW when both match", async () => {
    executeTool.mockResolvedValue({ result: { expense: { amount: 100, date: "2026-06-01" } } });
    await processMessage("biggest expense this month", "user-1");
    expect(executeTool).toHaveBeenCalledWith("getLargestExpense", expect.any(Object), "user-1");
  });
});
