import { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown,
  Server,
  Check,
  Search,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { assessmentService, BACKEND_TRACK_ID } from '../services/assessmentService';
import { assistantService } from '../services/assistantService';
import VoiceCompanionWidget, { stopCurrentVoiceAudio } from '../components/feature/VoiceCompanionWidget';
import { triggerHaptic } from '../services/hapticsService';
import './AssessmentReport.css';

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
  const [questionFilter, setQuestionFilter] = useState('all');
  const [voiceFeedback, setVoiceFeedback] = useState(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const voiceReqSeqRef = useRef(0);

  const topicRows = useMemo(() => {
    if (!result) return [];
    const topics = {};
    if (Array.isArray(result.responses) && result.responses.length > 0) {
      result.responses.forEach((resp) => {
        const name = resp.skillName || resp.skillSlug || 'Core Diagnostic Item';
        if (!topics[name]) {
          topics[name] = { name, right: 0, total: 0 };
        }
        topics[name].total += 1;
        if (resp.correct) {
          topics[name].right += 1;
        }
      });
    }

    if (Object.keys(topics).length === 0 && Array.isArray(result.skills)) {
      result.skills.forEach((s) => {
        const name = s.name || s.slug || 'Skill Node';
        const isMastered = s.state === 'MASTERED' || s.status === 'unlocked';
        const isFrontier = s.state === 'READY_TO_LEARN' || s.state === 'FRONTIER';
        topics[name] = {
          name,
          right: isMastered ? 1 : isFrontier ? 1 : 0,
          total: isMastered ? 1 : isFrontier ? 2 : 1,
        };
      });
    }

    return Object.values(topics)
      .map((t) => ({
        ...t,
        pct: t.total > 0 ? Math.round((100 * t.right) / t.total) : 0,
      }))
      .sort((a, b) => a.pct - b.pct);
  }, [result]);

  const topSteps = useMemo(() => {
    const gaps = topicRows.filter((r) => r.pct < 70).slice(0, 3);
    if (gaps.length > 0) return gaps;
    return topicRows.slice(0, 3);
  }, [topicRows]);

  const filteredResponses = useMemo(() => {
    const all = result?.responses || [];
    if (questionFilter === 'good') return all.filter((r) => r.correct);
    if (questionFilter === 'bad') return all.filter((r) => !r.correct);
    return all;
  }, [result?.responses, questionFilter]);

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
        const urlParams = new URLSearchParams(window.location.search);
        const urlAssessmentId = urlParams.get('id');

        // 0. If a specific assessment ID is requested via URL query param (e.g. from Test History)
        if (urlAssessmentId) {
          setPreparingReport(true);
          try {
            const report = await fetchFinalReport(urlAssessmentId);
            if (ignore) return;
            setResult(report);
            sessionStorage.setItem(ASSESSMENT_ID_KEY, urlAssessmentId);
            localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(report));
            setLoading(false);
            return;
          } catch (err) {
            console.warn('Unable to load assessment from URL parameter:', err);
          } finally {
            if (!ignore) setPreparingReport(false);
          }
        }

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

  // Ensure audio playback resources are cleaned up on unmount
  useEffect(() => {
    return () => {
      stopCurrentVoiceAudio();
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
    triggerHaptic.submit();

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
    triggerHaptic.submit();

    try {
      const updatedState = await assessmentService.submitAnswer(
        assessmentState.assessmentId,
        assessmentState.question.itemId,
        selectedOption
      );

      setAssessmentState(updatedState);
      setSelectedOption(null);

      // Immediately trigger AI Voice Companion with Spring Boot evaluated answer
      if (updatedState?.lastEvaluation) {
        const currentSeq = ++voiceReqSeqRef.current;
        setVoiceLoading(true);
        setVoiceFeedback(null);
        stopCurrentVoiceAudio();

        assistantService
          .getVoiceFeedback(updatedState.lastEvaluation)
          .then((feedback) => {
            if (voiceReqSeqRef.current === currentSeq) {
              setVoiceFeedback(feedback);
              setVoiceLoading(false);
            }
          })
          .catch((voiceErr) => {
            console.warn('Voice companion feedback skipped:', voiceErr);
            if (voiceReqSeqRef.current === currentSeq) {
              setVoiceLoading(false);
            }
          });
      }

      // Check if assessment completed
      if (updatedState.done || updatedState.status === 'COMPLETED') {
        triggerHaptic.success();
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
    stopCurrentVoiceAudio();
    setVoiceFeedback(null);
    setVoiceLoading(false);
    sessionStorage.removeItem(ASSESSMENT_ID_KEY);
    localStorage.removeItem(ASSESSMENT_RESULT_KEY);
    setAssessmentState(null);
    setResult(null);
    setSelectedOption(null);
    setError(null);
    triggerHaptic.submit();
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

  // Initial Skill Report - Layout matching design inspo
  if (isCompleted && result) {
    const correctCount =
      result?.correct ??
      (Array.isArray(result?.responses) ? result.responses.filter((r) => r.correct).length : 0);
    const totalCount =
      (result?.answered ??
      (Array.isArray(result?.responses) ? result.responses.length : 0)) || 1;
    const accuracyPct = Math.round((correctCount / totalCount) * 100);

    const thetaVal =
      typeof result?.finalTheta === 'number'
        ? result.finalTheta
        : typeof result?.theta === 'number'
        ? result.theta
        : 0;
    const thetaString = thetaVal > 0 ? `+${thetaVal.toFixed(2)}` : thetaVal.toFixed(2);
    const abilityBand = thetaVal >= 1.0 ? 'High' : thetaVal >= -0.5 ? 'Moderate' : 'Low';
    const displayLevel = result?.level
      ? `${result.level.charAt(0).toUpperCase() + result.level.slice(1).toLowerCase()} level`
      : 'Beginner level';

    const topicsToImproveCount = topicRows.filter((r) => r.pct < 40).length;

    const getBandInfo = (pct) => {
      if (pct >= 70) return { key: 'ok', label: 'Strength', color: 'var(--ok)' };
      if (pct >= 40) return { key: 'mid', label: 'Developing', color: 'var(--mid)' };
      return { key: 'gap', label: 'Gap', color: 'var(--gap)' };
    };

    const areAllExpanded =
      filteredResponses.length > 0 &&
      filteredResponses.every((resp, idx) => {
        const qKey = resp.seq !== undefined ? resp.seq : idx;
        return expandedQuestions[qKey] === true;
      });

    const handleToggleExpandAll = () => {
      const nextState = !areAllExpanded;
      const updated = { ...expandedQuestions };
      filteredResponses.forEach((resp, idx) => {
        const qKey = resp.seq !== undefined ? resp.seq : idx;
        updated[qKey] = nextState;
      });
      setExpandedQuestions(updated);
    };

    return (
      <div className="skill-report-page">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2.5">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Final question voice companion feedback */}
        {(voiceLoading || voiceFeedback) && (
          <VoiceCompanionWidget
            voiceFeedback={voiceFeedback}
            loading={voiceLoading}
            onClose={() => {
              stopCurrentVoiceAudio();
              setVoiceFeedback(null);
              setVoiceLoading(false);
            }}
          />
        )}

        <h1>Initial skill report</h1>
        <p className="sub">
          Your diagnostic is complete. Here is where you stand, which topics need work, and what to do next.
        </p>

        <div className="layout">
          <div>
            {/* Summary */}
            <section className="report-card" aria-labelledby="sum">
              <div className="summary">
                <div
                  className="ring"
                  style={{ '--p': Math.max(accuracyPct, 4) }}
                  role="img"
                  aria-label={`Score ${accuracyPct} out of 100`}
                >
                  <div>
                    <p style={{ margin: 0 }}>
                      <b>{accuracyPct}</b>
                      <span>out of 100</span>
                    </p>
                  </div>
                </div>
                <div>
                  <p className="level" id="sum">
                    {displayLevel}
                  </p>
                  <p className="hint" style={{ margin: '4px 0 0' }}>
                    You answered <b>{correctCount}</b> of <b>{totalCount}</b> questions correctly.
                  </p>
                  <div className="stats">
                    <div className="stat">
                      <b>{accuracyPct}%</b>
                      <span>Accuracy</span>
                    </div>
                    <div className="stat">
                      <b>
                        {abilityBand}{' '}
                        <span
                          className="info"
                          tabIndex={0}
                          data-tip={`Your ability score (θ) is ${thetaString}. It estimates skill from how hard the questions you got right were. Higher is better.`}
                        >
                          i
                        </span>
                      </b>
                      <span>Ability band</span>
                    </div>
                    <div className="stat">
                      <b>{topicsToImproveCount}</b>
                      <span>Topics to improve</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Skill breakdown */}
            <section className="report-card" aria-labelledby="skills">
              <h2 id="skills">Skill breakdown</h2>
              <p className="hint">Topics from your diagnostic, weakest first.</p>
              <div>
                {topicRows.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No topic data available.</p>
                ) : (
                  topicRows.map((r) => {
                    const band = getBandInfo(r.pct);
                    return (
                      <div key={r.name} className="skill">
                        <span className="name" title={r.name}>
                          {r.name}
                        </span>
                        <div
                          className="bar"
                          role="img"
                          aria-label={`${r.right} of ${r.total} correct`}
                        >
                          <i style={{ width: `${Math.max(r.pct, 4)}%`, background: band.color }} />
                        </div>
                        <span className={`badge ${band.key}`}>{band.label}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Question review */}
            <section className="report-card" aria-labelledby="rev">
              <div className="review-head">
                <div>
                  <h2 id="rev">Question review</h2>
                  <p className="hint" style={{ margin: 0 }}>
                    Open a question to see all options and the correct answer.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="tabs" role="group" aria-label="Filter questions">
                    <button
                      type="button"
                      data-f="all"
                      aria-pressed={questionFilter === 'all'}
                      onClick={() => setQuestionFilter('all')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      data-f="bad"
                      aria-pressed={questionFilter === 'bad'}
                      onClick={() => setQuestionFilter('bad')}
                    >
                      Incorrect
                    </button>
                    <button
                      type="button"
                      data-f="good"
                      aria-pressed={questionFilter === 'good'}
                      onClick={() => setQuestionFilter('good')}
                    >
                      Correct
                    </button>
                  </div>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={handleToggleExpandAll}
                  >
                    {areAllExpanded ? 'Collapse all' : 'Expand all'}
                  </button>
                </div>
              </div>

              <div>
                {filteredResponses.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No questions match the selected filter.
                  </p>
                ) : (
                  filteredResponses.map((resp, i) => {
                    const ok = resp.correct;
                    const k = ok ? 'good' : 'bad';
                    const qKey = resp.seq !== undefined ? resp.seq : i;
                    const isOpen = expandedQuestions[qKey] === true;

                    const opts = Array.isArray(resp.options)
                      ? resp.options
                      : typeof resp.options === 'string'
                      ? (() => {
                          try {
                            return JSON.parse(resp.options);
                          } catch {
                            return [];
                          }
                        })()
                      : [];

                    const userPickedText =
                      resp.yourAnswer ||
                      (typeof resp.selectedOption === 'number' && opts[resp.selectedOption]) ||
                      (resp.selectedOption !== undefined
                        ? `Option ${String.fromCharCode(65 + resp.selectedOption)}`
                        : 'No Answer');

                    const correctText =
                      resp.correctAnswer ||
                      (typeof resp.correctOption === 'number' && opts[resp.correctOption]) ||
                      (resp.correctOption !== undefined
                        ? `Option ${String.fromCharCode(65 + resp.correctOption)}`
                        : 'Solution');

                    return (
                      <div key={qKey} className={`q ${isOpen ? 'open' : ''}`}>
                        <button
                          type="button"
                          className="q-row"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setExpandedQuestions((prev) => ({
                              ...prev,
                              [qKey]: !prev[qKey],
                            }))
                          }
                        >
                          <span className={`num ${k}`}>{resp.seq || i + 1}</span>
                          <span className="q-topic">
                            {resp.skillName || resp.skillSlug || 'Diagnostic Item'}
                            <small>{ok ? 'Correct' : 'Incorrect'}</small>
                          </span>
                          <span className="q-ans">
                            {ok ? (
                              <b className="good">{correctText}</b>
                            ) : (
                              <>
                                You: <b className="bad">{userPickedText}</b> &middot; Correct:{' '}
                                <b className="good">{correctText}</b>
                              </>
                            )}
                          </span>
                          <ChevronDown size={16} className="chev" />
                        </button>

                        <div className="q-body">
                          <p>{resp.questionStem || 'Question text not available.'}</p>
                          {opts.length > 0 ? (
                            opts.map((o, j) => {
                              const isPick =
                                j === resp.selectedOption ||
                                (resp.yourAnswer && resp.yourAnswer === o);
                              const isAns =
                                j === resp.correctOption ||
                                (resp.correctAnswer && resp.correctAnswer === o);

                              const cls = isAns ? 'right' : isPick ? 'wrong' : '';
                              const tag = isAns
                                ? isPick
                                  ? 'Your answer (Correct)'
                                  : 'Correct answer'
                                : isPick
                                ? 'Your answer'
                                : '';

                              return (
                                <div key={o || j} className={`opt ${cls}`}>
                                  <span className="k">{String.fromCharCode(65 + j)}</span>
                                  <span style={{ flex: 1 }}>{o}</span>
                                  {tag && <em>{tag}</em>}
                                </div>
                              );
                            })
                          ) : (
                            <div className="space-y-2 mt-2">
                              <div className={`opt ${ok ? 'right' : 'wrong'}`}>
                                <span className="k">{ok ? '✓' : '✗'}</span>
                                <span style={{ flex: 1 }}>{userPickedText}</span>
                                <em>Your answer</em>
                              </div>
                              {!ok && (
                                <div className="opt right">
                                  <span className="k">✓</span>
                                  <span style={{ flex: 1 }}>{correctText}</span>
                                  <em>Correct answer</em>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Right rail */}
          <aside className="rail">
            <section className="report-card" aria-labelledby="next">
              <h2 id="next">Next steps</h2>
              <p className="hint" style={{ margin: 0 }}>
                Start with your biggest gaps.
              </p>
              <ol>
                {topSteps.map((step, idx) => (
                  <li key={step.name || idx}>
                    <span>{idx + 1}</span>
                    <div>
                      <b>{step.name}</b>
                      <small>
                        {step.right} of {step.total} correct
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="btn-action primary"
                onClick={() => navigate('/roadmap')}
              >
                Start my roadmap
              </button>
              <button
                type="button"
                className="btn-action"
                onClick={() => navigate('/graph')}
              >
                Explore skill graph
              </button>
              <button
                type="button"
                className="text-link"
                onClick={handleRetest}
              >
                Retake diagnostic
              </button>
              <button
                type="button"
                className="text-link"
                style={{ marginTop: 6, fontSize: 12 }}
                onClick={() => window.print()}
              >
                Print report
              </button>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  const answered = assessmentState?.answered ?? assessmentState?.progress?.answered ?? 0;
  const maxQuestions = assessmentState?.max ?? assessmentState?.progress?.max ?? 9;
  const currentQ = assessmentState?.question;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
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
              Before your adaptive diagnostic test begins, select your target track and identify the concepts you already feel comfortable with.
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
                  Select Your Study Track
                </h3>
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
                  </div>
                </div>
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
          </Card>

          {/* AI Voice Companion Interactive Feedback Widget */}
          {(voiceLoading || voiceFeedback) && (
            <VoiceCompanionWidget
              voiceFeedback={voiceFeedback}
              loading={voiceLoading}
              onClose={() => {
                stopCurrentVoiceAudio();
                setVoiceFeedback(null);
                setVoiceLoading(false);
              }}
            />
          )}

          {/* Active Dynamic Question Card */}
          <Card className="space-y-6">
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
                      onClick={() => {
                        if (!submitting) {
                          triggerHaptic.selection();
                          setSelectedOption(optIdx);
                        }
                      }}
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
            <div className="hidden lg:flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
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
          {/* Mobile Floating Sticky Submit Bar - Placed above MobileNav, strictly lg:hidden */}
          {selectedOption !== null && !submitting && (
            <div className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg lg:hidden">
              <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Selected Option</span>
                  <span className="text-xs font-extrabold text-indigo-700 truncate">
                    Option {String.fromCharCode(65 + selectedOption)}
                  </span>
                </div>
                <Button
                  variant="indigo"
                  size="md"
                  loading={submitting}
                  onClick={handleSubmitAnswer}
                  className="flex-1 max-w-[210px] shadow-sm justify-center font-bold text-xs"
                >
                  Submit & Next <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </>
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
