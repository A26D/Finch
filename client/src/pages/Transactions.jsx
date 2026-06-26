import { useState, useEffect } from "react";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import SortDropdown from "../components/SortDropdown";
import ActiveFilters from "../components/ActiveFilters";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "../services/transactions";
import { getAccounts } from "../services/accounts";
import { getCategories } from "../services/categories";
import useTransactionFilters from "../hooks/useTransactionFilters";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    search,
    filters,
    sort,
    filteredTransactions,
    setSearch,
    setFilters,
    setSort,
    clearFilters,
    clearFilterKey,
  } = useTransactionFilters(transactions);

  const fetchAll = async () => {
    const [txRes, acctRes, catRes] = await Promise.all([
      getTransactions({ user_id: USER_ID, limit: 200 }),
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

  const handleSubmit = async (data) => {
    if (editing) {
      await updateTransaction(editing.id, data);
    } else {
      await createTransaction({ ...data, user_id: USER_ID });
    }
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
        onSubmit={handleSubmit}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <FilterPanel
          filters={filters}
          categories={categories}
          accounts={accounts}
          onChange={setFilters}
        />
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      <ActiveFilters
        search={search}
        filters={filters}
        onClearKey={clearFilterKey}
      />

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 space-y-3">
          <p>No transactions match your filters.</p>
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <TransactionList
          transactions={filteredTransactions}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      )}

      <p className="text-sm text-gray-400 text-right">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </p>
    </div>
  );
}
