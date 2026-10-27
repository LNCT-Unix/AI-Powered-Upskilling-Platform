const badgeVariants = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
  rose: 'bg-rose-50 text-rose-800 border-rose-200/80',
  sky: 'bg-sky-50 text-sky-800 border-sky-200/80',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon: Icon,
}) {
  const variantClass = badgeVariants[variant] || badgeVariants.neutral;
  const sizeClass = badgeSizes[size] || badgeSizes.md;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border tracking-tight ${variantClass} ${sizeClass} ${className}`}
    >
      {Icon && <Icon size={12} className="shrink-0" />}
      {children}
    </span>
  );
}
