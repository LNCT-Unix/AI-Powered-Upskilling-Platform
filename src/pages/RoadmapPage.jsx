import { useState } from 'react';
import { CircleCheck, PlayCircle, Clock3 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { roadmapItems } from '../data/mockData';

export default function RoadmapPage() {
  const [done, setDone] = useState(roadmapItems.filter((x) => x.done).map((x) => x.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-green-950">Your learning roadmap</h1>
        <p className="mt-2 text-sm text-slate-500">A sample plan with practical resources and estimated time.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <span className="font-bold text-green-950">Roadmap progress</span>
          <span className="text-sm text-slate-500">
            {done.length}/{roadmapItems.length} complete
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-green-700 transition-all duration-300"
            style={{ width: `${(done.length / roadmapItems.length) * 100}%` }}
          />
        </div>
      </Card>

      {roadmapItems.map((item) => {
        const isDone = done.includes(item.id);
        return (
          <Card key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                isDone ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-green-900'
              }`}
            >
              {isDone ? <CircleCheck /> : <PlayCircle />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-green-950">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {item.topic} · {item.type}
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                <Clock3 size={13} />
                {item.duration}
              </p>
            </div>

            <Button
              variant={isDone ? 'outline' : 'primary'}
              onClick={() =>
                setDone((p) =>
                  p.includes(item.id) ? p.filter((id) => id !== item.id) : [...p, item.id]
                )
              }
            >
              {isDone ? 'Mark incomplete' : 'Mark complete'}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
