import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import ChartCard from "../charts/ChartCard";
import { COLORS } from "../../utils/chartData";

export default function TopCategories({ data }) {
  const isEmpty = !data?.topCategories || !data.topCategories.length;

  return (
    <ChartCard title="Top Spending Categories" isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data?.topCategories || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
          <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
          <Bar dataKey="amount" fill={COLORS.expense} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {/* TODO(ai-category-anomaly): Flags categories where current-month spend
           deviates significantly from the rolling 6-month average. */}
    </ChartCard>
  );
}
