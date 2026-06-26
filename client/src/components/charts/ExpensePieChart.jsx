import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ChartCard from "./ChartCard";
import { COLORS } from "../../utils/chartData";

const renderLabel = ({ name, percent }) =>
  `${(percent * 100).toFixed(0)}%`;

export default function ExpensePieChart({ data }) {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartCard title="Expenses by Category" isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={renderLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
