import { useState, useEffect } from "react";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "../services/transactions";
import { getAccounts } from "../services/accounts";
import { getCategories } from "../services/categories";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [txRes, acctRes, catRes] = await Promise.all([
      getTransactions({ user_id: USER_ID, limit: 100 }),
      getAccounts(USER_ID),
      getCategories(USER_ID),
    ]);
    setTransactions(txRes.data.transactions);
    setAccounts(acctRes.data);
    setCategories(catRes.data);
  };

  useEffect(() => {
    fetchAll().catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (data) => {
    await createTransaction({ ...data, user_id: USER_ID });
    setEditing(null);
    await fetchAll();
  };

  const handleUpdate = async (data) => {
    await updateTransaction(editing.id, data);
    setEditing(null);
    await fetchAll();
  };

  const handleDelete = async (id) => {
    await deleteTransaction(id);
    await fetchAll();
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>

      <TransactionForm
        categories={categories}
        accounts={accounts}
        initialData={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      <TransactionList
        transactions={transactions}
        onEdit={setEditing}
        onDelete={handleDelete}
      />
    </div>
  );
}
