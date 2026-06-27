import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeGoalProgress,
  getLinkedBudgetsForGoal,
  contributeToGoal,
  enrichGoalWithProgress,
  getGoalsWithProgress,
  createGoalSchema,
  updateGoalSchema,
  contributeSchema,
  validateCurrentSavedAmount,
} from "../src/services/goalService.js";

describe("computeGoalProgress", () => {
  it("returns percentage saved", () => {
    expect(computeGoalProgress({ current_saved_amount: 5000, target_amount: 10000 })).toBe(50);
  });

  it("returns 100 when saved equals target", () => {
    expect(computeGoalProgress({ current_saved_amount: 10000, target_amount: 10000 })).toBe(100);
  });

  it("caps at 100 even if over-saved", () => {
    expect(computeGoalProgress({ current_saved_amount: 12000, target_amount: 10000 })).toBe(100);
  });

  it("returns 0 when target is 0", () => {
    expect(computeGoalProgress({ current_saved_amount: 100, target_amount: 0 })).toBe(0);
  });

  it("returns 0 when target is negative", () => {
    expect(computeGoalProgress({ current_saved_amount: 100, target_amount: -500 })).toBe(0);
  });
});

describe("enrichGoalWithProgress", () => {
  it("adds progress and remaining fields", () => {
    const goal = { id: "g1", name: "Test", current_saved_amount: "3000", target_amount: "10000" };
    const enriched = enrichGoalWithProgress(goal);
    expect(enriched.progress).toBe(30);
    expect(enriched.remaining).toBe(7000);
  });
});

describe("getLinkedBudgetsForGoal", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("returns linked budgets", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: "b1", name: "Test", amount: 5000, period: "monthly", spent: 2000 }] });
    const result = await getLinkedBudgetsForGoal("g1", mockPool);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b1");
  });

  it("returns empty array when no linked budgets", async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const result = await getLinkedBudgetsForGoal("g1", mockPool);
    expect(result).toEqual([]);
  });
});

describe("contributeToGoal", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("updates current_saved_amount and returns goal", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: "g1", current_saved_amount: "8000", target_amount: "10000" }] });
    const result = await contributeToGoal("g1", 5000, mockPool);
    expect(result.id).toBe("g1");
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE goals"),
      [5000, "g1"]
    );
  });

  it("returns null when goal not found", async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const result = await contributeToGoal("nonexistent", 500, mockPool);
    expect(result).toBe(null);
  });
});

describe("getGoalsWithProgress", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("returns goals enriched with progress", async () => {
    mockPool.query.mockResolvedValue({
      rows: [
        { id: "g1", name: "Goal 1", current_saved_amount: "3000", target_amount: "10000" },
        { id: "g2", name: "Goal 2", current_saved_amount: "5000", target_amount: "5000" },
      ],
    });

    const results = await getGoalsWithProgress("u1", mockPool);
    expect(results).toHaveLength(2);
    expect(results[0].progress).toBe(30);
    expect(results[1].progress).toBe(100);
    expect(results[1].remaining).toBe(0);
  });

  it("returns empty array for user with no goals", async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const results = await getGoalsWithProgress("u1", mockPool);
    expect(results).toEqual([]);
  });
});

describe("createGoalSchema", () => {
  it("accepts valid goal data", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "Emergency Fund",
      target_amount: 100000,
    };
    const result = createGoalSchema.parse(data);
    expect(result.name).toBe("Emergency Fund");
    expect(result.current_saved_amount).toBe(0);
    expect(result.priority).toBe("medium");
    expect(result.status).toBe("active");
  });

  it("rejects negative target amount", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "Bad Goal",
      target_amount: -100,
    };
    expect(() => createGoalSchema.parse(data)).toThrow();
  });

  it("rejects empty name", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "",
      target_amount: 5000,
    };
    expect(() => createGoalSchema.parse(data)).toThrow();
  });

  it("rejects invalid priority", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "Test",
      target_amount: 5000,
      priority: "urgent",
    };
    expect(() => createGoalSchema.parse(data)).toThrow();
  });
});

describe("updateGoalSchema", () => {
  it("accepts partial updates", () => {
    const result = updateGoalSchema.parse({ target_amount: 20000 });
    expect(result.target_amount).toBe(20000);
  });

  it("rejects invalid field types", () => {
    expect(() => updateGoalSchema.parse({ target_amount: "not-a-number" })).toThrow();
  });

  it("accepts empty object", () => {
    const result = updateGoalSchema.parse({});
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe("contributeSchema", () => {
  it("accepts valid contribution", () => {
    const result = contributeSchema.parse({ amount: 500 });
    expect(result.amount).toBe(500);
  });

  it("rejects zero amount", () => {
    expect(() => contributeSchema.parse({ amount: 0 })).toThrow();
  });

  it("rejects negative amount", () => {
    expect(() => contributeSchema.parse({ amount: -100 })).toThrow();
  });
});

describe("validateCurrentSavedAmount", () => {
  it("returns error when saved exceeds target", () => {
    const error = validateCurrentSavedAmount(10000, 5000);
    expect(error).toBe("current_saved_amount cannot exceed target_amount");
  });

  it("returns null when saved is within target", () => {
    expect(validateCurrentSavedAmount(3000, 5000)).toBe(null);
  });

  it("returns null when saved equals target", () => {
    expect(validateCurrentSavedAmount(5000, 5000)).toBe(null);
  });
});
