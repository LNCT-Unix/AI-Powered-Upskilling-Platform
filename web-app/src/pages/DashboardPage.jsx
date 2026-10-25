import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  Flame,
  Layers,
  BookOpen,
  Sparkles,
  Award,
  AlertCircle,
  X,
  PlayCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import MetricCard from '../components/ui/MetricCard';
import ScoreRing from '../components/ui/ScoreRing';
import SkillBar from '../components/ui/SkillBar';
import Badge from '../components/ui/Badge';
import { skills, activities, roadmapItems, questions, knowledgeAreas } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activityFilter, setActivityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissNotice, setDismissNotice] = useState(false);

  // 1. Read onboarding profile from localStorage if present
  const onboardingProfile = useMemo(() => {
    try {
      const saved = localStorage.getItem('skillpath_onboarding_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  // 2. Read diagnostic assessment results from sessionStorage
  const diagnosticData = useMemo(() => {
    try {
      const isSubmitted = sessionStorage.getItem('skillpath_diagnostic_submitted') === 'true';
      const answersRaw = sessionStorage.getItem('skillpath_diagnostic_answers');
      const answers = answersRaw ? JSON.parse(answersRaw) : {};

      if (!isSubmitted || Object.keys(answers).length === 0) {
        return { isCompleted: false, score: 0, areas: [], gapsCount: 0 };
      }

      const totalCorrect = questions.filter((q, i) => answers[i] === q.answer).length;
      const score = Math.round((totalCorrect / questions.length) * 100);

      const areas = knowledgeAreas.map((areaName) => {
        const areaQuestions = questions.filter((q) => q.area === areaName);
        const areaCorrect = areaQuestions.filter((q) => {
          const qIdx = questions.findIndex((item) => item.id === q.id);
          return answers[qIdx] === q.answer;
        }).length;
        const pct = areaQuestions.length > 0 ? Math.round((areaCorrect / areaQuestions.length) * 100) : 0;
        return {
          name: areaName,
          score: pct,
          level: pct >= 80 ? 'Mastered' : pct >= 50 ? 'Proficient' : 'Needs Review',
        };
      });

      const gapsCount = areas.filter((a) => a.score < 80).length;

      return {
        isCompleted: true,
        score,
        areas,
        gapsCount,
      };
    } catch {
      return { isCompleted: false, score: 0, areas: [], gapsCount: 0 };
    }
  }, []);

  // 3. Compute roadmap progress
  const completedMilestones = useMemo(
    () => roadmapItems.filter((item) => item.done).length,
    []
  );
  const totalMilestones = roadmapItems.length;
  const roadmapPct = Math.round((completedMilestones / totalMilestones) * 100);

  // Next actionable milestone
  const nextMilestone = useMemo(
    () => roadmapItems.find((item) => !item.done) || roadmapItems[0],
    []
  );

  // Track naming
  const trackTitle = useMemo(() => {
    if (onboardingProfile?.trackId === 'backend') return 'Backend Systems & Architecture';
    if (onboardingProfile?.trackId === 'devops') return 'Cloud Engineering & DevOps';
    if (onboardingProfile?.trackId === 'ai-data') return 'AI Engineering & Applied ML';
    return 'Full-Stack Web Development';
  }, [onboardingProfile]);

  // Filtered activity stream
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesType = activityFilter === 'all' || act.type === activityFilter;
      const matchesSearch = act.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [activityFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Platform Header & Learner Status */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Personalized Learning Dashboard
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-slate-500">{trackTitle}</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Learner'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Follow your calibrated roadmap milestones and track verifiable competency gains.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => navigate('/roadmap')}
            className="text-xs sm:text-sm"
          >
            <Compass size={15} />
            View Full Roadmap
          </Button>
          {!diagnosticData.isCompleted && (
            <Button
              variant="indigo"
              onClick={() => navigate('/assessment')}
              className="text-xs sm:text-sm"
            >
              <Sparkles size={15} />
              Take Diagnostic
            </Button>
          )}
        </div>
      </div>

      {/* Honest Diagnostic Alert Banner if not yet completed */}
      {!diagnosticData.isCompleted && !dismissNotice && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-950">
          <div className="flex items-start gap-3">
            <AlertCircle size={19} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Initial Diagnostic Assessment Recommended</p>
              <p className="mt-0.5 text-xs text-slate-600">
                You have not yet completed the 10-question adaptive assessment. Take it now to calibrate your starting milestone and automatically identify knowledge gaps.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="indigo"
              onClick={() => navigate('/assessment')}
            >
              Start Diagnostic
            </Button>
            <button
              type="button"
              onClick={() => setDismissNotice(true)}
              aria-label="Dismiss notice"
              className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-100 hover:text-slate-700 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Top 4 Key Performance Indicators (Analytics-First) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Verified Readiness Score */}
        <Card className="flex items-center gap-4">
          <ScoreRing
            score={diagnosticData.isCompleted ? diagnosticData.score : 0}
            size={88}
            strokeWidth={7}
            color="#4f46e5"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Readiness Score
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {diagnosticData.isCompleted ? 'Diagnostic Verified' : 'Baseline Uncalibrated'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {diagnosticData.isCompleted
                ? `${diagnosticData.score}% benchmarked`
                : 'Take 10-min assessment'}
            </p>
          </div>
        </Card>

        {/* Metric 2: Milestones Mastered */}
        <MetricCard
          icon={BookOpen}
          label="Milestones Mastered"
          value={`${completedMilestones} / ${totalMilestones}`}
          detail={`${totalMilestones - completedMilestones} topics remaining on roadmap`}
          tint="indigo"
          trend={{ value: `${roadmapPct}% completed`, positive: true }}
        />

        {/* Metric 3: Habit Streak */}
        <MetricCard
          icon={Flame}
          label="Learning Streak"
          value="5 Days"
          detail="Target: 45 min daily study budget"
          tint="amber"
          trend={{ value: 'Daily goal met', positive: true }}
        />

        {/* Metric 4: Diagnostic Gaps Identified */}
        <MetricCard
          icon={Layers}
          label="Knowledge Frontiers"
          value={diagnosticData.isCompleted ? `${diagnosticData.gapsCount} Focus Topics` : 'Pending'}
          detail={
            diagnosticData.isCompleted
              ? 'Revision loops automatically scheduled'
              : 'Unlocks post diagnostic'
          }
          tint="emerald"
        />
      </div>

      {/* Actionable Next Best Learning Step (Highlight Card) */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo" icon={Sparkles}>
                Next Recommended Action
              </Badge>
              <Badge variant="neutral">
                {nextMilestone?.milestone?.split(':')[0] || 'Milestone'}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock size={13} /> {nextMilestone?.duration || '30 min'}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              {nextMilestone?.title || 'Continue Curriculum'}
            </h2>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
              {nextMilestone?.whyThisStep ||
                'Topological ordering recommends completing this milestone before tackling dependent advanced concepts.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              variant="indigo"
              onClick={() => navigate('/roadmap')}
              className="justify-center"
            >
              <PlayCircle size={17} />
              Open Learning Node
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid: Skill Competency Breakdown & Activity Stream */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Skill Competency Overview (7 cols) */}
        <Card className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Skill Competency Breakdown</h2>
              <p className="text-xs text-slate-500">
                {diagnosticData.isCompleted
                  ? 'Calculated from your 5-dimensional diagnostic results'
                  : 'Curriculum topics for enrolled track'}
              </p>
            </div>
            <Link
              to="/analytics"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              Detailed Analytics →
            </Link>
          </div>

          <div className="space-y-4">
            {diagnosticData.isCompleted ? (
              diagnosticData.areas.map((area) => (
                <SkillBar
                  key={area.name}
                  name={area.name}
                  score={area.score}
                  level={area.level}
                />
              ))
            ) : (
              skills.map((s) => (
                <SkillBar
                  key={s.name}
                  name={s.name}
                  score={s.score}
                  level="Evaluation Required"
                />
              ))
            )}
          </div>

          <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200/80 flex items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-indigo-600 shrink-0" />
              <span>Target standard: Reach 80%+ mastery to earn verified certificate credential.</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/assessment')}
              className="shrink-0"
            >
              Re-Assess
            </Button>
          </div>
        </Card>

        {/* Right: Activity Log & Learning History (5 cols) */}
        <Card className="lg:col-span-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Milestones</h2>
              <p className="text-xs text-slate-500">Recorded learning sessions</p>
            </div>

            {/* Activity Type Filter Tabs */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium" role="tablist">
              {[
                ['all', 'All'],
                ['assessment', 'Assess'],
                ['lesson', 'Learn'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activityFilter === key}
                  onClick={() => setActivityFilter(key)}
                  className={`rounded-md px-2.5 py-1 transition-colors ${
                    activityFilter === key
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search within activities */}
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learning activity..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white transition"
            />
          </div>

          {/* Activity items */}
          <ul className="divide-y divide-slate-100">
            {filteredActivities.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 py-3 hover:bg-slate-50/60 rounded-lg px-1 transition-colors"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs ${
                    item.type === 'assessment'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  {item.type === 'assessment' ? (
                    <Award size={15} />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{item.meta}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              </li>
            ))}

            {filteredActivities.length === 0 && (
              <li className="py-8 text-center text-xs text-slate-400">
                No matching activities found.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
