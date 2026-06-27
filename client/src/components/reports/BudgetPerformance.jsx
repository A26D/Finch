export default function BudgetPerformance({ data }) {
  if (!data) return null;

  const cards = [
    { label: "Active Budgets", value: data.total, color: "text-gray-900" },
    { label: "Total Budgeted", value: `₹${data.totalBudgeted.toLocaleString()}`, color: "text-blue-600" },
    { label: "Total Spent", value: `₹${data.totalSpent.toLocaleString()}`, color: "text-red-600" },
    { label: "Remaining", value: `₹${data.totalRemaining.toLocaleString()}`, color: "text-green-600" },
    { label: "On Track", value: data.onTrack, color: "text-green-600" },
    { label: "Near Limit", value: data.warningCount, color: "text-amber-600" },
    { label: "Exceeded", value: data.exceededCount, color: "text-red-600" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Budget Performance
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 text-center">
        {cards.map((c) => (
          <div key={c.label}>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      {/* TODO(ai-budget-optimization): AI recommends reallocation of budget caps
           based on actual vs budgeted spending patterns. */}
    </div>
  );
}
