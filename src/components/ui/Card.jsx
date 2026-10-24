export default function Card({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-green-950/[0.04] ${className}`}>
      {children}
    </section>
  );
}
