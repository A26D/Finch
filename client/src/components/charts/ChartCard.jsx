import EmptyChart from "./EmptyChart";

export default function ChartCard({ title, children, isEmpty }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
        {title}
      </h3>
      {isEmpty ? <EmptyChart /> : children}
    </div>
  );
}
