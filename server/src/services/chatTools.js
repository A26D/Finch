import { z } from "zod";
import pool from "../db.js";
import * as reportService from "./reportService.js";
import * as budgetService from "./budgetService.js";
import * as goalService from "./goalService.js";
import * as recurringService from "./recurringTransactionService.js";

// ── Parameter Validation Schemas ──

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalDateStr = dateStr.optional();

const spendingSummaryParams = z.object({
  startDate: dateStr,
  endDate: dateStr,
  type: z.enum(["income", "expense"]).optional(),
});

const categorySpendingParams = z.object({
  startDate: dateStr,
  endDate: dateStr,
  category: z.string().optional(),
});

const comparePeriodsParams = z.object({
  period1Start: dateStr,
  period1End: dateStr,
  period2Start: dateStr,
  period2End: dateStr,
  category: z.string().optional(),
});

const budgetStatusParams = z.object({
  budgetName: z.string().optional().nullable(),
});

const goalProgressParams = z.object({
  goalName: z.string().optional().nullable(),
});

const recurringExpensesParams = z.object({
  upcoming: z.boolean().optional().default(false),
});

const monthlyTrendParams = z.object({
  startDate: optionalDateStr,
  endDate: optionalDateStr,
});

const topMerchantsParams = z.object({
  startDate: dateStr,
  endDate: dateStr,
  limit: z.number().int().positive().max(50).optional().default(10),
});

const largestExpenseParams = z.object({
  startDate: dateStr,
  endDate: dateStr,
});

// ── Tool Definitions (Claude tool-use JSON schemas) ──

export const toolDefinitions = [
  {
    name: "getCurrentDate",
    description:
      "Returns today's date in YYYY-MM-DD format. Call this first to resolve relative date references like 'this month', 'last week', 'this year', etc. into concrete date ranges.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "getSpendingSummary",
    description:
      "Returns overall spending summary for a date range: total income, total expenses, current balance, savings rate, average daily/monthly spend, largest expense/income, active budgets and goals count.",
    input_schema: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format (inclusive)",
        },
        endDate: {
          type: "string",
          description: "End date in YYYY-MM-DD format (inclusive)",
        },
        type: {
          type: "string",
          enum: ["income", "expense"],
          description: "Optional: filter to only income or only expense transactions",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "getCategorySpending",
    description:
      "Returns spending broken down by category for a date range. Provides each category's name, amount, and percentage of total. Includes highest, lowest, and top 5 categories.",
    input_schema: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format (inclusive)",
        },
        endDate: {
          type: "string",
          description: "End date in YYYY-MM-DD format (inclusive)",
        },
        category: {
          type: "string",
          description:
            "Optional: filter to a specific category name (e.g. 'Food', 'Transport')",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "compareSpendingPeriods",
    description:
      "Compares spending between two time periods. Returns income, expenses, balance, and savings rate for each period, plus the absolute and percentage differences. Optionally filter to a specific category.",
    input_schema: {
      type: "object",
      properties: {
        period1Start: {
          type: "string",
          description: "First period start date in YYYY-MM-DD format",
        },
        period1End: {
          type: "string",
          description: "First period end date in YYYY-MM-DD format",
        },
        period2Start: {
          type: "string",
          description: "Second period start date in YYYY-MM-DD format",
        },
        period2End: {
          type: "string",
          description: "Second period end date in YYYY-MM-DD format",
        },
        category: {
          type: "string",
          description:
            "Optional category name to compare spending for a specific category only",
        },
      },
      required: ["period1Start", "period1End", "period2Start", "period2End"],
    },
  },
  {
    name: "getBudgetStatus",
    description:
      "Returns current period progress for all active budgets (or a specific one by name). Each budget shows: amount budgeted, spent, remaining, percent used, and the current period dates.",
    input_schema: {
      type: "object",
      properties: {
        budgetName: {
          type: "string",
          description:
            "Optional: name of a specific budget to check. If omitted, returns all active budgets.",
        },
      },
    },
  },
  {
    name: "getGoalProgress",
    description:
      "Returns progress on all active savings goals (or a specific one by name). Each goal shows: target amount, current saved, progress percentage, days remaining until deadline, and required monthly saving rate to meet the target.",
    input_schema: {
      type: "object",
      properties: {
        goalName: {
          type: "string",
          description:
            "Optional: name of a specific goal to check. If omitted, returns all active goals.",
        },
      },
    },
  },
  {
    name: "getRecurringExpenses",
    description:
      "Returns all active recurring expenses/income. Each item shows name, amount, frequency, next run date, and status. If upcoming is true, only items due within the next 7 days are returned.",
    input_schema: {
      type: "object",
      properties: {
        upcoming: {
          type: "boolean",
          description:
            "If true, only return recurring items due within the next 7 days",
        },
      },
    },
  },
  {
    name: "getMonthlyTrend",
    description:
      "Returns monthly income and expense totals over a date range. Each month shows income, expenses, and net amount. Useful for identifying spending patterns and trends over time.",
    input_schema: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format. Defaults to 12 months ago.",
        },
        endDate: {
          type: "string",
          description: "End date in YYYY-MM-DD format. Defaults to today.",
        },
      },
    },
  },
  {
    name: "getTopMerchants",
    description:
      "Returns the top merchants/descriptions by total spend for a date range. Each result shows the merchant name (from transaction description), total amount, number of transactions, and percentage of overall spend.",
    input_schema: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format (inclusive)",
        },
        endDate: {
          type: "string",
          description: "End date in YYYY-MM-DD format (inclusive)",
        },
        limit: {
          type: "number",
          description: "Number of top merchants to return (default 10, max 50)",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "getLargestExpense",
    description:
      "Returns the single largest expense transaction in a date range: amount, description, category name, and date.",
    input_schema: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format (inclusive)",
        },
        endDate: {
          type: "string",
          description: "End date in YYYY-MM-DD format (inclusive)",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
];

