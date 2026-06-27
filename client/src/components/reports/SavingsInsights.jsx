import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import ChartCard from "../charts/ChartCard";
import { COLORS } from "../../utils/chartData";

export default function SavingsInsights({ cashFlow }) {
  const isEmpty = !cashFlow?.monthlyGrowth || !cashFlow.monthlyGrowth.length;

  return (
    <ChartCard title="Savings & Expense Growth" isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={cashFlow?.monthlyGrowth || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
          <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, undefined]} />
          <Line type="monotone" dataKey="growth" stroke={COLORS.savings} strokeWidth={2} dot={{ r: 3 }} name="Net Growth" />
        </LineChart>
      </ResponsiveContainer>
      {/* TODO(ai-monthly-summaries): NLP generates "You spent 15% less on dining out
           this month compared to your 3-month average." */}
    </ChartCard>
  );
}
