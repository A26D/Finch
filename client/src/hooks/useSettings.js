import { useState, useEffect, useCallback } from "react";
import { getSettings, updateSettings, resetSettings } from "../services/settings";

export default function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const { data } = await getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleUpdate = useCallback(async (data) => {
    setSaving(true);
    try {
      const { data: updated } = await updateSettings(data);
      setSettings(updated);
    } catch (err) {
      console.error("Failed to update settings:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const handleReset = useCallback(async () => {
    setSaving(true);
    try {
      const { data: defaults } = await resetSettings();
      setSettings(defaults);
    } catch (err) {
      console.error("Failed to reset settings:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, updateSettings: handleUpdate, resetSettings: handleReset, refetch: fetch };
}
