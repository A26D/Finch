const SEVERITY_COLORS = {
  critical: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-800" },
  high: { bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", text: "text-orange-800" },
  medium: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500", text: "text-yellow-800" },
  low: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-800" },
  positive: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", text: "text-green-800" },
};

export default function AIInsightCard({ insight, compact }) {
  const colors = SEVERITY_COLORS[insight.severity] || SEVERITY_COLORS.medium;
  const confidenceLabel = insight.confidence >= 80 ? "High" : insight.confidence >= 50 ? "Medium" : "Low";

  if (compact) {
    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
        <div className="min-w-0">
          <p className={`text-sm font-medium ${colors.text}`}>{insight.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{insight.explanation}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${colors.bg} ${colors.border} p-4`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${colors.text}`}>{insight.title}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/60 text-gray-500 border">
              {insight.severity}
            </span>
            <span className="text-xs text-gray-400">{confidenceLabel} confidence</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{insight.explanation}</p>
          {insight.recommendation && (
            <div className="mt-2 text-sm text-indigo-700 bg-indigo-50 rounded-md px-3 py-2 border border-indigo-100">
              💡 {insight.recommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
