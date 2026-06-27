export default function ExportButtons({ onExport }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onExport("csv")}
        className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium"
      >
        Export CSV
      </button>
      <button
        onClick={() => onExport("pdf")}
        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium"
      >
        Export PDF
      </button>
    </div>
  );
}
