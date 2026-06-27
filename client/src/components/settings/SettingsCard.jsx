export default function SettingsCard({ label, description, children }) {
  return (
    <div className="flex items-start justify-between py-3 border-b last:border-b-0">
      <div className="flex-1 mr-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
