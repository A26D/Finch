export default function BudgetCategoryPicker({ categories, selected, onChange }) {
  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((v) => v !== id)
      : [...selected, id];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => toggle(c.id)}
          className={`px-3 py-1 text-sm rounded-full border ${
            selected.includes(c.id)
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
