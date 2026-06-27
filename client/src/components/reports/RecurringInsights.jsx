import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import ChartCard from "../charts/ChartCard";
import { COLORS } from "../../utils/chartData";

export default function RecurringInsights({ data }) {
  if (!data) return null;

  const chartData = [
    { name: "Monthly Recurring", expenses: data.monthlyRecurringExpenses, income: data.monthlyRecurringIncome },
  ];

  return (
    <div className="space-y-4">
      <ChartCard title="Recurring vs Total Spend" isEmpty={false}>
        <div className="grid grid-cols-2 gap-4 text-center mb-4">
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Monthly Recurring Expenses</p>
            <p className="text-lg font-bold text-red-600">₹{data.monthlyRecurringExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Monthly Recurring Income</p>
            <p className="text-lg font-bold text-green-600">₹{data.monthlyRecurringIncome.toLocaleString()}</p>
          </div>
        </div>
        {data.ratio !== null && (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Recurring Expense Ratio</p>
            <p className="text-lg font-bold text-gray-900">{data.ratio}% of total expenses</p>
          </div>
        )}
      </ChartCard>

      {data.upcoming && data.upcoming.length > 0 && (
        <ChartCard title="Upcoming Recurring Bills" isEmpty={false}>
          <div className="space-y-2">
            {data.upcoming.map((bill) => (
              <div key={bill.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{bill.name}</p>
                  <p className="text-xs text-gray-500">
                    {bill.daysUntilDue <= 0 ? "Due today" : bill.daysUntilDue === 1 ? "Tomorrow" : `${bill.daysUntilDue} days`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-600">₹{bill.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* TODO(ai-forecasted-spending): Time-series model predicts next month's
           category-level spending based on historical patterns. */}
    </div>
  );
}
