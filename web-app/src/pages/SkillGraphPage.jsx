import Card from '../components/ui/Card';

export default function SkillGraphPage() {
  const nodes = [
    ['Programming basics', 'left-0 top-2'],
    ['JavaScript', 'left-1/2 top-24 -translate-x-1/2'],
    ['Data structures', 'left-0 top-48'],
    ['React', 'right-0 top-48'],
    ['System design', 'left-1/2 bottom-2 -translate-x-1/2'],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-green-950">Skill graph</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sample prerequisite map. Start with foundations before moving to advanced topics.
        </p>
      </div>

      <Card>
        <div className="relative mx-auto h-[380px] max-w-2xl">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 600 380"
            preserveAspectRatio="none"
            aria-label="Connections between prerequisite skills"
          >
            <path
              d="M300 55 L300 110 M300 150 L125 205 M300 150 L475 205 M125 245 L300 315 M475 245 L300 315"
              stroke="#9bb9a3"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="5 5"
            />
          </svg>
          {nodes.map(([label, pos], i) => (
            <div
              key={label}
              className={`absolute ${pos} z-10 w-36 rounded-2xl border p-3 text-center shadow-sm sm:w-44 transition ${
                i === 0
                  ? 'border-green-200 bg-green-50'
                  : i === 4
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <span className="text-sm font-bold text-green-950">{label}</span>
              <p className="mt-1 text-xs text-slate-500">
                {i < 2 ? 'Foundation' : i === 4 ? 'Advanced' : 'Intermediate'}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4 text-center">
          Connections are illustrative sample data and can be expanded with your own curriculum.
        </p>
      </Card>
    </div>
  );
}
