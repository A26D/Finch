import SummaryCards from "../components/SummaryCards";
import DashboardCard from "../components/DashboardCard";
import TransactionList from "../components/TransactionList";
import ExpensePieChart from "../components/charts/ExpensePieChart";
import MonthlyBarChart from "../components/charts/MonthlyBarChart";
import IncomeExpenseLineChart from "../components/charts/IncomeExpenseLineChart";
import BudgetSummary from "../components/budgets/BudgetSummary";
import useDashboardData from "../hooks/useDashboardData";
import useAnalytics from "../hooks/useAnalytics";
import useBudgets from "../hooks/useBudgets";
import { COLORS } from "../utils/chartData";

const trendIcon = (direction) => {
  if (direction === "up") return "📈";
  if (direction === "down") return "📉";
  return "➡️";
};

export default function Dashboard() {
  const {
    loading,
    transactions,
    summaryCards,
    categoryData,
    monthlyExpenseData,
    incomeExpenseData,
    recentTransactions,
  } = useDashboardData();

  const analytics = useAnalytics(transactions);
  const {
    budgets,
    loading: budgetsLoading,
  } = useBudgets();

  if (loading || budgetsLoading) {
    return <div className="text-center py-10 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <SummaryCards {...summaryCards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensePieChart data={categoryData} />
        <MonthlyBarChart data={monthlyExpenseData} />
      </div>

      <IncomeExpenseLineChart data={incomeExpenseData} />

      <BudgetSummary budgets={budgets} />

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Financial Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="Avg Daily Spend"
            value={`₹${analytics.averageDailySpend.toFixed(2)}`}
            icon="📊"
            color="blue"
          />
          <DashboardCard
            title="Avg Monthly Spend"
            value={`₹${analytics.averageMonthlySpend.toFixed(2)}`}
            icon="📊"
            color="indigo"
          />
          <DashboardCard
            title="Largest Expense"
            value={
              analytics.largestExpense
                ? `₹${Math.abs(Number(analytics.largestExpense.amount)).toFixed(2)}`
                : "—"
            }
            subtitle={analytics.largestExpense?.description || ""}
            icon="🔻"
            color="red"
          />
          <DashboardCard
            title="Largest Income"
            value={
              analytics.largestIncome
                ? `₹${Number(analytics.largestIncome.amount).toFixed(2)}`
                : "—"
            }
            subtitle={analytics.largestIncome?.description || ""}
            icon="🔺"
            color="green"
          />
          <DashboardCard
            title="Savings Rate"
            value={`${analytics.monthlySavingsRate}%`}
            icon="💰"
            color="blue"
          />
          <DashboardCard
            title="Net Cash Flow"
            value={
              analytics.netCashFlow >= 0
                ? `+₹${analytics.netCashFlow.toFixed(2)}`
                : `-₹${Math.abs(analytics.netCashFlow).toFixed(2)}`
            }
            icon={analytics.netCashFlow >= 0 ? "✅" : "⚠️"}
            color={analytics.netCashFlow >= 0 ? "green" : "red"}
          />
          <DashboardCard
            title="Spending Trend"
            value={
              analytics.spendingTrend.direction === "stable"
                ? "Stable"
                : `${trendIcon(analytics.spendingTrend.direction)} ${Math.abs(analytics.spendingTrend.percent)}%`
            }
            icon="📉"
            color={analytics.spendingTrend.direction === "up" ? "red" : "green"}
          />
          <DashboardCard
            title="Income Trend"
            value={
              analytics.incomeTrend.direction === "stable"
                ? "Stable"
                : `${trendIcon(analytics.incomeTrend.direction)} ${Math.abs(analytics.incomeTrend.percent)}%`
            }
            icon="📈"
            color={analytics.incomeTrend.direction === "up" ? "green" : "red"}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Transactions</h2>
        <TransactionList transactions={recentTransactions} onEdit={() => {}} onDelete={() => {}} />
      </div>
    </div>
  );
}
