import { useState } from "react";
import BudgetForm from "../components/budgets/BudgetForm";
import BudgetList from "../components/budgets/BudgetList";
import BudgetSummary from "../components/budgets/BudgetSummary";
import useBudgets from "../hooks/useBudgets";

export default function Budgets() {
  const { budgets, categories, accounts, loading, createBudget, updateBudget, deleteBudget } =
    useBudgets();

  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data) => {
    if (editing) {
      await updateBudget(editing.id, data);
    } else {
      await createBudget(data);
    }
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (budget) => {
    setEditing(budget);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await deleteBudget(id);
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium"
          >
            + New Budget
          </button>
        )}
      </div>

      <BudgetSummary budgets={budgets} />

      {showForm && (
        <BudgetForm
          categories={categories}
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
      )}

      <BudgetList budgets={budgets} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
