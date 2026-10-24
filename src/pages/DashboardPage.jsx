import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Flame, Search, ChevronRight, Check, Target,
  TrendingUp, Sparkles, X, ArrowRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import MetricCard from '../components/ui/MetricCard';
import ScoreRing from '../components/ui/ScoreRing';
import SkillBar from '../components/ui/SkillBar';
import { skills, activities } from '../data/mockData';

export default function DashboardPage() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  const filtered = activities.filter(
    (a) =>
      (filter === 'all' || a.type === filter) &&
      a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-green-800">YOUR LEARNING SPACE</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-green-950 sm:text-3xl">
            Welcome back <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Here’s where your skills stand today.</p>
        </div>
        <Button onClick={() => navigate('/assessment')}>
          <Target size={17} /> Take diagnostic
        </Button>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
        >
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top 3 Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="flex items-center gap-4">
          <ScoreRing score={0} />
          <div>
            <p className="text-sm font-semibold text-slate-500">Overall skill score</p>
            <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-green-800">
              <TrendingUp size={15} /> 0 points this month
            </p>
            <p className="mt-1 text-xs text-slate-400">Compared with last month</p>
          </div>
        </Card>

        <MetricCard
          icon={BookOpen}
          label="Skills mastered"
          value="0 / 18"
          detail="11 skills left on your roadmap"
        />

        <Card>
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-slate-500">Learning streak</p>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-100 text-green-900">
              <Flame size={19} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-green-950">
            12 <span className="text-base font-semibold text-slate-400">days</span>
          </p>
          <div className="mt-4 flex gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span
                key={i}
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                  i < 5 ? 'bg-green-800 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i < 5 ? <Check size={14} /> : d}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity & Skill Breakdown */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-green-950">Recent activity</h2>
              <p className="mt-1 text-xs text-slate-500">Your latest learning milestones</p>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Filter activity">
              {[
                ['all', 'All'],
                ['assessment', 'Assessments'],
                ['lesson', 'Lessons'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  onClick={() => setFilter(id)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    filter === id ? 'bg-white text-green-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activity..."
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <ul className="mt-2 divide-y divide-slate-100">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-4">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    a.type === 'assessment' ? 'bg-yellow-100 text-green-900' : 'bg-green-50 text-green-800'
                  }`}
                >
                  {a.type === 'assessment' ? <Target size={18} /> : <Check size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{a.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{a.meta}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-8 text-center text-sm text-slate-500">
                No matching activity found. Try a different search.
              </li>
            )}
          </ul>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-green-950">Skill breakdown</h2>
              <p className="mt-1 text-xs text-slate-500">Current topic-wise scores</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="text-xs font-bold text-green-800 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="mt-6 space-y-5">
            {skills.map((s) => (
              <SkillBar key={s.name} {...s} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/roadmap')}
            className="mt-6 flex w-full items-center justify-between rounded-xl bg-green-50 px-4 py-3 text-left text-sm font-semibold text-green-900 hover:bg-green-100 transition"
          >
            View learning roadmap <ArrowRight size={16} />
          </button>
        </Card>
      </div>

      {/* Recommended Next Topic Card */}
      <Card className="flex flex-col justify-between gap-4 bg-yellow-50 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-green-800 shadow-sm">
            <Sparkles size={21} />
          </span>
          <div>
            <h2 className="font-bold text-green-950">Recommended next: Data Structures</h2>
            <p className="mt-1 text-sm text-slate-600">
              Build a stronger foundation with a focused 20-minute practice session.
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/roadmap')} className="shrink-0">
          View recommendation <ArrowRight size={16} />
        </Button>
      </Card>
    </div>
  );
}
