import { TrendingUp, ClipboardCheck, Flame, Check } from 'lucide-react';
import Card from '../components/ui/Card';
import MetricCard from '../components/ui/MetricCard';
import SkillBar from '../components/ui/SkillBar';
import { skills, activities } from '../data/mockData';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-green-950">Progress analytics</h1>
        <p className="mt-2 text-sm text-slate-500">
          A quick view of sample skill scores and completed assessments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={TrendingUp}
          label="Average skill score"
          value="0%"
          detail="Across 5 sample skills"
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Assessments completed"
          value="0"
          detail="Sample activity history"
          tint="yellow"
        />
        <MetricCard
          icon={Flame}
          label="Learning streak"
          value="0 days"
          detail="Illustrative sample metric"
        />
      </div>

      <Card>
        <h2 className="font-bold text-green-950">Skill-specific scores</h2>
        <div className="mt-6 space-y-5">
          {skills.map((s) => (
            <SkillBar key={s.name} {...s} />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-green-950">Completed assessments</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {activities
            .filter((a) => a.type === 'assessment')
            .map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-50 text-green-800">
                  <Check size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{a.meta}</p>
                </div>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
