import { useMemo } from "react";
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateCurrentBalance,
  calculateAverageDailySpend,
  calculateAverageMonthlySpend,
  calculateLargestExpense,
  calculateLargestIncome,
  calculateTopCategories,
  calculateMonthlySavingsRate,
  calculateNetCashFlow,
  calculateSpendingTrend,
  calculateIncomeTrend,
} from "../utils/analytics";

export default function useAnalytics(transactions) {
  return useMemo(
    () => ({
      totalIncome: calculateTotalIncome(transactions),
      totalExpenses: calculateTotalExpenses(transactions),
      balance: calculateCurrentBalance(transactions),
      averageDailySpend: calculateAverageDailySpend(transactions),
      averageMonthlySpend: calculateAverageMonthlySpend(transactions),
      largestExpense: calculateLargestExpense(transactions),
      largestIncome: calculateLargestIncome(transactions),
      topCategories: calculateTopCategories(transactions),
      monthlySavingsRate: calculateMonthlySavingsRate(transactions),
      netCashFlow: calculateNetCashFlow(transactions),
      spendingTrend: calculateSpendingTrend(transactions),
      incomeTrend: calculateIncomeTrend(transactions),
    }),
    [transactions]
  );
}
