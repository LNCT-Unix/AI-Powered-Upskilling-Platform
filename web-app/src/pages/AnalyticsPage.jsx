import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Flame, TrendingUp, Award, ChartNoAxesColumnIncreasing, ArrowRight } from 'lucide-react';

export default function AnalyticsPage() {
  const navigate = useNavigate();

  // Load real assessment result from storage
  const assessmentResult = useMemo(() => {
    try {
      const raw = localStorage.getItem('skillpath_assessment_result');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const skills = useMemo(() => {
    return assessmentResult?.skills || [];
  }, [assessmentResult]);

  // Aggregate dimension scores by cluster
  const clusterScores = useMemo(() => {
    if (skills.length === 0) return [];

    const clusterMap = {};
    skills.forEach(s => {
      const c = s.cluster || 'General';
      if (!clusterMap[c]) {
        clusterMap[c] = { total: 0, mastered: 0 };
      }
      clusterMap[c].total += 1;
      if (s.state === 'MASTERED') clusterMap[c].mastered += 1;
    });

    return Object.entries(clusterMap).map(([name, { total, mastered }]) => ({
      name,
      score: Math.round((mastered / total) * 100),
      total,
      mastered,
    }));
  }, [skills]);

  const masteredCount = skills.filter(s => s.state === 'MASTERED').length;
  const frontierCount = skills.filter(s => s.state === 'FRONTIER').length;
  const totalCount = skills.length;
  const overallPct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Adaptive Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Progress & Competency Analysis
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {totalCount > 0
            ? `Calculated from your Item Response Theory diagnostic across ${clusterScores.length} competency clusters.`
            : 'Diagnostic analytics based on your verified engineering skill tree.'}
        </p>
      </div>

      {totalCount === 0 ? (
        <Card className="text-center py-12 px-6 space-y-4 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <ChartNoAxesColumnIncreasing size={26} />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900">No Analytics Available Yet</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Complete your initial diagnostic test to allow the backend adaptive engine to evaluate your cluster proficiencies and ability parameter.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="indigo" onClick={() => navigate('/assessment')}>
              Take Diagnostic Test <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center gap-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-indigo-50 border-indigo-100 text-indigo-600">
                <TrendingUp size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ability (θ)</p>
                <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                  {assessmentResult?.theta > 0 ? `+${assessmentResult.theta}` : assessmentResult?.theta ?? '0.0'}
                </p>
                <p className="text-[11px] text-slate-400">IRT Difficulty Scale</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-amber-50 border-amber-100 text-amber-600">
                <Flame size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Level</p>
                <p className="text-lg font-extrabold text-slate-900 truncate">
                  {assessmentResult?.level || 'Intermediate'}
                </p>
                <p className="text-[11px] text-slate-400">Proficiency Tier</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-emerald-50 border-emerald-100 text-emerald-600">
                <Award size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mastered</p>
                <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                  {masteredCount} / {totalCount}
                </p>
                <p className="text-[11px] text-slate-400">{overallPct}% Track Coverage</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-indigo-50 border-indigo-100 text-indigo-600">
                <ChartNoAxesColumnIncreasing size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Frontiers</p>
                <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                  {frontierCount} Active
                </p>
                <p className="text-[11px] text-slate-400">Next Priority Nodes</p>
              </div>
            </Card>
          </div>

          {/* Radar Chart */}
          {clusterScores.length >= 3 && (
            <Card className="space-y-4 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Skill Cluster Mastery Radar</h2>
                <p className="text-xs text-slate-500">Proportion of verified mastered competencies across technical clusters</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={clusterScores} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar name="Score" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Dimension table */}
          <Card className="space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Competency Cluster Breakdown
            </h2>
            <table className="w-full text-xs border-collapse" aria-label="Skill cluster scores">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Cluster Area</th>
                  <th className="text-right py-2.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Mastered Ratio</th>
                  <th className="text-right py-2.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Score</th>
                  <th className="text-right py-2.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clusterScores.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-800">{c.name}</td>
                    <td className="py-2.5 text-right font-medium text-slate-500">{c.mastered} / {c.total}</td>
                    <td className="py-2.5 text-right tabular-nums font-bold text-slate-900">{c.score}%</td>
                    <td className="py-2.5 text-right">
                      <Badge variant={c.score >= 70 ? 'emerald' : c.score >= 40 ? 'indigo' : 'amber'}>
                        {c.score >= 70 ? 'Mastered' : c.score >= 40 ? 'Developing' : 'Frontier'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
