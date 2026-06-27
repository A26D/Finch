import SettingsSection from "./SettingsSection";
import SettingsCard from "./SettingsCard";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function AppearanceSettings({ settings, onUpdate }) {
  return (
    <SettingsSection title="Appearance" description="Customize the look and feel.">
      <SettingsCard label="Theme" description="Choose light, dark, or system default.">
        <select
          value={settings.theme}
          onChange={(e) => onUpdate({ theme: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </SettingsCard>

      <SettingsCard label="Dashboard Compact Mode" description="Show rounded values with fewer decimals.">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.dashboard_compact_mode}
            onChange={(e) => onUpdate({ dashboard_compact_mode: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
        </label>
      </SettingsCard>
    </SettingsSection>
  );
}
