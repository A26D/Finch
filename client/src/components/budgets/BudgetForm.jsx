import { useState, useEffect } from "react";
import BudgetCategoryPicker from "./BudgetCategoryPicker";

const initial = {
  name: "",
  amount: "",
  period: "monthly",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  alert_threshold: "0.8",
  strictness: "hard",
  category_ids: [],
};

export default function BudgetForm({ categories, initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        amount: String(Number(initialData.amount) || ""),
        period: initialData.period || "monthly",
        start_date: initialData.start_date?.slice(0, 10) || "",
        end_date: initialData.end_date?.slice(0, 10) || "",
        alert_threshold: String(Number(initialData.alert_threshold) || "0.8"),
        strictness: initialData.strictness || "hard",
        category_ids: initialData.categoryIds || [],
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
      period: form.period,
      start_date: form.start_date,
      end_date: form.end_date || null,
      alert_threshold: Number(form.alert_threshold),
      strictness: form.strictness,
      category_ids: form.category_ids,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {initialData ? "Edit Budget" : "Create Budget"}
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
            placeholder="Monthly Groceries"
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
            placeholder="5000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
          <select
            value={form.period}
            onChange={(e) => set("period", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alert Threshold</label>
          <select
            value={form.alert_threshold}
            onChange={(e) => set("alert_threshold", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          >
            <option value="0.5">50%</option>
            <option value="0.7">70%</option>
            <option value="0.8">80%</option>
            <option value="0.9">90%</option>
            <option value="1">100%</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Strictness</label>
          <div className="flex gap-2">
            {["hard", "soft"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("strictness", s)}
                className={`px-4 py-1.5 text-sm rounded-lg border capitalize ${
                  form.strictness === s
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories (leave empty = overall budget)
        </label>
        <BudgetCategoryPicker
          categories={categories}
          selected={form.category_ids}
          onChange={(ids) => set("category_ids", ids)}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:text-gray-900">
            Cancel
          </button>
        )}
        <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium">
          {initialData ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
