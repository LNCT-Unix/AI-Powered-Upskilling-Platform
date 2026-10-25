export default function SkillBar({
  name,
  score = 0,
  level,
  color,
  className = '',
}) {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));

  // Automatic semantic coloring if color is not explicitly passed
  const barColor =
    color ||
    (normalized >= 75
      ? 'bg-emerald-600'
      : normalized >= 40
      ? 'bg-indigo-600'
      : normalized > 0
      ? 'bg-amber-500'
      : 'bg-slate-300');

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-800 truncate">{name}</span>
        <div className="flex items-center gap-2 shrink-0">
          {level && (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {level}
            </span>
          )}
          <span className="font-semibold tabular-nums text-slate-700 text-xs">
            {normalized}%
          </span>
        </div>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={name}
        aria-valuenow={normalized}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}
