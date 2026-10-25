import { useState } from 'react';
import {
  CircleCheck,
  PlayCircle,
  Clock3,
  AlertCircle,
  Sparkles,
  Layers,
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { roadmapItems } from '../data/mockData';

export default function RoadmapPage() {
  const [done, setDone] = useState(roadmapItems.filter((x) => x.done).map((x) => x.id));
  const [activeFilter, setActiveFilter] = useState('all');
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [expandedRationales, setExpandedRationales] = useState({});
  const [activeRevisions, setActiveRevisions] = useState({ 2: true });

  const remainingMinutes = roadmapItems
    .filter((item) => !done.includes(item.id))
    .reduce((acc, item) => acc + (parseInt(item.duration, 10) || 30), 0);

  const daysToFinish = Math.max(1, Math.ceil(remainingMinutes / dailyMinutes));
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysToFinish);
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const toggleDone = (id) => {
    setDone((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleRationale = (id) => {
    setExpandedRationales((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resolveRevision = (id) => {
    setActiveRevisions((prev) => ({ ...prev, [id]: false }));
  };

  const filteredItems = roadmapItems.filter((item) => {
    const isDone = done.includes(item.id);
    const hasActiveRev = activeRevisions[item.id];
    if (activeFilter === 'completed') return isDone;
    if (activeFilter === 'revision') return hasActiveRev;
    if (activeFilter === 'in-progress') return !isDone && !hasActiveRev;
    return true;
  });

  // Group by milestone
  const milestones = [...new Set(roadmapItems.map((item) => item.milestone))];
  const completionPercentage = Math.round((done.length / roadmapItems.length) * 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo" icon={Sparkles}>
              TAILORED CURRICULUM
            </Badge>
            <span className="text-xs font-medium text-slate-500">Topological Milestone Graph</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Personalized Learning Roadmap
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            A dependency-ordered sequence of milestones designed to eliminate identified gaps and build verified proof of work.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDone(roadmapItems.map((i) => i.id))}
          >
            Mark All Completed
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDone([])}
          >
            Reset Progress
          </Button>
        </div>
      </div>

      {/* Progress & Smart Study Planner Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Progress Card (2 cols) */}
        <Card className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                ROADMAP COMPLETION
              </span>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {done.length} of {roadmapItems.length} Milestones Mastered ({completionPercentage}%)
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-sm border border-indigo-100">
              {completionPercentage}%
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
            {[
              ['all', 'All Topics'],
              ['in-progress', 'In Progress'],
              ['revision', 'Revision Loops'],
              ['completed', 'Completed'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveFilter(id)}
                className={`rounded-lg px-3 py-1.5 font-medium transition cursor-pointer ${
                  activeFilter === id
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        {/* Smart Study Planner Card */}
        <Card className="space-y-3 border-indigo-100 bg-slate-50/50">
          <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Calendar size={14} /> Smart Study Planner
          </div>
          <p className="text-xs text-slate-600">
            Based on {remainingMinutes} mins of pending study time:
          </p>

          <div className="flex items-center gap-1.5">
            {[30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDailyMinutes(mins)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition border cursor-pointer ${
                  dailyMinutes === mins
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mins}m/day
              </button>
            ))}
          </div>

          <div className="rounded-lg bg-white p-3 border border-slate-200/80 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500">Projected Target Completion</p>
            <p className="text-sm font-bold text-slate-900">{formattedDate}</p>
            <p className="text-[10px] text-slate-400">~{daysToFinish} days at current commitment</p>
          </div>
        </Card>
      </div>

      {/* Topological Milestone Groups */}
      <div className="space-y-8">
        {milestones.map((mName) => {
          const mItems = filteredItems.filter((item) => item.milestone === mName);
          if (mItems.length === 0) return null;

          const mCompleted = mItems.filter((i) => done.includes(i.id)).length;

          return (
            <div key={mName} className="space-y-3">
              {/* Milestone Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    <Layers size={15} />
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">{mName}</h2>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {mCompleted} of {mItems.length} completed
                </span>
              </div>

              {/* Milestone Items */}
              <div className="space-y-3">
                {mItems.map((item) => {
                  const isDone = done.includes(item.id);
                  const isRevisionActive = activeRevisions[item.id];
                  const isRationaleOpen = expandedRationales[item.id];

                  return (
                    <Card
                      key={item.id}
                      className={`transition-all duration-150 ${
                        isRevisionActive
                          ? 'border-amber-300 bg-amber-50/20'
                          : isDone
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-200/90 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start justify-between">
                        <div className="flex items-start gap-3.5">
                          <button
                            type="button"
                            onClick={() => toggleDone(item.id)}
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition cursor-pointer ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 hover:text-slate-600'
                            }`}
                            aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {isDone ? <CircleCheck size={20} /> : <PlayCircle size={20} />}
                          </button>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {item.topic}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-500">{item.type}</span>
                              <Badge
                                variant={item.difficulty === 'Advanced' ? 'indigo' : 'neutral'}
                                size="sm"
                              >
                                {item.difficulty}
                              </Badge>
                            </div>

                            <h3
                              className={`text-sm sm:text-base font-bold ${
                                isDone ? 'text-slate-400 line-through' : 'text-slate-900'
                              }`}
                            >
                              {item.title}
                            </h3>

                            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                              <span className="flex items-center gap-1">
                                <Clock3 size={13} /> {item.duration}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRationale(item.id)}
                                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              >
                                {isRationaleOpen ? 'Hide rationale' : 'Why this step?'}
                                {isRationaleOpen ? (
                                  <ChevronUp size={13} />
                                ) : (
                                  <ChevronDown size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center shrink-0">
                          <Button
                            variant={isDone ? 'outline' : 'secondary'}
                            size="sm"
                            onClick={() => toggleDone(item.id)}
                          >
                            {isDone ? 'Mark incomplete' : 'Mark complete'}
                          </Button>
                        </div>
                      </div>

                      {/* Transparent Rationale Box ("Why this step") */}
                      {isRationaleOpen && (
                        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-slate-700 space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-indigo-900">
                            <Sparkles size={13} /> Transparent Curriculum Rationale
                          </p>
                          <p className="leading-relaxed">{item.whyThisStep}</p>
                        </div>
                      )}

                      {/* Remediation Loop Alert & Revision Module */}
                      {isRevisionActive && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                              <AlertCircle size={15} /> Remediation Loop Active (Weak Subtopic Detected)
                            </div>
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Retest Pending
                            </span>
                          </div>
                          <p className="text-xs text-amber-950 leading-relaxed">
                            Your last diagnostic quiz showed uncertainty in microtask vs macrotask execution order. 
                            An interactive revision module has been attached to clarify this concept before proceeding.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveRevision(item.id)}
                              className="border-amber-300 text-amber-950 bg-white hover:bg-amber-50"
                            >
                              <RotateCcw size={13} /> Complete Revision & Retest
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
