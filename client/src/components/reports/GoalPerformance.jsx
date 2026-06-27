export default function GoalPerformance({ data }) {
  if (!data) return null;

  const cards = [
    { label: "Total Goals", value: data.total, color: "text-gray-900" },
    { label: "Completed", value: data.completed, color: "text-green-600" },
    { label: "Completion Rate", value: `${data.completionRate}%`, color: "text-blue-600" },
    { label: "Total Target", value: `₹${data.totalTarget.toLocaleString()}`, color: "text-gray-900" },
    { label: "Total Saved", value: `₹${data.totalSaved.toLocaleString()}`, color: "text-green-600" },
    { label: "Remaining", value: `₹${data.totalRemaining.toLocaleString()}`, color: "text-amber-600" },
    { label: "Avg Completion", value: `${data.averageCompletion}%`, color: "text-purple-600" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Goal Performance
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 text-center">
        {cards.map((c) => (
          <div key={c.label}>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      {/* TODO(ai-goal-recommendations): AI suggests target amounts and timelines
           based on income patterns and spending history. */}
    </div>
  );
}
