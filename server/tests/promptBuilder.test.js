import { describe, it, expect } from "vitest";
import { buildPrompt, buildForecastPrompt, buildRecommendationPrompt } from "../src/utils/promptBuilder.js";

describe("buildPrompt", () => {
  it("returns structured prompt with all sections", () => {
    const context = {
      reports: { totalIncome: 100000, totalExpenses: 80000, currentBalance: 20000, savingsRate: 20, averageMonthlySpend: 80000 },
      budgets: [{ name: "Food", percentUsed: 0.85, spent: 8500, amount: 10000 }],
      goals: [{ name: "Vacation", progress: 50, current_saved_amount: 50000, target_amount: 100000, status: "active" }],
      recurring: [{ name: "Netflix", amount: 500, frequency: "monthly", status: "active" }],
      settings: { currency: "INR", budget_alert_threshold: 0.8, goal_alert_days: 14, dashboard_compact_mode: false },
    };
    const prompt = buildPrompt(context);
    expect(prompt).toContain("FINANCIAL SUMMARY");
    expect(prompt).toContain("BUDGETS");
    expect(prompt).toContain("GOALS");
    expect(prompt).toContain("RECURRING TRANSACTIONS");
    expect(prompt).toContain("USER PREFERENCES");
    expect(prompt).toContain("REQUEST");
    expect(prompt).toContain("Food");
    expect(prompt).toContain("Vacation");
    expect(prompt).toContain("Netflix");
  });

  it("returns empty string for null context", () => {
    expect(buildPrompt(null)).toBe("");
  });

  it("handles missing sections gracefully", () => {
    const context = { reports: null, budgets: [], goals: [], recurring: [], settings: {} };
    const prompt = buildPrompt(context);
    expect(prompt).toContain("No active budgets");
    expect(prompt).toContain("No active goals");
    expect(prompt).toContain("No recurring transactions");
  });
});

describe("buildForecastPrompt", () => {
  it("returns forecast prompt with historical data", () => {
    const context = {
      reports: { totalIncome: 100000, totalExpenses: 80000, currentBalance: 20000, savingsRate: 20 },
      settings: { currency: "INR" },
    };
    const prompt = buildForecastPrompt(context);
    expect(prompt).toContain("forecast");
    expect(prompt).toContain("next month");
    expect(prompt).toContain("INR");
  });

  it("returns empty string for null context", () => {
    expect(buildForecastPrompt(null)).toBe("");
  });
});

describe("buildRecommendationPrompt", () => {
  it("returns recommendation prompt for a category", () => {
    const context = {
      reports: { totalIncome: 100000, totalExpenses: 80000, savingsRate: 20 },
      settings: { currency: "INR" },
    };
    const prompt = buildRecommendationPrompt(context, "overspending");
    expect(prompt).toContain("overspending");
    expect(prompt).toContain("action");
    expect(prompt).toContain("financial impact");
  });
});
