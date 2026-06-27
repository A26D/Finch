const BAR_COLORS = {
  on_track: "bg-green-500",
  at_risk: "bg-amber-500",
  behind: "bg-orange-500",
  completed: "bg-blue-500",
};

export default function GoalProgress({ currentSaved, targetAmount, status }) {
  const pct = targetAmount > 0 ? Math.min((currentSaved / targetAmount) * 100, 100) : 0;
  const color = BAR_COLORS[status] || "bg-gray-500";

  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
