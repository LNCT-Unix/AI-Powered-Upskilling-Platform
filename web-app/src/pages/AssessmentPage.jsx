import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Loader2
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ScoreRing from '../components/ui/ScoreRing';
import { questions, knowledgeAreas } from '../data/mockData';

const STORAGE_KEY = 'skillpath_diagnostic_answers';
const INDEX_STORAGE_KEY = 'skillpath_diagnostic_current_index';
const SUBMITTED_STORAGE_KEY = 'skillpath_diagnostic_submitted';

export default function AssessmentPage() {
  const navigate = useNavigate();

  // Hydrate answers from sessionStorage to prevent accidental loss
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = sessionStorage.getItem(INDEX_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [submitted, setSubmitted] = useState(() => {
    try {
      return sessionStorage.getItem(SUBMITTED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const startRoadmapGeneration = () => {
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

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    sessionStorage.setItem(INDEX_STORAGE_KEY, currentIndex.toString());
    sessionStorage.setItem(SUBMITTED_STORAGE_KEY, submitted.toString());
  }, [answers, currentIndex, submitted]);

  const currentQ = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleSelectOption = (optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(INDEX_STORAGE_KEY);
    sessionStorage.removeItem(SUBMITTED_STORAGE_KEY);
  };

  // Score Calculations for Initial Skill Report
  const totalCorrect = questions.filter((q, i) => answers[i] === q.answer).length;
  const overallPercentage = Math.round((totalCorrect / totalQuestions) * 100);

  // Categorized breakdown across all 5 knowledge areas
  const areaBreakdown = knowledgeAreas.map((areaName) => {
    const areaQuestions = questions.filter((q) => q.area === areaName);
    const areaCorrect = areaQuestions.filter((q) => {
      const qIndex = questions.findIndex((item) => item.id === q.id);
      return answers[qIndex] === q.answer;
    }).length;
    const percentage =
      areaQuestions.length > 0 ? Math.round((areaCorrect / areaQuestions.length) * 100) : 0;

    return {
      area: areaName,
      correct: areaCorrect,
      total: areaQuestions.length,
      percentage,
      status: percentage >= 80 ? 'Mastered' : percentage >= 50 ? 'Proficient' : 'Needs Focus',
    };
  });

  const strengths = areaBreakdown.filter((a) => a.percentage >= 80);
  const gaps = areaBreakdown.filter((a) => a.percentage < 80);

  const getTier = (pct) => {
    if (pct >= 85) return 'Advanced Technical Practitioner';
    if (pct >= 60) return 'Intermediate Applied Developer';
    return 'Foundational Learner';
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2">
          <Badge variant="indigo" icon={Sparkles}>
            PHASE 2: ADAPTIVE EVALUATION
          </Badge>
          <span className="text-xs font-medium text-slate-500">
            10 Questions · 5 Engineering Dimensions
          </span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {submitted ? 'Initial Skill Report & Gap Analysis' : 'Diagnostic Knowledge Assessment'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {submitted
            ? 'Your answers have been analyzed across the 5 core engineering dimensions.'
            : 'Answer each question sequentially. Your answers determine your customized starting milestone.'}
        </p>
      </div>

      {!submitted ? (
        <>
          {/* Progress Tracker Card */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-slate-800">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="font-medium text-slate-500 tabular-nums">
                {answeredCount} of {totalQuestions} answered
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {questions.map((q, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to question ${idx + 1}`}
                    className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 ring-2 ring-indigo-200'
                        : isAnswered
                        ? 'bg-indigo-400 hover:bg-indigo-500'
                        : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                );
              })}
            </div>
          </Card>

          {/* Active Question Card */}
          <Card className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <Badge variant="indigo" icon={Layers}>
                {currentQ.area}
              </Badge>
              <span className="text-xs font-medium text-slate-500">
                Topic: <strong className="text-slate-700">{currentQ.topic}</strong>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h2>

            <div className="grid gap-2.5">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = answers[currentIndex] === optIdx;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
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
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
              >
                <ArrowLeft size={15} /> Previous
              </Button>

              {currentIndex < totalQuestions - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentIndex((p) => Math.min(p + 1, totalQuestions - 1))}
                  disabled={answers[currentIndex] === undefined}
                >
                  Next Question <ArrowRight size={15} />
                </Button>
              ) : (
                <Button
                  variant="indigo"
                  size="sm"
                  disabled={answeredCount < totalQuestions}
                  onClick={() => setSubmitted(true)}
                >
                  Submit & View Gap Analysis <Sparkles size={15} />
                </Button>
              )}
            </div>
          </Card>
        </>
      ) : (
        /* Initial Skill Report & Gap Analysis */
        <div className="space-y-6">
          {/* Summary Banner */}
          <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  DIAGNOSTIC COMPLETE
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {getTier(overallPercentage)}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
                  You scored <strong className="text-slate-900">{totalCorrect} of {totalQuestions}</strong> correct ({overallPercentage}%).
                  Your roadmap has been automatically customized to skip verified strengths and focus on identified gap areas.
                </p>
              </div>

              <ScoreRing score={overallPercentage} size={96} strokeWidth={8} color="#4f46e5" />
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="indigo"
                onClick={startRoadmapGeneration}
                className="shadow-sm"
              >
                Generate My Personalized Roadmap <Sparkles size={16} />
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw size={15} /> Retest Diagnostic
              </Button>
            </div>
          </Card>

          {/* 5 Knowledge Dimensions Breakdown */}
          <Card className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Knowledge Dimension Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Evaluated across all 5 engineering competency areas
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {areaBreakdown.map((item) => (
                <div
                  key={item.area}
                  className="rounded-xl border border-slate-200/90 p-3.5 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">{item.area}</span>
                    <Badge
                      variant={item.percentage >= 80 ? 'emerald' : 'amber'}
                      size="sm"
                      icon={item.percentage >= 80 ? CheckCircle2 : AlertCircle}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{item.correct} / {item.total} correct</span>
                    <span className="font-semibold tabular-nums text-slate-700">{item.percentage}%</span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.percentage >= 80 ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Gap Analysis & Remediation Recommendations */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 size={17} className="text-emerald-600" /> Verified Strengths
              </div>
              <p className="text-xs text-slate-500">Topics fast-tracked on your curriculum</p>
              <ul className="space-y-2 pt-1">
                {strengths.length > 0 ? (
                  strengths.map((s) => (
                    <li key={s.area} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {s.area}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400">All areas will receive dedicated milestone coverage.</li>
                )}
              </ul>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <AlertCircle size={17} className="text-amber-600" /> Focus & Remediation Areas
              </div>
              <p className="text-xs text-slate-500">Targeted revision modules injected into your roadmap</p>
              <ul className="space-y-2 pt-1">
                {gaps.length > 0 ? (
                  gaps.map((g) => (
                    <li key={g.area} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      {g.area} (Revision module inserted)
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400">No major gaps identified! Ready for capstones.</li>
                )}
              </ul>
            </Card>
          </div>

          {/* Question Review with Explanations */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Detailed Answer Review</h3>
                <p className="text-xs text-slate-500">Review pedagogical rationale for each question</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">10 Questions</span>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const userChoice = answers[idx];
                const isCorrect = userChoice === q.answer;
                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-3.5 space-y-2 text-xs ${
                      isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Q{idx + 1}: {q.topic}
                      </span>
                      <span
                        className={`font-semibold ${
                          isCorrect ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>

                    <p className="font-medium text-slate-700">{q.question}</p>

                    <p className="text-slate-600">
                      <strong>Your answer:</strong> {q.options[userChoice] || 'None'}{' '}
                      {!isCorrect && (
                        <span className="text-emerald-700 font-semibold">
                          (Correct: {q.options[q.answer]})
                        </span>
                      )}
                    </p>

                    <p className="text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200/80">
                      💡 {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
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
                Analyzing diagnostic strengths, pruning redundant topics, and injecting targeted revision nodes.
              </p>
            </div>

            {/* Live Step Progression */}
            <div className="space-y-2.5 pt-1">
              {[
                { title: 'Evaluating 10 diagnostic responses across 5 engineering dimensions', desc: 'Determined baseline ability and verified competency bounds.' },
                { title: 'Pruning verified strengths (Closures, SQL Filters)', desc: 'Accelerates roadmap by skipping already mastered topics.' },
                { title: 'Injecting targeted Revision Modules for identified gaps', desc: 'Adding microtask vs macrotask visualizer before async milestones.' },
                { title: 'Calibrating topological milestones to study budget', desc: 'Organizing prerequisite DAG sequence with ~45 min daily blocks.' },
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
