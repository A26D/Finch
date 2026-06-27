import { useMemo } from "react";
import GoalProgress from "./GoalProgress";
import {
  calculateGoalProgress,
  calculateRemainingAmount,
  calculateDaysRemaining,
  calculateRequiredDailySaving,
  calculateGoalStatus,
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
} from "../../utils/goalAnalytics";

const PRIORITY_LABELS = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRIORITY_COLORS = {
  high: "text-red-600 bg-red-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-gray-600 bg-gray-100",
};

export default function GoalCard({ goal, onEdit, onDelete, onContribute }) {
  const currentSaved = Number(goal.current_saved_amount);
  const targetAmount = Number(goal.target_amount);

  const progress = useMemo(() => calculateGoalProgress(currentSaved, targetAmount), [currentSaved, targetAmount]);
  const remaining = useMemo(() => calculateRemainingAmount(currentSaved, targetAmount), [currentSaved, targetAmount]);
  const daysRemaining = useMemo(() => calculateDaysRemaining(goal.target_date), [goal.target_date]);
  const requiredDaily = useMemo(
    () => calculateRequiredDailySaving(remaining, daysRemaining),
    [remaining, daysRemaining]
  );
  const status = useMemo(
    () => calculateGoalStatus(progress, daysRemaining, requiredDaily),
    [progress, daysRemaining, requiredDaily]
  );

  const statusColor = GOAL_STATUS_COLORS[status] || "gray";
  const statusLabel = GOAL_STATUS_LABELS[status] || status;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{goal.name}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[goal.priority]}`}>
            {PRIORITY_LABELS[goal.priority]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize`}
            style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
          >
            {statusLabel}
          </span>
          <div className="flex gap-1">
            <button onClick={() => onContribute(goal)} className="text-green-600 hover:text-green-800 text-xs font-medium">
              Contribute
            </button>
            <button onClick={() => onEdit(goal)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
              Edit
            </button>
            <button onClick={() => onDelete(goal.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
              Delete
            </button>
          </div>
        </div>
      </div>

      <GoalProgress currentSaved={currentSaved} targetAmount={targetAmount} status={status} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Saved</p>
          <p className="font-medium text-gray-900">₹{currentSaved.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Target</p>
          <p className="font-medium text-gray-900">₹{targetAmount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Remaining</p>
          <p className="font-medium text-gray-900">₹{remaining.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Progress</p>
          <p className="font-medium text-gray-900">{progress}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 pt-1 border-t">
        <div>
          {goal.target_date ? (
            <span>Target: {goal.target_date}</span>
          ) : (
            <span>No target date</span>
          )}
        </div>
        <div className="text-right">
          {daysRemaining !== null && daysRemaining > 0 ? (
            <span>
              {daysRemaining}d left · ₹{requiredDaily?.toFixed(2) || "0.00"}/day needed
            </span>
          ) : daysRemaining === 0 ? (
            <span>Due today</span>
          ) : daysRemaining !== null ? (
            <span>Past due</span>
          ) : null}
        </div>
      </div>

      {status === "at_risk" && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
          ⚠ Goal is at risk. Consider increasing your contributions.
        </p>
      )}
      {status === "behind" && (
        <p className="text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
          🔶 Behind schedule. You may need to adjust your target or accelerate savings.
        </p>
      )}
      {status === "completed" && (
        <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
          ✅ Goal completed! Great job!
        </p>
      )}
    </div>
  );
}
