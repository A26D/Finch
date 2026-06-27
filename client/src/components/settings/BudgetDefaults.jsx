import SettingsSection from "./SettingsSection";
import SettingsCard from "./SettingsCard";

const PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const STRICTNESS = [
  { value: "soft", label: "Soft (warning only)" },
  { value: "hard", label: "Hard (prevent overspend)" },
];

export default function BudgetDefaults({ settings, onUpdate }) {
  return (
    <SettingsSection title="Budget Defaults" description="Default values when creating new budgets.">
      <SettingsCard label="Default Period" description="Budget cycle length.">
        <select
          value={settings.default_budget_period}
          onChange={(e) => onUpdate({ default_budget_period: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </SettingsCard>

      <SettingsCard label="Default Strictness" description="How strictly budgets are enforced.">
        <select
          value={settings.default_budget_strictness}
          onChange={(e) => onUpdate({ default_budget_strictness: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {STRICTNESS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </SettingsCard>

      <SettingsCard label="Alert Threshold" description="Spend % that triggers a warning notification.">
        <input
          type="range"
          min="0.5"
          max="1.0"
          step="0.05"
          value={settings.budget_alert_threshold}
          onChange={(e) => onUpdate({ budget_alert_threshold: parseFloat(e.target.value) })}
          className="w-32"
        />
        <span className="ml-2 text-sm text-gray-600">{Math.round(settings.budget_alert_threshold * 100)}%</span>
      </SettingsCard>
    </SettingsSection>
  );
}