// ── Tool Execution ──

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultStartDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sevenDaysFromNow() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function executeGetCurrentDate(userId, params) {
  return { today: todayStr() };
}

async function executeGetSpendingSummary(userId, params) {
  const filters = { start_date: params.startDate, end_date: params.endDate };
  if (params.type) filters.type = params.type;
  return await reportService.getSummary(userId, filters);
}

async function executeGetCategorySpending(userId, params) {
  const filters = { start_date: params.startDate, end_date: params.endDate };
  const result = await reportService.getCategoryReport(userId, filters);

  if (params.category) {
    const filtered = (result.categories || []).filter(
      (c) => c.name?.toLowerCase() === params.category.toLowerCase()
    );
    return {
      ...result,
      categories: filtered,
      highest: filtered.length ? filtered.reduce((a, b) => (a.amount > b.amount ? a : b)) : null,
      lowest: filtered.length ? filtered.reduce((a, b) => (a.amount < b.amount ? a : b)) : null,
      total: filtered.reduce((s, c) => s + c.amount, 0),
    };
  }
  return result;
}

async function executeComparePeriods(userId, params) {
  const filters1 = { start_date: params.period1Start, end_date: params.period1End };
  const filters2 = { start_date: params.period2Start, end_date: params.period2End };

  const [period1, period2] = await Promise.all([
    reportService.getSummary(userId, filters1),
    reportService.getSummary(userId, filters2),
  ]);

  return {
    period1: { ...period1, label: `${params.period1Start} to ${params.period1End}` },
    period2: { ...period2, label: `${params.period2Start} to ${params.period2End}` },
    difference: {
      incomeChange: Math.round((period2.totalIncome - period1.totalIncome) * 100) / 100,
      expenseChange: Math.round((period2.totalExpenses - period1.totalExpenses) * 100) / 100,
      balanceChange: Math.round((period2.currentBalance - period1.currentBalance) * 100) / 100,
      incomePercent: period1.totalIncome
        ? Math.round(((period2.totalIncome - period1.totalIncome) / period1.totalIncome) * 10000) / 100
        : null,
      expensePercent: period1.totalExpenses
        ? Math.round(((period2.totalExpenses - period1.totalExpenses) / period1.totalExpenses) * 10000) / 100
        : null,
    },
  };
}

async function executeGetBudgetStatus(userId, params) {
  const budgets = await budgetService.getBudgetsWithProgress(userId, pool);
  if (params.budgetName) {
    const filtered = budgets.filter(
      (b) => b.name?.toLowerCase() === params.budgetName.toLowerCase()
    );
    return { budgets: filtered };
  }
  return { budgets };
}

async function executeGetGoalProgress(userId, params) {
  const goals = await goalService.getGoalsWithProgress(userId, pool);
  if (params.goalName) {
    const filtered = goals.filter(
      (g) => g.name?.toLowerCase() === params.goalName.toLowerCase()
    );
    return { goals: filtered };
  }
  return { goals };
}

