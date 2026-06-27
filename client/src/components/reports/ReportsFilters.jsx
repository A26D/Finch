import { useState } from "react";

export default function ReportsFilters({ filters, onApply }) {
  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  const [type, setType] = useState(filters.type || "");

  const handleApply = () => {
    const f = {};
    if (startDate) f.start_date = startDate;
    if (endDate) f.end_date = endDate;
    if (type) f.type = type;
    onApply(f);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setType("");
    onApply({});
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
        >
          <option value="">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <button
        onClick={handleApply}
        className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium"
      >
        Apply
      </button>
      <button
        onClick={handleClear}
        className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:text-gray-900"
      >
        Clear
      </button>
    </div>
  );
}
