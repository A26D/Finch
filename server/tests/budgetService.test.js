import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCurrentPeriodWindow,
  computeCurrentPeriodAmount,
  getSpentAmountForPeriod,
  enrichBudgetWithProgress,
  validateBudgetCategories,
  createBudgetSchema,
  updateBudgetSchema,
} from "../src/services/budgetService.js";

describe("getCurrentPeriodWindow", () => {
  it("returns monthly window", () => {
    const budget = { period: "monthly" };
    const today = new Date("2026-06-15");
    const w = getCurrentPeriodWindow(budget, today);
    expect(w.periodStart).toBe("2026-06-01");
    expect(w.periodEnd).toBe("2026-06-30");
  });

  it("returns weekly window (Monday start)", () => {
    const budget = { period: "weekly" };
    const today = new Date("2026-06-25"); // Thursday
    const w = getCurrentPeriodWindow(budget, today);
    expect(w.periodStart).toBe("2026-06-22");
    expect(w.periodEnd).toBe("2026-06-28");
  });

  it("returns yearly window", () => {
    const budget = { period: "yearly" };
    const today = new Date("2026-06-15");
    const w = getCurrentPeriodWindow(budget, today);
    expect(w.periodStart).toBe("2026-01-01");
    expect(w.periodEnd).toBe("2026-12-31");
  });

  it("handles month boundaries", () => {
    const budget = { period: "monthly" };
    const today = new Date("2026-01-31");
    const w = getCurrentPeriodWindow(budget, today);
    expect(w.periodStart).toBe("2026-01-01");
    expect(w.periodEnd).toBe("2026-01-31");
  });

  it("handles December for yearly", () => {
    const budget = { period: "yearly" };
    const today = new Date("2026-12-25");
    const w = getCurrentPeriodWindow(budget, today);
    expect(w.periodStart).toBe("2026-01-01");
    expect(w.periodEnd).toBe("2026-12-31");
  });
});

describe("computeCurrentPeriodAmount", () => {
  it("returns budget amount as number", () => {
    expect(computeCurrentPeriodAmount({ amount: "5000" })).toBe(5000);
  });

  it("handles decimal amounts", () => {
    expect(computeCurrentPeriodAmount({ amount: "1234.56" })).toBe(1234.56);
  });
});

describe("getSpentAmountForPeriod", () => {
  const mockBudget = {
    id: "b1",
    user_id: "u1",
    start_date: new Date("2026-06-01"),
    end_date: null,
    categoryIds: ["cat1"],
  };

  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("returns 0 when no transactions match", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ spent: "0" }] });
    const result = await getSpentAmountForPeriod(mockBudget, "2026-06-01", "2026-06-30", mockPool);
    expect(result).toBe(0);
  });

  it("returns sum of expense amounts", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ spent: "2500" }] });
    const result = await getSpentAmountForPeriod(mockBudget, "2026-06-01", "2026-06-30", mockPool);
    expect(result).toBe(2500);
  });

  it("clamps periodStart to budget start_date when it starts later", async () => {
    mockPool.query.mockImplementation((sql, params) => {
      expect(params[1]).toBe("2026-06-10");
      expect(params[2]).toBe("2026-06-30");
      return { rows: [{ spent: "100" }] };
    });
    const budgetWithLateStart = { ...mockBudget, start_date: new Date("2026-06-10") };
    const result = await getSpentAmountForPeriod(budgetWithLateStart, "2026-06-01", "2026-06-30", mockPool);
    expect(result).toBe(100);
  });

  it("clamps to budget end_date when periodEnd goes beyond", async () => {
    mockPool.query.mockImplementation((sql, params) => {
      expect(params[2]).toBe("2026-06-15");
      return { rows: [{ spent: "100" }] };
    });
    const budgetWithEarlyEnd = { ...mockBudget, end_date: new Date("2026-06-15") };
    const result = await getSpentAmountForPeriod(budgetWithEarlyEnd, "2026-06-01", "2026-06-30", mockPool);
    expect(result).toBe(100);
  });

  it("builds category join when budget has categoryIds", async () => {
    mockPool.query.mockImplementation((sql, params) => {
      expect(sql).toContain("JOIN budget_categories");
      expect(params[3]).toBe("b1");
      return { rows: [{ spent: "500" }] };
    });
    const result = await getSpentAmountForPeriod(mockBudget, "2026-06-01", "2026-06-30", mockPool);
    expect(result).toBe(500);
  });

  it("skips category join when no categoryIds", async () => {
    mockPool.query.mockImplementation((sql, params) => {
      expect(sql).not.toContain("JOIN budget_categories");
      return { rows: [{ spent: "0" }] };
    });
    const budgetNoCats = { ...mockBudget, categoryIds: [] };
    const result = await getSpentAmountForPeriod(budgetNoCats, "2026-06-01", "2026-06-30", mockPool);
    expect(result).toBe(0);
  });
});

