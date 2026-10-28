import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Server,
  Sparkles,
  Loader2,
  Check,
  Search,
  BookOpen,
  Compass,
} from 'lucide-react';
import { assessmentService, BACKEND_TRACK_ID } from '../services/assessmentService';

const STEPS = ['Language', 'Track', 'Skills', 'Budget'];

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

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('en');

  // Track selection state
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [selectedTrackId, setSelectedTrackId] = useState(BACKEND_TRACK_ID);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Skill familiarity checklist state
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [selectedSkillSlugs, setSelectedSkillSlugs] = useState(new Set());
  const [skillSearch, setSkillSearch] = useState('');

  const [budget, setBudget] = useState('60');
  const [startingAssessment, setStartingAssessment] = useState(false);

  // Load tracks on mount
  useEffect(() => {
    let ignore = false;

    async function loadTracks() {
      try {
        setLoadingTracks(true);
        const data = await assessmentService.getTracks();
        if (ignore) return;

        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
          setSelectedTrackId(data[0].trackId);
          setSelectedTrack(data[0]);
        } else {
          const fallback = [{
            trackId: BACKEND_TRACK_ID,
            slug: 'backend-engineering',
            name: 'Backend Engineering',
          }];
          setTracks(fallback);
          setSelectedTrackId(BACKEND_TRACK_ID);
          setSelectedTrack(fallback[0]);
        }
      } catch (err) {
        console.warn('Unable to load tracks from server, using default:', err);
        const fallback = [{
          trackId: BACKEND_TRACK_ID,
          slug: 'backend-engineering',
          name: 'Backend Engineering',
        }];
        if (!ignore) {
          setTracks(fallback);
          setSelectedTrackId(BACKEND_TRACK_ID);
          setSelectedTrack(fallback[0]);
        }
      } finally {
        if (!ignore) {
          setLoadingTracks(false);
        }
      }
    }

    loadTracks();

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch skills whenever selectedTrackId changes
  useEffect(() => {
    let ignore = false;

    async function loadSkills() {
      if (!selectedTrackId) return;
      try {
        setLoadingSkills(true);
        const data = await assessmentService.getSkillsForTrack(selectedTrackId);
        if (ignore) return;
        if (Array.isArray(data)) {
          setSkills(data);
        }
      } catch (err) {
        console.warn('Unable to load track skills:', err);
      } finally {
        if (!ignore) {
          setLoadingSkills(false);
        }
      }
    }

    loadSkills();

    return () => {
      ignore = true;
    };
  }, [selectedTrackId]);

  const handleTrackChange = (e) => {
    const tId = e.target.value;
    setSelectedTrackId(tId);
    const found = tracks.find(t => t.trackId === tId);
    setSelectedTrack(found || null);
    setSelectedSkillSlugs(new Set()); // Reset selections for new track
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

  // Group and filter skills by cluster
  const groupedSkills = useMemo(() => {
    const searchLower = skillSearch.trim().toLowerCase();
    const filtered = skills.filter((s) => {
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
  }, [skills, skillSearch]);

  const handleFinish = async () => {
    const activeSlug = selectedTrack?.slug || 'backend-engineering';
    const targetTrackId = selectedTrackId || BACKEND_TRACK_ID;
    const declaredSkills = Array.from(selectedSkillSlugs);

    const profile = {
      language: lang,
      trackSlug: activeSlug,
      trackId: targetTrackId,
      trackName: selectedTrack?.name || 'Backend Engineering',
      knownSkillSlugs: declaredSkills,
      dailyMinutes: parseInt(budget, 10),
    };
    localStorage.setItem('skillpath_onboarding_profile', JSON.stringify(profile));

    setStartingAssessment(true);

    try {
      // Trigger new assessment with initial theta = 0.0 and declared comfortable skills
      const state = await assessmentService.startAssessment(targetTrackId, declaredSkills);
      if (state?.assessmentId) {
        sessionStorage.setItem('skillpath_assessment_id', state.assessmentId);
      }
      navigate('/assessment');
    } catch (err) {
      console.warn('Initial assessment start returned error, navigating to assessment runner:', err);
      navigate('/assessment');
    } finally {
      setStartingAssessment(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f3ee' }}>
      <div className="w-full max-w-2xl animate-scale-in">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  i < step ? 'bg-emerald-500 text-white'
                  : i === step ? 'bg-indigo-600 text-white animate-pulse-ring'
                  : 'bg-slate-200 text-slate-500'
                }`}>
                  {i < step ? <CheckCircle2 size={13} /> : i + 1}
                </span>
                <span className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-10 transition-all duration-500 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {/* Step 0: Language */}
          {step === 0 && (
            <div className="animate-slide-up p-8 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Step 1 of 4</p>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Welcome — choose your language</h1>
                <p className="mt-1 text-sm text-slate-500">You can change this anytime in the top bar.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[['en', 'English', 'Default'], ['hi', 'हिन्दी', 'Hindi'], ['hinglish', 'Hinglish', 'Mixed']].map(([key, label, sub]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLang(key)}
                    className={`rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                      lang === key
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-slate-900 text-sm">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                >
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Track Selection with Dropdown */}
          {step === 1 && (
            <div className="animate-slide-up p-8 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Step 2 of 4</p>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Select your learning track</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a track to evaluate with our diagnostic test and personalize your competency graph.
                </p>
              </div>

              {loadingTracks ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={28} className="animate-spin text-indigo-600" />
                  <span className="ml-3 text-sm text-slate-500 font-medium">Loading tracks from engine...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="track-select" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Target Career Track
                    </label>
                    <div className="relative">
                      <select
                        id="track-select"
                        value={selectedTrackId}
                        onChange={handleTrackChange}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-10 text-sm font-bold text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        {tracks.map((t) => (
                          <option key={t.trackId} value={t.trackId}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Selected Track Details Preview Card */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
                          <Server size={18} />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-slate-900 leading-tight">
                            {selectedTrack?.name || 'Backend Engineering'}
                          </h2>
                          <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                            slug: {selectedTrack?.slug || 'backend-engineering'}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <Sparkles size={11} /> Ready to Assess
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Language-agnostic backend engineering: web APIs, database modeling & transactions, authentication & security, concurrency, background queues, caching, and scalable system design.
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['REST & HTTP', 'SQL & ACID', 'Security & JWT', 'Caching & Redis', 'Async & Queues', 'Docker & CI/CD'].map((chip) => (
                        <span
                          key={chip}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                >
                  Next: Select Skills <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Known Skills Familiarity Checklist */}
          {step === 2 && (
            <div className="animate-slide-up p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Step 3 of 4</p>
                  <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Skills you are comfortable in</h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Select any concepts you already understand. We will pre-credit these in your graph.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
                    {selectedSkillSlugs.size} selected
                  </span>
                  {selectedSkillSlugs.size > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSkills}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-700 underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search concepts (e.g. SQL, Git, REST, Docker)..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {loadingSkills ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-indigo-600" />
                  <span className="ml-3 text-sm text-slate-500 font-medium">Loading competency list...</span>
                </div>
              ) : Object.keys(groupedSkills).length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <BookOpen size={28} className="mx-auto text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">No matching skills found</p>
                  <p className="text-xs text-slate-400">Try a different search term or clear the filter.</p>
                </div>
              ) : (
                <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1">
                  {Object.entries(groupedSkills).map(([clusterKey, clusterSkills]) => (
                    <div key={clusterKey} className="space-y-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {CLUSTER_NAMES[clusterKey] || clusterKey}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {clusterSkills.map((s) => {
                          const isSelected = selectedSkillSlugs.has(s.slug);
                          return (
                            <button
                              key={s.slug || s.skillId}
                              type="button"
                              onClick={() => toggleSkill(s.slug)}
                              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer text-left ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`grid h-4 w-4 place-items-center rounded-sm text-[10px] shrink-0 ${
                                  isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check size={11} strokeWidth={3} />}
                              </span>
                              <span>{s.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                >
                  Next: Study Plan <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Budget & Launch Diagnostic Assessment */}
          {step === 3 && (
            <div className="animate-slide-up p-8 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Step 4 of 4</p>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Your daily study budget</h1>
                <p className="mt-1 text-sm text-slate-500">Your roadmap will be paced to fit this. You can always adjust.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-indigo-600">{budget} min / day</span>
                  <span className="text-xs text-slate-400">
                    ≈ {budget <= 30 ? '4–6' : budget <= 60 ? '6–9' : '9–12'} weeks to complete
                  </span>
                </div>
                <input
                  type="range"
                  min="15" max="120" step="15"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  className="w-full accent-indigo-600 cursor-pointer"
                  aria-label="Daily study time in minutes"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span><span>90 min</span><span>120 min</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[['15', 'Light', '4 days / week'], ['45', 'Steady', 'Daily habit'], ['90', 'Intensive', 'Fast-track']].map(([v, label, sub]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBudget(v)}
                      className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                        budget === v ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">{label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assessment launch notice */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 flex items-start gap-3">
                <Compass className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">
                    Next: Calibrate your skill graph with the diagnostic assessment
                  </p>
                  <p>
                    The test starts with an initial IRT ability parameter of &theta; = 0.0. Answering correctly increases difficulty.
                    Your {selectedSkillSlugs.size} pre-selected skills will be unlocked in your graph.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  disabled={startingAssessment}
                  onClick={handleFinish}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-md cursor-pointer disabled:opacity-60"
                >
                  {startingAssessment ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Starting Assessment...
                    </>
                  ) : (
                    <>
                      Start Diagnostic Assessment <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
