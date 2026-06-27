import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import ChartCard from "../charts/ChartCard";
import { COLORS } from "../../utils/chartData";

export default function YearlyReport({ data }) {
  const isEmpty = !data || !data.length;

  return (
    <ChartCard title="Yearly Income vs Expenses" isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
          <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, undefined]} />
          <Legend verticalAlign="bottom" height={36} />
          <Bar dataKey="income" fill={COLORS.income} name="Income" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill={COLORS.expense} name="Expenses" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
