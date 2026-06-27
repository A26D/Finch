import { describe, it, expect } from "vitest";
import {
  detectOverspending,
  detectBudgetRisk,
  detectGoalDelay,
  detectRecurringGrowth,
  detectSavingsOpportunity,
  detectUnusedBudget,
  detectSubscriptionWaste,
  detectLargeExpenseTrend,
  detectIncomeDrop,
  detectPositiveAchievements,
  runAllRules,
} from "../src/utils/aiRules.js";

const now = new Date();
const threeMonthsAgo = new Date(now);
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
const sixMonthsAgo = new Date(now);
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

function makeTx(id, amount, date, category) {
  return { id, amount, date: date.toISOString().slice(0, 10), category_name: category };
}

describe("detectOverspending", () => {
  it("returns insight when category spending is >20% above 3-month average", () => {
    const farPast = new Date(now);
    farPast.setMonth(farPast.getMonth() - 6);
    const context = {
      transactions: [
        ...Array(3).fill(null).map((_, i) => makeTx(`old${i}`, -5000, farPast, "Dining")),
        ...Array(3).fill(null).map((_, i) => makeTx(`new${i}`, -10000, now, "Dining")),
      ],
    };
    const result = detectOverspending(context);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].category).toBe("overspending");
    expect(result[0].metric.category).toBe("Dining");
  });

  it("returns empty when no overspending", () => {
    const context = {
      transactions: [
        makeTx("t1", -5000, threeMonthsAgo, "Dining"),
        makeTx("t2", -5000, now, "Dining"),
      ],
    };
    const result = detectOverspending(context);
    expect(result).toEqual([]);
  });

  it("handles empty transactions", () => {
    expect(detectOverspending({ transactions: [] })).toEqual([]);
  });
});

describe("detectBudgetRisk", () => {
  it("returns insight when budget is near limit", () => {
    const context = {
      budgets: [{
        id: "b1", name: "Food", amount: 10000, spent: 8500, percentUsed: 0.85,
        alert_threshold: 0.8, periodEnd: now.toISOString(),
      }],
    };
    const result = detectBudgetRisk(context);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("budget_risk");
  });

  it("returns empty when budget is under threshold", () => {
    const context = {
      budgets: [{
        id: "b1", name: "Food", amount: 10000, spent: 5000, percentUsed: 0.5,
        alert_threshold: 0.8, periodEnd: now.toISOString(),
      }],
    };
    expect(detectBudgetRisk(context)).toEqual([]);
  });

  it("handles empty budgets", () => {
    expect(detectBudgetRisk({ budgets: [] })).toEqual([]);
  });
});

describe("detectGoalDelay", () => {
  it("returns insight when goal progress is behind schedule", () => {
    const targetDate = new Date(now);
    targetDate.setMonth(targetDate.getMonth() + 1);
    const createdDate = new Date(now);
    createdDate.setMonth(createdDate.getMonth() - 3);

    const context = {
      goals: [{
        id: "g1", name: "Vacation", target_amount: 100000, current_saved_amount: 5000,
        progress: 5, status: "active", target_date: targetDate.toISOString().slice(0, 10),
        created_at: createdDate.toISOString(),
      }],
    };
    const result = detectGoalDelay(context);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].category).toBe("goal_delay");
  });

  it("returns empty for completed goals", () => {
    const context = {
      goals: [{ id: "g1", name: "Vacation", progress: 100, status: "completed" }],
    };
    expect(detectGoalDelay(context)).toEqual([]);
  });
});

describe("detectRecurringGrowth", () => {
  it("returns insight when recurring amount increased", () => {
    const context = {
      recurring: [{
        id: "rt1", name: "Netflix", amount: 500, previous_amount: 350,
        type: "expense", status: "active", frequency: "monthly",
      }],
    };
    const result = detectRecurringGrowth(context);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("recurring_growth");
  });

  it("returns empty when no increase", () => {
    const context = {
      recurring: [{
        id: "rt1", name: "Netflix", amount: 500, previous_amount: 500,
        type: "expense", status: "active",
      }],
    };
    expect(detectRecurringGrowth(context)).toEqual([]);
  });
});

describe("detectSavingsOpportunity", () => {
  it("returns insight when savings rate is below 20%", () => {
    const context = {
      reports: { totalIncome: 100000, totalExpenses: 85000 },
    };
    const result = detectSavingsOpportunity(context);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].category).toBe("savings_opportunity");
  });

  it("returns positive insight when savings rate exceeds 20%", () => {
    const context = {
      reports: { totalIncome: 100000, totalExpenses: 50000 },
    };
    const result = detectSavingsOpportunity(context);
    expect(result.some((r) => r.severity === "positive")).toBe(true);
  });

  it("handles missing reports", () => {
    expect(detectSavingsOpportunity({})).toEqual([]);
  });
});

