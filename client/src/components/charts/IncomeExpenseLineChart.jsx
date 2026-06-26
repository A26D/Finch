import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import ChartCard from "./ChartCard";
import { COLORS } from "../../utils/chartData";

export default function IncomeExpenseLineChart({ data }) {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartCard title="Income vs Expenses" isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
          <Tooltip
            formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
          />
          <Legend verticalAlign="bottom" height={36} />
          <Line
            type="monotone"
            dataKey="income"
            stroke={COLORS.income}
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Income"
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke={COLORS.expense}
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Expenses"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
