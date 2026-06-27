/**
 * AI Rules Engine
 *
 * Pure functions only — no DB, no Express, no React, no DOM.
 * Portable to React Native unchanged.
 *
 * Each rule takes a normalized financial context object and returns
 * an array of insight objects. Empty array means no insight detected.
 *
 * ── AI_HOOK: Future rule types ──
 *
 * TODO(ai-debt-optimization): Detect high-interest debt and recommend
 * avalanche/snowball payoff strategy.
 *
 * TODO(ai-investment-opportunity): Detect idle cash balances exceeding
 * 6 months of expenses and suggest investment.
 *
 * TODO(ai-tax-optimization): Detect deductible expense categories
 * and estimate tax impact.
 *
 * TODO(ai-subscription-audit): Detect unused subscriptions (zero
 * usage for 90+ days but still paying).
 *
 * TODO(ai-credit-score-impact): Estimate how spending patterns
 * affect credit utilization ratio.
 *
 * TODO(ai-retirement-readiness): Compare current savings rate to
 * age-based retirement benchmarks.
 *
 * TODO(ai-emergency-fund): Track months of expenses covered by
 * liquid savings and alert when below 3-month threshold.
 *
 * TODO(ai-spending-personality): Classify user as saver/spender/
 * investor based on transaction patterns over 90 days.
 */

const SEVERITY = { CRITICAL: "critical", HIGH: "high", MEDIUM: "medium", LOW: "low", POSITIVE: "positive" };

function toNum(v) {
  return Number(v) || 0;
}

