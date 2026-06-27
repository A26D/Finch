import SettingsSection from "./SettingsSection";
import SettingsCard from "./SettingsCard";

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function GoalDefaults({ settings, onUpdate }) {
  return (
    <SettingsSection title="Goal Defaults" description="Default values when creating new savings goals.">
      <SettingsCard label="Default Priority" description="Default priority for new goals.">
        <select
          value={settings.default_goal_priority}
          onChange={(e) => onUpdate({ default_goal_priority: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </SettingsCard>

      <SettingsCard label="Alert Days" description="Days before target date to warn if behind schedule.">
        <input
          type="number"
          min="1"
          max="90"
          value={settings.goal_alert_days}
          onChange={(e) => onUpdate({ goal_alert_days: parseInt(e.target.value, 10) || 14 })}
          className="border rounded-lg px-3 py-1.5 text-sm w-20"
        />
      </SettingsCard>
    </SettingsSection>
  );
}
