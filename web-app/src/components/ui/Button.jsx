export default function Button({
  children,
  variant = 'primary',
  shape = 'pill',
  className = '',
  ...props
}) {
  const variants = {
    primary:
      'bg-gradient-to-br from-green-700 to-green-900 text-white shadow-md shadow-green-900/20 hover:from-green-600 hover:to-green-800 hover:shadow-lg focus-visible:ring-green-700',
    outline:
      'border-2 border-green-800 bg-white text-green-900 hover:bg-green-800 hover:text-white focus-visible:ring-green-700',
    ghost:
      'text-green-900 hover:bg-green-100 focus-visible:ring-green-700',
    yellow:
      'bg-gradient-to-br from-yellow-300 to-amber-400 text-green-950 shadow-md shadow-amber-500/30 hover:from-yellow-200 hover:to-amber-300 hover:shadow-lg focus-visible:ring-yellow-600',
    coral:
      'bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-rose-500/30 hover:from-orange-300 hover:to-rose-400 hover:shadow-lg focus-visible:ring-rose-500',
    sky:
      'bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-md shadow-indigo-500/30 hover:from-sky-300 hover:to-indigo-400 hover:shadow-lg focus-visible:ring-indigo-500',
  };

  // Change `shape` to switch the silhouette:
  // pill = fully round, leaf = opposite corners round, squircle = soft square, sharp = small radius
  const shapes = {
    pill: 'rounded-full',
    leaf: 'rounded-tl-2xl rounded-br-2xl rounded-tr-sm rounded-bl-sm',
    squircle: 'rounded-3xl',
    sharp: 'rounded-md',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${shapes[shape]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
