import Card from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const iconStyles = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  // Graceful fallbacks for legacy props
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  yellow: 'bg-amber-50 text-amber-700 border-amber-100',
  sky: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  coral: 'bg-rose-50 text-rose-700 border-rose-100',
  violet: 'bg-purple-50 text-purple-700 border-purple-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
};

export default function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tint = 'indigo',
  trend,
  className = '',
}) {
  const iconClass = iconStyles[tint] || iconStyles.indigo;

  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {Icon && (
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-sm ${iconClass}`}
            aria-hidden="true"
          >
            <Icon size={18} />
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                trend.positive !== false
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {trend.positive !== false ? (
                <TrendingUp size={13} />
              ) : (
                <TrendingDown size={13} />
              )}
              {trend.value || trend}
            </span>
          )}
        </div>
        {detail && (
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            {detail}
          </p>
        )}
      </div>
    </Card>
  );
}
