import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Loader2,
  Lock,
  Compass,
  Zap,
  XCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Network,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ScoreRing from '../components/ui/ScoreRing';
import { assessmentService, BACKEND_TRACK_ID } from '../services/assessmentService';

const ASSESSMENT_ID_KEY = 'skillpath_assessment_id';
const ASSESSMENT_RESULT_KEY = 'skillpath_assessment_result';

export default function AssessmentPage() {
  const navigate = useNavigate();

  const [assessmentState, setAssessmentState] = useState(null);
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem(ASSESSMENT_RESULT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [skillFilter, setSkillFilter] = useState('all');

  const toggleQuestionExpand = (seq) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [seq]: prev[seq] === undefined ? false : !prev[seq],
    }));
  };

  const toggleAllQuestions = (expand) => {
    if (!result?.responses) return;
    const next = {};
    result.responses.forEach((_, idx) => {
      next[idx] = expand;
    });
    setExpandedQuestions(next);
  };

  // Helper to safely load comprehensive report or fall back to legacy result
  const fetchFinalReport = async (assessmentId) => {
    try {
      const report = await assessmentService.getReport(assessmentId);
      return {
        ...report,
        theta: report.finalTheta !== undefined ? report.finalTheta : (report.theta ?? 0),
        unlockedSkills: report.unlockedSkills || (report.skills || []).filter(s => s.state === 'MASTERED' || s.state === 'FRONTIER'),
        responses: report.responses || [],
      };
    } catch {
      const legacyResult = await assessmentService.getResult(assessmentId);
      return {
        ...legacyResult,
        finalTheta: legacyResult?.theta ?? 0,
        unlockedSkills: (legacyResult?.skills || []).filter(s => s.state === 'MASTERED' || s.state === 'FRONTIER'),
        responses: [],
      };
    }
  };

  // Initialize or resume assessment on mount
  useEffect(() => {
    let ignore = false;

    async function loadInitialAssessment() {
      try {
        const savedId = sessionStorage.getItem(ASSESSMENT_ID_KEY);

        // 1. If an assessment ID is in session, attempt to resume it
        if (savedId) {
          try {
            const state = await assessmentService.getState(savedId);
            if (ignore) return;
            setAssessmentState(state);

            if (state.done || state.status === 'COMPLETED') {
              const report = await fetchFinalReport(savedId);
              if (ignore) return;
              setResult(report);
              localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
            }
            setLoading(false);
            return;
          } catch {
            sessionStorage.removeItem(ASSESSMENT_ID_KEY);
          }
        }

        // 2. Otherwise start a new test using track & declared skills from onboarding profile
        const profile = (() => {
          try {
            return JSON.parse(localStorage.getItem('skillpath_onboarding_profile') || '{}');
          } catch {
            return {};
          }
        })();

        const targetTrackId = profile.trackId || BACKEND_TRACK_ID;
        const declaredSkills = Array.isArray(profile.knownSkillSlugs) ? profile.knownSkillSlugs : [];

        const state = await assessmentService.startAssessment(targetTrackId, declaredSkills);
        if (ignore) return;
        setAssessmentState(state);
        sessionStorage.setItem(ASSESSMENT_ID_KEY, state.assessmentId);

        if (state.done || state.status === 'COMPLETED') {
          const report = await fetchFinalReport(state.assessmentId);
          if (ignore) return;
          setResult(report);
          localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Unable to connect to diagnostic engine.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialAssessment();

    return () => {
      ignore = true;
    };
  }, []);

  // Submit answer for current question
  const handleSubmitAnswer = async () => {
    if (selectedOption === null || submitting || !assessmentState?.question?.itemId) return;

    setSubmitting(true);
    setError(null);

    try {
      const updatedState = await assessmentService.submitAnswer(
        assessmentState.assessmentId,
        assessmentState.question.itemId,
        selectedOption
      );

      setAssessmentState(updatedState);
      setSelectedOption(null);

      // Check if assessment completed
      if (updatedState.done || updatedState.status === 'COMPLETED') {
        const report = await fetchFinalReport(updatedState.assessmentId);
        setResult(report);
        localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
      }
    } catch (err) {
      // Gracefully recover if 409 Conflict (e.g. out of order response or already submitted)
      if (
        err.status === 409 ||
        err.message?.includes('409') ||
        err.message?.toLowerCase().includes('conflict') ||
        err.message?.toLowerCase().includes('already')
      ) {
        try {
          const freshState = await assessmentService.getState(assessmentState.assessmentId);
          setAssessmentState(freshState);
          setSelectedOption(null);
          if (freshState.done || freshState.status === 'COMPLETED') {
            const report = await fetchFinalReport(freshState.assessmentId);
            setResult(report);
            localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
          }
          return;
        } catch {
          // fall through to error display
        }
      }
      setError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetest = async () => {
    sessionStorage.removeItem(ASSESSMENT_ID_KEY);
    localStorage.removeItem(ASSESSMENT_RESULT_KEY);
    setResult(null);
    setSelectedOption(null);
    setLoading(true);
    setError(null);

    try {
      const profile = (() => {
        try {
          return JSON.parse(localStorage.getItem('skillpath_onboarding_profile') || '{}');
        } catch {
          return {};
        }
      })();

      const targetTrackId = profile.trackId || BACKEND_TRACK_ID;
      const declaredSkills = Array.isArray(profile.knownSkillSlugs) ? profile.knownSkillSlugs : [];

      const state = await assessmentService.startAssessment(targetTrackId, declaredSkills);
      setAssessmentState(state);
      sessionStorage.setItem(ASSESSMENT_ID_KEY, state.assessmentId);

      if (state.done || state.status === 'COMPLETED') {
        const report = await fetchFinalReport(state.assessmentId);
        setResult(report);
        localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to diagnostic engine.');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = result !== null || assessmentState?.done || assessmentState?.status === 'COMPLETED';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 size={36} className="animate-spin text-indigo-600" aria-hidden="true" />
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">Connecting to CAT Adaptive Engine...</p>
          <p className="text-xs text-slate-500 mt-1">Calibrating question difficulty to your skill frontier</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !assessmentState && !result) {
    return (
      <div className="mx-auto max-w-xl p-6 sm:p-8 space-y-5">
        <Card className="text-center py-10 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Assessment Service Unavailable</h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">{error}</p>
          </div>
          <Button variant="primary" onClick={handleRetest}>
            <RotateCcw size={14} /> Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  const answered = assessmentState?.answered ?? assessmentState?.progress?.answered ?? 0;
  const maxQuestions = assessmentState?.max ?? assessmentState?.progress?.max ?? 9;
  const currentQ = assessmentState?.question;

  const allSkillsList = result?.skills || [];
  const unlockedSkills =
    result?.unlockedSkills && result.unlockedSkills.length > 0
      ? result.unlockedSkills
      : allSkillsList.filter((s) => s.state === 'MASTERED' || s.state === 'FRONTIER');
  const masteredSkills = allSkillsList.filter((s) => s.state === 'MASTERED');
  const frontierSkills = allSkillsList.filter((s) => s.state === 'FRONTIER');
  const lockedSkills = allSkillsList.filter((s) => s.state === 'LOCKED');

  const displayedSkills = allSkillsList.filter((skill) => {
    if (skillFilter === 'UNLOCKED') return skill.state === 'MASTERED' || skill.state === 'FRONTIER';
    if (skillFilter === 'MASTERED') return skill.state === 'MASTERED';
    if (skillFilter === 'FRONTIER') return skill.state === 'FRONTIER';
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {isCompleted ? 'Initial Skill Report & Gap Analysis' : 'Diagnostic Knowledge Assessment'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isCompleted
            ? 'Your ability parameter (θ) has converged. Verified strengths and frontier gaps are mapped below.'
            : 'Question difficulty dynamically calibrates after every answer based on your performance.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isCompleted && currentQ ? (
        <>
          {/* Progress Tracker Card */}
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  Question {answered + 1}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Up to {maxQuestions} max
                </span>
              </div>
              <span className="font-medium text-slate-500 tabular-nums text-xs">
                {answered} answered ({Math.round((answered / maxQuestions) * 100)}% progress)
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 relative">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(8, (answered / maxQuestions) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Calibration threshold: 5 questions</span>
              <span>θ Convergence auto-stop</span>
            </div>
          </Card>

          {/* Active Dynamic Question Card */}
          <Card className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="indigo" icon={Layers}>
                  Adaptive Item (IRT)
                </Badge>
                <Badge variant="neutral" icon={Zap}>
                  Live Difficulty
                </Badge>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Item: {currentQ.itemId ? currentQ.itemId.slice(0, 8) : 'CAT'}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.stem}
            </h2>

            <div className="grid gap-2.5">
              {(() => {
                const optionsList = Array.isArray(currentQ?.options)
                  ? currentQ.options
                  : typeof currentQ?.options === 'string'
                  ? JSON.parse(currentQ.options)
                  : [];
                return optionsList.map((option, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={submitting}
                      onClick={() => !submitting && setSelectedOption(optIdx)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3.5 sm:p-4 text-left text-xs sm:text-sm font-medium transition ${
                        submitting ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 text-slate-900 ring-2 ring-indigo-500/30 shadow-sm'
                          : 'border-slate-100 bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`grid h-7 w-7 place-items-center rounded-xl text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'border border-slate-200 bg-slate-50 text-slate-600'
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
                });
              })()}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400">
                {selectedOption !== null
                  ? `Selected: Option ${String.fromCharCode(65 + selectedOption)}`
                  : 'Select an option above to continue'}
              </span>
              <Button
                variant="indigo"
                size="md"
                disabled={selectedOption === null || submitting}
                loading={submitting}
                onClick={handleSubmitAnswer}
              >
                Submit Answer & Next <ArrowRight size={15} />
              </Button>
            </div>
          </Card>
        </>
      ) : isCompleted && result ? (
        /* Real CAT Assessment Result View */
        <div className="space-y-6">
          {/* Summary Banner */}
          <Card className="border-indigo-100 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    DIAGNOSTIC COMPLETE
                  </span>
                  {result.stopReason && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {result.stopReason.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {result.level || 'INTERMEDIATE'} Learner
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
                  You answered <strong className="text-slate-900">{result.correct} of {result.answered}</strong> questions correctly.
                  Ability parameter θ converged at{' '}
                  <span className="font-mono font-bold text-indigo-600">
                    {typeof result.theta === 'number'
                      ? (result.theta > 0 ? `+${result.theta.toFixed(2)}` : result.theta.toFixed(2))
                      : result.theta}
                  </span>.
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                    {(result.skills || []).filter(s => s.state === 'MASTERED').length} Mastered
                  </span>
                  <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                    {(result.skills || []).filter(s => s.state === 'FRONTIER').length} Frontier Skills
                  </span>
                  <span className="text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3 py-1">
                    {(result.skills || []).filter(s => s.state === 'LOCKED').length} Locked
                  </span>
                </div>
              </div>

              <ScoreRing
                score={result.answered ? Math.round((result.correct / result.answered) * 100) : 75}
                size={96}
                strokeWidth={8}
                color="#4f46e5"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="indigo"
                onClick={() => navigate('/graph')}
                className="shadow-sm"
              >
                <Network size={16} /> Explore Updated Skill Graph <ArrowRight size={16} />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/roadmap')}
              >
                View Calibrated Roadmap
              </Button>
              <Button variant="ghost" onClick={handleRetest}>
                <RotateCcw size={15} /> Retest Diagnostic
              </Button>
            </div>
          </Card>

          {/* Question-by-Question Breakdown */}
          {result.responses && result.responses.length > 0 && (
            <Card className="space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Question-by-Question Review
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed breakdown of your answers, solutions, and tested competencies
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {result.responses.filter((r) => r.correct).length} of {result.responses.length} Correct
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const allExpanded = result.responses.every((_, idx) => expandedQuestions[idx] !== false);
                      toggleAllQuestions(!allExpanded);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition px-2 py-1 cursor-pointer"
                  >
                    {result.responses.every((_, idx) => expandedQuestions[idx] !== false)
                      ? 'Collapse All'
                      : 'Expand All'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {result.responses.map((resp, idx) => {
                  const isCorrect = resp.correct;
                  const isExpanded = expandedQuestions[idx] !== false;
                  const opts = Array.isArray(resp.options)
                    ? resp.options
                    : typeof resp.options === 'string'
                    ? JSON.parse(resp.options)
                    : [];

                  return (
                    <div
                      key={resp.seq || idx}
                      className={`rounded-2xl border transition-all ${
                        isCorrect
                          ? 'border-emerald-100/90 bg-white hover:border-emerald-200'
                          : 'border-rose-100/90 bg-white hover:border-rose-200'
                      } shadow-xs overflow-hidden`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleQuestionExpand(idx)}
                        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="grid h-6 w-6 place-items-center rounded-lg bg-slate-200/80 text-xs font-bold text-slate-700">
                            {resp.seq || idx + 1}
                          </span>
                          <Badge
                            variant={isCorrect ? 'emerald' : 'rose'}
                            size="sm"
                            icon={isCorrect ? CheckCircle2 : XCircle}
                          >
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                          {(resp.skillName || resp.skillSlug) && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50/80 border border-indigo-100/80 text-[11px] font-medium text-indigo-700">
                              <Tag size={11} className="shrink-0" />
                              <span className="truncate max-w-[200px] sm:max-w-xs">
                                {resp.skillName || resp.skillSlug}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="text-slate-400 hover:text-slate-600 shrink-0">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 space-y-4 border-t border-slate-100">
                          <p className="text-sm font-semibold text-slate-900 leading-snug">
                            {resp.questionStem}
                          </p>

                          {/* Options List */}
                          <div className="grid gap-2">
                            {opts.map((option, optIdx) => {
                              const isSelectedByUser = optIdx === resp.selectedOption;
                              const isCorrectAnswer = optIdx === resp.correctOption;

                              let optionClasses = 'border-slate-100 bg-slate-50/40 text-slate-600';
                              let badgeElement = null;

                              if (isSelectedByUser && isCorrectAnswer) {
                                optionClasses =
                                  'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-medium ring-1 ring-emerald-300';
                                badgeElement = (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                                    <CheckCircle2 size={12} /> Your Choice (Correct)
                                  </span>
                                );
                              } else if (isSelectedByUser && !isCorrectAnswer) {
                                optionClasses =
                                  'border-rose-300 bg-rose-50/60 text-rose-900 font-medium ring-1 ring-rose-300';
                                badgeElement = (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full shrink-0">
                                    <XCircle size={12} /> Your Choice
                                  </span>
                                );
                              } else if (isCorrectAnswer) {
                                optionClasses =
                                  'border-emerald-200 border-dashed bg-emerald-50/30 text-emerald-800 font-medium';
                                badgeElement = (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                                    <CheckCircle2 size={12} /> Correct Solution
                                  </span>
                                );
                              }

                              return (
                                <div
                                  key={option}
                                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs sm:text-sm ${optionClasses}`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={`grid h-6 w-6 place-items-center rounded-lg text-xs font-bold shrink-0 ${
                                        isSelectedByUser
                                          ? isCorrectAnswer
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-rose-600 text-white'
                                          : isCorrectAnswer
                                          ? 'border border-emerald-300 bg-emerald-100 text-emerald-800'
                                          : 'border border-slate-200 bg-white text-slate-500'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span>{option}</span>
                                  </div>
                                  {badgeElement}
                                </div>
                              );
                            })}
                          </div>

                          {/* Detail Note */}
                          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
                            <span>
                              Your answer:{' '}
                              <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                                {resp.yourAnswer || `Option ${String.fromCharCode(65 + resp.selectedOption)}`}
                              </strong>
                            </span>
                            {!isCorrect && (
                              <span>
                                Correct answer:{' '}
                                <strong className="text-emerald-700">
                                  {resp.correctAnswer || `Option ${String.fromCharCode(65 + resp.correctOption)}`}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Unlocked Competencies & Skill Graph Showcase */}
          <Card className="space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Unlocked Competencies & Skill Graph
                  </h3>
                  <Badge variant="indigo" size="sm" icon={Sparkles}>
                    {unlockedSkills.length} Unlocked
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Your personalized knowledge graph has updated. Mastered skills and unlocked frontier nodes ready for study.
                </p>
              </div>

              <Button
                variant="indigo"
                size="md"
                onClick={() => navigate('/graph')}
                className="shrink-0 shadow-sm"
              >
                <Network size={15} /> Explore Skill Graph <ArrowRight size={15} />
              </Button>
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Mastered Skills</span>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-900">{masteredSkills.length}</div>
                <p className="text-[11px] text-emerald-700">Demonstrated or pre-declared</p>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-800">Frontier Skills</span>
                  <Sparkles size={16} className="text-indigo-600" />
                </div>
                <div className="text-2xl font-extrabold text-indigo-900">{frontierSkills.length}</div>
                <p className="text-[11px] text-indigo-700">Prerequisites met — ready to learn</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Locked Skills</span>
                  <Lock size={16} className="text-slate-400" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{lockedSkills.length}</div>
                <p className="text-[11px] text-slate-500">Requires completing frontier nodes</p>
              </div>
            </div>

            {/* Filter Tabs & Competency Nodes List */}
            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verified Skill Nodes ({allSkillsList.length})
                </h4>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSkillFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      skillFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All ({allSkillsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillFilter('UNLOCKED')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      skillFilter === 'UNLOCKED'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Unlocked ({unlockedSkills.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillFilter('MASTERED')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      skillFilter === 'MASTERED'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Mastered ({masteredSkills.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillFilter('FRONTIER')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      skillFilter === 'FRONTIER'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Frontier ({frontierSkills.length})
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {displayedSkills.map((skill) => {
                  const isMastered = skill.state === 'MASTERED';
                  const isFrontier = skill.state === 'FRONTIER';
                  return (
                    <div
                      key={skill.skillId || skill.slug || skill.name}
                      className={`rounded-2xl border p-4 transition ${
                        isMastered
                          ? 'border-emerald-200/80 bg-emerald-50/20 hover:border-emerald-300'
                          : isFrontier
                          ? 'border-indigo-200/80 bg-indigo-50/20 hover:border-indigo-300 ring-1 ring-indigo-500/10'
                          : 'border-slate-100 bg-slate-50/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {skill.name}
                        </span>
                        <Badge
                          variant={isMastered ? 'emerald' : isFrontier ? 'indigo' : 'neutral'}
                          size="sm"
                          icon={isMastered ? CheckCircle2 : isFrontier ? Sparkles : Lock}
                        >
                          {isMastered ? 'Mastered' : isFrontier ? 'Frontier' : 'Locked'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Cluster: {skill.cluster || 'Core'}</span>
                        {skill.slug && <span className="font-mono text-slate-400">{skill.slug}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Callout Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-purple-500/10 border border-indigo-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-900">
                  Ready to map your complete learning progression?
                </h4>
                <p className="text-xs text-slate-500">
                  View interactive dependency links, prerequisite paths, and begin mastering your unlocked frontier skills.
                </p>
              </div>
              <Button
                variant="indigo"
                size="md"
                onClick={() => navigate('/graph')}
                className="shrink-0 shadow-sm"
              >
                <Network size={15} /> Explore Updated Skill Graph <ArrowRight size={15} />
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-10 space-y-3">
          <Compass size={32} className="mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">No active test session</p>
          <Button variant="primary" onClick={handleRetest}>
            Start Diagnostic Test
          </Button>
        </Card>
      )}
    </div>
  );
}
