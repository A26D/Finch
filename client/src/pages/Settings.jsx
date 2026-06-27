import { useState } from "react";
import useSettings from "../hooks/useSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import RegionalSettings from "../components/settings/RegionalSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import BudgetDefaults from "../components/settings/BudgetDefaults";
import GoalDefaults from "../components/settings/GoalDefaults";
import DashboardSettings from "../components/settings/DashboardSettings";
import ResetSettingsDialog from "../components/settings/ResetSettingsDialog";

function TabsNav({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-white rounded-lg shadow-sm border p-1 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
            active === tab.key
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const TABS = [
  { key: "appearance", label: "Appearance" },
  { key: "regional", label: "Regional" },
  { key: "notifications", label: "Notifications" },
  { key: "budgets", label: "Budget Defaults" },
  { key: "goals", label: "Goal Defaults" },
  { key: "dashboard", label: "Dashboard" },
];

export default function Settings() {
  const { settings, loading, saving, updateSettings, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("appearance");
  const [toast, setToast] = useState(null);

  const handleUpdate = async (data) => {
    try {
      await updateSettings(data);
      setToast({ type: "success", message: "Settings saved" });
    } catch {
      setToast({ type: "error", message: "Failed to save settings" });
    }
    setTimeout(() => setToast(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-gray-500">Failed to load settings.</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your application preferences.</p>
        </div>
        <ResetSettingsDialog onConfirm={resetSettings} saving={saving} />
      </div>

      <TabsNav tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="space-y-6">
        {activeTab === "appearance" && (
          <AppearanceSettings settings={settings} onUpdate={handleUpdate} />
        )}
        {activeTab === "regional" && (
          <RegionalSettings settings={settings} onUpdate={handleUpdate} />
        )}
        {activeTab === "notifications" && (
          <NotificationSettings settings={settings} onUpdate={handleUpdate} />
        )}
        {activeTab === "budgets" && (
          <BudgetDefaults settings={settings} onUpdate={handleUpdate} />
        )}
        {activeTab === "goals" && (
          <GoalDefaults settings={settings} onUpdate={handleUpdate} />
        )}
        {activeTab === "dashboard" && (
          <DashboardSettings settings={settings} onUpdate={handleUpdate} />
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
