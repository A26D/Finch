import { useState, useEffect } from "react";

const initial = {
  name: "",
  amount: "",
  type: "expense",
  frequency: "monthly",
  interval_value: "1",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  category_id: "",
  account_id: "",
  payment_method: "",
  auto_create: true,
};

export default function RecurringForm({ categories, accounts, initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        amount: String(Number(initialData.amount) || ""),
        type: initialData.type || "expense",
        frequency: initialData.frequency || "monthly",
        interval_value: String(initialData.interval_value || "1"),
        start_date: initialData.start_date?.slice(0, 10) || "",
        end_date: initialData.end_date?.slice(0, 10) || "",
        category_id: initialData.category_id || "",
        account_id: initialData.account_id || "",
        payment_method: initialData.payment_method || "",
        auto_create: initialData.auto_create !== false,
      });
    } else {
      setForm(initial);
    }
  }, [initialData]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      amount: Number(form.amount),
      type: form.type,
      frequency: form.frequency,
      interval_value: Number(form.interval_value),
      start_date: form.start_date,
      end_date: form.end_date || null,
      category_id: form.category_id || null,
      account_id: form.account_id || null,
      payment_method: form.payment_method || null,
      auto_create: form.auto_create,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {initialData ? "Edit Recurring Transaction" : "Create Recurring Transaction"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            placeholder="Netflix Subscription"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            required
            min="0.01"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            placeholder="500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <div className="flex gap-2">
            {["expense", "income"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("type", t)}
                className={`px-4 py-1.5 text-sm rounded-lg border capitalize ${
                  form.type === t
                    ? t === "expense"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
          <select
            value={form.frequency}
            onChange={(e) => set("frequency", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Every (interval)
          </label>
          <input
            type="number"
            min="1"
            value={form.interval_value}
            onChange={(e) => set("interval_value", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <input
            type="text"
            value={form.payment_method}
            onChange={(e) => set("payment_method", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            placeholder="upi / card / bank_transfer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          />
        </div>

        {categories && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {accounts && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={form.account_id}
              onChange={(e) => set("account_id", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="">None</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto_create"
            checked={form.auto_create}
            onChange={(e) => set("auto_create", e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="auto_create" className="text-sm text-gray-700">
            Auto-create transactions when due
          </label>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:text-gray-900"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium"
        >
          {initialData ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
