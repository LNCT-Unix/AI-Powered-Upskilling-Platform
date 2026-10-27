export default function Card({
  children,
  className = '',
  interactive = false,
  padding = true,
  ...props
}) {
  return (
    <section
      className={`rounded-3xl border border-slate-100 bg-white text-slate-900 shadow-xs transition-all duration-150 ${
        padding ? 'p-5 sm:p-6' : ''
      } ${
        interactive ? 'hover:border-slate-200 hover:shadow-md cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
