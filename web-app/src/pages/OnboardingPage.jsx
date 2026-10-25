import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Briefcase,
  GraduationCap,
  Compass,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Search,
  Clock,
  Code2,
  Server,
  Cloud,
  Cpu,
  Target,
  Award
} from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import Badge from '../components/ui/Badge';
import { useLanguage } from '../hooks/useLanguage';
import { getTrackUuid } from '../services/assessmentService';

const TRACKS = [
  {
    id: 'fullstack',
    title: 'Full-Stack Web Development',
    tagline: 'Modern React 19, TypeScript, Distributed State & Cloud Fullstack',
    icon: Code2,
    badge: 'Popular',
    duration: '6-8 Weeks',
    topicsCount: 18,
    description:
      'Master component architecture, asynchronous state, REST/GraphQL APIs, and end-to-end fullstack deployment.',
  },
  {
    id: 'backend',
    title: 'Backend Systems & Architecture',
    tagline: 'Spring Boot, High-Throughput APIs, Kafka Queues & SQL Optimization',
    icon: Server,
    badge: 'Enterprise',
    duration: '8-10 Weeks',
    topicsCount: 22,
    description:
      'Deep dive into microservices, relational indexing, caching strategies, message brokers, and security.',
  },
  {
    id: 'devops',
    title: 'Cloud Engineering & DevOps',
    tagline: 'Docker, Kubernetes, Cloud Infrastructure & Production CI/CD',
    icon: Cloud,
    badge: 'Infrastructure',
    duration: '6-8 Weeks',
    topicsCount: 16,
    description:
      'Build automated delivery pipelines, container orchestrations, infrastructure as code, and cloud monitoring.',
  },
  {
    id: 'ai-data',
    title: 'AI Engineering & Applied ML',
    tagline: 'Python, LLMs, Vector Databases, RAG Pipelines & Agent Orchestration',
    icon: Cpu,
    badge: 'Advanced AI',
    duration: '8-10 Weeks',
    topicsCount: 20,
    description:
      'Integrate generative AI APIs, train retrieval-augmented agents, structure embeddings, and build production AI workflows.',
  },
];

const PERSONAS = [
  {
    id: 'job_seeker',
    title: 'Career Seeker',
    subtitle: 'Actively preparing for engineering roles, technical interviews & capstones',
    icon: Briefcase,
  },
  {
    id: 'pro',
    title: 'Working Professional',
    subtitle: 'Upskilling in a new stack or deepening architectural mechanics',
    icon: Target,
  },
  {
    id: 'student',
    title: 'College Student',
    subtitle: 'Strengthening CS fundamentals, building semester portfolios & project verification',
    icon: GraduationCap,
  },
  {
    id: 'maker',
    title: 'Hobbyist & Builder',
    subtitle: 'Shipping personal products, SaaS prototypes, or exploring modern frameworks',
    icon: Compass,
  },
];

