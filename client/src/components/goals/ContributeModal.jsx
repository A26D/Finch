import { useState } from "react";

export default function ContributeModal({ goal, onSubmit, onCancel }) {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onSubmit(goal.id, Number(amount));
  };

  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_saved_amount));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Contribute to {goal.name}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Remaining: ₹{remaining.toLocaleString()}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              placeholder="Enter amount"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium"
            >
              Contribute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
