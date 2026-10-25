import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Menu,
  X,
  LogIn,
  Sparkles,
  Layers,
  Map,
  ChartNoAxesColumnIncreasing,
  Code2,
  Server,
  Cloud,
  Cpu,
  ShieldCheck,
  Clock
} from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ScoreRing from '../components/ui/ScoreRing';
import SkillBar from '../components/ui/SkillBar';
import { useAuth } from '../hooks/useAuth';

const TRACKS_PREVIEW = [
  {
    id: 'fullstack',
    title: 'Full-Stack Web Development',
    tagline: 'Modern React 19, TypeScript, Distributed State & Fullstack Cloud',
    icon: Code2,
    badge: 'Popular Track',
    duration: '6-8 Weeks',
    topicsCount: 18,
  },
  {
    id: 'backend',
    title: 'Backend Systems & Architecture',
    tagline: 'Spring Boot, High-Throughput APIs, Kafka Queues & SQL Optimization',
    icon: Server,
    badge: 'Enterprise Demand',
    duration: '8-10 Weeks',
    topicsCount: 22,
  },
  {
    id: 'devops',
    title: 'Cloud Engineering & DevOps',
    tagline: 'Docker, Kubernetes, AWS/GCP Infrastructures & Production CI/CD',
    icon: Cloud,
    badge: 'Infrastructure',
    duration: '6-8 Weeks',
    topicsCount: 16,
  },
  {
    id: 'ai-data',
    title: 'AI Engineering & Applied ML',
    tagline: 'Python, LLMs, Vector Databases, RAG Pipelines & Agent Orchestration',
    icon: Cpu,
    badge: 'Advanced AI',
    duration: '8-10 Weeks',
    topicsCount: 20,
  },
];

