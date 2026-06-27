import GoalCard from "./GoalCard";

export default function GoalList({ goals, onEdit, onDelete, onContribute }) {
  if (!goals.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-1">No goals yet</p>
        <p className="text-sm">Create your first savings goal to start tracking progress.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} onEdit={onEdit} onDelete={onDelete} onContribute={onContribute} />
      ))}
    </div>
  );
}
