import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  RotateCcw, Sparkles, Layers, Loader2
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
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

  const currentQ = questions[currentIndex];
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
    const percentage = areaQuestions.length > 0
      ? Math.round((areaCorrect / areaQuestions.length) * 100)
      : 0;

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
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
            <Sparkles size={13} /> ADAPTIVE DIAGNOSTIC
          </span>
          <span className="text-xs font-semibold text-slate-500">10 Questions · 5 Knowledge Dimensions</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-green-950 sm:text-3xl">
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
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="font-medium text-slate-500 tabular-nums">
                {answeredCount} of {totalQuestions} answered
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-700 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {questions.map((q, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to question ${idx + 1}`}
                    className={`h-2 flex-1 rounded-full transition-all ${isCurrent
                        ? 'bg-emerald-800 ring-2 ring-emerald-300 ring-offset-1'
                        : isAnswered
                          ? 'bg-emerald-400 hover:bg-emerald-500'
                          : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                  />
                );
              })}
            </div>
          </Card>

          {/* Active Question Card */}
          <Card className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <Layers size={14} className="text-emerald-700" />
                {currentQ.area}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Topic: {currentQ.topic}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug sm:text-xl">
              {currentQ.question}
            </h2>

            <div className="grid gap-3">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = answers[currentIndex] === optIdx;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition ${isSelected
                        ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'border border-slate-300 bg-white text-slate-500'
                          }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{option}</span>
                    </span>
                    {isSelected && <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
              >
                <ArrowLeft size={16} /> Previous
              </Button>

              {currentIndex < totalQuestions - 1 ? (
                <Button
                  onClick={() => setCurrentIndex((p) => Math.min(p + 1, totalQuestions - 1))}
                  disabled={answers[currentIndex] === undefined}
                >
                  Next Question <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  disabled={answeredCount < totalQuestions}
                  onClick={() => setSubmitted(true)}
                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                >
                  Submit & Generate Report <Sparkles size={16} />
                </Button>
              )}
            </div>
          </Card>
        </>
      ) : (
        /* Initial Skill Report & Gap Analysis */
        <div className="space-y-6">
          {/* Summary Banner */}
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  DIAGNOSTIC COMPLETE
                </span>
                <h2 className="mt-1 text-2xl font-extrabold text-green-950 sm:text-3xl">
                  {getTier(overallPercentage)}
                </h2>
                <p className="mt-2 text-sm text-slate-600 max-w-lg">
                  You scored <strong className="text-slate-900">{totalCorrect} of {totalQuestions}</strong> correct ({overallPercentage}%).
                  Your roadmap has been automatically customized to skip verified strengths and focus on identified gap areas.
                </p>
              </div>

              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-white border border-emerald-200 shadow-sm text-center">
                <span className="text-3xl font-extrabold text-emerald-900">{overallPercentage}%</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Score</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={startRoadmapGeneration} className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-md">
                Generate My Personalized Roadmap <Sparkles size={16} />
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw size={16} /> Retest Diagnostic
              </Button>
            </div>
          </Card>

          {/* 5 Knowledge Dimensions Breakdown */}
          <Card className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-green-950">Knowledge Dimension Breakdown</h3>
              <p className="text-xs text-slate-500">Evaluated across all 5 engineering competency areas</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {areaBreakdown.map((item) => (
                <div
                  key={item.area}
                  className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{item.area}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${item.percentage >= 80
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                        }`}
                    >
                      {item.percentage >= 80 ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <AlertCircle size={13} />
                      )}
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{item.correct} / {item.total} correct</span>
                    <span className="font-semibold tabular-nums">{item.percentage}%</span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.percentage >= 80 ? 'bg-emerald-600' : 'bg-amber-500'
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
                <CheckCircle2 size={18} /> Verified Strengths
              </div>
              <p className="text-xs text-slate-500">Topics you can skip or fast-track on your path</p>
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
                <AlertCircle size={18} /> Focus & Remediation Areas
              </div>
              <p className="text-xs text-slate-500">Targeted modules injected into your roadmap</p>
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
                <h3 className="text-base font-bold text-green-950">Detailed Answer Review</h3>
                <p className="text-xs text-slate-500">See rationale and pedagogical explanations for each question</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">10 Questions</span>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userChoice = answers[idx];
                const isCorrect = userChoice === q.answer;
                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-4 space-y-2 text-xs ${isCorrect ? 'border-emerald-100 bg-emerald-50/30' : 'border-amber-100 bg-amber-50/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Q{idx + 1}: {q.topic} ({q.area})
                      </span>
                      <span
                        className={`font-semibold ${isCorrect ? 'text-emerald-800' : 'text-amber-800'
                          }`}
                      >
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>

                    <p className="font-medium text-slate-700">{q.question}</p>

                    <p className="text-slate-600">
                      <strong>Your answer:</strong> {q.options[userChoice] || 'None'}{' '}
                      {!isCorrect && (
                        <span className="text-emerald-800">
                          (Correct: {q.options[q.answer]})
                        </span>
                      )}
                    </p>

                    <p className="text-slate-500 italic bg-white/60 p-2 rounded-lg border border-slate-100">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 text-slate-100 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                <Sparkles size={14} className="animate-pulse" /> AI CURRICULUM SYNTHESIZER
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold tabular-nums">
                {generationStep >= 4 ? '100%' : `${Math.min(95, generationStep * 25 + 15)}%`}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {generationStep >= 4 ? 'Roadmap Synthesized!' : 'Generating Personalized Milestone Graph'}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Analyzing diagnostic strengths, pruning redundant topics, and injecting targeted revision nodes.
              </p>
            </div>

            {/* Live Step Progression */}
            <div className="space-y-3 pt-2">
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
                    className={`flex items-start gap-3 rounded-xl p-3 border text-xs transition-all duration-300 ${
                      isDone
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                        : isCurrent
                        ? 'border-emerald-500 bg-emerald-950/50 text-white ring-1 ring-emerald-500/30'
                        : 'border-slate-800 bg-slate-900/50 text-slate-500'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 size={16} className="text-emerald-400 animate-spin" />
                      ) : (
                        <span className="grid h-4 w-4 place-items-center rounded-full border border-slate-700 text-[10px]">
                          {idx + 1}
                        </span>
                      )}
                    </span>
                    <div>
                      <p className={`font-bold ${isCurrent ? 'text-white' : isDone ? 'text-emerald-300' : 'text-slate-400'}`}>
                        {st.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar and skip button */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${generationStep >= 4 ? 100 : Math.min(95, generationStep * 25 + 15)}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate('/roadmap')}
                className="text-xs text-slate-400 hover:text-white font-medium shrink-0 transition"
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
