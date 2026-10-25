import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Briefcase, GraduationCap, Compass, Sparkles,
  ArrowRight, ArrowLeft, CheckCircle2, Search,
  Clock, Code2, Server, Cloud, Cpu, Target, Award
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useLanguage } from '../hooks/useLanguage';

const TRACKS = [
  {
    id: 'fullstack',
    title: 'Full-Stack Web Development',
    tagline: 'Modern React 19, TypeScript, Node.js & Distributed Systems',
    icon: Code2,
    badge: 'Most Popular',
    duration: '6-8 Weeks',
    topicsCount: 18,
    color: 'from-emerald-500 to-teal-700',
    borderActive: 'border-emerald-600 bg-emerald-50/60',
    badgeColor: 'bg-emerald-100 text-emerald-900',
    description: 'Master component architecture, asynchronous state, REST/GraphQL APIs, and end-to-end fullstack deployment.',
  },
  {
    id: 'backend',
    title: 'Backend Systems & Architecture',
    tagline: 'Spring Boot, Distributed Transactions, Queues & High-Throughput APIs',
    icon: Server,
    badge: 'Enterprise Demand',
    duration: '8-10 Weeks',
    topicsCount: 22,
    color: 'from-blue-600 to-indigo-800',
    borderActive: 'border-blue-600 bg-blue-50/60',
    badgeColor: 'bg-blue-100 text-blue-900',
    description: 'Deep dive into microservices, relational indexing, caching strategies, message brokers (Kafka/RabbitMQ), and security.',
  },
  {
    id: 'devops',
    title: 'Cloud Engineering & DevOps',
    tagline: 'Docker, Kubernetes, Cloud Architecture (AWS/GCP) & CI/CD Pipelines',
    icon: Cloud,
    badge: 'High Impact',
    duration: '6-8 Weeks',
    topicsCount: 16,
    color: 'from-cyan-600 to-sky-800',
    borderActive: 'border-cyan-600 bg-cyan-50/60',
    badgeColor: 'bg-cyan-100 text-cyan-900',
    description: 'Build automated delivery pipelines, container orchestrations, infrastructure as code (Terraform), and cloud monitoring.',
  },
  {
    id: 'ai-data',
    title: 'AI Engineering & Applied ML',
    tagline: 'Python, LLMs, RAG Pipelines, Vector DBs & Prompt Engineering',
    icon: Cpu,
    badge: 'Cutting Edge',
    duration: '8-10 Weeks',
    topicsCount: 20,
    color: 'from-purple-600 to-violet-800',
    borderActive: 'border-purple-600 bg-purple-50/60',
    badgeColor: 'bg-purple-100 text-purple-900',
    description: 'Integrate generative AI APIs, train retrieval-augmented agents, structure embeddings, and build production AI workflows.',
  },
];

const PERSONAS = [
  {
    id: 'job_seeker',
    title: 'Career Seeker',
    subtitle: 'Actively preparing for engineering roles, technical interviews & capstones',
    icon: Briefcase,
    color: 'text-emerald-700 bg-emerald-100',
  },
  {
    id: 'pro',
    title: 'Working Professional',
    subtitle: 'Upskilling in a new stack or deepening architectural mechanics',
    icon: Target,
    color: 'text-blue-700 bg-blue-100',
  },
  {
    id: 'student',
    title: 'College / University Student',
    subtitle: 'Strengthening CS fundamentals, building semester portfolios & project verification',
    icon: GraduationCap,
    color: 'text-purple-700 bg-purple-100',
  },
  {
    id: 'maker',
    title: 'Hobbyist & Indie Hacker',
    subtitle: 'Shipping personal products, SaaS prototypes, or exploring modern frameworks',
    icon: Compass,
    color: 'text-amber-700 bg-amber-100',
  },
];

