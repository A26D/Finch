import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ChartCard from "../charts/ChartCard";
import { CATEGORY_COLORS } from "../../utils/chartData";

export default function CategoryBreakdown({ data }) {
  const isEmpty = !data || !data.categories || !data.categories.length;

  return (
    <ChartCard title="Category Breakdown" isEmpty={isEmpty}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data?.categories || []}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {(data?.categories || []).map((_, i) => (
                <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 text-sm">
          {data?.categories?.slice(0, 8).map((cat) => (
            <div key={cat.name} className="flex justify-between items-center">
              <span className="text-gray-700">{cat.name}</span>
              <span className="font-medium text-gray-900">
                ₹{cat.amount.toLocaleString()} ({cat.percentage}%)
              </span>
            </div>
          ))}
          {data?.highest && (
            <div className="pt-3 border-t text-xs text-gray-500">
              Highest: <span className="font-medium text-gray-700">{data.highest.name}</span> — ₹{data.highest.amount.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  );
}
