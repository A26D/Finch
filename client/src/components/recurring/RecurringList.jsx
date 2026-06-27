import RecurringCard from "./RecurringCard";

export default function RecurringList({ transactions, onEdit, onDelete, onPause, onResume }) {
  if (!transactions.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-1">No recurring transactions yet</p>
        <p className="text-sm">Create your first recurring transaction to automate bill tracking.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {transactions.map((t) => (
        <RecurringCard
          key={t.id}
          transaction={t}
          onEdit={onEdit}
          onDelete={onDelete}
          onPause={onPause}
          onResume={onResume}
        />
      ))}
    </div>
  );
}
