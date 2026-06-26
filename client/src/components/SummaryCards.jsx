import DashboardCard from "./DashboardCard";

export default function SummaryCards({ income, expenses, balance }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <DashboardCard title="Total Income" value={`₹${income.toFixed(2)}`} icon="📈" color="green" />
      <DashboardCard title="Total Expenses" value={`₹${expenses.toFixed(2)}`} icon="📉" color="red" />
      <DashboardCard title="Balance" value={`₹${balance.toFixed(2)}`} icon="💰" color="blue" />
    </div>
  );
}
