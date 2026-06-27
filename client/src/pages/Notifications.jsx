import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";

const severityStyles = {
  critical: "bg-red-50 border-red-400 text-red-800",
  warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
  success: "bg-green-50 border-green-400 text-green-800",
  info: "bg-blue-50 border-blue-400 text-blue-800",
};

const severityBadge = {
  critical: "bg-red-100 text-red-800",
  warning: "bg-yellow-100 text-yellow-800",
  success: "bg-green-100 text-green-800",
  info: "bg-blue-100 text-blue-800",
};

export default function Notifications() {
  const [filter, setFilter] = useState("");
  const { notifications, total, loading, markRead, markAllRead, archive } =
    useNotifications(filter ? { type: filter } : {});

  const filtered = filter
    ? notifications
    : notifications;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border rounded px-3 py-1.5 text-gray-700"
          >
            <option value="">All types</option>
            <option value="budget_exceeded">Budget Exceeded</option>
            <option value="budget_warning">Budget Warning</option>
            <option value="goal_completed">Goal Completed</option>
            <option value="goal_behind">Goal Behind</option>
            <option value="recurring_due">Recurring Due</option>
            <option value="large_expense">Large Expense</option>
          </select>
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 border rounded"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">{total} notification{total !== 1 ? "s" : ""}</p>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {filter ? "No notifications for this type." : "No notifications yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`border-l-4 rounded p-4 ${severityStyles[n.severity] || "bg-white border-gray-300"} ${
                n.read_at ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        severityBadge[n.severity] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {n.severity}
                    </span>
                    {!n.read_at && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!n.read_at && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => archive(n.id)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
