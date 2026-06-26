import { useMemo } from "react";
import BudgetProgress from "./BudgetProgress";
import {
  calculateBudgetProgress,
  calculateRemainingBudget,
  calculateDaysRemaining,
  calculateDailySafeSpend,
  calculateBudgetStatus,
  calculateProjectedOverspend,
} from "../../utils/budgetAnalytics";

const STATUS_STYLES = {
  safe: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-orange-100 text-orange-700",
  exceeded: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  safe: "Safe",
  warning: "Warning",
  critical: "Critical",
  exceeded: "Exceeded",
};

// TODO(ai-notifications): hook in AI-driven push notification triggers here
// e.g. if status === 'warning' and user hasn't adjusted in 3 days → push alert

export default function BudgetCard({ budget, onEdit, onDelete }) {
  const spent = Number(budget.spent);
  const amount = Number(budget.amount);
  const alertThreshold = Number(budget.alert_threshold);

  const progress = useMemo(() => calculateBudgetProgress(spent, amount), [spent, amount]);
  const remaining = useMemo(() => calculateRemainingBudget(spent, amount), [spent, amount]);
  const daysRemaining = useMemo(() => calculateDaysRemaining(budget.periodEnd), [budget.periodEnd]);
  const dailySafe = useMemo(
    () => calculateDailySafeSpend(remaining, daysRemaining),
    [remaining, daysRemaining]
  );
  const status = useMemo(() => calculateBudgetStatus(progress, alertThreshold), [progress, alertThreshold]);

  const isSoft = budget.strictness === "soft";

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{budget.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {budget.categories && budget.categories.length > 0 ? (
              budget.categories.map((c) => (
                <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {c.name}
                </span>
              ))
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Overall</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status]} ${
              isSoft ? "opacity-60" : ""
            }`}
            title={isSoft ? "Soft budget (informational)" : ""}
          >
            {STATUS_LABELS[status]}
          </span>
          <div className="flex gap-1">
            <button onClick={() => onEdit(budget)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
              Edit
            </button>
            <button onClick={() => onDelete(budget.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <BudgetProgress spent={spent} amount={amount} alertThreshold={alertThreshold} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Spent</p>
          <p className="font-medium text-gray-900">₹{spent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Remaining</p>
          <p className="font-medium text-gray-900">₹{remaining.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Budget</p>
          <p className="font-medium text-gray-900">₹{amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Used</p>
          <p className="font-medium text-gray-900">{progress}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 pt-1 border-t">
        <div>
          <span>{budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}</span>
          <span className="ml-2">
            {budget.periodStart} – {budget.periodEnd}
          </span>
        </div>
        <div className="text-right">
          {daysRemaining > 0 ? (
            <span>
              {daysRemaining}d left · ₹{dailySafe.toFixed(2)}/day safe
            </span>
          ) : (
            <span>Period ended</span>
          )}
        </div>
      </div>

      {status === "warning" && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
          ⚠ You've used {progress}% of your budget. {isSoft ? "(Soft budget — informational)" : ""}
        </p>
      )}
      {status === "critical" && (
        <p className="text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
          🔶 Budget exceeded! {isSoft ? "(Soft budget)" : "Consider adjusting your budget."}
        </p>
      )}
      {status === "exceeded" && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
          🔴 Significantly over budget!
        </p>
      )}
    </div>
  );
}
