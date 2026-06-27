/**
 * Notification Detector
 *
 * Pure functions that compare old vs new dashboard snapshots
 * and return notification payloads for any threshold crossings.
 *
 * All functions accept an optional `settings` parameter from user_settings
 * so thresholds are user-configurable rather than hardcoded.
 *
 * ── Future AI Extension Points ──
 *
 * TODO(ai-budget-optimization): Detect budgets that are consistently
 * under-utilized and suggest reallocation.
 *
 * TODO(ai-goal-recommendations): Detect savings patterns that could
 * support new goals.
 *
 * TODO(ai-subscription-alerts): Detect recurring charges that
 * increased in amount.
 *
 * TODO(ai-forecast-warnings): Compare projected vs actual spend
 * and warn if on track to exceed budget.
 *
 * TODO(ai-monthly-summaries): Generate natural language summaries
 * from the diff between snapshots.
 *
 * TODO(ai-financial-health-score): Trigger notification when health
 * score crosses thresholds.
 *
 * TODO(ai-anomaly-detection): Detect unusual spending patterns not
 * captured by simple thresholds.
 *
 * TODO(ai-preferred-savings-target): Read savings target from user_settings
 * and alert when偏离.
 *
 * TODO(ai-spending-style): Use spending style preference to tune
 * notification frequency.
 */

export function detectBudgetNotifications(oldSnap, newSnap, settings) {
  const notifications = [];
  const oldBudgets = (oldSnap?.budgets || []).reduce((map, b) => {
    map[b.id] = b;
    return map;
  }, {});
  const newBudgets = newSnap?.budgets || [];
  const defaultThreshold = settings?.budget_alert_threshold ?? 0.8;

  for (const nb of newBudgets) {
    const ob = oldBudgets[nb.id];
    const oldPct = ob ? Number(ob.percentUsed) : 0;
    const newPct = Number(nb.percentUsed);
    const threshold = Number(nb.alert_threshold) || defaultThreshold;

    if (oldPct < 1 && newPct >= 1) {
      notifications.push({
        type: "budget_exceeded",
        title: "Budget Exceeded",
        message: `You've exceeded your "${nb.name}" budget.`,
        severity: "critical",
        metadata: { budget_id: nb.id, budget_name: nb.name, percentUsed: newPct, threshold },
      });
    } else if (oldPct < threshold && newPct >= threshold && newPct < 1) {
      notifications.push({
        type: "budget_warning",
        title: "Budget Warning",
        message: `Your "${nb.name}" budget has reached ${Math.round(newPct * 100)}% of its limit.`,
        severity: "warning",
        metadata: { budget_id: nb.id, budget_name: nb.name, percentUsed: newPct, threshold },
      });
    }
  }

  return notifications;
}

export function detectGoalNotifications(oldSnap, newSnap, settings) {
  const notifications = [];
  const oldGoals = (oldSnap?.goals || []).reduce((map, g) => {
    map[g.id] = g;
    return map;
  }, {});
  const newGoals = newSnap?.goals || [];
  const alertDays = settings?.goal_alert_days ?? 30;
  const minProgress = 50;

  for (const ng of newGoals) {
    const og = oldGoals[ng.id];
    const oldStatus = og?.status || "active";
    const newStatus = ng.status;

    if (oldStatus !== "completed" && newStatus === "completed") {
      notifications.push({
        type: "goal_completed",
        title: "Goal Completed",
        message: `Congratulations! You've completed your "${ng.name}" goal.`,
        severity: "success",
        metadata: { goal_id: ng.id, goal_name: ng.name, target_amount: ng.target_amount },
      });
    }

    if (ng.target_date && newStatus === "active") {
      const progress = Number(ng.progress);
      const daysUntilTarget = Math.ceil(
        (new Date(ng.target_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilTarget > 0 && daysUntilTarget <= alertDays && progress < minProgress) {
        const alreadySent = og && Number(og.progress) === progress;
        if (!alreadySent) {
          notifications.push({
            type: "goal_behind",
            title: "Goal Behind Schedule",
            message: `Your "${ng.name}" goal is only ${progress}% complete with ${daysUntilTarget} days remaining.`,
            severity: "warning",
            metadata: { goal_id: ng.id, goal_name: ng.name, progress, daysUntilTarget },
          });
        }
      }
    }
  }

  return notifications;
}

export function detectRecurringNotifications(oldSnap, newSnap, settings) {
  const notifications = [];
  const oldRecurring = new Set(
    (oldSnap?.recurringDue || []).map((r) => r.id)
  );
  const newRecurring = newSnap?.recurringDue || [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const nr of newRecurring) {
    const dueDate = new Date(nr.nextRunDate);
    const isDueTomorrow =
      dueDate.getFullYear() === tomorrow.getFullYear() &&
      dueDate.getMonth() === tomorrow.getMonth() &&
      dueDate.getDate() === tomorrow.getDate();

    if (isDueTomorrow && !oldRecurring.has(nr.id)) {
      notifications.push({
        type: "recurring_due",
        title: "Recurring Bill Due Tomorrow",
        message: `"${nr.name}" of ₹${Number(nr.amount).toFixed(2)} is due tomorrow.`,
        severity: "info",
        metadata: { recurring_id: nr.id, recurring_name: nr.name, amount: nr.amount, dueDate: nr.nextRunDate },
      });
    }
  }

  return notifications;
}

export function detectLargeExpenseNotifications(oldSnap, newSnap, settings) {
  const notifications = [];
  const threshold = settings?.large_expense_threshold ?? 10000;

  const oldIds = new Set((oldSnap?.recentLargeExpenses || []).map((e) => e.id));
  const newExpenses = newSnap?.recentLargeExpenses || [];

  for (const ne of newExpenses) {
    const amount = Math.abs(Number(ne.amount));
    if (amount >= threshold && !oldIds.has(ne.id)) {
      notifications.push({
        type: "large_expense",
        title: "Large Expense Detected",
        message: `A ${ne.category_name ? `"${ne.category_name}" ` : ""}expense of ₹${amount.toFixed(2)} was recorded.`,
        severity: "info",
        metadata: { transaction_id: ne.id, amount, category: ne.category_name, description: ne.description },
      });
    }
  }

  return notifications;
}

export function detectAll(oldSnap, newSnap, settings) {
  return [
    ...detectBudgetNotifications(oldSnap, newSnap, settings),
    ...detectGoalNotifications(oldSnap, newSnap, settings),
    ...detectRecurringNotifications(oldSnap, newSnap, settings),
    ...detectLargeExpenseNotifications(oldSnap, newSnap, settings),
  ];
}
