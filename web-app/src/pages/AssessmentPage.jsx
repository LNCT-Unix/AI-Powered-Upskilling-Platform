import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Loader2,
  Compass,
  Zap,
  XCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Network,
  Server,
  Check,
  Search,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ScoreRing from '../components/ui/ScoreRing';
import { assessmentService, BACKEND_TRACK_ID } from '../services/assessmentService';

const ASSESSMENT_ID_KEY = 'skillpath_assessment_id';
const ASSESSMENT_RESULT_KEY = 'skillpath_assessment_result';

const CLUSTER_NAMES = {
  foundations: 'Foundations & CS',
  'web-apis': 'Web APIs & Protocols',
  databases: 'Databases & Modeling',
  security: 'Security & Auth',
  architecture: 'Architecture & Patterns',
  performance: 'Performance & Caching',
  'async-distributed': 'Async & Distributed Systems',
  'quality-observability': 'Testing & Observability',
  devops: 'DevOps & Cloud',
};

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

  // Pre-test configuration questionnaire state
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(BACKEND_TRACK_ID);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [skillsList, setSkillsList] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [selectedSkillSlugs, setSelectedSkillSlugs] = useState(new Set());
  const [skillSearch, setSkillSearch] = useState('');

  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preparingReport, setPreparingReport] = useState(false);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

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
        unlockedSkills: report.unlockedSkills || (report.skills || []).filter(s => s.state === 'MASTERED' || s.status === 'unlocked' || s.state === 'READY_TO_LEARN'),
        responses: report.responses || [],
      };
    } catch {
      const legacyResult = await assessmentService.getResult(assessmentId);
      return {
        ...legacyResult,
        finalTheta: legacyResult?.theta ?? 0,
        unlockedSkills: (legacyResult?.skills || []).filter(s => s.state === 'MASTERED' || s.status === 'unlocked' || s.state === 'READY_TO_LEARN'),
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
              setPreparingReport(true);
              try {
                const report = await fetchFinalReport(savedId);
                if (ignore) return;
                setResult(report);
                localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
              } finally {
                if (!ignore) setPreparingReport(false);
              }
            }
            setLoading(false);
            return;
          } catch {
            sessionStorage.removeItem(ASSESSMENT_ID_KEY);
          }
        }

        // 2. If a completed result exists in localStorage and no active test in session
        const savedResult = localStorage.getItem(ASSESSMENT_RESULT_KEY);
        if (savedResult) {
          try {
            const parsed = JSON.parse(savedResult);
            if (parsed && (parsed.skills || parsed.answered)) {
              if (ignore) return;
              setResult(parsed);
              setLoading(false);
              return;
            }
          } catch {
            // ignore
          }
        }

        // 3. Otherwise: ask the questions (Track and Skills) before starting any test!
        if (!ignore) {
          setIsConfiguring(true);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Unable to connect to diagnostic engine.');
          setLoading(false);
        }
      }
    }

    loadInitialAssessment();

    return () => {
      ignore = true;
    };
  }, []);

  // Load tracks and track skills whenever configuration mode is active
  useEffect(() => {
    if (!isConfiguring) return;
    let ignore = false;

    async function loadTracksAndSkills() {
      try {
        setLoadingConfig(true);
        const tracksData = await assessmentService.getTracks();
        if (ignore) return;

        let activeTrackId = selectedTrackId || BACKEND_TRACK_ID;
        if (Array.isArray(tracksData) && tracksData.length > 0) {
          setTracks(tracksData);
          const found = tracksData.find((t) => t.trackId === activeTrackId);
          if (found) {
            setSelectedTrack(found);
          } else {
            activeTrackId = tracksData[0].trackId;
            setSelectedTrackId(activeTrackId);
            setSelectedTrack(tracksData[0]);
          }
        }

        const skillsData = await assessmentService.getSkillsForTrack(activeTrackId);
        if (ignore) return;
        if (Array.isArray(skillsData)) {
          setSkillsList(skillsData);
        }
      } catch (err) {
        console.warn('Unable to load tracks or skills:', err);
      } finally {
        if (!ignore) {
          setLoadingConfig(false);
        }
      }
    }

    loadTracksAndSkills();

    return () => {
      ignore = true;
    };
  }, [isConfiguring]);

  const handleTrackChange = async (e) => {
    const tId = e.target.value;
    setSelectedTrackId(tId);
    const found = tracks.find((t) => t.trackId === tId);
    setSelectedTrack(found || null);
    setSelectedSkillSlugs(new Set());
    try {
      setLoadingConfig(true);
      const skillsData = await assessmentService.getSkillsForTrack(tId);
      if (Array.isArray(skillsData)) {
        setSkillsList(skillsData);
      }
    } catch (err) {
      console.warn('Unable to load track skills:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const toggleSkill = (slug) => {
    setSelectedSkillSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const handleClearSkills = () => {
    setSelectedSkillSlugs(new Set());
  };

  // Group and filter skills by cluster for the checklist
  const groupedSkills = useMemo(() => {
    const searchLower = skillSearch.trim().toLowerCase();
    const filtered = skillsList.filter((s) => {
      if (!searchLower) return true;
      return (
        s.name.toLowerCase().includes(searchLower) ||
        (s.cluster && s.cluster.toLowerCase().includes(searchLower))
      );
    });

    const groups = {};
    filtered.forEach((s) => {
      const c = s.cluster || 'general';
      if (!groups[c]) groups[c] = [];
      groups[c].push(s);
    });

    return groups;
  }, [skillsList, skillSearch]);

  const handleStartTestWithSkills = async (declaredSkills) => {
    setSubmitting(true);
    setError(null);

    try {
      const activeTrackId = selectedTrackId || BACKEND_TRACK_ID;
      const skillsToDeclare = Array.isArray(declaredSkills) ? declaredSkills : Array.from(selectedSkillSlugs);

      const profile = {
        trackId: activeTrackId,
        trackSlug: selectedTrack?.slug || 'backend-engineering',
        trackName: selectedTrack?.name || 'Backend Engineering',
        knownSkillSlugs: skillsToDeclare,
      };
      localStorage.setItem('skillpath_onboarding_profile', JSON.stringify(profile));

      const state = await assessmentService.startAssessment(activeTrackId, skillsToDeclare);
      setAssessmentState(state);
      sessionStorage.setItem(ASSESSMENT_ID_KEY, state.assessmentId);
      setIsConfiguring(false);

      if (state.done || state.status === 'COMPLETED') {
        setPreparingReport(true);
        try {
          const report = await fetchFinalReport(state.assessmentId);
          setResult(report);
          localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
        } finally {
          setPreparingReport(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to start diagnostic test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
        setPreparingReport(true);
        try {
          const report = await fetchFinalReport(updatedState.assessmentId);
          setResult(report);
          localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
        } finally {
          setPreparingReport(false);
        }
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
            setPreparingReport(true);
            try {
              const report = await fetchFinalReport(freshState.assessmentId);
              setResult(report);
              localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
            } finally {
              setPreparingReport(false);
            }
            return;
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

  const handleRetest = () => {
    sessionStorage.removeItem(ASSESSMENT_ID_KEY);
    localStorage.removeItem(ASSESSMENT_RESULT_KEY);
    setAssessmentState(null);
    setResult(null);
    setSelectedOption(null);
    setError(null);
    setSelectedSkillSlugs(new Set());
    setPreparingReport(false);
    setIsConfiguring(true);
  };

  const isCompleted = !isConfiguring && (result !== null || assessmentState?.done || assessmentState?.status === 'COMPLETED');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 size={36} className="animate-spin text-indigo-600" aria-hidden="true" />
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">Connecting to CAT Adaptive Engine...</p>
          <p className="text-xs text-slate-500 mt-1">Calibrating question difficulty to your skill baseline</p>
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
          {preparingReport || (isCompleted && !result)
            ? 'Finalizing Diagnostic Evaluation'
            : isConfiguring
            ? 'Diagnostic Screening Setup'
            : isCompleted
            ? 'Initial Skill Report & Gap Analysis'
            : 'Diagnostic Knowledge Assessment'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {preparingReport || (isCompleted && !result)
            ? 'Your adaptive assessment has concluded. Calibrating your ability score and preparing your final report.'
            : isConfiguring
            ? 'Select your specialization track and mark the skills you already know before starting your adaptive test.'
            : isCompleted
            ? 'Your ability parameter (θ) has converged. Verified strengths and learning paths are mapped below.'
            : 'Question difficulty dynamically calibrates after every answer based on your performance.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preparingReport || (isCompleted && !result) ? (
        /* Preparing Diagnostic Report Screen */
        <Card className="text-center py-12 px-6 sm:px-10 space-y-6 shadow-sm border-indigo-100 bg-white">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            {/* Pulsing ring background */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/15 animate-ping" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
              <Sparkles size={32} className="animate-pulse text-indigo-600" />
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-100">
              <Loader2 size={12} className="animate-spin text-indigo-600" />
              Adaptive Test Complete
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Preparing Your Diagnostic Skill Report...
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Our diagnostic engine is calculating your final ability parameter (θ), verifying correct answers, and unlocking your personalized skill graph.
            </p>
          </div>

          {/* Stepped progress indicators */}
          <div className="max-w-sm mx-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>Assessment responses submitted & recorded</span>
            </div>
            <div className="flex items-center gap-2.5 text-indigo-700 font-semibold">
              <Loader2 size={15} className="shrink-0 animate-spin text-indigo-600" />
              <span>Calibrating theta (θ) ability estimate & skill nodes...</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 font-medium">
              <div className="h-3.5 w-3.5 rounded-full border border-slate-300 grid place-items-center shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              </div>
              <span>Generating per-question breakdown & skill tree</span>
            </div>
          </div>
        </Card>
      ) : isConfiguring ? (
        /* Pre-Test Configuration Stage: Questions for Track and Comfortable Skills */
        <div className="space-y-6">
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 p-6 sm:p-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Diagnostic Calibration Setup
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-indigo-100 text-[11px] font-semibold text-indigo-800 shadow-2xs">
                <Sparkles size={12} className="text-indigo-600" />
                IRT Baseline θ = 0.0
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pre-Assessment Calibration Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Before your adaptive diagnostic test begins, select your target track and identify the concepts you already feel comfortable with. This calibrates your initial ability baseline and maps your learning nodes.
            </p>
          </div>

          {/* Question 1: Track Selection */}
          <Card className="space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                1
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Select Your Engineering Track
                </h3>
                <p className="text-xs text-slate-500">
                  Which career specialization are you currently targeting?
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="assessment-track-select" className="block text-xs font-semibold text-slate-700">
                Available Curriculum Track
              </label>
              <div className="relative">
                <select
                  id="assessment-track-select"
                  value={selectedTrackId}
                  onChange={handleTrackChange}
                  disabled={loadingConfig}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs cursor-pointer disabled:bg-slate-50"
                >
                  {tracks.map((t) => (
                    <option key={t.trackId} value={t.trackId}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Selected Track Preview */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <Server size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {selectedTrack?.name || 'Backend Engineering'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      REST APIs • Relational DBs • Concurrency • Microservices
                    </p>
                  </div>
                </div>
                <Badge variant="indigo" size="sm">
                  Active Track
                </Badge>
              </div>
            </div>
          </Card>

          {/* Question 2: Known Skills Checklist */}
          <Card className="space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Which skills are you already comfortable in?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select familiar skills to skip introductory questions and unlock advanced dependencies.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {selectedSkillSlugs.size} selected
                </span>
                {selectedSkillSlugs.size > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSkills}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills (e.g. Git, SQL, REST, Docker)..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition shadow-2xs"
              />
            </div>

            {/* Loading or Cluster Chips */}
            {loadingConfig ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
                <span className="text-xs">Loading curriculum skills...</span>
              </div>
            ) : Object.keys(groupedSkills).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No matching skills found.</p>
            ) : (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {Object.entries(groupedSkills).map(([clusterKey, items]) => (
                  <div key={clusterKey} className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {CLUSTER_NAMES[clusterKey] || clusterKey}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {items.map((s) => {
                        const isSelected = selectedSkillSlugs.has(s.slug);
                        return (
                          <button
                            key={s.slug}
                            type="button"
                            onClick={() => toggleSkill(s.slug)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500/20'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`grid h-4 w-4 place-items-center rounded ${
                                isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                              }`}
                            >
                              {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>
                            <span>{s.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setSelectedSkillSlugs(new Set());
                handleStartTestWithSkills([]);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
            >
              I am starting from scratch (skip skill selection)
            </button>

            <Button
              variant="indigo"
              size="lg"
              disabled={submitting || loadingConfig}
              loading={submitting}
              onClick={() => handleStartTestWithSkills(Array.from(selectedSkillSlugs))}
              className="shadow-sm"
            >
              Start Diagnostic Screening Test <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      ) : !isCompleted && currentQ ? (
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
                    Detailed breakdown of your answers and solutions
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
