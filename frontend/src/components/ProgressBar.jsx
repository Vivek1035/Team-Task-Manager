export default function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct === 100  ? "bg-emerald-500" :
    pct >= 60    ? "bg-brand-500"   :
    pct >= 30    ? "bg-amber-500"   :
                   "bg-red-500";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Progress</span>
        <span className="font-medium text-gray-300">{pct}%</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
