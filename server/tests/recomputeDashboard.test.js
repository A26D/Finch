import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDashboardData = {
  totalIncome: 50000,
  totalExpenses: 2000,
  currentBalance: 48000,
  savingsRate: 96,
  activeBudgets: 1,
  activeGoals: 2,
};

const mockPool = { query: vi.fn() };

const mockCacheGet = vi.fn().mockResolvedValue(null);
const mockCacheSet = vi.fn().mockResolvedValue(undefined);
const mockGetDashboardData = vi.fn().mockResolvedValue(mockDashboardData);
const mockGetBudgets = vi.fn().mockResolvedValue([]);
const mockGetGoals = vi.fn().mockResolvedValue([]);
const mockGetAllActive = vi.fn().mockResolvedValue([]);
const mockEnqueueNotification = vi.fn().mockResolvedValue(undefined);
const mockGetSettings = vi.fn().mockResolvedValue({
  budget_alert_threshold: 0.8,
  goal_alert_days: 30,
  large_expense_threshold: 10000,
  dashboard_compact_mode: false,
  currency: "INR",
  locale: "en-IN",
});

vi.mock("../src/db.js", () => ({ default: mockPool }));

vi.mock("../src/services/dashboardService.js", () => ({
  getDashboardData: mockGetDashboardData,
}));

vi.mock("../src/services/budgetService.js", () => ({
  getBudgetsWithProgress: mockGetBudgets,
}));

vi.mock("../src/services/goalService.js", () => ({
  getGoalsWithProgress: mockGetGoals,
}));

vi.mock("../src/services/recurringTransactionService.js", () => ({
  getAllActive: mockGetAllActive,
}));

vi.mock("../src/services/cacheService.js", () => ({
  get: mockCacheGet,
  set: mockCacheSet,
}));

vi.mock("../src/services/settingsService.js", () => ({
  getSettings: mockGetSettings,
}));

vi.mock("../src/jobs/jobQueue.js", () => ({
  enqueueDashboardRecompute: vi.fn(),
  enqueueNotification: mockEnqueueNotification,
}));

vi.mock("bullmq", () => ({
  Worker: vi.fn().mockImplementation((queueName, handler) => {
    return {
      handler,
      queueName,
      on: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

vi.mock("ioredis", () => ({
  default: function MockRedis() {
    return {
      on: vi.fn(),
      connect: vi.fn(),
    };
  },
}));

let recomputeDashboard;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  mockPool.query.mockResolvedValue({ rows: [{ count: "0" }] });
  recomputeDashboard = await import("../src/jobs/recomputeDashboard.js");
});

describe("recomputeDashboard worker", () => {
  it("createRecomputeWorker returns a worker", () => {
    const worker = recomputeDashboard.createRecomputeWorker();
    expect(worker).toBeDefined();
    expect(worker.queueName).toBe("dashboard.recompute");
  });

  it("worker handler calls getDashboardData and cacheService.set with snapshot", async () => {
    const worker = recomputeDashboard.createRecomputeWorker();
    const job = {
      data: { userId: "user-1", reason: "test", triggeredAt: new Date().toISOString() },
    };

    await worker.handler(job);

    expect(mockCacheGet).toHaveBeenCalledWith("dashboard:snapshot:v1:user-1");
    expect(mockGetDashboardData).toHaveBeenCalledWith("user-1", expect.any(Object));
    expect(mockCacheSet).toHaveBeenCalledWith(
      "dashboard:v2:user-1",
      expect.objectContaining({
        ...mockDashboardData,
        notificationsSummary: { unread: 0, critical: 0 },
      }),
      3600
    );
    expect(mockCacheSet).toHaveBeenCalledWith(
      "dashboard:snapshot:v1:user-1",
      expect.any(Object),
      3600
    );
  });

  it("worker handler uses userId from job data", async () => {
    const worker = recomputeDashboard.createRecomputeWorker();
    const job = {
      data: { userId: "user-42", reason: "budget_updated", triggeredAt: new Date().toISOString() },
    };

    await worker.handler(job);

    expect(mockGetDashboardData).toHaveBeenCalledWith("user-42", expect.any(Object));
    expect(mockCacheSet).toHaveBeenCalledWith(
      "dashboard:v2:user-42",
      expect.objectContaining({
        notificationsSummary: { unread: 0, critical: 0 },
      }),
      3600
    );
  });

  it("buildSnapshot returns structured snapshot data", async () => {
    mockGetBudgets.mockResolvedValue([
      { id: "b1", name: "Food", amount: 5000, spent: 4000, percentUsed: 0.8, alert_threshold: 0.8 },
    ]);
    mockGetGoals.mockResolvedValue([
      { id: "g1", name: "Vacation", target_amount: 10000, current_saved_amount: 5000, progress: 50, status: "active" },
    ]);
    mockGetAllActive.mockResolvedValue([
      { id: "rt1", name: "Netflix", amount: 500, type: "expense", status: "active", next_run_date: "2026-07-01" },
    ]);

    const snapshot = await recomputeDashboard.buildSnapshot("user-1");

    expect(snapshot).toHaveProperty("budgets");
    expect(snapshot).toHaveProperty("goals");
    expect(snapshot).toHaveProperty("recurringDue");
    expect(snapshot.budgets).toHaveLength(1);
    expect(snapshot.goals).toHaveLength(1);
    expect(snapshot.budgets[0].percentUsed).toBe(0.8);
    expect(snapshot.goals[0].progress).toBe(50);
  });
});
