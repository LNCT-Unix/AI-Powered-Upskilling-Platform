export default function Card({
  children,
  className = '',
  interactive = false,
  padding = true,
  ...props
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200/90 bg-white text-slate-900 shadow-xs transition-all duration-150 ${
        padding ? 'p-5 sm:p-6' : ''
      } ${
        interactive ? 'hover:border-slate-300 hover:shadow-sm cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
