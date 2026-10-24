import Card from './Card';

export default function MetricCard({ icon: Icon, label, value, detail, tint = 'green' }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            tint === 'yellow' ? 'bg-yellow-100 text-green-900' : 'bg-green-50 text-green-800'
          }`}
        >
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-green-950">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </Card>
  );
}
