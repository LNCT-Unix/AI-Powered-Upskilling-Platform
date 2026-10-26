import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Loader2,
  Zap,
  Lock,
  Compass
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ScoreRing from '../components/ui/ScoreRing';
import { useAdaptiveAssessment } from '../hooks/useAdaptiveAssessment';
import { getTrackUuid } from '../services/assessmentService';

export default function AssessmentPage() {
  const navigate = useNavigate();

  // Read active onboarding profile from localStorage to grab selected track
  const profile = useMemo(() => {
    try {
      const raw = localStorage.getItem('skillpath_onboarding_profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const trackId = profile?.trackUuid || getTrackUuid(profile?.trackId);

  const {
    currentQuestion,
    answeredCount,
    maxQuestions,
    isCompleted,
    results,
    isLoading,
    isSubmitting,
    error,
    handleAnswer,
    resetAssessment,
  } = useAdaptiveAssessment(trackId);

  const [selectedOption, setSelectedOption] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const onSubmitOption = async () => {
    if (selectedOption === null || isSubmitting) return;
    const choice = selectedOption;
    setSelectedOption(null);
    await handleAnswer(choice);
  };

  const handleRetest = async () => {
    setSelectedOption(null);
    await resetAssessment();
  };

  const startRoadmapGeneration = () => {
    // Persist verified skills & frontier gaps for the roadmap engine
    try {
      const roadmapContext = {
        level: results?.level || 'INTERMEDIATE',
        theta: results?.theta ?? 0.0,
        skills: results?.skills || [],
        generatedAt: new Date().toISOString(),
      };
      localStorage.setItem('skillpath_generated_roadmap_context', JSON.stringify(roadmapContext));
    } catch {
      // ignore
    }

    setIsGenerating(true);
    setGenerationStep(0);
    setTimeout(() => setGenerationStep(1), 600);
    setTimeout(() => setGenerationStep(2), 1300);
    setTimeout(() => setGenerationStep(3), 2000);
    setTimeout(() => {
      setGenerationStep(4);
      setTimeout(() => navigate('/roadmap'), 800);
    }, 2800);
  };

  // Score & Tier calculations from Gateway results
  const correctCount = results?.correct ?? 0;
  const totalEvaluated = Math.max(results?.answered ?? answeredCount, 1);
  const scorePercentage = Math.round((correctCount / totalEvaluated) * 100);

  const levelDisplay = useMemo(() => {
    const lvl = results?.level || 'INTERMEDIATE';
    if (lvl === 'ADVANCED') return 'Advanced Technical Practitioner';
    if (lvl === 'INTERMEDIATE') return 'Intermediate Applied Developer';
    return 'Foundational Learner';
  }, [results?.level]);

  // Skill categorizations from Gateway
  const masteredSkills = useMemo(
    () => (results?.skills || []).filter((s) => s.state === 'MASTERED'),
    [results?.skills]
  );
  const frontierSkills = useMemo(
    () => (results?.skills || []).filter((s) => s.state === 'FRONTIER'),
    [results?.skills]
  );
  const lockedSkills = useMemo(
    () => (results?.skills || []).filter((s) => s.state === 'LOCKED'),
    [results?.skills]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2">
          <Badge variant="indigo" icon={Sparkles}>
            PHASE 2: ADAPTIVE EVALUATION
          </Badge>
          <span className="text-xs font-medium text-slate-500">
            Computer Adaptive Testing (CAT) · Dynamic Ability Calibration
          </span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {isCompleted ? 'Initial Skill Report & Gap Analysis' : 'Diagnostic Knowledge Assessment'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isCompleted
            ? 'Your ability parameter (θ) and skill tree have been computed by the adaptive engine.'
            : 'Answer each question sequentially. The engine adapts question difficulty in real time.'}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <Loader2 size={36} className="text-indigo-600 animate-spin" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Initializing Adaptive Diagnostic Engine...
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Calibrating item pool and retrieving your assessment state from the gateway.
            </p>
          </div>
        </Card>
      )}

      {/* Error Banner */}
      {!isLoading && error && (
        <Card className="border-red-200 bg-red-50/60 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900">
              <strong className="font-bold">Assessment Engine Notice:</strong> {error}
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleRetest}>
              <RotateCcw size={14} /> Retry Session
            </Button>
          </div>
        </Card>
      )}

      {/* In-Progress Adaptive Testing Loop */}
      {!isLoading && !isCompleted && currentQuestion && (
        <>
          {/* Progress Tracker Card */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-slate-800 flex items-center gap-2">
                <Zap size={15} className="text-indigo-600" />
                Adaptive Question {answeredCount + 1}
              </span>
              <span className="font-medium text-slate-500 tabular-nums">
                {answeredCount} answered · Cap: {maxQuestions} max
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, ((answeredCount + 1) / maxQuestions) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Item Response Theory (IRT)</span>
              <span>Stops dynamically once proficiency converges</span>
            </div>
          </Card>

          {/* Active Question Card */}
          <Card className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <Badge variant="indigo" icon={Layers}>
                {currentQuestion.area || 'Engineering Competency'}
              </Badge>
              <span className="text-xs font-mono font-medium text-slate-400">
                Item ID: {currentQuestion.itemId?.slice(0, 8)}...
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQuestion.stem}
            </h2>

            <div className="grid gap-2.5">
              {currentQuestion.options?.map((option, optIdx) => {
                const isSelected = selectedOption === optIdx;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedOption(optIdx)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 sm:p-4 text-left text-xs sm:text-sm font-medium transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 text-slate-900 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-lg text-xs font-bold shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-300 bg-slate-50 text-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={18} className="text-indigo-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400">
                {selectedOption !== null ? 'Option selected' : 'Choose an answer above to advance'}
              </span>

              <Button
                variant="indigo"
                size="sm"
                disabled={selectedOption === null || isSubmitting}
                onClick={onSubmitOption}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit Answer <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Completed State: Initial Skill Report & Gap Analysis */}
      {!isLoading && isCompleted && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  DIAGNOSTIC COMPLETE · CAT EVALUATION
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {levelDisplay}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
                  Evaluated across <strong className="text-slate-900">{results?.answered || answeredCount} adaptive questions</strong>. 
                  Estimated ability parameter <strong className="text-slate-900">θ = {results?.theta ?? 0.0}</strong>. 
                  Your roadmap has been automatically customized to skip verified strengths and focus on frontier gaps.
                </p>
              </div>

              <ScoreRing score={scorePercentage} size={96} strokeWidth={8} color="#4f46e5" />
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="indigo"
                onClick={startRoadmapGeneration}
                className="shadow-sm"
              >
                Generate My Personalized Roadmap <Sparkles size={16} />
              </Button>
              <Button variant="outline" onClick={handleRetest}>
                <RotateCcw size={15} /> Retest Diagnostic
              </Button>
            </div>
          </Card>

          {/* Diagnostic Categorization Matrix */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Mastered Skills */}
            <Card className="space-y-3 border-emerald-100 bg-emerald-50/20">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 size={17} className="text-emerald-600" /> Mastered ({masteredSkills.length})
              </div>
              <p className="text-[11px] text-slate-500">Verified strengths fast-tracked on curriculum</p>
              <ul className="space-y-2 pt-1">
                {masteredSkills.length > 0 ? (
                  masteredSkills.map((s) => (
                    <li key={s.skillId} className="rounded-lg bg-white p-2.5 border border-emerald-200/80 text-xs">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.cluster}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400">All foundational areas will receive dedicated milestone coverage.</li>
                )}
              </ul>
            </Card>

            {/* Frontier Skills */}
            <Card className="space-y-3 border-amber-100 bg-amber-50/20">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Compass size={17} className="text-amber-600" /> Frontier Targets ({frontierSkills.length})
              </div>
              <p className="text-[11px] text-slate-500">Optimal target concepts for upcoming milestones</p>
              <ul className="space-y-2 pt-1">
                {frontierSkills.length > 0 ? (
                  frontierSkills.map((s) => (
                    <li key={s.skillId} className="rounded-lg bg-white p-2.5 border border-amber-200/80 text-xs">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.cluster}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400">No immediate frontier gaps identified.</li>
                )}
              </ul>
            </Card>

            {/* Locked Skills */}
            <Card className="space-y-3 border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <Lock size={17} className="text-slate-400" /> Locked ({lockedSkills.length})
              </div>
              <p className="text-[11px] text-slate-500">Advanced skills requiring prerequisite completion</p>
              <ul className="space-y-2 pt-1">
                {lockedSkills.length > 0 ? (
                  lockedSkills.map((s) => (
                    <li key={s.skillId} className="rounded-lg bg-white p-2.5 border border-slate-200 text-xs opacity-80">
                      <p className="font-semibold text-slate-700">{s.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.cluster}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400">Prerequisites cleared for all tracks.</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* Animated AI Roadmap Generation Screen */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="indigo" icon={Sparkles}>
                AI CURRICULUM SYNTHESIZER
              </Badge>
              <span className="text-xs font-mono text-indigo-600 font-bold tabular-nums">
                {generationStep >= 4 ? '100%' : `${Math.min(95, generationStep * 25 + 15)}%`}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {generationStep >= 4 ? 'Roadmap Synthesized!' : 'Generating Personalized Milestone Graph'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Analyzing CAT diagnostic parameters, pruning mastered skills, and scheduling daily frontier blocks.
              </p>
            </div>

            {/* Live Step Progression */}
            <div className="space-y-2.5 pt-1">
              {[
                {
                  title: 'Evaluating CAT diagnostic responses & ability parameter (θ)',
                  desc: `Calibrated learner ability level: ${levelDisplay} (θ = ${results?.theta ?? 0.0}).`,
                },
                {
                  title: `Pruning ${masteredSkills.length} verified strengths from prerequisite graph`,
                  desc: 'Accelerates roadmap by skipping already mastered skills and protocols.',
                },
                {
                  title: `Injecting targeted Revision Modules for ${frontierSkills.length} frontier concepts`,
                  desc: 'Adding bite-sized exercises and doubt assistant contexts for upcoming topics.',
                },
                {
                  title: 'Calibrating topological milestones to study budget',
                  desc: 'Organizing DAG milestone sequence with customized daily learning blocks.',
                },
              ].map((st, idx) => {
                const isDone = generationStep > idx;
                const isCurrent = generationStep === idx;
                return (
                  <div
                    key={st.title}
                    className={`flex items-start gap-3 rounded-lg p-2.5 border text-xs transition-all ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                        : isCurrent
                        ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      ) : isCurrent ? (
                        <Loader2 size={15} className="text-indigo-600 animate-spin" />
                      ) : (
                        <span className="grid h-4 w-4 place-items-center rounded-full border border-slate-300 text-[10px]">
                          {idx + 1}
                        </span>
                      )}
                    </span>
                    <div>
                      <p className={`font-bold ${isCurrent ? 'text-slate-900' : isDone ? 'text-emerald-900' : 'text-slate-500'}`}>
                        {st.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar and skip button */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${generationStep >= 4 ? 100 : Math.min(95, generationStep * 25 + 15)}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate('/roadmap')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold shrink-0 transition cursor-pointer"
              >
                Skip to Roadmap →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
