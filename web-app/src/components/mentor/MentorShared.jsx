import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';

/* ───────────────────────────── Demo marker ───────────────────────────── */
export function DemoPill({ children = 'Frontend demo data', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#E4D7FF] bg-[#EFEAFC] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6244E8] ${className}`}
    >
      <Sparkles size={12} aria-hidden="true" />
      {children}
    </span>
  );
}

/* ─────────────────────────── Page header bar ─────────────────────────── */
export function MentorPageHeader({ eyebrow, title, description, icon: Icon, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {Icon && (
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#E4D7FF] bg-[#EFEAFC] text-[#7C5CFA]">
              <Icon size={16} aria-hidden="true" />
            </span>
          )}
          {eyebrow && (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8D8471]">
              {eyebrow}
            </p>
          )}
          <DemoPill />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#2F2A3E] sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#6E6880] sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ──────────────────────────── Summary card ───────────────────────────── */
const STAT_TINTS = {
  purple: { box: 'bg-[#EFEAFC] text-[#7C5CFA] border-[#E4D7FF]', bar: 'from-[#7C5CFA] to-[#A78BFA]' },
  green: { box: 'bg-[#E7F8EF] text-[#138A63] border-[#C8EFDD]', bar: 'from-[#2FBF8F] to-[#6EE7B7]' },
  orange: { box: 'bg-[#FFEEDD] text-[#C06A14] border-[#FFD9B8]', bar: 'from-[#FF9838] to-[#FFC93C]' },
  blue: { box: 'bg-[#E8F1FF] text-[#2563EB] border-[#D3E6FF]', bar: 'from-[#3B82F6] to-[#93C5FD]' },
  rose: { box: 'bg-rose-50 text-rose-600 border-rose-100', bar: 'from-rose-500 to-rose-300' },
};

export function MentorStatCard({
  label,
  value,
  detail,
  icon: Icon,
  tint = 'purple',
  trend,
  onClick,
}) {
  const style = STAT_TINTS[tint] || STAT_TINTS.purple;
  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group w-full rounded-2xl border border-[#E8E0CC] bg-[#FFFDF7] p-4 text-left shadow-2xs transition sm:p-5 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[#D8CCAE] hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8D8471]">
          {label}
        </p>
        {Icon && (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${style.box}`}>
            <Icon size={17} aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-2xl font-extrabold leading-none tracking-tight text-[#2F2A3E] tabular-nums sm:text-3xl">
          {value}
        </p>
        {trend && (
          <span className="rounded-full border border-[#C8EFDD] bg-[#E7F8EF] px-2 py-0.5 text-[10px] font-bold text-[#138A63]">
            {trend}
          </span>
        )}
      </div>
      {detail && <p className="mt-1.5 truncate text-[11px] text-[#6E6880]">{detail}</p>}
    </Element>
  );
}

/* ───────────────────────────── Progress bar ──────────────────────────── */
const PROGRESS_TONES = {
  purple: 'bg-gradient-to-r from-[#7C5CFA] to-[#A78BFA]',
  green: 'bg-gradient-to-r from-[#2FBF8F] to-[#6EE7B7]',
  amber: 'bg-gradient-to-r from-[#F59E0B] to-[#FCD34D]',
  rose: 'bg-gradient-to-r from-rose-500 to-rose-300',
  slate: 'bg-slate-400',
};

export function ProgressBar({ value = 0, tone = 'purple', className = '', label = 'Progress' }) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-[#EDE7DA] ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={normalized}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${PROGRESS_TONES[tone] || PROGRESS_TONES.purple}`}
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}

/* ─────────────────────────────── Empty state ──────────────────────────── */
export function MentorEmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D8CCAE] bg-[#FFFDF7]/70 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-[#E4D7FF] bg-[#EFEAFC] text-[#7C5CFA]">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-sm font-extrabold text-[#2F2A3E]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-[#6E6880]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ──────────────────────────────── Modal ──────────────────────────────── */
export function MentorModal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#211A2E]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-[#E8E0CC] bg-[#FFFDF7] shadow-2xl sm:rounded-3xl ${widths[size] || widths.md}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E8E0CC] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-extrabold text-[#2F2A3E]">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#6E6880]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#E8E0CC] bg-white text-[#8D8471] transition hover:border-[#D8CCAE] hover:bg-[#F7F3E8] hover:text-[#2F2A3E]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-[#E8E0CC] bg-[#FDF9EE] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ─────────────────────────── Inline stat pill ────────────────────────── */
export function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#E8E0CC] bg-[#FDF9EE] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8D8471]">
        {Icon && <Icon size={12} aria-hidden="true" />}
        {label}
      </div>
      <p className="mt-1 text-lg font-extrabold tabular-nums text-[#2F2A3E]">{value}</p>
    </div>
  );
}
