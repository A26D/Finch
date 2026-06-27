/**
 * AI Insight Service
 *
 * Orchestrates the financial insight pipeline:
 *
 *   collectFinancialContext(userId)
 *       ↓
 *   runInsightRules(context)
 *       ↓
 *   rankInsights(insights)
 *       ↓
 *   buildPayload(headline, insights, recommendations)
 *
 * This service is the ONLY place responsible for generating
 * financial insights. It consumes existing services — never
 * queries the database directly.
 *
 * ── AI_HOOK: Future pipeline stages ──
 *
 * TODO(ai-llm-enrichment): After rule-based insights are generated,
 * pass headline + top insights to llmAdapter.generateInsights()
 * for natural language enhancement.
 *
 * TODO(ai-forecast): Add a pipeline stage that runs forecast models
 * after insights are generated.
 *
 * TODO(ai-personalization): Weight insights based on user's
 * preferred spending style and risk tolerance from settings.
 *
 * TODO(ai-behavioral-nudge): Generate follow-up insights after
 * user acts on a recommendation (e.g. "You reduced dining by
 * ₹2000 this month — great progress!").
 */

import pool from "../db.js";
import { getSettings } from "./settingsService.js";
import { getBudgetsWithProgress } from "./budgetService.js";
import { getGoalsWithProgress } from "./goalService.js";
import { getAllActive } from "./recurringTransactionService.js";
import { getSummary as getReportSummary } from "./reportService.js";
import { fetchTransactions } from "./reportService.js";
import { runAllRules } from "../utils/aiRules.js";
import { buildPrompt } from "../utils/promptBuilder.js";
import * as llmAdapter from "./llmAdapter.js";

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, positive: 4 };

/**
 * Collect all financial data for a user into one normalized context object.
 */
export async function collectFinancialContext(userId) {
  const [settings, budgets, goals, recurring, reportSummary, transactions] = await Promise.all([
    getSettings(userId),
    getBudgetsWithProgress(userId, pool),
    getGoalsWithProgress(userId, pool),
    getAllActive(userId, pool),
    getReportSummary(),
    fetchTransactions(userId),
  ]);

  return {
    transactions,
    budgets,
    goals,
    recurring,
    reports: reportSummary,
    settings,
  };
}

/**
 * Run all insight rules against the financial context.
 */
export function runInsightRules(context) {
  return runAllRules(context);
}

/**
 * Rank insights by severity, then confidence.
 * Returns top N insights.
 */
export function rankInsights(insights, limit = 5) {
  const sorted = [...insights].sort((a, b) => {
    const sevDiff = (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
    if (sevDiff !== 0) return sevDiff;
    return (b.confidence || 0) - (a.confidence || 0);
  });

  return sorted.slice(0, limit);
}

/**
 * Generate a financial headline from the top insights.
 */
export function generateHeadline(context, topInsights) {
  if (!topInsights || topInsights.length === 0) {
    return "Your finances look stable — no significant changes detected.";
  }

  const top = topInsights[0];
  if (top.severity === "positive") {
    return top.title;
  }

  const positiveCount = topInsights.filter((i) => i.severity === "positive").length;
  const issueCount = topInsights.filter((i) => i.severity !== "positive").length;

  if (issueCount > 0 && positiveCount > 0) {
    return `${top.title} — but ${positiveCount} positive sign${positiveCount > 1 ? "s" : ""} found.`;
  }

  return top.title;
}

/**
 * Generate actionable recommendations from the top insights.
 */
export function extractRecommendations(topInsights) {
  return topInsights
    .filter((i) => i.recommendation)
    .map((i) => ({
      category: i.category,
      action: i.recommendation,
      priority: i.severity === "critical" || i.severity === "high" ? "high" : "normal",
    }));
}

/**
 * Build the complete insight payload.
 */
export function buildInsightPayload(context, topInsights) {
  const headline = generateHeadline(context, topInsights);
  const recommendations = extractRecommendations(topInsights);

  return {
    headline,
    summary: topInsights.length > 0
      ? topInsights.map((i) => i.explanation).join(" ")
      : "No insights at this time. Your financial data appears stable.",
    insights: topInsights,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Full pipeline: collect → detect → rank → build → enrich (LLM optional).
 *
 * This is the main entry point for all insight consumers.
 *
 * ── AI_HOOK: LLM enrichment ──
 * After building the payload, pass to llmAdapter for natural language
 * enhancement if an LLM provider is configured.
 */
export async function generateInsights(userId) {
  const context = await collectFinancialContext(userId);
  const insights = runInsightRules(context);
  const topInsights = rankInsights(insights, 5);
  const payload = buildInsightPayload(context, topInsights);

  // LLM enrichment (currently no-op — returns null)
  const prompt = buildPrompt(context);
  const llmResult = await llmAdapter.generateInsights(context, prompt);
  if (llmResult) {
    // ── AI_HOOK: Merge LLM output with rule-based insights
    // payload.llmEnhanced = llmResult;
  }

  return { ...payload, context };
}

/**
 * Get a short summary suitable for embedding in dashboard/responses.
 * Does NOT return raw transactions — only insight metadata.
 */
export async function getDashboardInsights(userId) {
  const context = await collectFinancialContext(userId);
  const insights = runInsightRules(context);
  const topInsights = rankInsights(insights, 3);
  const headline = generateHeadline(context, topInsights);
  const recommendations = extractRecommendations(topInsights);

  return {
    headline,
    insights: topInsights.map((i) => ({
      severity: i.severity,
      category: i.category,
      title: i.title,
      explanation: i.explanation,
      recommendation: i.recommendation,
      confidence: i.confidence,
    })),
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
