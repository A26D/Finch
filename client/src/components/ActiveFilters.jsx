const LABELS = {
  search: 'Search: "%s"',
  categories: "Category",
  accounts: "Account",
  type: 'Type: %s',
  paymentMethods: "Payment",
  dateRange: "Date Range",
  minAmount: "Min: ₹%s",
  maxAmount: "Max: ₹%s",
};

export default function ActiveFilters({ search, filters, onClearKey }) {
  const chips = [];

  if (search) {
    chips.push(
      <Chip key="search" label={`Search: "${search}"`} onRemove={() => onClearKey("search")} />
    );
  }

  for (const [key, val] of Object.entries(filters)) {
    if (Array.isArray(val) && val.length) {
      chips.push(
        <Chip key={key} label={LABELS[key] || key} onRemove={() => onClearKey(key)} />
      );
    } else if (key === "type" && val) {
      chips.push(
        <Chip key={key} label={`Type: ${val}`} onRemove={() => onClearKey(key)} />
      );
    } else if (key === "dateRange" && (val.start || val.end)) {
      const label = [val.start || "…", val.end || "…"].join(" – ");
      chips.push(<Chip key={key} label={`${label}`} onRemove={() => onClearKey(key)} />);
    } else if ((key === "minAmount" || key === "maxAmount") && val) {
      chips.push(
        <Chip key={key} label={LABELS[key].replace("%s", val)} onRemove={() => onClearKey(key)} />
      );
    }
  }

  if (!chips.length) return null;

  return <div className="flex flex-wrap gap-2">{chips}</div>;
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900 ml-0.5" aria-label="Remove filter">
        ✕
      </button>
    </span>
  );
}
