import { Link } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";

const severityColors = {
  critical: "bg-red-100 border-red-400",
  warning: "bg-yellow-100 border-yellow-400",
  success: "bg-green-100 border-green-400",
  info: "bg-blue-100 border-blue-400",
};

export default function NotificationDropdown({ onClose }) {
  const { notifications, loading, markAllRead, markRead } = useNotifications({ limit: 5 });

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-3 border-l-4 text-sm ${
                severityColors[n.severity] || "bg-gray-50 border-gray-300"
              } ${n.read_at ? "opacity-60" : ""}`}
              onClick={() => {
                if (!n.read_at) markRead(n.id);
                onClose();
              }}
            >
              <p className="font-medium text-gray-900">{n.title}</p>
              <p className="text-gray-600 text-xs mt-1">{n.message}</p>
              <p className="text-gray-400 text-xs mt-1">
                {new Date(n.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
      <Link
        to="/notifications"
        onClick={onClose}
        className="block px-4 py-3 text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium border-t"
      >
        View all notifications
      </Link>
    </div>
  );
}
