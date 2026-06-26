import { useState, useEffect } from "react";
import SummaryCards from "../components/SummaryCards";
import TransactionList from "../components/TransactionList";
import { getTransactions } from "../services/transactions";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions({ user_id: USER_ID, limit: 5 })
      .then(({ data }) => setTransactions(data.transactions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <SummaryCards transactions={transactions} />
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Transactions</h2>
        <TransactionList transactions={transactions} onEdit={() => {}} onDelete={() => {}} />
      </div>
    </div>
  );
}
