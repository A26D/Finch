const toNum = (v) => Number(v);

export default function filterTransactions(transactions, { search, filters, sort }) {
  let result = [...transactions];

  // ── Search ──
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (t) =>
        (t.description || "").toLowerCase().includes(q) ||
        (t.category_name || "").toLowerCase().includes(q) ||
        (t.account_name || "").toLowerCase().includes(q) ||
        (t.payment_method || "").toLowerCase().includes(q)
    );
  }

  // ── Filters ──
  if (filters.categories?.length) {
    result = result.filter((t) => filters.categories.includes(t.category_id));
  }

  if (filters.accounts?.length) {
    result = result.filter((t) => filters.accounts.includes(t.account_id));
  }

  if (filters.type) {
    result = result.filter((t) => {
      const isExpense = toNum(t.amount) < 0;
      return filters.type === "expense" ? isExpense : !isExpense;
    });
  }

  if (filters.paymentMethods?.length) {
    result = result.filter((t) =>
      filters.paymentMethods.includes(t.payment_method)
    );
  }

  if (filters.dateRange?.start) {
    result = result.filter((t) => t.date >= filters.dateRange.start);
  }

  if (filters.dateRange?.end) {
    result = result.filter((t) => t.date <= filters.dateRange.end);
  }

  if (filters.minAmount) {
    const min = Math.abs(toNum(filters.minAmount));
    result = result.filter((t) => Math.abs(toNum(t.amount)) >= min);
  }

  if (filters.maxAmount) {
    const max = Math.abs(toNum(filters.maxAmount));
    result = result.filter((t) => Math.abs(toNum(t.amount)) <= max);
  }

  // ── Sort ──
  const field = sort?.field || "date";
  const dir = sort?.direction === "asc" ? 1 : -1;

  result.sort((a, b) => {
    let cmp = 0;
    if (field === "date") cmp = a.date.localeCompare(b.date);
    else if (field === "amount") cmp = toNum(a.amount) - toNum(b.amount);
    else if (field === "description")
      cmp = (a.description || "").localeCompare(b.description || "");
    return cmp * dir;
  });

  return result;
}
