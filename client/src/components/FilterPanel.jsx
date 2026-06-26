import { useState } from "react";
import DateRangePicker from "./DateRangePicker";

const PAYMENT_METHODS = ["cash", "credit", "debit", "upi"];

export default function FilterPanel({ filters, categories, accounts, onChange }) {
  const [open, setOpen] = useState(false);

  const toggleArray = (key, value) => {
    const arr = filters[key] || [];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    onChange({ [key]: next });
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg px-3 py-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {open ? " ▲" : " ▼"}
      </button>

      {open && (
        <div className="mt-3 p-4 border rounded-xl bg-white shadow-sm space-y-5">
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Type</label>
            <div className="flex gap-2">
              {["", "income", "expense"].map((t) => (
                <button
                  key={t}
                  onClick={() => onChange({ type: filters.type === t ? "" : t })}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    filters.type === t
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {t || "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleArray("categories", c.id)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    (filters.categories || []).includes(c.id)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Account</label>
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleArray("accounts", a.id)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    (filters.accounts || []).includes(a.id)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm}
                  onClick={() => toggleArray("paymentMethods", pm)}
                  className={`px-3 py-1 text-sm rounded-full border capitalize ${
                    (filters.paymentMethods || []).includes(pm)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Date Range</label>
            <DateRangePicker value={filters.dateRange} onChange={(dr) => onChange({ dateRange: dr })} />
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Min Amount</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => onChange({ minAmount: e.target.value })}
                placeholder="₹0"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Max Amount</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => onChange({ maxAmount: e.target.value })}
                placeholder="₹99999"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
