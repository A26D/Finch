import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPool = { query: vi.fn() };

vi.mock("../src/db.js", () => ({ default: mockPool }));

vi.mock("../src/services/budgetService.js", () => ({
  getBudgetsWithProgress: vi.fn(),
}));

vi.mock("../src/services/goalService.js", () => ({
  getGoalsWithProgress: vi.fn(),
}));

vi.mock("../src/services/recurringTransactionService.js", () => ({
  getAllActive: vi.fn(),
}));

let dashboardService;
let budgetService;
let goalService;
let recurringService;

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

async function loadModules() {
  dashboardService = await import("../src/services/dashboardService.js");
  budgetService = await import("../src/services/budgetService.js");
  goalService = await import("../src/services/goalService.js");
  recurringService = await import("../src/services/recurringTransactionService.js");
}

describe("getDashboardData", () => {
  beforeEach(async () => {
    await loadModules();
  });

  it("returns complete dashboard shape with all required fields", async () => {
    mockPool.query.mockResolvedValue({
      rows: [
        { id: "1", amount: 50000, date: "2026-06-01", category_name: "Salary" },
        { id: "2", amount: -2000, date: "2026-06-05", category_name: "Food" },
      ],
    });
    budgetService.getBudgetsWithProgress.mockResolvedValue([
      { id: "b1", amount: 5000, spent: 2000, percentUsed: 0.4, alert_threshold: 0.8, name: "Food Budget" },
    ]);
    goalService.getGoalsWithProgress.mockResolvedValue([
      { id: "g1", target_amount: 10000, current_saved_amount: 5000, name: "Vacation" },
    ]);
    recurringService.getAllActive.mockResolvedValue([
      { id: "rt1", type: "expense", amount: 500, frequency: "monthly", interval_value: 1, name: "Netflix", status: "active" },
    ]);

    const result = await dashboardService.getDashboardData("860e5c75-ad13-454d-899d-f140a3767fb6");

    expect(result).toHaveProperty("totalIncome");
    expect(result).toHaveProperty("totalExpenses");
    expect(result).toHaveProperty("currentBalance");
    expect(result).toHaveProperty("savingsRate");
    expect(result).toHaveProperty("averageDailySpend");
    expect(result).toHaveProperty("averageMonthlySpend");
    expect(result).toHaveProperty("largestExpense");
    expect(result).toHaveProperty("largestIncome");
    expect(result).toHaveProperty("recurringMonthlyExpenses");
    expect(result).toHaveProperty("recurringMonthlyIncome");
    expect(result).toHaveProperty("activeBudgets");
    expect(result).toHaveProperty("activeGoals");

    expect(typeof result.totalIncome).toBe("number");
    expect(typeof result.totalExpenses).toBe("number");
    expect(typeof result.currentBalance).toBe("number");
    expect(typeof result.savingsRate).toBe("number");
    expect(typeof result.activeBudgets).toBe("number");
    expect(typeof result.activeGoals).toBe("number");

    expect(result.totalIncome).toBe(50000);
    expect(result.totalExpenses).toBe(2000);
    expect(result.currentBalance).toBe(48000);
    expect(result.activeBudgets).toBe(1);
    expect(result.activeGoals).toBe(1);
  });

  it("handles empty data gracefully", async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    budgetService.getBudgetsWithProgress.mockResolvedValue([]);
    goalService.getGoalsWithProgress.mockResolvedValue([]);
    recurringService.getAllActive.mockResolvedValue([]);

    const result = await dashboardService.getDashboardData("860e5c75-ad13-454d-899d-f140a3767fb6");

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.currentBalance).toBe(0);
    expect(result.savingsRate).toBe(0);
    expect(result.activeBudgets).toBe(0);
    expect(result.activeGoals).toBe(0);
    expect(result.largestExpense).toBeNull();
    expect(result.largestIncome).toBeNull();
  });

  it("calls all four data sources in parallel via Promise.all", async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    budgetService.getBudgetsWithProgress.mockResolvedValue([]);
    goalService.getGoalsWithProgress.mockResolvedValue([]);
    recurringService.getAllActive.mockResolvedValue([]);

    await dashboardService.getDashboardData("test-user");

    expect(mockPool.query).toHaveBeenCalled();
    expect(budgetService.getBudgetsWithProgress).toHaveBeenCalledWith("test-user", mockPool);
    expect(goalService.getGoalsWithProgress).toHaveBeenCalledWith("test-user", mockPool);
    expect(recurringService.getAllActive).toHaveBeenCalledWith("test-user", mockPool);
  });
});
