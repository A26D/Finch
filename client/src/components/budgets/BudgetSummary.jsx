import { useMemo } from "react";
import { calculateBudgetProgress } from "../../utils/budgetAnalytics";

export default function BudgetSummary({ budgets }) {
  const stats = useMemo(() => {
    const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amount), 0);
    const totalSpent = budgets.reduce((s, b) => s + Number(b.spent), 0);
    const totalRemaining = budgets.reduce((s, b) => s + Number(b.remaining), 0);
    const atLimit = budgets.filter((b) => Number(b.percentUsed) >= Number(b.alert_threshold)).length;

    return {
      totalBudgeted: Math.round(totalBudgeted * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalRemaining: Math.round(totalRemaining * 100) / 100,
      utilization: calculateBudgetProgress(totalSpent, totalBudgeted),
      activeCount: budgets.length,
      atLimitCount: atLimit,
    };
  }, [budgets]);

  if (!budgets.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Budget Overview
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Total Budgeted</p>
          <p className="text-lg font-bold text-gray-900">₹{stats.totalBudgeted.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Spent</p>
          <p className="text-lg font-bold text-red-600">₹{stats.totalSpent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="text-lg font-bold text-green-600">₹{stats.totalRemaining.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Utilization</p>
          <p className="text-lg font-bold text-gray-900">{stats.utilization}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Active Budgets</p>
          <p className="text-lg font-bold text-gray-900">{stats.activeCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Near Limit</p>
          <p className="text-lg font-bold text-amber-600">{stats.atLimitCount}</p>
        </div>
      </div>
      {/* AI_INSIGHT_SLOT */}
      {/* Future: AI-generated insight sentence renders here.
           Example: "You're spending 15% less on Food this month compared to your 3-month average."
           This slot is left intentionally empty in v1. */}
    </div>
  );
}
