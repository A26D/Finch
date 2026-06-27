import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import ChartCard from "../charts/ChartCard";
import { COLORS } from "../../utils/chartData";

export default function CashFlowChart({ data }) {
  const isEmpty = !data || !data.monthly || !data.monthly.length;

  return (
    <div className="space-y-6">
      <ChartCard title="Cash Flow (Net Worth Trend)" isEmpty={isEmpty}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data?.netWorth || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Net Worth"]} />
            <Legend verticalAlign="bottom" height={36} />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke={COLORS.balance}
              fill={COLORS.balance}
              fillOpacity={0.1}
              strokeWidth={2}
              name="Net Worth"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Growth" isEmpty={!data?.monthlyGrowth?.length}>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data?.monthlyGrowth || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, undefined]} />
            <Legend verticalAlign="bottom" height={36} />
            <Area type="monotone" dataKey="growth" stroke={COLORS.savings} fill={COLORS.savings} fillOpacity={0.1} strokeWidth={2} name="Net Growth" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
