export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-green-800 text-white shadow-sm hover:bg-green-900 focus-visible:ring-green-700',
    outline: 'border border-slate-200 bg-white text-slate-800 hover:bg-green-50 focus-visible:ring-green-700',
    ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-green-700',
    yellow: 'bg-yellow-300 text-green-950 hover:bg-yellow-400 focus-visible:ring-yellow-600',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
