import SettingsSection from "./SettingsSection";
import SettingsCard from "./SettingsCard";

export default function DashboardSettings({ settings, onUpdate }) {
  return (
    <SettingsSection title="Dashboard" description="Dashboard display preferences.">
      <SettingsCard label="Large Expense Threshold" description="Minimum amount to trigger a large-expense notification.">
        <input
          type="number"
          min="0"
          step="1000"
          value={settings.large_expense_threshold}
          onChange={(e) => onUpdate({ large_expense_threshold: parseFloat(e.target.value) || 10000 })}
          className="border rounded-lg px-3 py-1.5 text-sm w-28"
        />
      </SettingsCard>
    </SettingsSection>
  );
}
