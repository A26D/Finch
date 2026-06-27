export default function ReportSummary({ summary }) {
  if (!summary) return null;

  const cards = [
    { label: "Total Income", value: `₹${summary.totalIncome.toLocaleString()}`, color: "green" },
    { label: "Total Expenses", value: `₹${summary.totalExpenses.toLocaleString()}`, color: "red" },
    { label: "Current Balance", value: `₹${summary.currentBalance.toLocaleString()}`, color: "blue" },
    { label: "Savings Rate", value: `${summary.savingsRate}%`, color: "purple" },
    { label: "Avg Daily Spend", value: `₹${summary.averageDailySpend.toFixed(2)}`, color: "amber" },
    { label: "Avg Monthly Spend", value: `₹${summary.averageMonthlySpend.toFixed(2)}`, color: "amber" },
    { label: "Recurring /mo (exps)", value: `₹${summary.recurringMonthlyExpenses.toFixed(2)}`, color: "red" },
    { label: "Recurring /mo (inc)", value: `₹${summary.recurringMonthlyIncome.toFixed(2)}`, color: "green" },
    { label: "Active Budgets", value: summary.activeBudgets, color: "blue" },
    { label: "Active Goals", value: summary.activeGoals, color: "blue" },
  ];

  const colorClasses = {
    green: "text-green-600",
    red: "text-red-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    amber: "text-amber-600",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 mb-1">{c.label}</p>
          <p className={`text-lg font-bold ${colorClasses[c.color]}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
