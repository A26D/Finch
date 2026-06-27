import AIInsightCard from "./AIInsightCard";

export default function AIInsightBanner({ insights, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (!insights || !insights.insights || insights.insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <h2 className="text-lg font-semibold text-gray-900">AI Financial Insights</h2>
      </div>

      <p className="text-sm text-gray-600 bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-100">
        {insights.headline}
      </p>

      <div className="space-y-2">
        {insights.insights.slice(0, 3).map((insight, i) => (
          <AIInsightCard key={i} insight={insight} compact />
        ))}
      </div>
    </div>
  );
}
