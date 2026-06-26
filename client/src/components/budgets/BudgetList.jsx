import BudgetCard from "./BudgetCard";

export default function BudgetList({ budgets, onEdit, onDelete }) {
  if (!budgets.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-1">No budgets yet</p>
        <p className="text-sm">Create your first budget to start tracking spending limits.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {budgets.map((b) => (
        <BudgetCard key={b.id} budget={b} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
