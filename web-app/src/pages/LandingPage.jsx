import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Check, ChevronRight, GraduationCap, Menu,
  Sparkles, TrendingUp, X, LogIn
} from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import Card from '../components/ui/Card';
import SkillBar from '../components/ui/SkillBar';
import { HERO_IMAGE, skills, features, steps } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

// Nav link with a gradient underline that grows on hover
const navLink =
  'relative text-sm font-medium text-slate-700 transition hover:text-green-800 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-yellow-400 after:to-green-600 after:transition-all after:duration-300 hover:after:w-full';

// One gradient per feature card ("!" overrides Card's default gradient)
const featureTints = [
  {
    card: '!from-lime-200 !via-green-200 !to-emerald-300 !border-green-400/70 hover:!border-green-700',
    badge: 'bg-green-800 text-white shadow-green-900/30',
    ink: 'text-green-950', sub: 'text-green-900/80', link: 'text-green-900',
  },
  {
    card: '!from-yellow-100 !via-yellow-200 !to-amber-300 !border-yellow-400/70 hover:!border-amber-600',
    badge: 'bg-yellow-300 text-green-950 shadow-amber-500/40',
    ink: 'text-amber-950', sub: 'text-amber-900/80', link: 'text-amber-950',
  },
  {
    card: '!from-sky-100 !via-sky-200 !to-indigo-300 !border-sky-400/70 hover:!border-indigo-600',
    badge: 'bg-indigo-600 text-white shadow-indigo-700/30',
    ink: 'text-indigo-950', sub: 'text-indigo-900/80', link: 'text-indigo-950',
  },
  {
    card: '!from-orange-100 !via-orange-200 !to-rose-300 !border-orange-400/70 hover:!border-rose-600',
    badge: 'bg-rose-500 text-white shadow-rose-600/30',
    ink: 'text-rose-950', sub: 'text-rose-900/80', link: 'text-rose-950',
  },
];

