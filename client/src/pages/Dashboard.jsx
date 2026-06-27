import SummaryCards from "../components/SummaryCards";
import DashboardCard from "../components/DashboardCard";
import TransactionList from "../components/TransactionList";
import ExpensePieChart from "../components/charts/ExpensePieChart";
import MonthlyBarChart from "../components/charts/MonthlyBarChart";
import IncomeExpenseLineChart from "../components/charts/IncomeExpenseLineChart";
import BudgetSummary from "../components/budgets/BudgetSummary";
import GoalSummary from "../components/goals/GoalSummary";
import UpcomingBills from "../components/recurring/UpcomingBills";
import useDashboardData from "../hooks/useDashboardData";
import useAnalytics from "../hooks/useAnalytics";
import useBudgets from "../hooks/useBudgets";
import useGoals from "../hooks/useGoals";
import useRecurringTransactions from "../hooks/useRecurringTransactions";
import { useAIDashboardSummary } from "../hooks/useAIInsights";
import AIInsightBanner from "../components/ai/AIInsightBanner";
import { useUnreadCount } from "../hooks/useNotifications";
import { Link } from "react-router-dom";
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

  const {
    goals,
    loading: goalsLoading,
  } = useGoals();

  const {
    recurringTransactions,
    loading: recurringLoading,
  } = useRecurringTransactions();

  const { summary: aiSummary, loading: aiLoading } = useAIDashboardSummary();
  const { unread } = useUnreadCount();

  if (loading || budgetsLoading || goalsLoading || recurringLoading) {
    return <div className="text-center py-10 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/notifications"
          className="relative flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>

      <AIInsightBanner insights={aiSummary} loading={aiLoading} />

      <SummaryCards {...summaryCards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensePieChart data={categoryData} />
        <MonthlyBarChart data={monthlyExpenseData} />
      </div>

      <IncomeExpenseLineChart data={incomeExpenseData} />

      <BudgetSummary budgets={budgets} />

      <GoalSummary goals={goals} />

      <UpcomingBills recurringTransactions={recurringTransactions} />

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

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Transactions</h2>
        <Link
          to="/reports"
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
        >
          View Detailed Reports →
        </Link>
      </div>
      <TransactionList transactions={recentTransactions} onEdit={() => {}} onDelete={() => {}} />
    </div>
  );
}
