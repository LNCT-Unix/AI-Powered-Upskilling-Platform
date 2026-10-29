import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';

export default function ProjectVerifyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="w-full rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 shadow-sm text-center animate-slide-up space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 shadow-2xs">
          <ShieldCheck size={32} />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200/80">
            <Sparkles size={13} className="text-amber-600" />
            Coming Soon
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Project Verification & Badges
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            We are building our automated verification engine to evaluate GitHub repositories, run automated testing pipelines, and award verifiable skill badges and completion certificates.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-600 max-w-sm mx-auto space-y-2 text-left">
          <div className="font-semibold text-slate-800">What's in progress:</div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-500">
            <li>Automated GitHub repo linting & test suite execution</li>
            <li>AST code quality checks and dependency vulnerability scanning</li>
            <li>Verifiable digital badges & capstone completion certificates</li>
            <li>Direct integration with competency graph & career portfolio</li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button variant="indigo" onClick={() => navigate('/dashboard')}>
            Back to Dashboard <ArrowRight size={16} />
          </Button>
          <Button variant="outline" onClick={() => navigate('/graph')}>
            Explore Skill Graph
          </Button>
        </div>
      </div>
    </div>
  );
}