const BUDGET_OPTIONS = [
  { minutes: 15, label: '15 min/day', subtitle: 'Micro-learning' },
  { minutes: 30, label: '30 min/day', subtitle: 'Steady habit' },
  { minutes: 45, label: '45 min/day', subtitle: 'Recommended speed', recommended: true },
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-green-950 text-slate-100 px-4 py-8 sm:px-6 sm:py-12 flex flex-col justify-between">
      {/* Top Header & Step Indicator */}
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <Sparkles size={20} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Phase 1: Learner Calibration
              </p>
              <h1 className="text-lg font-bold text-white">Adaptive Profile Setup</h1>
            </div>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                      : step > s
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 w-6 sm:w-10 rounded-full transition-all ${
                      step > s ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Contents */}
        <div className="py-8">
          {/* STEP 1: Language & Persona */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center sm:text-left">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Step 1 of 3
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
                  Choose your language & learner profile
                </h2>
                <p className="mt-2 text-sm text-slate-400 max-w-xl">
                  We customize the AI learning tutor explanations and your assessment tone based on how you learn best.
                </p>
              </div>

              {/* Language Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Globe size={15} className="text-emerald-400" />
                  Primary Learning Language
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: 'en', title: 'English', desc: 'Standard technical terms and English explanations', icon: '🇺🇸' },
                    { id: 'hi', title: 'हिन्दी (Hindi)', desc: 'हिंदी व्याख्यान एवं स्थानीय उदाहरण', icon: '🇮🇳' },
                    { id: 'hinglish', title: 'Hinglish', desc: 'Natural mix of Hindi & English tech terminology', icon: '💬' },
                  ].map((l) => {
                    const isSelected = language === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLanguage(l.id)}
                        className={`group relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/20'
                            : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{l.icon}</span>
                          {isSelected && <CheckCircle2 size={18} className="text-emerald-400" />}
                        </div>
                        <p className="font-bold text-sm text-white group-hover:text-emerald-300">
                          {l.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{l.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Persona Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Award size={15} className="text-emerald-400" />
                  Select Your Learner Persona
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
                        className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/20'
                            : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/80'
                        }`}
                      >
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${p.color}`}>
                          <Icon size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-white">{p.title}</p>
                            {isSelected && <CheckCircle2 size={18} className="text-emerald-400" />}
                          </div>
                          <p className="mt-1 text-xs text-slate-400 leading-relaxed">{p.subtitle}</p>
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
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Step 2 of 3
                  </span>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
                    Select your technology track to master
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Your diagnostic and topological milestones will be generated for this path.
                  </p>
                </div>

                {/* Track Search Filter */}
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search engineering tracks..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                      className={`relative flex flex-col justify-between p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/40 shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${track.badgeColor}`}>
                            {track.badge}
                          </span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={13} /> {track.duration}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
                            <Icon size={20} />
                          </span>
                          <div>
                            <h3 className="font-bold text-base text-white">{track.title}</h3>
                            <p className="text-xs text-emerald-400/90 font-medium mt-0.5">{track.tagline}</p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                          {track.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">{track.topicsCount} core modules + 2 capstones</span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 size={16} /> Selected
                          </span>
                        ) : (
                          <span className="text-slate-500 hover:text-slate-300">Click to select</span>
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
            <div className="space-y-8 animate-fadeIn">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Step 3 of 3
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
                  Your background & available study time
                </h2>
                <p className="mt-2 text-sm text-slate-400 max-w-xl">
                  We use your available time to calculate precise milestone deadlines and structure your daily revision rhythm.
                </p>
              </div>

              {/* Prior Experience Tier */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Self-Assessed Current Knowledge Level
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: 'beginner', title: '🌱 Foundational', subtitle: 'Basic syntax understanding; ready to learn patterns' },
                    { id: 'intermediate', title: '🌿 Intermediate', subtitle: 'Built small apps; need architectural mastery' },
                    { id: 'advanced', title: '🌳 Advanced', subtitle: 'Experienced developer filling niche depth gaps' },
                  ].map((lvl) => {
                    const isSelected = priorExperience === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setPriorExperience(lvl.id)}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/20'
                            : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-white">{lvl.title}</p>
                          {isSelected && <CheckCircle2 size={16} className="text-emerald-400" />}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{lvl.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Study Budget Selection */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Clock size={15} className="text-emerald-400" />
                    Daily Study Commitment
                  </label>
                  <span className="text-xs font-bold text-emerald-400">
                    {studyBudget} minutes / day
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
                        className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/20 text-white font-bold ring-2 ring-emerald-500/30'
                            : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <p className="text-sm font-bold">{opt.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{opt.subtitle}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Completion Forecast Banner */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs text-emerald-200 flex items-start gap-3 mt-4">
                  <Sparkles size={18} className="shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-white text-sm">Smart Study Projection</p>
                    <p className="mt-1 leading-relaxed">
                      At <strong className="text-emerald-300">{studyBudget} mins/day</strong>, you will complete the{' '}
                      <strong>{TRACKS.find((t) => t.id === selectedTrack)?.title}</strong> curriculum, pass all verification milestones, and unlock your capstone project in approximately{' '}
                      <strong className="text-emerald-300">
                        {Math.max(3, Math.ceil(36 / (studyBudget / 30)))} weeks
                      </strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="border-t border-slate-800 pt-6 flex items-center justify-between">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-800 text-xs py-2.5 px-4"
            >
              <ArrowLeft size={16} /> Previous
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← Cancel & return home
            </button>
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-5"
            >
              Next Step <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs py-2.5 px-6 shadow-lg shadow-emerald-500/25"
            >
              Begin AI Diagnostic Assessment <Sparkles size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