describe("detectUnusedBudget", () => {
  it("returns insight when budget is under 30% used near period end", () => {
    const context = {
      budgets: [{
        id: "b1", name: "Shopping", amount: 10000, spent: 2000, percentUsed: 0.2,
        periodEnd: new Date(Date.now() + 86400000).toISOString(),
      }],
    };
    const result = detectUnusedBudget(context);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("unused_budget");
  });

  it("returns empty when period not ending soon", () => {
    const context = {
      budgets: [{
        id: "b1", name: "Shopping", amount: 10000, spent: 2000, percentUsed: 0.2,
        periodEnd: new Date(Date.now() + 86400000 * 14).toISOString(),
      }],
    };
    expect(detectUnusedBudget(context)).toEqual([]);
  });
});

describe("detectSubscriptionWaste", () => {
  it("returns insight for high-cost subscriptions", () => {
    const context = {
      recurring: [{
        id: "rt1", name: "Premium Suite", amount: 15000,
        type: "expense", status: "active", frequency: "monthly",
      }],
      settings: { large_expense_threshold: 10000 },
    };
    const result = detectSubscriptionWaste(context);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("subscription_waste");
  });

  it("returns empty for low-cost subscriptions", () => {
    const context = {
      recurring: [{
        id: "rt1", name: "Netflix", amount: 500,
        type: "expense", status: "active", frequency: "monthly",
      }],
    };
    expect(detectSubscriptionWaste(context)).toEqual([]);
  });
});

describe("detectLargeExpenseTrend", () => {
  it("returns insight when 3+ large expenses in 3 months", () => {
    const context = {
      transactions: Array(3).fill(null).map((_, i) => makeTx(`t${i}`, -15000, now, "Electronics")),
      settings: { large_expense_threshold: 10000 },
    };
    const result = detectLargeExpenseTrend(context);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("large_expense_trend");
  });

  it("returns empty when few large expenses", () => {
    const context = {
      transactions: [makeTx("t1", -15000, now, "Electronics")],
      settings: { large_expense_threshold: 10000 },
    };
    expect(detectLargeExpenseTrend(context)).toEqual([]);
  });
});

describe("detectIncomeDrop", () => {
  it("returns insight when income dropped >30%", () => {
    const recent = Array(3).fill(null).map((_, i) => makeTx(`r${i}`, 30000, new Date(now.getTime() - i * 86400000), "Salary"));
    const prev = Array(3).fill(null).map((_, i) => makeTx(`p${i}`, 100000, new Date(sixMonthsAgo.getTime() + i * 86400000), "Salary"));
    const context = { transactions: [...prev, ...recent] };
    const result = detectIncomeDrop(context);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("income_drop");
  });

  it("returns empty when income is stable", () => {
    const recent = Array(3).fill(null).map((_, i) => makeTx(`r${i}`, 100000, now, "Salary"));
    const prev = Array(3).fill(null).map((_, i) => makeTx(`p${i}`, 100000, sixMonthsAgo, "Salary"));
    const context = { transactions: [...prev, ...recent] };
    expect(detectIncomeDrop(context)).toEqual([]);
  });
});

describe("detectPositiveAchievements", () => {
  it("returns insight when expenses under 50% of income", () => {
    const context = {
      reports: { totalIncome: 100000, totalExpenses: 40000 },
      goals: [],
    };
    const result = detectPositiveAchievements(context);
    expect(result.some((r) => r.category === "positive_achievement")).toBe(true);
  });

  it("returns insight when goals completed", () => {
    const context = {
      goals: [{ id: "g1", name: "Laptop", status: "completed", progress: 100 }],
    };
    const result = detectPositiveAchievements(context);
    expect(result.some((r) => r.category === "positive_achievement")).toBe(true);
  });

  it("returns empty on neutral data", () => {
    const context = {
      reports: { totalIncome: 100000, totalExpenses: 80000 },
      goals: [],
    };
    expect(detectPositiveAchievements(context)).toEqual([]);
  });
});

describe("runAllRules", () => {
  it("aggregates insights from all rules", () => {
    const context = {
      transactions: Array(3).fill(null).map((_, i) => makeTx(`t${i}`, -15000, now, "Electronics")),
      budgets: [],
      goals: [],
      recurring: [],
      reports: { totalIncome: 100000, totalExpenses: 80000 },
      settings: { large_expense_threshold: 10000 },
    };
    const result = runAllRules(context);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for minimal context", () => {
    const context = { transactions: [], budgets: [], goals: [], recurring: [], reports: null };
    const result = runAllRules(context);
    expect(Array.isArray(result)).toBe(true);
  });
});
