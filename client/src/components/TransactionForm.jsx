import { useState, useEffect } from "react";

const initial = {
  amount: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  payment_method: "",
  category_id: "",
  account_id: "",
};

export default function TransactionForm({ categories, accounts, initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (initialData) {
      setForm({
        amount: String(Math.abs(Number(initialData.amount))),
        description: initialData.description || "",
        date: initialData.date?.slice(0, 10) || "",
        payment_method: initialData.payment_method || "",
        category_id: initialData.category_id || "",
        account_id: initialData.account_id || "",
      });
    } else {
      setForm(initial);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isIncome = form.category_id
      ? categories.find((c) => c.id === form.category_id)?.type === "income"
      : false;
    const amount = isIncome ? Math.abs(Number(form.amount)) : -Math.abs(Number(form.amount));

    onSubmit({
      amount,
      description: form.description || null,
      date: form.date,
      payment_method: form.payment_method || null,
      category_id: form.category_id || null,
      account_id: form.account_id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {initialData ? "Edit Transaction" : "Add Transaction"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
          >
            <option value="">— Select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
          <select
            name="account_id"
            value={form.account_id}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
          >
            <option value="">— Select —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            placeholder="Coffee at Starbucks"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            name="payment_method"
            value={form.payment_method}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
          >
            <option value="">— Select —</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit Card</option>
            <option value="debit">Debit Card</option>
            <option value="upi">UPI</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg">
            Cancel
          </button>
        )}
        <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">
          {initialData ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