function monthsBetween(d1, d2) {
  const start = new Date(d1);
  const end = new Date(d2);
  return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/**
 * Detect categories where current spending exceeds the 3-month average by more than 20%.
 */
export function detectOverspending(context) {
  const insights = [];
  const transactions = context.transactions || [];
  const threshold = 1.2;
  const now = new Date();

  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recent = transactions.filter((t) => new Date(t.date) >= threeMonthsAgo && toNum(t.amount) < 0);
  const older = transactions.filter((t) => new Date(t.date) < threeMonthsAgo && toNum(t.amount) < 0);

  const recentByCategory = {};
  for (const t of recent) {
    const cat = t.category_name || "Uncategorized";
    recentByCategory[cat] = (recentByCategory[cat] || 0) + Math.abs(toNum(t.amount));
  }

  const olderByCategory = {};
  for (const t of older) {
    const cat = t.category_name || "Uncategorized";
    olderByCategory[cat] = (olderByCategory[cat] || 0) + Math.abs(toNum(t.amount));
  }

  const recentMonths = Math.max(1, monthsBetween(threeMonthsAgo, now));
  const olderMonths = Math.max(1, monthsBetween(new Date(Math.min(...older.map((t) => new Date(t.date)))), threeMonthsAgo) || 1);

  for (const [cat, recentTotal] of Object.entries(recentByCategory)) {
    const olderTotal = olderByCategory[cat] || 0;
    const monthlyRecent = recentTotal / recentMonths;
    const monthlyOlder = olderTotal / olderMonths;

    if (monthlyOlder > 0 && monthlyRecent / monthlyOlder > threshold) {
      const ratio = Math.round((monthlyRecent / monthlyOlder) * 100);
      const excess = Math.round((monthlyRecent - monthlyOlder) * 100) / 100;
      insights.push({
        severity: SEVERITY.WARNING,
        category: "overspending",
        title: `${cat} spending is ${ratio}% above average`,
        explanation: `Your ${cat} spending has increased to ₹${Math.round(monthlyRecent)}/month, ${ratio}% above your ${Math.round(monthlyOlder)}/month average.`,
        recommendation: `Review your ${cat} expenses. Reducing by ₹${excess}/month would bring you back to your historical average.`,
        confidence: Math.min(90, 50 + Math.round((ratio - 100) / 2)),
        metric: { category: cat, currentMonthly: Math.round(monthlyRecent * 100) / 100, previousMonthly: Math.round(monthlyOlder * 100) / 100, changePercent: ratio - 100 },
      });
    }
  }

  return insights;
}

/**
 * Detect budgets at risk of exceeding their limit before the period ends.
 */
export function detectBudgetRisk(context) {
  const insights = [];
  const budgets = context.budgets || [];

  for (const b of budgets) {
    const pct = toNum(b.percentUsed);
    const threshold = toNum(b.alert_threshold) || 0.8;
    if (pct >= threshold && pct < 1) {
      const remaining = Math.round((toNum(b.amount) - toNum(b.spent)) * 100) / 100;
      const daysLeft = b.periodEnd ? Math.ceil((new Date(b.periodEnd) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
      insights.push({
        severity: pct >= 0.95 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
        category: "budget_risk",
        title: `"${b.name}" budget at ${Math.round(pct * 100)}%`,
        explanation: `You've used ${Math.round(pct * 100)}% of your "${b.name}" budget. ₹${remaining} remaining${daysLeft > 0 ? ` over ${daysLeft} days` : ""}.`,
        recommendation: daysLeft > 0 && remaining / daysLeft < 50
          ? `Reduce daily spending in ${b.name} to stay within budget. You have ₹${Math.round(remaining / daysLeft)}/day available.`
          : `Monitor ${b.name} spending closely for the rest of the period.`,
        confidence: 85,
        metric: { budgetId: b.id, budgetName: b.name, percentUsed: pct, remaining, daysLeft },
      });
    }
  }

  return insights;
}

/**
 * Detect goals that are behind schedule based on elapsed time vs progress.
 */
export function detectGoalDelay(context) {
  const insights = [];
  const goals = context.goals || [];

  for (const g of goals) {
    if (g.status !== "active" || !g.target_date) continue;
    const progress = toNum(g.progress);
    const createdDate = g.created_at ? new Date(g.created_at) : new Date();
    const targetDate = new Date(g.target_date);
    const now = new Date();

    const totalDays = Math.ceil((targetDate - createdDate) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24));
    const expectedProgress = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;

    if (totalDays > 0 && elapsedDays > totalDays * 0.3 && progress < expectedProgress * 0.8) {
      const gap = Math.round((expectedProgress - progress) * 100) / 100;
      const remaining = toNum(g.target_amount) - toNum(g.current_saved_amount);
      const daysLeft = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
      insights.push({
        severity: daysLeft < 30 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
        category: "goal_delay",
        title: `"${g.name}" goal is behind schedule`,
        explanation: `Your "${g.name}" goal is ${progress}% complete but should be at ${Math.round(expectedProgress)}%. ₹${Math.round(remaining)} remaining in ${daysLeft} days.`,
        recommendation: daysLeft > 0
          ? `Increase savings for "${g.name}" to ₹${Math.round(remaining / daysLeft)}/day to stay on track.`
          : `Consider extending the target date for "${g.name}" to a more realistic timeline.`,
        confidence: 80,
        metric: { goalId: g.id, goalName: g.name, progress, expectedProgress, remaining, daysLeft },
      });
    }
  }

  return insights;
}

/**
 * Detect recurring expenses that have grown month-over-month.
 */
export function detectRecurringGrowth(context) {
  const insights = [];
  const recurring = context.recurring || [];

  for (const r of recurring) {
    if (r.type !== "expense" || r.status !== "active") continue;
    const amount = toNum(r.amount);
    const prevAmount = toNum(r.previous_amount) || amount;

    if (prevAmount > 0 && amount > prevAmount) {
      const increase = Math.round((amount - prevAmount) * 100) / 100;
      const pct = Math.round((increase / prevAmount) * 100);
      insights.push({
        severity: pct > 20 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
        category: "recurring_growth",
        title: `"${r.name}" increased by ${pct}%`,
        explanation: `Your "${r.name}" subscription increased from ₹${prevAmount} to ₹${amount} (${pct}% increase).`,
        recommendation: `Review your "${r.name}" subscription. Contact provider to negotiate or consider alternatives.`,
        confidence: 85,
        metric: { recurringId: r.id, name: r.name, previousAmount: prevAmount, currentAmount: amount, changePercent: pct },
      });
    }
  }

  return insights;
}

/**
 * Detect opportunities to save more based on income-to-expense ratio.
 */
export function detectSavingsOpportunity(context) {
  const insights = [];
  const reports = context.reports;
  if (!reports) return insights;

  const income = toNum(reports.totalIncome);
  const expenses = toNum(reports.totalExpenses);
  if (income <= 0) return insights;

  const savingsRate = ((income - expenses) / income) * 100;
  const targetRate = 20;

  if (savingsRate < targetRate && savingsRate >= 0) {
    const gap = Math.round((income * (targetRate / 100) - (income - expenses)) * 100) / 100;
    const targetSavings = Math.round(income * (targetRate / 100) * 100) / 100;
    insights.push({
      severity: savingsRate < 5 ? SEVERITY.CRITICAL : SEVERITY.MEDIUM,
      category: "savings_opportunity",
      title: `Savings rate is ${Math.round(savingsRate)}%`,
      explanation: `You're saving ${Math.round(savingsRate)}% of your income. A 20% savings rate would mean ₹${targetSavings}/month.`,
      recommendation: gap > 0
        ? `Try to save an additional ₹${gap}/month by reducing discretionary spending or finding additional income sources.`
        : `Continue maintaining your current savings habits.`,
      confidence: 75,
      metric: { currentRate: Math.round(savingsRate * 100) / 100, targetRate, monthlyGap: gap },
    });
  }

  if (savingsRate >= targetRate) {
    insights.push({
      severity: SEVERITY.POSITIVE,
      category: "savings_opportunity",
      title: `Great savings rate of ${Math.round(savingsRate)}%`,
      explanation: `You're saving ${Math.round(savingsRate)}% of your income, which is above the recommended 20% target.`,
      recommendation: "Consider investing your surplus savings in a diversified portfolio for long-term growth.",
      confidence: 90,
      metric: { currentRate: Math.round(savingsRate * 100) / 100, targetRate },
    });
  }

  return insights;
}

/**
 * Detect budgets that are significantly under-utilized (< 30% used near period end).
 */
export function detectUnusedBudget(context) {
  const insights = [];
  const budgets = context.budgets || [];

  for (const b of budgets) {
    const pct = toNum(b.percentUsed);
    if (pct < 0.3 && b.periodEnd) {
      const daysLeft = Math.ceil((new Date(b.periodEnd) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        const unused = Math.round((toNum(b.amount) - toNum(b.spent)) * 100) / 100;
        insights.push({
          severity: SEVERITY.LOW,
          category: "unused_budget",
          title: `"${b.name}" budget is under-utilized`,
          explanation: `You've only used ${Math.round(pct * 100)}% of your "${b.name}" budget (₹${unused} remaining) with ${daysLeft} days left.`,
          recommendation: `Consider reallocating unused "${b.name}" budget to other categories or reducing the budget amount next period.`,
          confidence: 70,
          metric: { budgetId: b.id, budgetName: b.name, percentUsed: pct, unusedAmount: unused },
        });
      }
    }
  }

  return insights;
}

/**
 * Detect subscriptions that may be wasteful (high recurring cost relative to usage frequency).
 * Uses recurring transaction data only — no actual usage data available without external integration.
 */
export function detectSubscriptionWaste(context) {
  const insights = [];
  const recurring = context.recurring || [];
  const highThreshold = (context.settings?.large_expense_threshold || 10000) * 0.3;

  for (const r of recurring) {
    if (r.type !== "expense" || r.status !== "active") continue;
    const monthly = (() => {
      const amt = toNum(r.amount);
      const interval = r.interval_value || 1;
      switch (r.frequency) {
        case "daily": return (amt / interval) * 30.44;
        case "weekly": return (amt / (interval * 7)) * 30.44;
        case "monthly": return amt / interval;
        case "yearly": return amt / (interval * 12);
        default: return 0;
      }
    })();

    if (monthly >= highThreshold) {
      insights.push({
        severity: SEVERITY.MEDIUM,
        category: "subscription_waste",
        title: `"${r.name}" costs ₹${Math.round(monthly)}/month`,
        explanation: `Your "${r.name}" recurring expense is ₹${Math.round(monthly)}/month. Review if you're getting sufficient value.`,
        recommendation: `Audit your "${r.name}" subscription. Consider downgrading or cancelling if under-utilized.`,
        confidence: 60,
        metric: { recurringId: r.id, name: r.name, monthlyCost: Math.round(monthly * 100) / 100 },
      });
    }
  }

  return insights;
}

/**
 * Detect whether large expenses are becoming a trend (multiple large expenses in recent period).
 */
export function detectLargeExpenseTrend(context) {
  const insights = [];
  const transactions = context.transactions || [];
  const threshold = context.settings?.large_expense_threshold || 10000;
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const largeRecent = transactions.filter(
    (t) => new Date(t.date) >= threeMonthsAgo && Math.abs(toNum(t.amount)) >= threshold
  );

  if (largeRecent.length >= 3) {
    const total = largeRecent.reduce((s, t) => s + Math.abs(toNum(t.amount)), 0);
    insights.push({
      severity: SEVERITY.HIGH,
      category: "large_expense_trend",
      title: `${largeRecent.length} large expenses in 3 months`,
      explanation: `You've had ${largeRecent.length} expenses of ₹${threshold}+ in the last 3 months, totalling ₹${Math.round(total)}.`,
      recommendation: "Review your large purchases. Consider delaying non-essential expenses or setting a monthly large-expense budget.",
      confidence: 75,
      metric: { count: largeRecent.length, total, threshold, periodMonths: 3 },
    });
  }

  return insights;
}

/**
 * Detect a significant drop in income compared to the previous period.
 */
export function detectIncomeDrop(context) {
  const insights = [];
  const transactions = context.transactions || [];
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentIncome = transactions.filter((t) => new Date(t.date) >= threeMonthsAgo && toNum(t.amount) > 0);
  const prevIncome = transactions.filter((t) => new Date(t.date) >= sixMonthsAgo && new Date(t.date) < threeMonthsAgo && toNum(t.amount) > 0);

  const recentTotal = recentIncome.reduce((s, t) => s + toNum(t.amount), 0);
  const prevTotal = prevIncome.reduce((s, t) => s + toNum(t.amount), 0);

  if (prevTotal > 0 && recentTotal < prevTotal * 0.7) {
    const drop = Math.round((1 - recentTotal / prevTotal) * 100);
    insights.push({
      severity: SEVERITY.CRITICAL,
      category: "income_drop",
      title: `Income dropped ${drop}% in last 3 months`,
      explanation: `Your total income over the last 3 months (₹${Math.round(recentTotal)}) is ${drop}% lower than the previous 3 months (₹${Math.round(prevTotal)}).`,
      recommendation: "Review your income sources and consider diversifying. Temporarily reduce discretionary spending until income stabilizes.",
      confidence: 80,
      metric: { recentTotal: Math.round(recentTotal * 100) / 100, previousTotal: Math.round(prevTotal * 100) / 100, dropPercent: drop },
    });
  }

  return insights;
}

/**
 * Detect positive financial achievements.
 */
export function detectPositiveAchievements(context) {
  const insights = [];
  const reports = context.reports;
  const goals = context.goals || [];

  if (reports) {
    const income = toNum(reports.totalIncome);
    const expenses = toNum(reports.totalExpenses);
    if (income > 0 && expenses < income * 0.5) {
      insights.push({
        severity: SEVERITY.POSITIVE,
        category: "positive_achievement",
        title: "Expenses are under 50% of income",
        explanation: `Your expenses (₹${Math.round(expenses)}) are only ${Math.round((expenses / income) * 100)}% of your income (₹${Math.round(income)}).`,
        recommendation: "Excellent financial discipline! Consider investing the surplus for long-term wealth building.",
        confidence: 90,
        metric: { income: Math.round(income * 100) / 100, expenses: Math.round(expenses * 100) / 100, ratio: Math.round((expenses / income) * 100) },
      });
    }
  }

  const completedGoals = goals.filter((g) => g.status === "completed");
  if (completedGoals.length > 0) {
    insights.push({
      severity: SEVERITY.POSITIVE,
      category: "positive_achievement",
      title: `Completed ${completedGoals.length} goal${completedGoals.length > 1 ? "s" : ""}!`,
      explanation: `You've completed "${completedGoals[0].name}"${completedGoals.length > 1 ? ` and ${completedGoals.length - 1} other goal${completedGoals.length > 2 ? "s" : ""}` : ""}.`,
      recommendation: "Celebrate your progress and set a new financial goal to keep building momentum.",
      confidence: 95,
      metric: { completedCount: completedGoals.length, names: completedGoals.map((g) => g.name) },
    });
  }

  const onTrackGoals = goals.filter((g) => g.status === "active" && toNum(g.progress) >= 50);
  if (onTrackGoals.length > 0 && completedGoals.length === 0) {
    insights.push({
      severity: SEVERITY.POSITIVE,
      category: "positive_achievement",
      title: `${onTrackGoals.length} goal${onTrackGoals.length > 1 ? "s are" : " is"} more than halfway there`,
      explanation: `"${onTrackGoals[0].name}" is ${Math.round(toNum(onTrackGoals[0].progress))}% complete${onTrackGoals.length > 1 ? ` along with ${onTrackGoals.length - 1} other goal${onTrackGoals.length > 2 ? "s" : ""}` : ""}.`,
      recommendation: "Keep up the momentum! You're making great progress toward your savings goals.",
      confidence: 85,
      metric: { onTrackCount: onTrackGoals.length, names: onTrackGoals.map((g) => ({ name: g.name, progress: toNum(g.progress) })) },
    });
  }

  return insights;
}

/**
 * Run all rules against a financial context object.
 */
export function runAllRules(context) {
  return [
    ...detectOverspending(context),
    ...detectBudgetRisk(context),
    ...detectGoalDelay(context),
    ...detectRecurringGrowth(context),
    ...detectSavingsOpportunity(context),
    ...detectUnusedBudget(context),
    ...detectSubscriptionWaste(context),
    ...detectLargeExpenseTrend(context),
    ...detectIncomeDrop(context),
    ...detectPositiveAchievements(context),
  ];
}
