import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  Map,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/ui/Button';

const STATUS_CONFIG = {
  done:   { label: 'Mastered',    dot: 'bg-emerald-500', ring: 'border-emerald-500 bg-emerald-50', icon: CheckCircle2, iconCls: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  active: { label: 'In Progress', dot: 'bg-indigo-500',  ring: 'border-indigo-500 bg-indigo-50',  icon: Sparkles,     iconCls: 'text-indigo-600',  badge: 'bg-indigo-100 text-indigo-700' },
  locked: { label: 'Up Next',     dot: 'bg-slate-300',   ring: 'border-slate-300 bg-white',       icon: Lock,         iconCls: 'text-slate-400',   badge: 'bg-slate-100 text-slate-500' },
};

function RoadmapItem({ item, index, isLast }) {
  const [open, setOpen] = useState(item.status === 'active');
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.locked;
  const Icon = cfg.icon;
  const delay = `${index * 60}ms`;

  return (
    <div
      className="animate-slide-left flex gap-4"
      style={{ animationDelay: delay, animationFillMode: 'both' }}
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className={`h-9 w-9 shrink-0 rounded-full border-2 flex items-center justify-center ${cfg.ring} card-hover transition-all`}>
          <Icon size={15} className={cfg.iconCls} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1 mb-1" />}
      </div>

      {/* Content card */}
      <div className={`flex-1 mb-5 rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-200 ${
        item.status === 'active' ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-100'
      }`}>
        <button
          type="button"
          onClick={() => setOpen(p => !p)}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-0.5">
              {item.cluster || 'Core Milestone'}
            </p>
            <p className={`text-sm font-bold ${item.status === 'locked' ? 'text-slate-400' : 'text-slate-900'}`}>
              {item.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                <Icon size={9} /> {cfg.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                <Clock size={10} /> {item.duration || '35 min'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                <BookOpen size={10} /> {item.type || 'Applied Practice'}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {open && (
          <div className="animate-slide-up border-t border-slate-100 px-5 py-4 space-y-3">
            <div className="rounded-xl bg-indigo-50/70 border border-indigo-100/80 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                Pedagogical Objective
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {item.whyThisStep || `Targeted mastery of ${item.title} calibrated to your learning track frontier.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600">
                {item.difficulty || 'Applied Standard'}
              </span>
            </div>
            {item.status !== 'locked' && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm cursor-pointer"
              >
                {item.status === 'done' ? 'Review Concept' : 'Start Learning Module'} <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  // Load real assessment result from storage
  const assessmentResult = useMemo(() => {
    try {
      const raw = localStorage.getItem('skillpath_assessment_result');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Transform backend skills into real roadmap milestones
  const milestones = useMemo(() => {
    if (!assessmentResult?.skills || assessmentResult.skills.length === 0) {
      return [];
    }

    return assessmentResult.skills.map((skill, index) => {
      const isMastered = skill.state === 'MASTERED';
      const isFrontier = skill.state === 'FRONTIER';

      return {
        id: skill.skillId || `skill-${index}`,
        title: skill.name,
        cluster: skill.cluster || 'Technical Core',
        status: isMastered ? 'done' : isFrontier ? 'active' : 'locked',
        duration: isMastered ? '25 min' : isFrontier ? '40 min' : '50 min',
        type: isMastered ? 'Verified Competency' : isFrontier ? 'Target Learning Module' : 'Upcoming Prerequisite',
        difficulty: isMastered ? 'Mastered' : isFrontier ? 'Focus Area' : 'Advanced Prerequisite',
        whyThisStep: isMastered
          ? `Verified proficiency during adaptive testing (θ = ${assessmentResult.theta}). Available for refresher review.`
          : isFrontier
          ? `Topological frontier node identified for immediate skill acquisition in ${skill.cluster || 'your track'}.`
          : `Prerequisite competencies must be consolidated before activating this milestone.`,
      };
    });
  }, [assessmentResult]);

  const completedCount = milestones.filter(m => m.status === 'done').length;
  const totalCount = milestones.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filtered = useMemo(() => {
    if (filter === 'all') return milestones;
    return milestones.filter(m => m.status === filter);
  }, [filter, milestones]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="animate-slide-up">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Your Adaptive Plan</span>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">Learning Roadmap</h1>
        <p className="mt-1 text-sm text-slate-500">
          {totalCount > 0
            ? `${completedCount} of ${totalCount} milestones mastered (${pct}% of your diagnostic track).`
            : 'Personalized milestones generated from your adaptive assessment.'}
        </p>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <Map size={26} />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900">No Assessment Data Found</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Complete your initial diagnostic test to allow the backend adaptive engine to map your verified skills and frontier milestones.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="indigo" onClick={() => navigate('/assessment')}>
              Take Diagnostic Test <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="animate-slide-up delay-75 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-700">Overall Track Progress</p>
              <p className="text-xs font-extrabold text-indigo-600">{pct}%</p>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px] font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {completedCount} Mastered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />{' '}
                {milestones.filter(m => m.status === 'active').length} In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300" />{' '}
                {milestones.filter(m => m.status === 'locked').length} Up Next
              </span>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="animate-slide-up delay-150 flex rounded-full bg-slate-200/60 p-1 w-fit gap-0.5">
            {[
              ['all', 'All'],
              ['done', 'Mastered'],
              ['active', 'In Progress'],
              ['locked', 'Up Next'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  filter === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="pt-2">
            {filtered.length === 0 ? (
              <div className="animate-fade-in rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <Map size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500">No milestones match this filter.</p>
              </div>
            ) : (
              filtered.map((item, i) => (
                <RoadmapItem
                  key={item.id}
                  item={item}
                  index={i}
                  isLast={i === filtered.length - 1}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
