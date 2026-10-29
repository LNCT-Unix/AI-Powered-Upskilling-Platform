import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitFork, Sparkles, ArrowRight, Compass, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import InteractiveSkillGraph from '../components/graph/InteractiveSkillGraph';
import './SkillGraphPage.css';

export default function SkillGraphPage() {
  const navigate = useNavigate();

  const assessmentResult = useMemo(() => {
    try {
      const raw = localStorage.getItem('skillpath_assessment_result');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const skills = useMemo(() => {
    if (!assessmentResult) return [];
    if (Array.isArray(assessmentResult)) return assessmentResult;
    if (Array.isArray(assessmentResult.skills)) return assessmentResult.skills;
    return [];
  }, [assessmentResult]);

  if (skills.length === 0) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="w-full rounded-3xl border border-slate-200/90 bg-[#FFFDF7] p-8 sm:p-12 shadow-xs text-center animate-slide-up">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 mb-5 shadow-2xs">
            <Compass size={32} />
          </div>

          <span className="block text-xs font-bold uppercase tracking-widest text-indigo-700 mb-2">
            Interactive Competency Graph
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Take Initial Screening Test to Unlock Your Personal Graph
          </h1>
          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Select your track and familiar skills during onboarding to launch your adaptive diagnostic test. Your personal learning path and competency nodes will be dynamically rendered on this interactive graph.
          </p>

          {/* Value cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3 text-left">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <GitFork size={16} />
                <span className="text-xs font-bold text-slate-900">Topological DAG</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Visualizes strict prerequisite relationships so you always know which skills unblock advanced topics.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Sparkles size={16} />
                <span className="text-xs font-bold text-slate-900">Adaptive Calibration</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Uses 1D Item Response Theory to classify skills into Ready to Learn and Locked states.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <CheckCircle2 size={16} />
                <span className="text-xs font-bold text-slate-900">Zero Dummy Data</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Nodes and edges accurately mirror your backend-verified progress rather than placeholder data.
              </p>
            </div>
          </div>

          {/* CTA actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/onboarding')}>
              Start Initial Screening Test <ArrowRight size={16} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="graph-page-container flex flex-col h-[calc(100vh-80px)]">
      {/* Contextual Top Utility Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-800">
            {assessmentResult?.level ? `${assessmentResult.level} Learner Graph` : 'Calibrated Skill Graph'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/assessment')}
            className="text-xs"
          >
            Review Diagnostic Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/onboarding')}
            className="text-xs"
          >
            Retest / Switch Track
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <InteractiveSkillGraph skills={skills} height="100%" showHeader={true} />
      </div>
    </div>
  );
}
