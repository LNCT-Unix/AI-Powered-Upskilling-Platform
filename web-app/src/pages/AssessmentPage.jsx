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
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ScoreRing from '../components/ui/ScoreRing';
import { assessmentService, normalizeTrackId, BACKEND_TRACK_ID } from '../services/assessmentService';

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

  // Initialize assessment on mount
  useEffect(() => {
    let ignore = false;

    async function loadInitialAssessment() {
      try {
        const savedId = sessionStorage.getItem(ASSESSMENT_ID_KEY);

        if (savedId) {
          try {
            const state = await assessmentService.getState(savedId);
            if (ignore) return;
            setAssessmentState(state);

            if (state.done || state.status === 'COMPLETED') {
              const res = await assessmentService.getResult(savedId);
              if (ignore) return;
              setResult(res);
              localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(res));
            }
            setLoading(false);
            return;
          } catch {
            sessionStorage.removeItem(ASSESSMENT_ID_KEY);
          }
        }

        // Start new or resume active test for track with normalized UUID
        const trackId = (() => {
          try {
            const profile = JSON.parse(localStorage.getItem('skillpath_onboarding_profile') || '{}');
            return normalizeTrackId(profile.trackId || profile.trackSlug);
          } catch {
            return BACKEND_TRACK_ID;
          }
        })();

        const state = await assessmentService.startOrResume(trackId);
        if (ignore) return;
        setAssessmentState(state);
        sessionStorage.setItem(ASSESSMENT_ID_KEY, state.assessmentId);

        if (state.done || state.status === 'COMPLETED') {
          const res = await assessmentService.getResult(state.assessmentId);
          if (ignore) return;
          setResult(res);
          localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(res));
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
    if (selectedOption === null || !assessmentState?.question?.itemId) return;

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
        const res = await assessmentService.getResult(updatedState.assessmentId);
        setResult(res);
        localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(res));
      }
    } catch (err) {
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
      const trackId = (() => {
        try {
          const profile = JSON.parse(localStorage.getItem('skillpath_onboarding_profile') || '{}');
          return normalizeTrackId(profile.trackId || profile.trackSlug);
        } catch {
          return BACKEND_TRACK_ID;
        }
      })();

      const state = await assessmentService.startOrResume(trackId);
      setAssessmentState(state);
      sessionStorage.setItem(ASSESSMENT_ID_KEY, state.assessmentId);

      if (state.done || state.status === 'COMPLETED') {
        const res = await assessmentService.getResult(state.assessmentId);
        setResult(res);
        localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(res));
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
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-slate-800">
                Question {answered + 1}
              </span>
              <span className="font-medium text-slate-500 tabular-nums">
                {answered} of maximum {maxQuestions} answered
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(10, (answered / maxQuestions) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              The engine automatically concludes early once your ability level stabilizes (minimum 5 questions).
            </p>
          </Card>

          {/* Active Dynamic Question Card */}
          <Card className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <Badge variant="indigo" icon={Layers}>
                Adaptive Item
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                ID: {currentQ.itemId ? currentQ.itemId.slice(0, 8) : 'CAT'}
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
                      onClick={() => setSelectedOption(optIdx)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3.5 sm:p-4 text-left text-xs sm:text-sm font-medium transition cursor-pointer ${
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
            <div className="flex items-center justify-end border-t border-slate-100 pt-4">
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
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  DIAGNOSTIC COMPLETE
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {result.level || 'INTERMEDIATE'} Learner
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
                  You answered <strong className="text-slate-900">{result.correct} of {result.answered}</strong> questions correctly.
                  Ability parameter θ converged at <span className="font-mono font-bold text-indigo-600">{result.theta > 0 ? `+${result.theta}` : result.theta}</span>.
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
                onClick={() => navigate('/roadmap')}
                className="shadow-sm"
              >
                View Calibrated Roadmap <ArrowRight size={16} />
              </Button>
              <Button variant="outline" onClick={handleRetest}>
                <RotateCcw size={15} /> Retest Diagnostic
              </Button>
            </div>
          </Card>

          {/* Skill Tree from Backend */}
          <Card className="space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Calibrated Skill Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  State evaluated across competency clusters
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {(result.skills || []).length} Verified Nodes
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(result.skills || []).map((skill) => {
                const isMastered = skill.state === 'MASTERED';
                const isFrontier = skill.state === 'FRONTIER';
                return (
                  <div
                    key={skill.skillId || skill.name}
                    className={`rounded-2xl border p-4 transition ${
                      isMastered
                        ? 'border-emerald-100 bg-emerald-50/20'
                        : isFrontier
                        ? 'border-indigo-100 bg-indigo-50/20'
                        : 'border-slate-100 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {skill.name}
                      </span>
                      <Badge
                        variant={isMastered ? 'emerald' : isFrontier ? 'indigo' : 'neutral'}
                        size="sm"
                        icon={isMastered ? CheckCircle2 : isFrontier ? Sparkles : Lock}
                      >
                        {skill.state}
                      </Badge>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">
                      Cluster: {skill.cluster || 'General'}
                    </p>
                  </div>
                );
              })}
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
