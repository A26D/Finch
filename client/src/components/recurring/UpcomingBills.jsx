import { useMemo } from "react";
import { calculateUpcomingBills } from "../../utils/recurringAnalytics";

export default function UpcomingBills({ recurringTransactions }) {
  const upcoming = useMemo(
    () => calculateUpcomingBills(recurringTransactions, 5),
    [recurringTransactions]
  );

  if (!upcoming.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Upcoming Bills
      </h3>
      <div className="space-y-2">
        {upcoming.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{bill.name}</p>
              <p className="text-xs text-gray-500">
                {bill.daysUntilDue <= 0
                  ? "Due today"
                  : bill.daysUntilDue === 1
                  ? "Tomorrow"
                  : `${bill.daysUntilDue} days`}
              </p>
            </div>
            <span className="text-sm font-semibold text-red-600">
              ₹{bill.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      {/* AI_INSIGHT_SLOT */}
      {/* Future: AI-generated insight sentence renders here.
           Example: "Your upcoming bills total ₹3,500 this week."
           This slot is left intentionally empty in v1. */}
    </div>
  );
}