const BUDGET_OPTIONS = [
  { minutes: 15, label: '15 min/day', subtitle: 'Micro-learning' },
  { minutes: 30, label: '30 min/day', subtitle: 'Steady habit' },
  { minutes: 45, label: '45 min/day', subtitle: 'Recommended speed' },
  { minutes: 60, label: '60 min/day', subtitle: 'Deep immersion' },
  { minutes: 90, label: '90+ min/day', subtitle: 'Bootcamp pace' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState('job_seeker');
  const [selectedTrack, setSelectedTrack] = useState('fullstack');
  const [searchQuery, setSearchQuery] = useState('');
  const [studyBudget, setStudyBudget] = useState(45);
  const [priorExperience, setPriorExperience] = useState('intermediate');

  const filteredTracks = TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tagline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleComplete = () => {
    const profile = {
      language,
      persona,
      trackId: selectedTrack,
      trackUuid: getTrackUuid(selectedTrack),
      studyBudgetMinutes: studyBudget,
      priorExperience,
      completedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('skillpath_onboarding_profile', JSON.stringify(profile));
    } catch {
      // Ignore storage errors
    }
    // Transition straight into Phase 2 Diagnostic
    navigate('/assessment');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 sm:px-6 sm:py-12 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Top Header & Branding */}
        <div className="flex items-center justify-between border-b border-slate-200/90 pb-5">
          <Logo />
          {/* Stepper Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : step > s
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-0.5 w-6 sm:w-10 rounded-full transition-all ${
                      step > s ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card Container */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-8">
          {/* STEP 1: Language & Persona */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Step 1 of 3: Persona Calibration
                </span>
                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Choose your language & learner profile
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 max-w-xl">
                  We calibrate the AI tutor explanations, diagnostic tone, and roadmap feedback based on your preferences.
                </p>
              </div>

              {/* Language Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Globe size={14} className="text-indigo-600" />
                  Primary Learning Language
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: 'en',
                      title: 'English',
                      desc: 'Standard technical terminology & concepts',
                      flag: 'EN',
                    },
                    {
                      id: 'hi',
                      title: 'हिन्दी (Hindi)',
                      desc: 'हिंदी तकनीकी व्याख्या एवं उदाहरण',
                      flag: 'HI',
                    },
                    {
                      id: 'hinglish',
                      title: 'Hinglish',
                      desc: 'Natural mix of Hindi phrasing & English tech terms',
                      flag: 'HG',
                    },
                  ].map((l) => {
                    const isSelected = language === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLanguage(l.id)}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {l.flag}
                          </span>
                          {isSelected && <CheckCircle2 size={17} className="text-indigo-600" />}
                        </div>
                        <p className="font-bold text-sm text-slate-900">{l.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{l.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Persona Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Award size={14} className="text-indigo-600" />
                  Learner Persona
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PERSONAS.map((p) => {
                    const Icon = p.icon;
                    const isSelected = persona === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPersona(p.id)}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-sm ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-slate-900">{p.title}</p>
                            {isSelected && <CheckCircle2 size={16} className="text-indigo-600" />}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{p.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Technology Track Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Step 2 of 3: Curriculum Selection
                  </span>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Select your technology track
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Your 10-question adaptive assessment will evaluate skills against this track.
                  </p>
                </div>

                {/* Track Search Filter */}
                <div className="relative w-full sm:w-64">
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tracks..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              {/* Track Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredTracks.map((track) => {
                  const Icon = track.icon;
                  const isSelected = selectedTrack === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelectedTrack(track.id)}
                      className={`relative flex flex-col justify-between p-5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant={isSelected ? 'indigo' : 'neutral'}>
                            {track.badge}
                          </Badge>
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Clock size={13} /> {track.duration}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-sm ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Icon size={20} />
                          </span>
                          <div>
                            <h3 className="font-bold text-base text-slate-900">{track.title}</h3>
                            <p className="text-xs text-indigo-700 font-medium mt-0.5">
                              {track.tagline}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                          {track.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>{track.topicsCount} core modules + capstone</span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-indigo-700 font-bold">
                            <CheckCircle2 size={15} /> Selected
                          </span>
                        ) : (
                          <span className="text-slate-400">Select track</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Experience & Study Budget */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Step 3 of 3: Timeline & Study Budget
                </span>
                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Your background & available study time
                </h1>
                <p className="mt-1 text-sm text-slate-500 max-w-xl">
                  We use your daily study budget to calibrate milestone scheduling and projected completion dates.
                </p>
              </div>

              {/* Prior Experience Tier */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Self-Assessed Current Knowledge Level
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: 'beginner',
                      title: 'Foundational',
                      subtitle: 'Basic syntax understanding; ready to learn architectural patterns',
                    },
                    {
                      id: 'intermediate',
                      title: 'Intermediate',
                      subtitle: 'Built small projects; seeking systematic depth and best practices',
                    },
                    {
                      id: 'advanced',
                      title: 'Advanced',
                      subtitle: 'Experienced engineer filling niche architectural and system gaps',
                    },
                  ].map((lvl) => {
                    const isSelected = priorExperience === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setPriorExperience(lvl.id)}
                        className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-slate-900">{lvl.title}</p>
                          {isSelected && <CheckCircle2 size={16} className="text-indigo-600" />}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{lvl.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Study Budget */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-600" />
                    Daily Study Commitment
                  </label>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {studyBudget} min / day
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {BUDGET_OPTIONS.map((opt) => {
                    const isSelected = studyBudget === opt.minutes;
                    return (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => setStudyBudget(opt.minutes)}
                        className={`p-3 rounded-lg border text-center transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <p className="text-xs sm:text-sm font-bold">{opt.label}</p>
                        <p
                          className={`text-[10px] mt-0.5 ${
                            isSelected ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Projection banner */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-slate-700 flex items-start gap-3 mt-4">
                  <Sparkles size={18} className="shrink-0 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Adaptive Timeline Forecast</p>
                    <p className="mt-1 leading-relaxed">
                      At <strong className="text-indigo-700">{studyBudget} mins/day</strong>, you will complete the{' '}
                      <strong>{TRACKS.find((t) => t.id === selectedTrack)?.title}</strong> track, pass all verification checkpoints, and unlock your capstone review in approximately{' '}
                      <strong className="text-indigo-700">
                        {Math.max(3, Math.ceil(36 / (studyBudget / 30)))} weeks
                      </strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Footer */}
          <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft size={15} /> Previous Step
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs text-slate-500 hover:text-slate-800 transition font-medium"
              >
                ← Return to Landing Page
              </button>
            )}

            {step < 3 ? (
              <Button
                variant="indigo"
                size="sm"
                onClick={() => setStep((s) => s + 1)}
              >
                Continue to Step {step + 1} <ArrowRight size={15} />
              </Button>
            ) : (
              <Button
                variant="indigo"
                size="md"
                onClick={handleComplete}
                className="shadow-sm"
              >
                Begin AI Diagnostic Assessment <Sparkles size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
