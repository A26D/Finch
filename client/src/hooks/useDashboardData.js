import { useState, useEffect, useMemo } from "react";
import { getTransactions } from "../services/transactions";
import { groupByCategory, groupByMonth, incomeVsExpense } from "../utils/chartData";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export default function useDashboardData() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions({ user_id: USER_ID, limit: 200 })
      .then(({ data }) => setTransactions(data.transactions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const summaryCards = useMemo(() => {
    let income = 0;
    let expenses = 0;

    for (const t of transactions) {
      const amount = Number(t.amount);
      if (amount >= 0) income += amount;
      else expenses += Math.abs(amount);
    }

    return {
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      balance: Math.round((income - expenses) * 100) / 100,
    };
  }, [transactions]);

  const categoryData = useMemo(() => groupByCategory(transactions), [transactions]);

  const monthlyExpenseData = useMemo(
    () => groupByMonth(transactions, "expense"),
    [transactions]
  );

  const incomeExpenseData = useMemo(() => incomeVsExpense(transactions), [transactions]);

  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  );

  return {
    loading,
    transactions,
    summaryCards,
    categoryData,
    monthlyExpenseData,
    incomeExpenseData,
    recentTransactions,
  };
}
