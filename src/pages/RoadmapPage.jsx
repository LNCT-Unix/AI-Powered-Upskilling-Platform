import { useState } from 'react';
import {
  CircleCheck, PlayCircle, Clock3, AlertCircle, Sparkles,
  Layers, Calendar, ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
              <Sparkles size={13} /> TAILORED CURRICULUM
            </span>
            <span className="text-xs font-semibold text-slate-500">Topologically Ordered Path</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-green-950 sm:text-3xl">
            Your Personalized Learning Roadmap
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A goal-aligned sequence designed to eliminate identified gaps and build verified proof of work.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setDone(roadmapItems.map((i) => i.id))}>
            Mark All Done
          </Button>
          <Button variant="ghost" onClick={() => setDone([])}>
            Reset
          </Button>
        </div>
      </div>

      {/* Progress & Smart Study Planner Ribbon */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                ROADMAP PROGRESS
              </span>
              <p className="text-xl font-bold text-green-950 mt-1">
                {done.length} of {roadmapItems.length} Milestones Mastered ({completionPercentage}%)
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-900 font-extrabold text-sm">
              {completionPercentage}%
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-700 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
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
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  activeFilter === id
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        {/* Smart Study Planner Card */}
        <Card className="space-y-3 bg-gradient-to-br from-yellow-50/60 to-white border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-900 text-xs font-bold uppercase tracking-wider">
            <Calendar size={14} /> Smart Study Planner
          </div>
          <p className="text-xs text-slate-600">
            Based on {remainingMinutes} mins of pending study time:
          </p>

          <div className="flex items-center gap-2">
            {[30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDailyMinutes(mins)}
                className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition border ${
                  dailyMinutes === mins
                    ? 'border-yellow-400 bg-yellow-300 text-green-950 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {mins}m/day
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-white p-3 border border-yellow-100 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500">Estimated Target Finish Date</p>
            <p className="text-sm font-extrabold text-green-950">{formattedDate}</p>
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
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Layers size={16} />
                  </span>
                  <h2 className="text-base font-bold text-green-950">{mName}</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
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
                      className={`transition-all duration-200 ${
                        isRevisionActive
                          ? 'border-amber-300 bg-amber-50/30'
                          : isDone
                          ? 'border-slate-200 bg-white opacity-95'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start justify-between">
                        <div className="flex items-start gap-3.5">
                          <button
                            type="button"
                            onClick={() => toggleDone(item.id)}
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                            }`}
                            aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {isDone ? <CircleCheck size={22} /> : <PlayCircle size={22} />}
                          </button>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {item.topic}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-500">{item.type}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.difficulty === 'Advanced'
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'bg-blue-100 text-blue-900'
                                }`}
                              >
                                {item.difficulty}
                              </span>
                            </div>

                            <h3 className={`text-base font-bold ${isDone ? 'text-slate-600 line-through' : 'text-green-950'}`}>
                              {item.title}
                            </h3>

                            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                              <span className="flex items-center gap-1">
                                <Clock3 size={13} /> {item.duration}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRationale(item.id)}
                                className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950"
                              >
                                {isRationaleOpen ? 'Hide rationale' : 'Why this step?'}
                                {isRationaleOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center">
                          <Button
                            variant={isDone ? 'outline' : 'primary'}
                            onClick={() => toggleDone(item.id)}
                            className="text-xs py-2 px-3.5"
                          >
                            {isDone ? 'Mark incomplete' : 'Mark complete'}
                          </Button>
                        </div>
                      </div>

                      {/* Transparent Rationale Box ("Why this step") */}
                      {isRationaleOpen && (
                        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-emerald-950 space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                            <Sparkles size={13} /> Transparent Learning Rationale
                          </p>
                          <p className="text-slate-700 leading-relaxed">{item.whyThisStep}</p>
                        </div>
                      )}

                      {/* Remediation Loop Alert & Revision Module */}
                      {isRevisionActive && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                              <AlertCircle size={15} /> Remediation Loop Active (Weak Subtopic Detected)
                            </div>
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Retest Pending
                            </span>
                          </div>
                          <p className="text-xs text-amber-950">
                            Your last diagnostic quiz showed uncertainty in microtask vs macrotask execution order. 
                            An interactive revision visualizer has been inserted to clarify this concept before proceeding.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              variant="outline"
                              onClick={() => resolveRevision(item.id)}
                              className="text-xs py-1.5 px-3 bg-white border-amber-300 text-amber-950 hover:bg-amber-100"
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
