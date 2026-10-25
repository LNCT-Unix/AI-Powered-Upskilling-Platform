import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  // Support standard variants with graceful fallback for legacy props
  const variants = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-xs focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2',
    indigo:
      'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
    outline:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2',
    // Fallbacks for older call sites
    yellow:
      'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2',
    coral:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2',
    sky:
      'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-md gap-1.5 min-h-[36px]',
    md: 'px-4 py-2 text-sm font-semibold rounded-lg gap-2 min-h-[42px]',
    lg: 'px-5 py-2.5 text-sm sm:text-base font-semibold rounded-lg gap-2.5 min-h-[46px]',
  };

  const selectedVariant = variants[variant] || variants.primary;
  const selectedSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 select-none disabled:cursor-not-allowed disabled:opacity-50 ${selectedSize} ${selectedVariant} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin shrink-0" />}
      {children}
    </button>
  );
}
