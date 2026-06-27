import { describe, it, expect, vi, beforeEach } from "vitest";

const mockContext = {
  transactions: [{ id: "t1", amount: -5000, date: "2026-06-01", category_name: "Food" }],
  budgets: [],
  goals: [],
  recurring: [],
  reports: { totalIncome: 100000, totalExpenses: 80000, currentBalance: 20000, savingsRate: 20, averageMonthlySpend: 80000 },
  settings: { currency: "INR", budget_alert_threshold: 0.8, goal_alert_days: 14, large_expense_threshold: 10000, dashboard_compact_mode: false },
};

vi.mock("../src/services/settingsService.js", () => ({
  getSettings: vi.fn().mockResolvedValue(mockContext.settings),
}));

vi.mock("../src/services/budgetService.js", () => ({
  getBudgetsWithProgress: vi.fn().mockResolvedValue([]),
}));

vi.mock("../src/services/goalService.js", () => ({
  getGoalsWithProgress: vi.fn().mockResolvedValue([]),
}));

vi.mock("../src/services/recurringTransactionService.js", () => ({
  getAllActive: vi.fn().mockResolvedValue([]),
}));

vi.mock("../src/services/reportService.js", () => ({
  getSummary: vi.fn().mockResolvedValue(mockContext.reports),
  fetchTransactions: vi.fn().mockResolvedValue(mockContext.transactions),
}));

vi.mock("../src/utils/aiRules.js", () => ({
  runAllRules: vi.fn().mockReturnValue([
    {
      severity: "high",
      category: "budget_risk",
      title: "Food budget at 85%",
      explanation: "You've used 85% of your Food budget.",
      recommendation: "Reduce spending in Food.",
      confidence: 85,
    },
    {
      severity: "positive",
      category: "positive_achievement",
      title: "Great savings rate",
      explanation: "You're saving 20% of income.",
      recommendation: "Keep it up!",
      confidence: 90,
    },
  ]),
}));

vi.mock("../src/utils/promptBuilder.js", () => ({
  buildPrompt: vi.fn().mockReturnValue("Mock prompt"),
}));

vi.mock("../src/services/llmAdapter.js", () => ({
  generateInsights: vi.fn().mockResolvedValue(null),
  generateForecast: vi.fn().mockResolvedValue(null),
  generateRecommendations: vi.fn().mockResolvedValue(null),
  getActiveProvider: vi.fn().mockReturnValue(null),
}));

let aiInsightService;

beforeEach(async () => {
  vi.clearAllMocks();
  aiInsightService = await import("../src/services/aiInsightService.js");
});

describe("collectFinancialContext", () => {
  it("gathers data from all services", async () => {
    const context = await aiInsightService.collectFinancialContext("user-1");
    expect(context).toHaveProperty("transactions");
    expect(context).toHaveProperty("budgets");
    expect(context).toHaveProperty("goals");
    expect(context).toHaveProperty("recurring");
    expect(context).toHaveProperty("reports");
    expect(context).toHaveProperty("settings");
    expect(context.transactions).toHaveLength(1);
    expect(context.reports.totalIncome).toBe(100000);
  });
});

describe("rankInsights", () => {
  it("sorts by severity then confidence", () => {
    const insights = [
      { severity: "low", confidence: 80, title: "Low" },
      { severity: "high", confidence: 70, title: "High" },
      { severity: "critical", confidence: 90, title: "Critical" },
      { severity: "positive", confidence: 95, title: "Positive" },
      { severity: "medium", confidence: 50, title: "Medium" },
    ];
    const ranked = aiInsightService.rankInsights(insights, 5);
    expect(ranked[0].title).toBe("Critical");
    expect(ranked[1].title).toBe("High");
    expect(ranked[2].title).toBe("Medium");
    expect(ranked[3].title).toBe("Low");
    expect(ranked[4].title).toBe("Positive");
  });

  it("respects limit", () => {
    const insights = Array(10).fill(null).map((_, i) => ({
      severity: "low", confidence: 50, title: `Insight ${i}`,
    }));
    expect(aiInsightService.rankInsights(insights, 3)).toHaveLength(3);
  });

  it("returns empty for empty input", () => {
    expect(aiInsightService.rankInsights([])).toEqual([]);
  });
});

describe("generateHeadline", () => {
  it("uses top insight title for issues", () => {
    const headline = aiInsightService.generateHeadline(mockContext, [
      { severity: "high", title: "Budget warning" },
    ]);
    expect(headline).toBe("Budget warning");
  });

  it("uses top insight title for positives", () => {
    const headline = aiInsightService.generateHeadline(mockContext, [
      { severity: "positive", title: "You're doing great!" },
    ]);
    expect(headline).toBe("You're doing great!");
  });

  it("falls back to stable message", () => {
    const headline = aiInsightService.generateHeadline(mockContext, []);
    expect(headline).toBe("Your finances look stable — no significant changes detected.");
  });
});

describe("buildInsightPayload", () => {
  it("includes headline, summary, insights, and recommendations", () => {
    const insights = [
      { severity: "high", category: "test", title: "Test", explanation: "Explanation", recommendation: "Do something", confidence: 80 },
    ];
    const payload = aiInsightService.buildInsightPayload(mockContext, insights);
    expect(payload).toHaveProperty("headline");
    expect(payload).toHaveProperty("summary");
    expect(payload).toHaveProperty("insights");
    expect(payload).toHaveProperty("recommendations");
    expect(payload).toHaveProperty("generatedAt");
    expect(payload.insights).toHaveLength(1);
    expect(payload.recommendations).toHaveLength(1);
  });
});

describe("generateInsights", () => {
  it("orchestrates full pipeline", async () => {
    const result = await aiInsightService.generateInsights("user-1");
    expect(result).toHaveProperty("headline");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("insights");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("generatedAt");
    expect(result).toHaveProperty("context");
    expect(result.insights.length).toBeLessThanOrEqual(5);
  });
});

describe("getDashboardInsights", () => {
  it("returns short summary without raw transactions", async () => {
    const result = await aiInsightService.getDashboardInsights("user-1");
    expect(result).toHaveProperty("headline");
    expect(result).toHaveProperty("insights");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("generatedAt");
    expect(result.insights.length).toBeLessThanOrEqual(3);
    // Should not contain raw context data
    expect(result).not.toHaveProperty("transactions");
    expect(result).not.toHaveProperty("context");
  });
});
