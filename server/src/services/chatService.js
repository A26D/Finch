import Anthropic from "@anthropic-ai/sdk";
import { toolDefinitions, executeTool } from "./chatTools.js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
const MAX_TOKENS = 2048;

function pad(n) {
  return String(n).padStart(2, "0");
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function lastMonthRange() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  return {
    start: `${first.getFullYear()}-${pad(first.getMonth() + 1)}-01`,
    end: `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`,
  };
}

function buildSystemPrompt() {
  const today = todayStr();
  return `You are a helpful financial assistant for the user's Expense Tracker app. Today's date is ${today}.

YOUR CAPABILITIES:
- Answer questions about the user's spending, budgets, goals, recurring expenses, and financial trends
- Compare time periods
- Report on budget status and goal progress

RULES:
1. ONLY answer using the tool results. Never estimate, guess, or make up financial numbers from general knowledge.
2. If a tool returns empty results (no data found), say so plainly — e.g. "I don't see any transactions in that period" — rather than implying a confident zero.
3. If the user's question is ambiguous (e.g. "my spending" with no category or date range), ask a brief clarifying question rather than guessing the scope.
4. This is a READ-ONLY assistant. Never offer to create, modify, or delete any data. If asked to "set a budget", "add a transaction", etc., explain that those actions are done through the Budgets or Transactions pages in the app, not through chat.
5. Keep responses concise and concrete. Lead with the key number or fact, then provide brief context. Avoid long preambles.
6. Use getCurrentDate to find today's date, then convert any relative date references (like "this month", "last week", "this year") into concrete YYYY-MM-DD dates before selecting tool parameters.
7. You can call multiple tools in a single response if needed.`;
}

function fmt(num) {
  if (num === null || num === undefined) return "0";
  const n = Number(num);
  if (isNaN(n)) return "0";
  return Math.round(n * 100) / 100 + "";
}

