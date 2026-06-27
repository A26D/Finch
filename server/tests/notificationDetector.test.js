import { describe, it, expect } from "vitest";
import {
  detectAll,
  detectBudgetNotifications,
  detectGoalNotifications,
  detectRecurringNotifications,
  detectLargeExpenseNotifications,
} from "../src/utils/notificationDetector.js";

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextMonth = new Date(today);
nextMonth.setMonth(nextMonth.getMonth() + 1);

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

describe("detectBudgetNotifications", () => {
  const defaultSettings = { budget_alert_threshold: 0.8 };

  it("returns budget_exceeded when percentUsed crosses 1.0", () => {
    const oldSnap = { budgets: [{ id: "b1", percentUsed: 0.8 }] };
    const newSnap = { budgets: [{ id: "b1", name: "Food", percentUsed: 1.2, alert_threshold: 0.8 }] };
    const result = detectBudgetNotifications(oldSnap, newSnap, defaultSettings);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("budget_exceeded");
  });

  it("returns budget_warning when percentUsed crosses alert_threshold", () => {
    const oldSnap = { budgets: [{ id: "b1", percentUsed: 0.5 }] };
    const newSnap = { budgets: [{ id: "b1", name: "Food", percentUsed: 0.9, alert_threshold: 0.8 }] };
    const result = detectBudgetNotifications(oldSnap, newSnap, defaultSettings);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("budget_warning");
  });

  it("uses settings.budget_alert_threshold when budget lacks alert_threshold", () => {
    const oldSnap = { budgets: [{ id: "b1", percentUsed: 0.5 }] };
    const newSnap = { budgets: [{ id: "b1", name: "Food", percentUsed: 0.85 }] };
    const settings = { budget_alert_threshold: 0.75 };
    const result = detectBudgetNotifications(oldSnap, newSnap, settings);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("budget_warning");
  });

  it("returns no notification when percentUsed hasn't crossed threshold", () => {
    const oldSnap = { budgets: [{ id: "b1", percentUsed: 0.5 }] };
    const newSnap = { budgets: [{ id: "b1", name: "Food", percentUsed: 0.6 }] };
    const result = detectBudgetNotifications(oldSnap, newSnap, defaultSettings);
    expect(result).toHaveLength(0);
  });

  it("handles empty budgets", () => {
    const result = detectBudgetNotifications({}, {}, defaultSettings);
    expect(result).toEqual([]);
  });
});

describe("detectGoalNotifications", () => {
  it("returns goal_completed when status changes to completed", () => {
    const oldSnap = { goals: [{ id: "g1", status: "active", progress: 50 }] };
    const newSnap = { goals: [{ id: "g1", name: "Vacation", status: "completed", progress: 100, target_amount: 10000 }] };
    const result = detectGoalNotifications(oldSnap, newSnap);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("goal_completed");
  });

  it("returns goal_behind when progress drops below 50% and target is within alert_days", () => {
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 7);
    // Progress was 60 (above threshold), now 20 (below) — triggers because progress changed
    const oldSnap = { goals: [{ id: "g1", status: "active", progress: 60 }] };
    const newSnap = { goals: [{ id: "g1", name: "Vacation", status: "active", progress: 20, target_date: fmtDate(nearFuture) }] };
    const settings = { goal_alert_days: 30 };
    const result = detectGoalNotifications(oldSnap, newSnap, settings);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("goal_behind");
  });

  it("uses settings.goal_alert_days instead of hardcoded 30", () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 20);
    const oldSnap = { goals: [{ id: "g1", status: "active", progress: 60 }] };
    const newSnap = { goals: [{ id: "g1", name: "Vacation", status: "active", progress: 20, target_date: fmtDate(farFuture) }] };
    // With alert_days=14, 20 days away should NOT trigger
    const settings = { goal_alert_days: 14 };
    const result = detectGoalNotifications(oldSnap, newSnap, settings);
    expect(result).toHaveLength(0);
    // With alert_days=30, 20 days away SHOULD trigger
    const settings2 = { goal_alert_days: 30 };
    const result2 = detectGoalNotifications(oldSnap, newSnap, settings2);
    expect(result2).toHaveLength(1);
  });

  it("does not duplicate goal_behind when progress hasn't changed", () => {
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 7);
    // First comparison: progress drops from 60 to 20 — triggers
    const oldSnap = { goals: [{ id: "g1", status: "active", progress: 60 }] };
    const newSnap = { goals: [{ id: "g1", name: "Vacation", status: "active", progress: 20, target_date: fmtDate(nearFuture) }] };
    const settings = { goal_alert_days: 30 };
    const first = detectGoalNotifications(oldSnap, newSnap, settings);
    expect(first).toHaveLength(1);
    // Second comparison: progress stays at 20 — should NOT re-trigger (alreadySent)
    const secondSnap = { goals: [{ id: "g1", name: "Vacation", status: "active", progress: 20, target_date: fmtDate(nearFuture) }] };
    const second = detectGoalNotifications(newSnap, secondSnap, settings);
    expect(second).toHaveLength(0);
  });

  it("handles empty goals", () => {
    const result = detectGoalNotifications({}, {});
    expect(result).toEqual([]);
  });
});

