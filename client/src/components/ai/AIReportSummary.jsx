import AIInsightCard from "./AIInsightCard";

export default function AIReportSummary({ insights, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  if (!insights || !insights.insights || insights.insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <p className="text-sm text-gray-700 bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-100 leading-relaxed">
          {insights.headline}
        </p>

        <div className="space-y-3">
          {insights.insights.map((insight, i) => (
            <AIInsightCard key={i} insight={insight} />
          ))}
        </div>

        {insights.recommendations && insights.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommended Actions</h3>
            <ul className="space-y-2">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-indigo-500">→</span>
                  <span>
                    <span className="font-medium">
                      {rec.priority === "high" ? "⚠️ " : "💡 "}
                    </span>
                    {rec.action}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