const PLATFORM_FEATURES = [
  {
    icon: Sparkles,
    title: 'Adaptive Diagnostic Assessment',
    text: 'Evaluate your proficiency across 5 engineering dimensions to establish an honest baseline ability score.',
    route: '/assessment',
  },
  {
    icon: Map,
    title: 'Topological Learning Roadmap',
    text: 'A structured, dependency-ordered sequence of milestones designed to close gaps with zero redundant study.',
    route: '/roadmap',
  },
  {
    icon: Layers,
    title: 'Interactive Skill Graph',
    text: 'Visualize prerequisites and knowledge relationships before progressing into high-complexity architecture.',
    route: '/graph',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: 'Analytics & Verification',
    text: 'Track real learning velocity, habit streaks, and preparation for verifiable capstone credentials.',
    route: '/analytics',
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Diagnose Baseline',
    desc: 'Take an adaptive 10-question evaluation that analyzes core prerequisites, theory, syntax, and problem-solving.',
  },
  {
    num: '02',
    title: 'Generate Roadmap',
    desc: 'The AI engine eliminates mastered topics and compiles a topological milestone path calibrated to your schedule.',
  },
  {
    num: '03',
    title: 'Learn & Remediate',
    desc: 'Follow curated modules and exercises. If a quiz score is below threshold, automated revision loops bridge the gap.',
  },
  {
    num: '04',
    title: 'Verify & Credential',
    desc: 'Build capstone projects, undergo AI code evaluation, and earn verifiable proof-of-competency credentials.',
  },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} asLink={false} />

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-7 md:flex text-sm font-medium text-slate-600">
            <a href="#tracks" className="hover:text-slate-900 transition-colors">
              Tracks
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Platform
            </a>
            <a href="#how" className="hover:text-slate-900 transition-colors">
              Methodology
            </a>

            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                Open Dashboard
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                <LogIn size={15} /> Sign in
              </Button>
            )}

            <Button
              variant="indigo"
              size="sm"
              onClick={() => navigate('/onboarding')}
              className="gap-1.5"
            >
              Start Diagnostic
              <ArrowRight size={15} />
            </Button>
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 space-y-3 md:hidden shadow-lg">
            <a
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href="#tracks"
            >
              Curriculum Tracks
            </a>
            <a
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href="#features"
            >
              Platform Capabilities
            </a>
            <a
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href="#how"
            >
              How It Works
            </a>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  setMobileOpen(false);
                  navigate('/login');
                }}
              >
                Sign in
              </Button>
              <Button
                variant="indigo"
                className="w-full justify-center"
                onClick={() => {
                  setMobileOpen(false);
                  navigate('/onboarding');
                }}
              >
                Start Diagnostic & Onboarding
              </Button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative border-b border-slate-200/80 bg-slate-50/50 py-16 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              {/* Left Column: Value Proposition */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800">
                  <Sparkles size={13} /> ADAPTIVE LEARNING & VERIFICATION
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] leading-[1.12]">
                  Know what to learn next.{' '}
                  <span className="text-indigo-600 block sm:inline">Eliminate skill gaps.</span>
                </h1>

                <p className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
                  Engineered for college students, job seekers, and working professionals. Take an adaptive diagnostic assessment, follow a personalized milestone roadmap, and verify mastery with structured proof of work.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Button
                    variant="indigo"
                    size="lg"
                    onClick={() => navigate('/onboarding')}
                    className="justify-center"
                  >
                    Start Free Diagnostic
                    <ArrowRight size={17} />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/dashboard')}
                    className="justify-center"
                  >
                    Explore Dashboard Demo
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 flex flex-wrap items-center gap-5 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Check size={15} className="text-emerald-600" /> 10-Question Diagnostic
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check size={15} className="text-emerald-600" /> Automated Revision Loops
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check size={15} className="text-emerald-600" /> Verifiable Proof of Work
                  </span>
                </div>
              </div>

              {/* Right Column: Live Product Preview Card */}
              <div className="lg:col-span-5">
                <Card className="border border-slate-200/90 shadow-md bg-white p-5 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Live Learning Snapshot
                      </span>
                    </div>
                    <Badge variant="indigo">Full-Stack Track</Badge>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <ScoreRing score={78} size={80} strokeWidth={6} color="#4f46e5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Readiness Score
                      </p>
                      <p className="text-lg font-bold text-slate-900">78 / 100 Benchmarked</p>
                      <p className="text-xs text-emerald-700 font-medium mt-0.5">
                        Top 20% in Core Concepts
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Knowledge Frontier
                    </p>
                    <SkillBar name="JavaScript Mechanics" score={85} level="Mastered" />
                    <SkillBar name="React State & Fiber" score={72} level="Proficient" />
                    <SkillBar name="Relational DB & SQL" score={45} level="Revision Loop" />
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Next milestone: Relational Queries</span>
                    <span className="font-semibold text-indigo-600">30 min</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Tracks Section */}
        <section id="tracks" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Curated Engineering Tracks
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Industry-Calibrated Curriculums
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                Choose a technology track to generate your personalized topological roadmap.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TRACKS_PREVIEW.map((t) => {
                const Icon = t.icon;
                return (
                  <Card
                    key={t.id}
                    interactive
                    onClick={() => navigate('/onboarding')}
                    className="flex flex-col justify-between group border-slate-200/90 hover:border-indigo-300"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Icon size={20} />
                        </span>
                        <Badge variant="neutral">{t.badge}</Badge>
                      </div>

                      <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {t.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        {t.tagline}
                      </p>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {t.duration}
                      </span>
                      <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
                        Start <ChevronRight size={13} />
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Platform Capabilities */}
        <section id="features" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 bg-slate-50/60 border-y border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Architecture & Methodology
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Engineered for Measurable Competency
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Move beyond passive video tutorials with active diagnostic evaluation and automated remediation.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PLATFORM_FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <Card key={f.title} className="p-5 space-y-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon size={20} />
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.text}</p>
                    <button
                      type="button"
                      onClick={() => navigate(f.route)}
                      className="pt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      Explore capability <ChevronRight size={13} />
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4-Step Methodology */}
        <section id="how" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                End-to-End Workflow
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                The 4-Phase Learning Lifecycle
              </h2>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_STEPS.map((step) => (
                <div
                  key={step.num}
                  className="rounded-xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-2xs"
                >
                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    PHASE {step.num}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Card */}
        <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/80">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-slate-900 p-8 sm:p-12 text-center text-white shadow-md space-y-5">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-800 text-indigo-400 mx-auto">
                <ShieldCheck size={24} />
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ready to accelerate your technical skills?
              </h2>
              <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-400 leading-relaxed">
                Take the 10-minute adaptive assessment to pinpoint knowledge gaps and establish your customized starting milestone.
              </p>
              <div className="pt-2 flex justify-center">
                <Button
                  variant="indigo"
                  size="lg"
                  onClick={() => navigate('/onboarding')}
                >
                  Start Adaptive Diagnostic
                  <ArrowRight size={17} />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-500 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
        <span>© 2026 AI Upskilling Platform. All rights reserved.</span>
        <div className="flex items-center gap-5">
          <Link to="/login" className="hover:text-slate-900 transition">
            Sign In
          </Link>
          <Link to="/onboarding" className="hover:text-slate-900 transition">
            Start Diagnostic
          </Link>
          <Link to="/dashboard" className="hover:text-slate-900 transition">
            Dashboard
          </Link>
        </div>
      </footer>
    </div>
  );
}
