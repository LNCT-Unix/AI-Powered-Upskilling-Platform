export default function SkillBar({ name, score, color = 'bg-green-700' }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{name}</span>
        <span className="font-semibold tabular-nums text-slate-500">{score}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={name}
        aria-valuenow={score}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
