import SettingsSection from "./SettingsSection";
import SettingsCard from "./SettingsCard";

const CURRENCIES = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
];

const LOCALES = [
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const NUMBER_FORMATS = [
  { value: "1,234.56", label: "1,234.56" },
  { value: "1 234,56", label: "1 234,56" },
  { value: "1.234,56", label: "1.234,56" },
];

export default function RegionalSettings({ settings, onUpdate }) {
  return (
    <SettingsSection title="Regional" description="Currency, date, and number preferences.">
      <SettingsCard label="Currency" description="Default currency for all amounts.">
        <select
          value={settings.currency}
          onChange={(e) => onUpdate({ currency: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </SettingsCard>

      <SettingsCard label="Locale" description="Regional formatting conventions.">
        <select
          value={settings.locale}
          onChange={(e) => onUpdate({ locale: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {LOCALES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </SettingsCard>

      <SettingsCard label="Timezone" description="Your local timezone.">
        <select
          value={settings.timezone}
          onChange={(e) => onUpdate({ timezone: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </SettingsCard>

      <SettingsCard label="First Day of Week" description="Start of the week for reports.">
        <select
          value={settings.first_day_of_week}
          onChange={(e) => onUpdate({ first_day_of_week: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {WEEKDAYS.map((wd) => (
            <option key={wd.value} value={wd.value}>{wd.label}</option>
          ))}
        </select>
      </SettingsCard>

      <SettingsCard label="Date Format" description="How dates are displayed.">
        <select
          value={settings.date_format}
          onChange={(e) => onUpdate({ date_format: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {DATE_FORMATS.map((df) => (
            <option key={df.value} value={df.value}>{df.label}</option>
          ))}
        </select>
      </SettingsCard>

      <SettingsCard label="Number Format" description="How large numbers are formatted.">
        <select
          value={settings.number_format}
          onChange={(e) => onUpdate({ number_format: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {NUMBER_FORMATS.map((nf) => (
            <option key={nf.value} value={nf.value}>{nf.label}</option>
          ))}
        </select>
      </SettingsCard>
    </SettingsSection>
  );
}
