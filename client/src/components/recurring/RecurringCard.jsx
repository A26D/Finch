import { useMemo } from "react";

const TYPE_STYLES = {
  income: "text-green-600 bg-green-50",
  expense: "text-red-600 bg-red-50",
};

const FREQUENCY_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default function RecurringCard({ transaction, onEdit, onDelete, onPause, onResume }) {
  const daysUntilNext = useMemo(() => {
    if (!transaction.next_run_date) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const next = new Date(transaction.next_run_date);
    const diff = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [transaction.next_run_date]);

  const amount =
    transaction.type === "expense"
      ? -Math.abs(Number(transaction.amount))
      : Math.abs(Number(transaction.amount));

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{transaction.name}</h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              TYPE_STYLES[transaction.type]
            }`}
          >
            {transaction.type === "income" ? "Income" : "Expense"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
            {FREQUENCY_LABELS[transaction.frequency] || transaction.frequency}
          </span>
          <div className="flex gap-1">
            {transaction.status === "active" ? (
              <button
                onClick={() => onPause(transaction.id)}
                className="text-amber-600 hover:text-amber-800 text-xs font-medium"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={() => onResume(transaction.id)}
                className="text-green-600 hover:text-green-800 text-xs font-medium"
              >
                Resume
              </button>
            )}
            <button
              onClick={() => onEdit(transaction)}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(transaction.id)}
              className="text-red-600 hover:text-red-800 text-xs font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Amount</p>
          <p
            className={`font-medium ${
              amount >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {amount >= 0 ? "+" : ""}₹{Math.abs(amount).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Next Run</p>
          <p className="font-medium text-gray-900">
            {transaction.next_run_date || "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Last Run</p>
          <p className="font-medium text-gray-900">
            {transaction.last_run_date || "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Status</p>
          <p
            className={`font-medium capitalize ${
              transaction.status === "active" ? "text-green-600" : "text-amber-600"
            }`}
          >
            {transaction.status}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 pt-1 border-t">
        <div>
          {transaction.category_name && (
            <span className="mr-3">Category: {transaction.category_name}</span>
          )}
          {transaction.account_name && (
            <span>Account: {transaction.account_name}</span>
          )}
          {!transaction.category_name && !transaction.account_name && (
            <span>No category or account</span>
          )}
        </div>
        <div className="text-right">
          {daysUntilNext !== null && daysUntilNext > 0 ? (
            <span>Due in {daysUntilNext}d</span>
          ) : daysUntilNext === 0 ? (
            <span className="text-amber-600 font-medium">Due today</span>
          ) : daysUntilNext !== null && daysUntilNext < 0 ? (
            <span className="text-red-600 font-medium">Overdue by {Math.abs(daysUntilNext)}d</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
