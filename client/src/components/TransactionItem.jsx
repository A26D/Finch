export default function TransactionItem({ transaction, onEdit, onDelete }) {
  const isExpense = Number(transaction.amount) < 0;

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4 text-sm text-gray-600">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="py-3 px-4 text-sm text-gray-900">{transaction.description || "—"}</td>
      <td className="py-3 px-4 text-sm">
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
          {transaction.category_name || "Uncategorized"}
        </span>
      </td>
      <td className={`py-3 px-4 text-sm font-medium ${isExpense ? "text-red-600" : "text-green-600"}`}>
        {isExpense ? `-₹${Math.abs(Number(transaction.amount)).toFixed(2)}` : `+₹${Number(transaction.amount).toFixed(2)}`}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 capitalize">{transaction.payment_method || "—"}</td>
      <td className="py-3 px-4 text-sm">
        <div className="flex gap-2">
          <button onClick={() => onEdit(transaction)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
            Edit
          </button>
          <button onClick={() => onDelete(transaction.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
