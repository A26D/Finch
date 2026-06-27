import { useMemo } from "react";
import { calculateGoalProgress } from "../../utils/goalAnalytics";

export default function GoalSummary({ goals }) {
  const stats = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
    const totalSaved = goals.reduce((s, g) => s + Number(g.current_saved_amount), 0);
    const totalRemaining = goals.reduce((s, g) => s + Math.max(0, Number(g.target_amount) - Number(g.current_saved_amount)), 0);
    const completed = goals.filter((g) => g.status === "completed").length;
    const active = goals.filter((g) => g.status === "active").length;

    return {
      totalTarget: Math.round(totalTarget * 100) / 100,
      totalSaved: Math.round(totalSaved * 100) / 100,
      totalRemaining: Math.round(totalRemaining * 100) / 100,
      utilization: calculateGoalProgress(totalSaved, totalTarget),
      activeCount: active,
      completedCount: completed,
    };
  }, [goals]);

  if (!goals.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Goal Overview
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Total Target</p>
          <p className="text-lg font-bold text-gray-900">₹{stats.totalTarget.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Saved</p>
          <p className="text-lg font-bold text-green-600">₹{stats.totalSaved.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="text-lg font-bold text-amber-600">₹{stats.totalRemaining.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Overall Progress</p>
          <p className="text-lg font-bold text-gray-900">{stats.utilization}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Active / Completed</p>
          <p className="text-lg font-bold text-gray-900">{stats.activeCount} / {stats.completedCount}</p>
        </div>
      </div>
      {/* AI_INSIGHT_SLOT */}
      {/* Future: AI-generated insight sentence renders here.
           Example: "You're on track to hit your Emergency Fund goal by December."
           This slot is left intentionally empty in v1. */}
    </div>
  );
}
