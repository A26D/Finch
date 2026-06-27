/**
 * Prompt Builder
 *
 * Pure function that transforms a normalized financial context into
 * a structured prompt string for future LLM providers.
 *
 * No API calls. No DB. Platform-independent.
 *
 * ── AI_HOOK: Future prompt strategies ──
 *
 * TODO(ai-prompt-personalization): Incorporate user's language
 * preference, risk tolerance, and financial goals from settings
 * into the prompt tone and focus.
 *
 * TODO(ai-prompt-few-shot): Include examples of good financial
 * advice in the prompt for better LLM output quality.
 *
 * TODO(ai-prompt-tool-use): Add function-calling definitions so
 * the LLM can request specific data (e.g. "how much did I spend
 * on groceries last month?").
 *
 * TODO(ai-prompt-multilingual): Support prompt generation in the
 * user's preferred language from settings.locale.
 *
 * TODO(ai-prompt-role-customization): Allow user to set the AI's
 * persona (e.g. "frugal accountant", "growth investor", "balanced
 * advisor").
 */

/**
 * Build a structured prompt from financial context.
 *
 * @param {Object} context - Normalized financial context from aiInsightService
 * @returns {string} Structured prompt suitable for LLM consumption
 */
export function buildPrompt(context) {
  if (!context) return "";

  const { reports, budgets, goals, recurring, settings } = context;
  const currency = settings?.currency || "INR";

  const sections = [];

  // System directive
  sections.push(`You are a financial advisor analyzing personal finance data.`);
  sections.push(`Your role is to provide actionable, data-backed advice.`);
  sections.push(`Never invent numbers. Only use the data provided below.`);
  sections.push(`Format monetary values in ${currency}.`);
  sections.push(`Be concise and specific.`);
  sections.push("");

  // Summary
  sections.push("=== FINANCIAL SUMMARY ===");
  if (reports) {
    sections.push(`Total Income: ${currency} ${reports.totalIncome || 0}`);
    sections.push(`Total Expenses: ${currency} ${reports.totalExpenses || 0}`);
    sections.push(`Current Balance: ${currency} ${reports.currentBalance || 0}`);
    sections.push(`Savings Rate: ${reports.savingsRate || 0}%`);
    sections.push(`Average Monthly Spend: ${currency} ${reports.averageMonthlySpend || 0}`);
  }
  sections.push("");

  // Budgets
  sections.push("=== BUDGETS ===");
  if (budgets && budgets.length) {
    for (const b of budgets) {
      sections.push(`- ${b.name}: ${Math.round(toNum(b.percentUsed) * 100)}% used (${currency} ${Math.round(toNum(b.spent))} of ${currency} ${Math.round(toNum(b.amount))})`);
    }
  } else {
    sections.push("- No active budgets");
  }
  sections.push("");

  // Goals
  sections.push("=== GOALS ===");
  if (goals && goals.length) {
    for (const g of goals) {
      sections.push(`- ${g.name}: ${Math.round(toNum(g.progress))}% complete (${currency} ${Math.round(toNum(g.current_saved_amount))} of ${currency} ${Math.round(toNum(g.target_amount))}) [Status: ${g.status}]`);
    }
  } else {
    sections.push("- No active goals");
  }
  sections.push("");

  // Recurring
  sections.push("=== RECURRING TRANSACTIONS ===");
  if (recurring && recurring.length) {
    for (const r of recurring) {
      sections.push(`- ${r.name}: ${currency} ${Math.round(toNum(r.amount))} (${r.frequency}, ${r.status})`);
    }
  } else {
    sections.push("- No recurring transactions");
  }
  sections.push("");

  // Settings
  sections.push("=== USER PREFERENCES ===");
  if (settings) {
    sections.push(`Budget Alert Threshold: ${Math.round((settings.budget_alert_threshold || 0.8) * 100)}%`);
    sections.push(`Goal Alert Days: ${settings.goal_alert_days || 14}`);
    sections.push(`Dashboard Compact Mode: ${settings.dashboard_compact_mode ? "Yes" : "No"}`);
  }
  sections.push("");

  // Request
  sections.push("=== REQUEST ===");
  sections.push("Based on the data above, provide:");
  sections.push("1. A one-sentence financial headline");
  sections.push("2. Top 3-5 actionable insights");
  sections.push("3. One specific recommendation the user can act on today");
  sections.push("");
  sections.push("Be specific with numbers. Reference actual categories, amounts, and goals.");

  return sections.join("\n");
}

function toNum(v) {
  return Number(v) || 0;
}

/**
 * Build a short prompt focused on forecasting.
 *
 * ── AI_HOOK: Future forecast prompt ──
 */
export function buildForecastPrompt(context) {
  if (!context) return "";
  const { reports } = context;
  const currency = context.settings?.currency || "INR";

  const lines = [
    "Given the following financial data, predict next month's income, expenses, and savings rate.",
    `Currency: ${currency}`,
    "",
    "=== HISTORICAL DATA ===",
  ];

  if (reports) {
    lines.push(`Current Balance: ${currency} ${reports.currentBalance || 0}`);
    lines.push(`Average Monthly Income: ${currency} ${reports.totalIncome || 0}`);
    lines.push(`Average Monthly Expenses: ${currency} ${reports.totalExpenses || 0}`);
    lines.push(`Savings Rate: ${reports.savingsRate || 0}%`);
  }

  lines.push("");
  lines.push("Provide your forecast as JSON: { nextMonthIncome, nextMonthExpenses, nextMonthSavingsRate, confidence, reasoning }");

  return lines.join("\n");
}

/**
 * Build a short prompt focused on recommendations.
 *
 * ── AI_HOOK: Future recommendation prompt ──
 */
export function buildRecommendationPrompt(context, insightCategory) {
  if (!context) return "";
  const currency = context.settings?.currency || "INR";

  const lines = [
    `Based on the financial data below, provide specific recommendations for: ${insightCategory || "overall financial health"}.`,
    `Currency: ${currency}`,
    "",
    "=== FINANCIAL DATA ===",
    `Income: ${currency} ${context.reports?.totalIncome || 0}`,
    `Expenses: ${currency} ${context.reports?.totalExpenses || 0}`,
    `Savings Rate: ${context.reports?.savingsRate || 0}%`,
    "",
    "Each recommendation must include:",
    "- A specific action the user can take",
    "- The expected financial impact",
    "- A time frame for implementation",
    "",
    "Never recommend anything that isn't supported by the data.",
  ];

  return lines.join("\n");
}
