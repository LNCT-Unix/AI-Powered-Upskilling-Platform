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

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithGitHub, isAuthenticated } = useAuth();

  return (
    <div id="top" className="overflow-hidden bg-white text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8" aria-label="Main navigation">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} asLink={false} />
          
          <div className="hidden items-center gap-6 md:flex">
            <a className="text-sm font-medium text-slate-600 hover:text-green-800 transition" href="#features">Features</a>
            <a className="text-sm font-medium text-slate-600 hover:text-green-800 transition" href="#how">How it works</a>
            <a className="text-sm font-medium text-slate-600 hover:text-green-800 transition" href="#about">About</a>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <Button variant="ghost" onClick={() => setAuthModalOpen(true)}>
                <LogIn size={15} /> Sign in
              </Button>
            )}

            <Button onClick={() => navigate('/assessment')}>
              Try a diagnostic <ArrowRight size={16} />
            </Button>
          </div>

          <button
            type="button"
            className="rounded-xl p-2 hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="space-y-1 border-t border-slate-100 px-5 py-4 md:hidden">
            <a onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm" href="#features">
              Features
            </a>
            <a onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm" href="#how">
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

      {/* Main Hero & Content */}
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:py-20 md:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3.5 py-2 text-xs font-bold text-green-900">
              <Sparkles size={14} /> YOUR SKILLS, YOUR NEXT STEP
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight text-green-950 sm:text-5xl lg:text-6xl">
              Know what to learn next, <span className="text-green-700">not just what to study.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Turn your learning goals into a clear plan. Discover skill gaps, get a personalized roadmap, and see your progress grow — one step at a time.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate('/assessment')}>
                Start free diagnostic <ArrowRight size={17} />
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Explore dashboard
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-2">
                <Check size={15} className="text-green-700" /> Personalized learning
              </span>
              <span className="flex items-center gap-2">
                <Check size={15} className="text-green-700" /> Track your growth
              </span>
              <span className="flex items-center gap-2">
                <Check size={15} className="text-green-700" /> Learn at your pace
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl pb-7 pl-3 sm:pl-5">
            <img
              src={HERO_IMAGE}
              alt="Students learning and collaborating on a project"
              className="h-[330px] w-full rounded-3xl object-cover shadow-xl shadow-green-950/10 sm:h-[420px]"
            />
            <div className="absolute left-0 top-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-lg">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-100 text-green-900">
                <GraduationCap size={21} />
              </span>
              <div>
                <p className="text-sm font-bold text-green-950">Learn with direction</p>
                <p className="mt-1 text-xs text-slate-500">Small steps, real progress</p>
              </div>
            </div>

            <div className="absolute -bottom-1 right-0 w-[min(330px,90%)] rounded-2xl border border-slate-100 bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">YOUR SKILL SNAPSHOT</p>
                  <h2 className="mt-1 text-lg font-extrabold text-green-950">A little better every day</h2>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-800">
                  <TrendingUp />
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {skills.slice(0, 3).map((s) => (
                  <SkillBar key={s.name} {...s} />
                ))}
              </div>
              <p className="mt-3 text-center text-[10px] text-slate-400">Illustrative preview · sample data</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 bg-green-50/70 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-800">A smarter way to grow</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-green-950 sm:text-4xl">
                Everything you need to close the gap
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                A clear path from knowing where you are to knowing what to do next.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }, i) => {
                const targetRoutes = ['/assessment', '/graph', '/roadmap', '/analytics'];
                return (
                  <Card key={title} className="transition hover:-translate-y-0.5 hover:shadow-md">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl ${
                        i % 2 === 0 ? 'bg-yellow-100 text-green-900' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      <Icon size={23} />
                    </span>
                    <h3 className="mt-5 font-bold text-green-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                    <button
                      type="button"
                      onClick={() => navigate(targetRoutes[i])}
                      className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-green-800 hover:text-green-950"
                    >
                      Explore <ChevronRight size={15} />
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-800">Simple by design</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-green-950 sm:text-4xl">
              Your growth, in four steps
            </h2>
          </div>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, text], i) => (
              <li key={title}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-yellow-300 text-sm font-extrabold text-green-950">
                  0{i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-green-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section id="about" className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
          <div className="rounded-3xl bg-green-950 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <GraduationCap className="mx-auto mb-4 text-yellow-300" size={36} />
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready to find your next step?</h2>
            <p className="mx-auto mt-4 max-w-lg leading-7 text-green-100">
              Start with what you know today. Build the skills you need for tomorrow.
            </p>
            <Button variant="yellow" className="mt-7" onClick={() => navigate('/dashboard')}>
              Explore your dashboard <ArrowRight size={17} />
            </Button>
          </div>
        </section>
      </main>

      {/* Sign-In Modal (Spring Boot Gateway Integration) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-green-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-green-950">Sign In to SkillPath</h2>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Sign in via your preferred identity provider to sync your adaptive roadmap across devices.
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-slate-300 hover:bg-slate-50"
                onClick={loginWithGoogle}
              >
                <span className="font-bold text-slate-700">Continue with Google</span>
              </Button>

              <Button
                variant="primary"
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white"
                onClick={loginWithGitHub}
              >
                <span className="font-bold">Continue with GitHub</span>
              </Button>

              <div className="relative py-2 text-center text-xs text-slate-400">
                <span className="bg-white px-2">or for local offline development</span>
              </div>

              <Button
                variant="ghost"
                className="w-full text-xs text-slate-600 hover:bg-slate-100"
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

      <footer className="border-t border-slate-100 px-5 py-7 text-center text-sm text-slate-500">
        © 2026 AiUpskillingPlatform. Learning progress preview · Sample data only.
      </footer>
    </div>
  );
}
