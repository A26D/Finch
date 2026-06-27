import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getReportSummary,
  getMonthlyReport,
  getYearlyReport,
  getCategoryReport,
  getCashFlowReport,
  getBudgetReport,
  getGoalReport,
  getRecurringReport,
  exportReport,
} from "../services/reports";

export default function useReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [yearly, setYearly] = useState([]);
  const [categories, setCategories] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [budgets, setBudgets] = useState(null);
  const [goals, setGoals] = useState(null);
  const [recurring, setRecurring] = useState(null);

  const fetchAll = useCallback(async (filterOverrides) => {
    setLoading(true);
    setError(null);
    const activeFilters = filterOverrides || filters;
    try {
      const [
        sRes, mRes, yRes, cRes, cfRes, bRes, gRes, rRes,
      ] = await Promise.all([
        getReportSummary(),
        getMonthlyReport(activeFilters),
        getYearlyReport(activeFilters),
        getCategoryReport(activeFilters),
        getCashFlowReport(activeFilters),
        getBudgetReport(),
        getGoalReport(),
        getRecurringReport(),
      ]);
      setSummary(sRes.data);
      setMonthly(mRes.data);
      setYearly(yRes.data);
      setCategories(cRes.data);
      setCashFlow(cfRes.data);
      setBudgets(bRes.data);
      setGoals(gRes.data);
      setRecurring(rRes.data);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAll().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilters = useCallback(
    (newFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      fetchAll({ ...filters, ...newFilters }).catch(() => {});
    },
    [filters, fetchAll]
  );

  const handleExport = useCallback(
    async (format) => {
      const res = await exportReport(format, filters);
      if (format === "csv") {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = "expense-report.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const win = window.open();
        win.document.write(res.data);
        win.document.close();
        win.focus();
      }
    },
    [filters]
  );

  const isLoading = useMemo(() => loading, [loading]);

  return {
    loading: isLoading,
    error,
    filters,
    summary,
    monthly,
    yearly,
    categories,
    cashFlow,
    budgets,
    goals,
    recurring,
    updateFilters,
    exportReport: handleExport,
    refetch: fetchAll,
  };
}
