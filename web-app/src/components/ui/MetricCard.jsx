import Card from './Card';

// Each tint gives the card its own gradient, border, text colour and icon badge.
// "!" overrides the default yellow-green gradient from Card.
// The shape comes from Card's `shape="rounded"` prop (a plain rounded rectangle).
const tints = {
  green: {
    card: '!from-lime-200 !via-green-200 !to-emerald-300 !border-green-400/70 hover:!border-green-700 hover:!shadow-green-700/25',
    badge: 'bg-green-800 text-white shadow-green-900/30',
    ink: 'text-green-950',
    sub: 'text-green-900/75',
    bar: 'bg-green-800',
  },
  yellow: {
    card: '!from-yellow-100 !via-yellow-200 !to-amber-300 !border-yellow-400/70 hover:!border-amber-600 hover:!shadow-amber-500/30',
    badge: 'bg-yellow-300 text-green-950 shadow-amber-500/40',
    ink: 'text-amber-950',
    sub: 'text-amber-900/75',
    bar: 'bg-amber-600',
  },
  sky: {
    card: '!from-sky-100 !via-sky-200 !to-indigo-300 !border-sky-400/70 hover:!border-indigo-600 hover:!shadow-indigo-500/25',
    badge: 'bg-indigo-600 text-white shadow-indigo-700/30',
    ink: 'text-indigo-950',
    sub: 'text-indigo-900/75',
    bar: 'bg-indigo-600',
  },
  coral: {
    card: '!from-orange-100 !via-orange-200 !to-rose-300 !border-orange-400/70 hover:!border-rose-600 hover:!shadow-rose-500/25',
    badge: 'bg-rose-500 text-white shadow-rose-600/30',
    ink: 'text-rose-950',
    sub: 'text-rose-900/75',
    bar: 'bg-rose-500',
  },
  violet: {
    card: '!from-fuchsia-100 !via-violet-200 !to-purple-300 !border-violet-400/70 hover:!border-purple-600 hover:!shadow-purple-500/25',
    badge: 'bg-purple-600 text-white shadow-purple-700/30',
    ink: 'text-purple-950',
    sub: 'text-purple-900/75',
    bar: 'bg-purple-600',
  },
  teal: {
    card: '!from-emerald-100 !via-teal-200 !to-cyan-300 !border-teal-400/70 hover:!border-teal-700 hover:!shadow-teal-600/25',
    badge: 'bg-teal-700 text-white shadow-teal-800/30',
    ink: 'text-teal-950',
    sub: 'text-teal-900/75',
    bar: 'bg-teal-700',
  },
};

export default function MetricCard({ icon: Icon, label, value, detail, tint = 'green' }) {
  const t = tints[tint] || tints.green;

  return (
    <Card shape="rounded" className={`cursor-default ${t.card}`}>
      <div className="flex items-start justify-between">
        <p className={`text-sm font-semibold ${t.sub}`}>{label}</p>
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl shadow-md transition-all duration-300 motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110 ${t.badge}`}
        >
          <Icon size={20} />
        </span>
      </div>

      <p
        className={`mt-3 origin-left text-3xl font-extrabold tracking-tight transition-transform duration-300 motion-safe:group-hover:scale-110 ${t.ink}`}
      >
        {value}
      </p>
      <p className={`mt-2 text-xs ${t.sub}`}>{detail}</p>

      {/* accent bar that grows on hover */}
      <span
        aria-hidden="true"
        className={`mt-4 block h-1.5 w-10 rounded-full opacity-70 transition-all duration-500 group-hover:w-full group-hover:opacity-100 ${t.bar}`}
      />
    </Card>
  );
}

/* Dashboard usage:

<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
  <MetricCard icon={Users}       label="Total users" value="1,284" detail="+12% this month"  tint="green" />
  <MetricCard icon={Wallet}      label="Revenue"     value="₹4.2L" detail="+8% this month"   tint="yellow" />
  <MetricCard icon={ShoppingBag} label="Orders"      value="356"   detail="24 pending"       tint="sky" />
  <MetricCard icon={Star}        label="Rating"      value="4.8"   detail="From 210 reviews" tint="coral" />
</div>
*/