function formatCurrency(num) {
  const n = Number(num);
  if (isNaN(n)) return "$0";
  const abs = Math.abs(n);
  const s = abs >= 1000 ? (Math.round(abs * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : Math.round(abs * 100) / 100 + "";
  return (n < 0 ? "-$" : "$") + s;
}

function getClient() {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

const intents = [
  {
    name: "LARGEST_EXPENSE",
    keywords: ["largest", "highest", "biggest", "maximum", "max", "expensive", "costliest", "transaction"],
    async handler(msg, userId) {
      const mStart = monthStart();
      const tStr = todayStr();
      const res = await executeTool("getLargestExpense", { startDate: mStart, endDate: tStr }, userId);
      if (res.error) return "I had trouble finding your largest expense.";
      if (!res.result?.expense) return "No expenses found in this period.";
      const e = res.result.expense;
      let response = `Your largest expense was ${formatCurrency(e.amount)}`;
      if (e.description) response += ` for "${e.description}"`;
      if (e.category) response += ` in ${e.category}`;
      response += ` on ${e.date}.`;
      return response;
    },
  },
  {
    name: "TOP_MERCHANT",
    keywords: ["merchant", "store", "shop", "amazon", "flipkart", "where", "who"],
    async handler(msg, userId) {
      const mStart = monthStart();
      const tStr = todayStr();
      const res = await executeTool("getTopMerchants", { startDate: mStart, endDate: tStr, limit: 5 }, userId);
      if (res.error) return "I had trouble checking your top merchants.";
      const merchants = res.result?.merchants || [];
      if (!merchants.length) return "No merchant spending found for this month.";
      const top = merchants[0];
      let response = `Your top merchant this month is ${top.merchant} at ${formatCurrency(top.totalSpend)} across ${top.transactionCount} transaction(s).`;
      if (merchants.length > 1) {
        const lines = merchants.slice(1).map((m) => `  • ${m.merchant}: ${formatCurrency(m.totalSpend)} (${m.transactionCount} txns)`);
        response += `\n\nOther merchants:\n${lines.join("\n")}`;
      }
      return response;
    },
  },
  {
    name: "CATEGORY_SPENDING",
    keywords: ["category", "categories", "food", "shopping", "travel", "entertainment", "groceries", "spent on", "breakdown"],
    async handler(msg, userId) {
      const mStart = monthStart();
      const tStr = todayStr();
      const res = await executeTool("getCategorySpending", { startDate: mStart, endDate: tStr }, userId);
      if (res.error) return "I had trouble checking your spending categories.";
      const cats = res.result?.categories || [];
      if (!cats.length) return "No spending found for this month.";
      const top = cats[0];
      const total = cats.reduce((s, c) => s + Number(c.amount), 0);
      let response = `Your biggest spending category this month is ${top.name} at ${formatCurrency(top.amount)}.`;
      if (cats.length > 1) {
        const lines = cats.slice(0, 5).map((c) => {
          const pct = total > 0 ? Math.round((Number(c.amount) / total) * 100) : 0;
          return `  • ${c.name}: ${formatCurrency(c.amount)} (${pct}%)`;
        });
        response += `\n\nAll categories:\n${lines.join("\n")}`;
      }
      return response;
    },
  },
  {
    name: "COMPARE",
    keywords: ["compare", "last month", "previous month", "difference"],
    async handler(msg, userId) {
      const mStart = monthStart();
      const tStr = todayStr();
      const lm = lastMonthRange();
      const res = await executeTool("comparePeriods", {
        period1Start: lm.start,
        period1End: lm.end,
        period2Start: mStart,
        period2End: tStr,
      }, userId);
      if (res.error) return "I had trouble comparing your spending.";
      const d = res.result?.difference;
      if (!d) return "Not enough data to compare periods.";
      const lines = [
        "Comparing this month to last month:",
        `  • Expenses: ${d.expenseChange >= 0 ? "↑" : "↓"} ${formatCurrency(Math.abs(d.expenseChange))}${d.expensePercent !== null ? ` (${d.expensePercent >= 0 ? "+" : ""}${d.expensePercent}%)` : ""}`,
        `  • Income: ${d.incomeChange >= 0 ? "↑" : "↓"} ${formatCurrency(Math.abs(d.incomeChange))}${d.incomePercent !== null ? ` (${d.incomePercent >= 0 ? "+" : ""}${d.incomePercent}%)` : ""}`,
      ];
      return lines.join("\n");
    },
  },
  {
    name: "RECURRING",
    keywords: ["recurring", "subscription", "emi", "upcoming", "next payment"],
    async handler(msg, userId) {
      const isUpcoming = msg.includes("upcoming") || msg.includes("due");
      const res = await executeTool("getRecurringExpenses", { upcoming: isUpcoming }, userId);
      if (res.error) return "I had trouble checking your recurring expenses.";
      const items = res.result?.recurringItems || [];
      if (!items.length) return isUpcoming ? "No upcoming bills or subscriptions due in the next 7 days." : "You don't have any active recurring expenses or income.";
      const lines = items.map((r) => `  • ${r.name}: ${formatCurrency(r.amount)} (${r.frequency}, next: ${r.next_run_date})`);
      return `Here are your recurring items:\n${lines.join("\n")}`;
    },
  },
  {
    name: "BUDGETS",
    keywords: ["budget", "budgets", "limit", "overspend", "remaining"],
    async handler(msg, userId) {
      const res = await executeTool("getBudgetStatus", {}, userId);
      if (res.error) return "I had trouble checking your budgets.";
      const budgets = res.result?.budgets || [];
      if (!budgets.length) return "You don't have any active budgets set up. You can create one in the Budgets page.";
      budgets.sort((a, b) => Number(b.percentUsed) - Number(a.percentUsed));
      const lines = budgets.map((b) => {
        const pct = Math.round(Number(b.percentUsed) * 100);
        const icon = pct >= 100 ? "🔴" : pct >= 80 ? "⚠️" : "✅";
        return `${icon} ${b.name}: ${pct}% used (${formatCurrency(b.spent)} of ${formatCurrency(b.amount)})`;
      });
      return `Here's your budget status:\n${lines.join("\n")}`;
    },
  },
  {
    name: "GOALS",
    keywords: ["goal", "goals", "saving", "emergency fund", "progress"],
    async handler(msg, userId) {
      const goalName = msg.includes("emergency fund") ? "Emergency Fund" : null;
      const res = await executeTool("getGoalProgress", { goalName }, userId);
      if (res.error) return "I had trouble checking your goals.";
      const goals = res.result?.goals || [];
      if (!goals.length) return "You don't have any active savings goals. You can set one up in the Goals page.";
      const lines = goals.map((g) => {
        const pct = Math.round((Number(g.current_saved_amount) / Number(g.target_amount)) * 100);
        return `• ${g.name}: ${pct}% complete (${formatCurrency(g.current_saved_amount)} of ${formatCurrency(g.target_amount)})`;
      });
      return `Here's your goal progress:\n${lines.join("\n")}`;
    },
  },
  {
    name: "OVERVIEW",
    keywords: ["overview", "summary", "financial", "balance", "income", "expense", "expenses", "month", "today", "how am i doing"],
    async handler(msg, userId) {
      const mStart = monthStart();
      const tStr = todayStr();
      const [sumRes, budRes] = await Promise.all([
        executeTool("getSpendingSummary", { startDate: mStart, endDate: tStr }, userId),
        executeTool("getBudgetStatus", {}, userId),
      ]);
      const parts = ["Here's your financial snapshot:"];
      if (!sumRes.error && sumRes.result) {
        const s = sumRes.result;
        parts.push(
          `  • Income: ${formatCurrency(s.totalIncome)}`,
          `  • Expenses: ${formatCurrency(s.totalExpenses)}`,
          `  • Balance: ${formatCurrency(s.currentBalance)}`,
          `  • Savings Rate: ${fmt(s.savingsRate)}%`
        );
      }
      if (!budRes.error && budRes.result?.budgets?.length) {
        const risky = budRes.result.budgets.filter((b) => Number(b.percentUsed) >= 0.8);
        if (risky.length) {
          parts.push("", "⚠️ Budgets to watch:");
          for (const b of risky) {
            parts.push(`  • ${b.name}: ${Math.round(Number(b.percentUsed) * 100)}% used`);
          }
        }
      }
      return parts.join("\n");
    },
  },
];

function normalize(msg) {
  return msg.toLowerCase().trim().replace(/[^\w\s]/g, "");
}

function getIntent(msg) {
  const cleaned = normalize(msg);
  for (const intent of intents) {
    if (intent.keywords.some((kw) => cleaned.includes(kw))) {
      return intent;
    }
  }
  return intents[intents.length - 1];
}

async function generateFallbackResponse(userMessage, userId) {
  const intent = getIntent(userMessage);
  return intent.handler(normalize(userMessage), userId);
}

export async function processMessage(userMessage, userId) {
  if (!ANTHROPIC_API_KEY) {
    return generateFallbackResponse(userMessage, userId);
  }

  const client = getClient();
  const systemPrompt = buildSystemPrompt();

  let messages = [{ role: "user", content: userMessage }];

  let finalText = null;
  let turnCount = 0;
  const MAX_TURNS = 10;

  while (turnCount < MAX_TURNS) {
    turnCount++;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
      tools: toolDefinitions,
    });

    const toolCalls = response.content.filter((b) => b.type === "tool_use");
    const textBlocks = response.content.filter((b) => b.type === "text");

    if (toolCalls.length === 0) {
      finalText = textBlocks.map((b) => b.text).join("\n");
      break;
    }

    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        const toolName = tc.name;
        const toolInput = tc.input;
        const result = await executeTool(toolName, toolInput, userId);
        if (result.error) {
          return {
            type: "tool_result",
            tool_use_id: tc.id,
            content: JSON.stringify({ error: result.error }),
          };
        }
        return {
          type: "tool_result",
          tool_use_id: tc.id,
          content: JSON.stringify(result.result),
        };
      })
    );

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  if (finalText === null && turnCount >= MAX_TURNS) {
    finalText =
      "I've gathered a lot of information but need more time to process. Could you please ask a more specific question?";
  }

  return finalText;
}
