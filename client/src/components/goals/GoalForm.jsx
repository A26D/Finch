import { useState, useEffect } from "react";

const initial = {
  name: "",
  target_amount: "",
  current_saved_amount: "0",
  target_date: "",
  priority: "medium",
};

export default function GoalForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        target_amount: String(Number(initialData.target_amount) || ""),
        current_saved_amount: String(Number(initialData.current_saved_amount) || "0"),
        target_date: initialData.target_date?.slice(0, 10) || "",
        priority: initialData.priority || "medium",
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
      target_amount: Number(form.target_amount),
      current_saved_amount: Number(form.current_saved_amount),
      target_date: form.target_date || null,
      priority: form.priority,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {initialData ? "Edit Goal" : "Create Goal"}
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
            placeholder="Emergency Fund"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount *</label>
          <input
            type="number"
            step="0.01"
            value={form.target_amount}
            onChange={(e) => set("target_amount", e.target.value)}
            required
            min="0.01"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            placeholder="100000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Saved</label>
          <input
            type="number"
            step="0.01"
            value={form.current_saved_amount}
            onChange={(e) => set("current_saved_amount", e.target.value)}
            min="0"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Date (optional)</label>
          <input
            type="date"
            value={form.target_date}
            onChange={(e) => set("target_date", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <div className="flex gap-2">
            {["low", "medium", "high"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("priority", p)}
                className={`px-4 py-1.5 text-sm rounded-lg border capitalize ${
                  form.priority === p
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
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
