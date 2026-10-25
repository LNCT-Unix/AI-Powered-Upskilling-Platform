import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ClipboardCheck,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import Card from '../components/ui/Card';
import MetricCard from '../components/ui/MetricCard';
import SkillBar from '../components/ui/SkillBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { skills, activities, questions, knowledgeAreas, roadmapItems } from '../data/mockData';

export default function AnalyticsPage() {
  const navigate = useNavigate();

  // Read diagnostic data from sessionStorage
  const diagnosticData = useMemo(() => {
    try {
      const isSubmitted = sessionStorage.getItem('skillpath_diagnostic_submitted') === 'true';
      const answersRaw = sessionStorage.getItem('skillpath_diagnostic_answers');
      const answers = answersRaw ? JSON.parse(answersRaw) : {};

      if (!isSubmitted || Object.keys(answers).length === 0) {
        return { isCompleted: false, score: 0, areas: [] };
      }

      const totalCorrect = questions.filter((q, i) => answers[i] === q.answer).length;
      const score = Math.round((totalCorrect / questions.length) * 100);

      const areas = knowledgeAreas.map((areaName) => {
        const areaQuestions = questions.filter((q) => q.area === areaName);
        const areaCorrect = areaQuestions.filter((q) => {
          const qIdx = questions.findIndex((item) => item.id === q.id);
          return answers[qIdx] === q.answer;
        }).length;
        const pct =
          areaQuestions.length > 0 ? Math.round((areaCorrect / areaQuestions.length) * 100) : 0;
        return {
          name: areaName,
          score: pct,
          level: pct >= 80 ? 'Mastered' : pct >= 50 ? 'Proficient' : 'Needs Review',
        };
      });

      return { isCompleted: true, score, areas };
    } catch {
      return { isCompleted: false, score: 0, areas: [] };
    }
  }, []);

  const completedMilestones = roadmapItems.filter((i) => i.done).length;
  const totalMilestones = roadmapItems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo" icon={Sparkles}>
              LEARNING VELOCITY
            </Badge>
            <span className="text-xs font-medium text-slate-500">Progress Tracker</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Progress Analytics & Mastery
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time competency telemetry, assessment scores, and roadmap completion velocity.
          </p>
        </div>

        {!diagnosticData.isCompleted && (
          <Button
            variant="indigo"
            size="sm"
            onClick={() => navigate('/assessment')}
            className="shrink-0"
          >
            Take Baseline Assessment
          </Button>
        )}
      </div>

      {/* Top Analytics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label="Diagnostic Score"
          value={diagnosticData.isCompleted ? `${diagnosticData.score}%` : 'Uncalibrated'}
          detail={
            diagnosticData.isCompleted
              ? 'Computed from 5 engineering dimensions'
              : 'Take assessment to establish score'
          }
          tint="indigo"
          trend={
            diagnosticData.isCompleted
              ? { value: 'Verified Baseline', positive: true }
              : undefined
          }
        />

        <MetricCard
          icon={ClipboardCheck}
          label="Milestones Mastered"
          value={`${completedMilestones} / ${totalMilestones}`}
          detail={`${totalMilestones - completedMilestones} topics remaining on roadmap`}
          tint="emerald"
          trend={{ value: `${Math.round((completedMilestones / totalMilestones) * 100)}% complete`, positive: true }}
        />

        <MetricCard
          icon={Flame}
          label="Learning Streak"
          value="5 Days"
          detail="Consistent daily 45-min study habit"
          tint="amber"
          trend={{ value: 'Active Streak', positive: true }}
        />

        <MetricCard
          icon={Clock}
          label="Hours Logged"
          value="14.5 hrs"
          detail="Active interactive practice & quizzes"
          tint="slate"
        />
      </div>

      {/* Grid: 5 Knowledge Dimensions & Assessment Records */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: 5 Dimensions Breakdown (7 cols) */}
        <Card className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Engineering Dimension Competency</h2>
              <p className="text-xs text-slate-500">
                Performance across core technical pillars
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Target: 80%</span>
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
                  level="Pending Assessment"
                />
              ))
            )}
          </div>

          <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200/80 flex items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-indigo-600 shrink-0" />
              <span>Gaps are automatically targeted with revision modules in your roadmap.</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/roadmap')}
              className="shrink-0"
            >
              View Roadmap
            </Button>
          </div>
        </Card>

        {/* Right: Completed Assessment History (5 cols) */}
        <Card className="lg:col-span-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Evaluations & Assessments</h2>
            <p className="text-xs text-slate-500">Recent test records and verification results</p>
          </div>

          <ul className="divide-y divide-slate-100">
            {activities
              .filter((a) => a.type === 'assessment')
              .map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs">
                    <CheckCircle2 size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900">{a.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{a.meta}</p>
                  </div>
                  <Badge variant="emerald" size="sm">
                    Passed
                  </Badge>
                </li>
              ))}
          </ul>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/assessment')}
              className="w-full justify-center"
            >
              Take New Diagnostic Quiz <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
