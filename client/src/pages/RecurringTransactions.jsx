import { useState } from "react";
import RecurringForm from "../components/recurring/RecurringForm";
import RecurringList from "../components/recurring/RecurringList";
import useRecurringTransactions from "../hooks/useRecurringTransactions";

export default function RecurringTransactions() {
  const {
    recurringTransactions,
    loading,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    pauseRecurringTransaction,
    resumeRecurringTransaction,
  } = useRecurringTransactions();

  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data) => {
    if (editing) {
      await updateRecurringTransaction(editing.id, data);
    } else {
      await createRecurringTransaction(data);
    }
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (tx) => {
    setEditing(tx);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await deleteRecurringTransaction(id);
  };

  const handlePause = async (id) => {
    await pauseRecurringTransaction(id);
  };

  const handleResume = async (id) => {
    await resumeRecurringTransaction(id);
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recurring Transactions</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium"
          >
            + New Recurring
          </button>
        )}
      </div>

      {showForm && (
        <RecurringForm
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
      )}

      <RecurringList
        transactions={recurringTransactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPause={handlePause}
        onResume={handleResume}
      />
    </div>
  );
}
