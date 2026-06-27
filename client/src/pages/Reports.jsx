import useReports from "../hooks/useReports";
import ReportSummary from "../components/reports/ReportSummary";
import MonthlyReport from "../components/reports/MonthlyReport";
import YearlyReport from "../components/reports/YearlyReport";
import CategoryBreakdown from "../components/reports/CategoryBreakdown";
import CashFlowChart from "../components/reports/CashFlowChart";
import BudgetPerformance from "../components/reports/BudgetPerformance";
import GoalPerformance from "../components/reports/GoalPerformance";
import SavingsInsights from "../components/reports/SavingsInsights";
import RecurringInsights from "../components/reports/RecurringInsights";
import TopCategories from "../components/reports/TopCategories";
import ExportButtons from "../components/reports/ExportButtons";
import ReportsFilters from "../components/reports/ReportsFilters";
import { useAIInsights } from "../hooks/useAIInsights";
import AIReportSummary from "../components/ai/AIReportSummary";

export default function Reports() {
  const { insights: aiInsights, loading: aiLoading } = useAIInsights();

  const {
    loading,
    error,
    summary,
    monthly,
    yearly,
    categories,
    cashFlow,
    budgets,
    goals,
    recurring,
    updateFilters,
    exportReport,
  } = useReports();

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading…</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Insights</h1>
        <ExportButtons onExport={exportReport} />
      </div>

      <AIReportSummary insights={aiInsights} loading={aiLoading} />

      <ReportsFilters filters={{}} onApply={updateFilters} />

      <ReportSummary summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyReport data={monthly} />
        <YearlyReport data={yearly} />
      </div>

      <CategoryBreakdown data={categories} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart data={cashFlow} />
        <SavingsInsights cashFlow={cashFlow} />
      </div>

      <BudgetPerformance data={budgets} />
      <GoalPerformance data={goals} />
      <RecurringInsights data={recurring} />
      <TopCategories data={categories} />

      {/* TODO(ai-financial-health-score): Composite score combining savings rate,
           budget adherence, goal progress, debt ratio, and recurring coverage. */}
      {/* TODO(ai-natural-language-reports): LLM generates paragraph summaries of
           any report section on demand. */}
    </div>
  );
}
