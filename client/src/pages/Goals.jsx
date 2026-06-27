import { useState } from "react";
import GoalForm from "../components/goals/GoalForm";
import GoalList from "../components/goals/GoalList";
import GoalSummary from "../components/goals/GoalSummary";
import ContributeModal from "../components/goals/ContributeModal";
import useGoals from "../hooks/useGoals";

export default function Goals() {
  const { goals, loading, createGoal, updateGoal, deleteGoal, contributeToGoal, refetch } =
    useGoals();

  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [contributingGoal, setContributingGoal] = useState(null);

  const handleSubmit = async (data) => {
    if (editing) {
      await updateGoal(editing.id, data);
    } else {
      await createGoal(data);
    }
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (goal) => {
    setEditing(goal);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await deleteGoal(id);
  };

  const handleContribute = async (id, amount) => {
    await contributeToGoal(id, amount);
    setContributingGoal(null);
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium"
          >
            + New Goal
          </button>
        )}
      </div>

      <GoalSummary goals={goals} />

      {showForm && (
        <GoalForm
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
      )}

      <GoalList goals={goals} onEdit={handleEdit} onDelete={handleDelete} onContribute={setContributingGoal} />

      {contributingGoal && (
        <ContributeModal
          goal={contributingGoal}
          onSubmit={handleContribute}
          onCancel={() => setContributingGoal(null)}
        />
      )}
    </div>
  );
}