async function executeGetRecurringExpenses(userId, params) {
  const items = await recurringService.getAllActive(userId, pool);
  if (params.upcoming) {
    const future = sevenDaysFromNow();
    const now = todayStr();
    const upcoming = items.filter((r) => {
      if (r.status !== "active") return false;
      return r.next_run_date >= now && r.next_run_date <= future;
    });
    return { recurringItems: upcoming };
  }
  return { recurringItems: items };
}

async function executeGetMonthlyTrend(userId, params) {
  const filters = {};
  if (params.startDate) filters.start_date = params.startDate;
  if (params.endDate) filters.end_date = params.endDate;
  if (!params.startDate && !params.endDate) {
    filters.start_date = defaultStartDate();
    filters.end_date = todayStr();
  }
  return await reportService.getMonthlyReport(userId, filters);
}

async function executeGetTopMerchants(userId, params) {
  const { rows } = await pool.query(
    `SELECT description AS merchant,
            COUNT(*) AS transaction_count,
            SUM(ABS(amount)) AS total_spend
     FROM transactions
     WHERE user_id = $1
       AND date >= $2
       AND date <= $3
       AND amount < 0
       AND description IS NOT NULL
       AND description != ''
     GROUP BY description
     ORDER BY total_spend DESC
     LIMIT $4`,
    [userId, params.startDate, params.endDate, params.limit]
  );

  const spendTotal = rows.reduce((s, r) => s + Number(r.total_spend), 0);

  return {
    merchants: rows.map((r) => ({
      merchant: r.merchant,
      totalSpend: Number(r.total_spend),
      transactionCount: Number(r.transaction_count),
      percentageOfTotal: spendTotal > 0
        ? Math.round((Number(r.total_spend) / spendTotal) * 10000) / 100
        : 0,
    })),
    totalSpend: spendTotal,
  };
}

async function executeGetLargestExpense(userId, params) {
  const { rows } = await pool.query(
    `SELECT t.*, c.name AS category_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
       AND t.amount < 0
       AND t.date >= $2
       AND t.date <= $3
     ORDER BY t.amount ASC
     LIMIT 1`,
    [userId, params.startDate, params.endDate]
  );

  if (rows.length === 0) {
    return { expense: null };
  }

  const t = rows[0];
  return {
    expense: {
      id: t.id,
      amount: Math.abs(Number(t.amount)),
      date: t.date,
      description: t.description,
      category: t.category_name,
    },
  };
}

// ── Dispatch Map ──

const toolParamSchemas = {
  getCurrentDate: z.object({}).strict(),
  getSpendingSummary: spendingSummaryParams,
  getCategorySpending: categorySpendingParams,
  comparePeriods: comparePeriodsParams,
  getBudgetStatus: budgetStatusParams,
  getGoalProgress: goalProgressParams,
  getRecurringExpenses: recurringExpensesParams,
  getMonthlyTrend: monthlyTrendParams,
  getTopMerchants: topMerchantsParams,
  getLargestExpense: largestExpenseParams,
};

const toolExecutors = {
  getCurrentDate: executeGetCurrentDate,
  getSpendingSummary: executeGetSpendingSummary,
  getCategorySpending: executeGetCategorySpending,
  comparePeriods: executeComparePeriods,
  getBudgetStatus: executeGetBudgetStatus,
  getGoalProgress: executeGetGoalProgress,
  getRecurringExpenses: executeGetRecurringExpenses,
  getMonthlyTrend: executeGetMonthlyTrend,
  getTopMerchants: executeGetTopMerchants,
  getLargestExpense: executeGetLargestExpense,
};

// ── Public API ──

export async function executeTool(toolName, toolInput, userId) {
  const schema = toolParamSchemas[toolName];
  if (!schema) {
    return { error: `Unknown tool: ${toolName}` };
  }

  const parsed = schema.safeParse(toolInput);
  if (!parsed.success) {
    return { error: `Invalid parameters for ${toolName}: ${parsed.error.message}` };
  }

  const executor = toolExecutors[toolName];
  if (!executor) {
    return { error: `No executor for tool: ${toolName}` };
  }

  try {
    const result = await executor(userId, parsed.data);
    return { result };
  } catch (err) {
    console.error(`Tool ${toolName} execution error:`, err);
    return { error: `Error executing ${toolName}: ${err.message}` };
  }
}
