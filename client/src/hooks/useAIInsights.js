import { useState, useEffect, useCallback } from "react";
import { getInsights, getDashboardSummary } from "../services/ai";

export function useAIInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getInsights();
      setInsights(data);
    } catch (err) {
      console.error("Failed to load AI insights:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { insights, loading, refetch: fetch };
}

export function useAIDashboardSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load AI dashboard summary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { summary, loading, refetch: fetch };
}
