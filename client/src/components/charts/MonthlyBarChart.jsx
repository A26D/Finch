import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import ChartCard from "./ChartCard";
import { COLORS } from "../../utils/chartData";

export default function MonthlyBarChart({ data }) {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartCard title="Monthly Expenses" isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `₹${v}`}
          />
          <Tooltip
            formatter={(value) => [`₹${value.toLocaleString()}`, "Expenses"]}
          />
          <Bar dataKey="amount" fill={COLORS.expense} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
