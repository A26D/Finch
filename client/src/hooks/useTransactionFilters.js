import { useState, useMemo, useCallback } from "react";
import filterTransactions from "../utils/filterTransactions";

const INITIAL_FILTERS = {
  categories: [],
  accounts: [],
  type: "",
  paymentMethods: [],
  dateRange: { start: "", end: "" },
  minAmount: "",
  maxAmount: "",
};

const INITIAL_SORT = { field: "date", direction: "desc" };

export default function useTransactionFilters(transactions) {
  const [search, setSearch] = useState("");
  const [filters, setFiltersState] = useState(INITIAL_FILTERS);
  const [sort, setSortState] = useState(INITIAL_SORT);

  const setFilters = useCallback((partial) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setSort = useCallback((partial) => {
    setSortState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setFiltersState(INITIAL_FILTERS);
    setSortState(INITIAL_SORT);
  }, []);

  const clearFilterKey = useCallback((key) => {
    if (key === "search") {
      setSearch("");
      return;
    }
    setFiltersState((prev) => {
      const val = prev[key];
      if (Array.isArray(val)) return { ...prev, [key]: [] };
      if (typeof val === "object" && val !== null)
        return { ...prev, [key]: { start: "", end: "" } };
      return { ...prev, [key]: "" };
    });
  }, []);

  const config = { search, filters, sort };

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, config),
    [transactions, search, filters, sort]
  );

  return {
    search,
    filters,
    sort,
    filteredTransactions,
    setSearch,
    setFilters,
    setSort,
    clearFilters,
    clearFilterKey,
  };
}
