const OPTIONS = [
  { field: "date", direction: "desc", label: "Newest" },
  { field: "date", direction: "asc", label: "Oldest" },
  { field: "amount", direction: "desc", label: "Highest Amount" },
  { field: "amount", direction: "asc", label: "Lowest Amount" },
  { field: "description", direction: "asc", label: "A–Z" },
];

export default function SortDropdown({ value, onChange }) {
  const current = `${value.field}-${value.direction}`;

  const handleChange = (e) => {
    const [field, direction] = e.target.value.split("-");
    onChange({ field, direction });
  };

  return (
    <select
      value={current}
      onChange={handleChange}
      className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.label} value={`${opt.field}-${opt.direction}`}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