describe("detectRecurringNotifications", () => {
  it("returns recurring_due when a new recurring bill is due tomorrow", () => {
    const oldSnap = { recurringDue: [] };
    const newSnap = { recurringDue: [{ id: "rt1", name: "Netflix", amount: 500, nextRunDate: fmtDate(tomorrow) }] };
    const result = detectRecurringNotifications(oldSnap, newSnap);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("recurring_due");
  });

  it("does not re-notify if already in old snapshot", () => {
    const oldSnap = { recurringDue: [{ id: "rt1", name: "Netflix", amount: 500, nextRunDate: fmtDate(tomorrow) }] };
    const newSnap = { recurringDue: [{ id: "rt1", name: "Netflix", amount: 500, nextRunDate: fmtDate(tomorrow) }] };
    const result = detectRecurringNotifications(oldSnap, newSnap);
    expect(result).toHaveLength(0);
  });

  it("handles empty recurringDue", () => {
    const result = detectRecurringNotifications({}, {});
    expect(result).toEqual([]);
  });
});

describe("detectLargeExpenseNotifications", () => {
  it("returns large_expense when expense exceeds threshold", () => {
    const oldSnap = { recentLargeExpenses: [] };
    const newSnap = { recentLargeExpenses: [{ id: "t1", amount: 15000, category_name: "Electronics" }] };
    const settings = { large_expense_threshold: 10000 };
    const result = detectLargeExpenseNotifications(oldSnap, newSnap, settings);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("large_expense");
  });

  it("uses settings.large_expense_threshold instead of hardcoded default", () => {
    const oldSnap = { recentLargeExpenses: [] };
    const newSnap = { recentLargeExpenses: [{ id: "t1", amount: 5000, category_name: "Food" }] };
    const settings = { large_expense_threshold: 10000 };
    const result = detectLargeExpenseNotifications(oldSnap, newSnap, settings);
    expect(result).toHaveLength(0);
  });

  it("handles empty recentLargeExpenses", () => {
    const result = detectLargeExpenseNotifications({}, {});
    expect(result).toEqual([]);
  });
});

describe("detectAll", () => {
  it("returns empty array when no changes", () => {
    const snap = {
      budgets: [],
      goals: [],
      recurringDue: [],
    };
    const result = detectAll(snap, snap, {});
    expect(result).toEqual([]);
  });

  it("aggregates notifications from all detectors", () => {
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const oldSnap = {
      budgets: [{ id: "b1", percentUsed: 0.5 }],
      goals: [{ id: "g1", status: "active", progress: 20 }],
      recurringDue: [],
    };
    const newSnap = {
      budgets: [{ id: "b1", name: "Food", percentUsed: 0.9, alert_threshold: 0.8 }],
      goals: [{ id: "g1", name: "Vacation", status: "active", progress: 20, target_date: fmtDate(tomorrowDate) }],
      recurringDue: [{ id: "rt1", name: "Netflix", amount: 500, nextRunDate: fmtDate(tomorrowDate) }],
    };
    const settings = { budget_alert_threshold: 0.8, goal_alert_days: 30 };
    const result = detectAll(oldSnap, newSnap, settings);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