describe("enrichBudgetWithProgress", () => {
  it("adds spent, remaining, percentUsed, periodStart, periodEnd", async () => {
    const mockPool = {
      query: vi.fn().mockResolvedValue({ rows: [{ spent: "2000" }] }),
    };
    const budget = {
      id: "b1",
      user_id: "u1",
      amount: "5000",
      start_date: new Date("2026-06-01"),
      end_date: null,
      period: "monthly",
      categoryIds: [],
    };
    const enriched = await enrichBudgetWithProgress(budget, mockPool);
    expect(enriched.spent).toBe(2000);
    expect(enriched.remaining).toBe(3000);
    expect(enriched.percentUsed).toBeCloseTo(0.4, 2);
    expect(enriched.periodStart).toBeDefined();
    expect(enriched.periodEnd).toBeDefined();
  });
});

describe("validateBudgetCategories", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("returns true when all categories belong to user", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ cnt: "2" }] });
    const result = await validateBudgetCategories(["cat1", "cat2"], "u1", mockPool);
    expect(result).toBe(true);
  });

  it("returns false when some categories don't match", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ cnt: "1" }] });
    const result = await validateBudgetCategories(["cat1", "cat3"], "u1", mockPool);
    expect(result).toBe(false);
  });

  it("returns true when categoryIds is empty", async () => {
    const result = await validateBudgetCategories([], "u1", mockPool);
    expect(result).toBe(true);
    expect(mockPool.query).not.toHaveBeenCalled();
  });
});

describe("createBudgetSchema", () => {
  it("accepts valid budget data", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "Test Budget",
      amount: 5000,
      period: "monthly",
      start_date: "2026-06-01",
    };
    const result = createBudgetSchema.parse(data);
    expect(result.name).toBe("Test Budget");
    expect(result.type).toBe("fixed");
    expect(result.strictness).toBe("hard");
  });

  it("rejects negative amount", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "Bad Budget",
      amount: -100,
      period: "monthly",
      start_date: "2026-06-01",
    };
    expect(() => createBudgetSchema.parse(data)).toThrow();
  });

  it("rejects empty name", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "",
      amount: 5000,
      period: "monthly",
      start_date: "2026-06-01",
    };
    expect(() => createBudgetSchema.parse(data)).toThrow();
  });

  it("rejects invalid period", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "Test",
      amount: 5000,
      period: "daily",
      start_date: "2026-06-01",
    };
    expect(() => createBudgetSchema.parse(data)).toThrow();
  });

  it("applies default values", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "Test",
      amount: 5000,
      period: "monthly",
      start_date: "2026-06-01",
    };
    const result = createBudgetSchema.parse(data);
    expect(result.type).toBe("fixed");
    expect(result.strictness).toBe("hard");
    expect(result.rollover_enabled).toBe(false);
    expect(result.alert_threshold).toBe(0.8);
  });
});

describe("updateBudgetSchema", () => {
  it("accepts partial updates", () => {
    const result = updateBudgetSchema.parse({ amount: 6000 });
    expect(result.amount).toBe(6000);
  });

  it("rejects invalid field types", () => {
    expect(() => updateBudgetSchema.parse({ amount: "not-a-number" })).toThrow();
  });

  it("accepts empty object (no updates)", () => {
    const result = updateBudgetSchema.parse({});
    expect(Object.keys(result)).toHaveLength(0);
  });
});