// One gradient badge per step
const stepBadges = [
  'from-yellow-300 to-amber-400 text-green-950 shadow-amber-500/40',
  'from-lime-300 to-green-500 text-green-950 shadow-green-600/40',
  'from-emerald-400 to-teal-600 text-white shadow-teal-700/40',
  'from-sky-400 to-indigo-500 text-white shadow-indigo-600/40',
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithGitHub, isAuthenticated } = useAuth();

  return (
    // overflow-x-clip (not overflow-hidden) so the sticky header keeps working
    <div id="top" className="overflow-x-clip bg-white text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 shadow-sm shadow-green-900/5 backdrop-blur">
        <div className="h-1 bg-gradient-to-r from-yellow-300 via-lime-400 to-green-600" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8" aria-label="Main navigation">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} asLink={false} />

          <div className="hidden items-center gap-6 md:flex">
            <a className={navLink} href="#features">Features</a>
            <a className={navLink} href="#how">How it works</a>
            <a className={navLink} href="#about">About</a>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="ghost">
                  <LogIn size={15} /> Sign in
                </Button>
              </Link>
            )}

            <Button onClick={() => navigate('/onboarding')} className="group">
              Start Free Assessment
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </div>

          <button
            type="button"
            className="rounded-xl p-2 transition hover:bg-green-100 active:scale-95 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="space-y-1 border-t border-green-100 bg-gradient-to-b from-yellow-50 to-white px-5 py-4 md:hidden">
            <a onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-green-100" href="#features">
              Features
            </a>
            <a onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-green-100" href="#how">
              How it works
            </a>
            {!isAuthenticated && (
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => {
                  setMobileOpen(false);
                  setAuthModalOpen(true);
                }}
              >
                <LogIn size={15} /> Sign in
              </Button>
            )}
            <Button className="mt-2 w-full" onClick={() => { setMobileOpen(false); navigate('/dashboard'); }}>
              Open dashboard <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative bg-gradient-to-b from-yellow-50 via-lime-50/60 to-white">
          {/* soft colour blobs */}
          <span aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-yellow-200/50 blur-3xl" />
          <span aria-hidden="true" className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-green-300/40 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:py-20 md:grid-cols-2 lg:px-8 lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-gradient-to-r from-yellow-100 to-lime-100 px-3.5 py-2 text-xs font-bold text-green-900 shadow-sm">
                <Sparkles size={14} /> YOUR SKILLS, YOUR NEXT STEP
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight text-green-950 sm:text-5xl lg:text-6xl">
                Know what to learn next,{' '}
                <span className="bg-gradient-to-r from-green-700 via-emerald-500 to-lime-500 bg-clip-text text-transparent">
                  not just what to study.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-700 sm:text-lg">
                Turn your learning goals into a clear plan. Discover skill gaps, get a personalized roadmap, and see your progress grow — one step at a time.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate('/onboarding')} className="group">
                  Start Free Diagnostic & Onboarding
                  <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Explore dashboard
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-green-900">
                {['Personalized learning', 'Track your growth', 'Learn at your pace'].map((t) => (
                  <span
                    key={t}
                    className="flex cursor-default items-center gap-2 rounded-full border border-green-200 bg-white/80 px-3 py-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-500 hover:bg-green-100"
                  >
                    <Check size={15} className="text-green-700" /> {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="group/hero relative mx-auto w-full max-w-xl pb-7 pl-3 sm:pl-5">
              <div className="relative">
                {/* gradient frame that shifts on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-yellow-300 via-lime-300 to-green-500 transition-transform duration-500 group-hover/hero:translate-x-5 group-hover/hero:translate-y-5"
                />
                <img
                  src={HERO_IMAGE}
                  alt="Students learning and collaborating on a project"
                  className="relative h-[330px] w-full rounded-3xl object-cover shadow-xl shadow-green-950/10 sm:h-[420px]"
                />
              </div>

              <div className="absolute left-0 top-5 flex items-center gap-3 rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-white p-3 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-safe:hover:-rotate-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-300 text-green-950">
                  <GraduationCap size={21} />
                </span>
                <div>
                  <p className="text-sm font-bold text-green-950">Learn with direction</p>
                  <p className="mt-1 text-xs text-slate-600">Small steps, real progress</p>
                </div>
              </div>

              <div className="absolute -bottom-1 right-0 w-[min(330px,90%)] rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-green-500 hover:shadow-2xl hover:shadow-green-700/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600">YOUR SKILL SNAPSHOT</p>
                    <h2 className="mt-1 text-lg font-extrabold text-green-950">A little better every day</h2>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-800 text-white shadow-md shadow-green-900/25">
                    <TrendingUp />
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {skills.slice(0, 3).map((s) => (
                    <SkillBar key={s.name} {...s} />
                  ))}
                </div>
                <p className="mt-3 text-center text-[10px] text-slate-500">Illustrative preview · sample data</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 bg-gradient-to-br from-green-50 via-lime-50 to-yellow-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-800">A smarter way to grow</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-green-950 sm:text-4xl">
                Everything you need to close the gap
              </h2>
              <p className="mt-4 leading-7 text-slate-700">
                A clear path from knowing where you are to knowing what to do next.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }, i) => {
                const targetRoutes = ['/assessment', '/graph', '/roadmap', '/analytics'];
                const t = featureTints[i % featureTints.length];
                return (
                  <Card key={title} className={t.card}>
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl shadow-md transition-all duration-300 motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110 ${t.badge}`}
                    >
                      <Icon size={23} />
                    </span>
                    <h3 className={`mt-5 font-bold ${t.ink}`}>{title}</h3>
                    <p className={`mt-2 text-sm leading-6 ${t.sub}`}>{text}</p>
                    <button
                      type="button"
                      onClick={() => navigate(targetRoutes[i])}
                      className={`group/link mt-5 inline-flex items-center gap-1 text-sm font-bold ${t.link}`}
                    >
                      Explore
                      <ChevronRight size={15} className="transition-transform duration-200 group-hover/link:translate-x-1.5" />
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:py-20 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-800">Simple by design</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-green-950 sm:text-4xl">
              Your growth, in four steps
            </h2>
          </div>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, text], i) => (
              <li
                key={title}
                className="group rounded-3xl border border-transparent p-5 transition-all duration-300 hover:border-green-200 hover:bg-gradient-to-br hover:from-white hover:to-green-50 hover:shadow-lg hover:shadow-green-900/10 motion-safe:hover:-translate-y-1"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-sm font-extrabold shadow-md transition-all duration-300 motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110 ${stepBadges[i % stepBadges.length]}`}
                >
                  0{i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-green-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section id="about" className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-950 via-green-900 to-emerald-700 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <span aria-hidden="true" className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-yellow-300/25 blur-2xl" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-10 h-52 w-52 rounded-full bg-lime-300/20 blur-2xl" />
            <div className="relative">
              <GraduationCap className="mx-auto mb-4 text-yellow-300" size={36} />
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready to find your next step?</h2>
              <p className="mx-auto mt-4 max-w-lg leading-7 text-green-100">
                Start with what you know today. Build the skills you need for tomorrow.
              </p>
              <Button variant="yellow" className="group mt-7" onClick={() => navigate('/dashboard')}>
                Explore your dashboard
                <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Sign-In Modal (Spring Boot Gateway Integration) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-950/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md space-y-6 overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-yellow-300 via-lime-400 to-green-600" />
            <div className="flex items-center justify-between border-b border-green-100 pb-3 pt-1">
              <h2 className="text-lg font-bold text-green-950">Sign In to SkillPath</h2>
              <button
                type="button"
                aria-label="Close sign in"
                onClick={() => setAuthModalOpen(false)}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-green-100 hover:text-green-900"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Sign in via your preferred identity provider to sync your adaptive roadmap across devices.
            </p>

            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={loginWithGoogle}>
                Continue with Google
              </Button>

              {/* !bg-none removes Button's green gradient so the dark colour shows */}
              <Button
                variant="primary"
                className="w-full !bg-none bg-slate-900 text-white shadow-slate-900/30 hover:bg-black"
                onClick={loginWithGitHub}
              >
                Continue with GitHub
              </Button>

              <div className="relative py-2 text-center text-xs text-slate-500">
                <span className="bg-white px-2">or for local offline development</span>
              </div>

              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setAuthModalOpen(false);
                  navigate('/dashboard');
                }}
              >
                Continue as Guest (Offline Mode)
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t-4 border-lime-300 bg-gradient-to-b from-white to-green-50 px-5 py-7 text-center text-sm text-slate-600">
        © 2026 AiUpskillingPlatform. Learning progress preview · Sample data only.
      </footer>
    </div>
  );
}
