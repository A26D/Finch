import TransactionItem from "./TransactionItem";

export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (!transactions.length) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        No transactions yet. Add one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Description</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Amount</th>
            <th className="py-3 px-4">Payment</th>
            <th className="py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <TransactionItem key={t.id} transaction={t} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
