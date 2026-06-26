import { calculateBudgetStatus } from "../../utils/budgetAnalytics";

const BAR_COLORS = {
  safe: "bg-green-500",
  warning: "bg-amber-500",
  critical: "bg-orange-500",
  exceeded: "bg-red-500",
};

export default function BudgetProgress({ spent, amount, alertThreshold = 0.8 }) {
  const pct = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;
  const status = calculateBudgetStatus(pct, alertThreshold);

  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${BAR_COLORS[status]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
