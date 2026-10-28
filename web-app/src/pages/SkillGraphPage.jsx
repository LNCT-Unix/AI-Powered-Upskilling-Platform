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

  const skills = assessmentResult?.skills || [];

  if (skills.length === 0) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="w-full rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-8 sm:p-12 shadow-xs text-center animate-slide-up">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EFEAFC] border border-[#7C5CFA]/20 text-[#7C5CFA] mb-5 shadow-2xs">
            <Compass size={32} />
          </div>

          <span className="block text-xs font-bold uppercase tracking-widest text-[#7C5CFA] mb-2">
            Interactive Competency Graph
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F2A3E] tracking-tight">
            Take Diagnostic Test to Unlock Graph
          </h1>
          <p className="mt-3 text-sm text-[#6E6880] max-w-xl mx-auto leading-relaxed">
            Your dependency topology and competency levels are mapped directly from your adaptive test results. Complete the adaptive diagnostic test to calibrate your personal skill graph.
          </p>

          {/* Value cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3 text-left">
            <div className="rounded-2xl border border-[#E8E0CC] bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-[#7C5CFA] mb-2">
                <GitFork size={16} />
                <span className="text-xs font-bold text-[#2F2A3E]">Topological DAG</span>
              </div>
              <p className="text-[11px] text-[#6E6880] leading-relaxed">
                Visualizes strict prerequisite relationships so you always know which skills unblock advanced topics.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E0CC] bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-[#FF9838] mb-2">
                <Sparkles size={16} />
                <span className="text-xs font-bold text-[#2F2A3E]">Adaptive Calibration</span>
              </div>
              <p className="text-[11px] text-[#6E6880] leading-relaxed">
                Uses 1D Item Response Theory to classify skills into Unlocked, Frontier, and Locked states.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E0CC] bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-[#2FBF8F] mb-2">
                <CheckCircle2 size={16} />
                <span className="text-xs font-bold text-[#2F2A3E]">Zero Dummy Data</span>
              </div>
              <p className="text-[11px] text-[#6E6880] leading-relaxed">
                Nodes and edges accurately mirror your backend-verified progress rather than placeholder data.
              </p>
            </div>
          </div>

          {/* CTA actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/assessment')}>
              Take Diagnostic Test (5-10 min) <ArrowRight size={16} />
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
    <div className="graph-page-container">
      <InteractiveSkillGraph skills={skills} height="calc(100vh - 120px)" showHeader={true} />
    </div>
  );
}
