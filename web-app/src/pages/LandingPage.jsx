import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Video, CheckCircle2 } from 'lucide-react';

/* ── Stat badge floating card ─────────────────────────── */
function StatBadge({ icon: Icon, value, label, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
        <Icon size={16} className="text-indigo-600" />
      </span>
      <div>
        <p className="text-sm font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Avatar card (coloured background + initials) ──────── */
function AvatarCard({ initials, bg, size = 'md', rotate = 0, className = '' }) {
  const sizes = { sm: 'h-20 w-16', md: 'h-28 w-22', lg: 'h-36 w-28' };
  return (
    <div
      className={`${sizes[size]} rounded-2xl flex items-center justify-center font-bold text-white text-lg select-none shadow-md ${bg} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/* ── Feature row ───────────────────────────────────────── */
function Feature({ title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: '#f5f3ee' }}>
      {/* ── Navbar ──────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <BookOpen size={16} className="text-white" />
          </span>
          <span className="text-lg font-extrabold text-slate-900">SkillPath</span>
        </div>

        <nav className="hidden sm:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="text-slate-900 border-b-2 border-indigo-600 pb-0.5">Home</a>
          <a href="#" className="hover:text-slate-900 transition">Courses</a>
          <a href="#" className="hover:text-slate-900 transition">About</a>
          <a href="#" className="hover:text-slate-900 transition">Blog</a>
        </nav>

        <Link
          to="/login"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
        >
          Get Started
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <main className="relative overflow-hidden">
        {/* Heading block */}
        <div className="text-center pt-12 pb-6 px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-3xl mx-auto">
            Diagnose your gaps,<br />
            build real skills,<br />
            get hired.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-500 max-w-md mx-auto">
            Adaptive diagnostic, personalised roadmap, and job-match verification — built for Indian learners.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
          >
            Start for free <ArrowRight size={16} />
          </button>
        </div>

        {/* Photo collage area */}
        <div className="relative mx-auto max-w-4xl h-80 sm:h-96 px-4">
          {/* Left side cards */}
          <AvatarCard initials="PK" bg="bg-yellow-400" size="sm" rotate={-4}
            className="absolute left-4 sm:left-16 top-4" />
          <AvatarCard initials="RS" bg="bg-teal-400" size="sm" rotate={3}
            className="absolute left-0 sm:left-8 top-28" />

          {/* Centre large card */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 h-64 w-44 sm:w-52 rounded-3xl bg-yellow-300 flex items-center justify-center shadow-lg">
            <div className="h-56 w-40 sm:w-48 rounded-2xl bg-gradient-to-b from-indigo-200 to-indigo-400 flex items-end justify-center overflow-hidden">
              <div className="text-5xl mb-4">👩‍💻</div>
            </div>
          </div>

          {/* Right side cards */}
          <AvatarCard initials="AM" bg="bg-purple-300" size="sm" rotate={2}
            className="absolute right-8 sm:right-20 top-2" />
          <AvatarCard initials="VJ" bg="bg-pink-300" size="sm" rotate={-3}
            className="absolute right-2 sm:right-6 top-32" />
          <AvatarCard initials="NK" bg="bg-sky-300" size="sm" rotate={4}
            className="absolute right-16 sm:right-36 top-44 sm:top-52" />

          {/* Floating stat badges */}
          <StatBadge icon={Video} value="3K+" label="Practice problems"
            className="absolute left-4 sm:left-24 top-44 sm:top-48 z-10" />
          <StatBadge icon={Users} value="98%" label="Learner satisfaction"
            className="absolute left-1/2 -translate-x-1/2 bottom-0 z-10" />
          <StatBadge icon={CheckCircle2} value="120+" label="Skills verified"
            className="absolute right-2 sm:right-16 top-44 z-10" />
        </div>

        {/* ── How it works ─────────────────────────────── */}
        <section className="mt-16 mx-auto max-w-5xl px-6 sm:px-10">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Four steps to job-ready</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', title: 'Take the diagnostic', desc: 'A 10-question adaptive test maps your current knowledge across 5 dimensions in under 15 minutes.' },
              { n: '02', title: 'Get your roadmap', desc: 'AI skips topics you already know and adds revision loops where you need work.' },
              { n: '03', title: 'Learn & verify', desc: 'NPTEL, freeCodeCamp, Kaggle — curated resources with time estimates, not just links.' },
              { n: '04', title: 'Match to jobs', desc: 'Your skill profile is compared against real JDs. You see exactly what to complete next.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
                <p className="text-3xl font-black text-indigo-100 leading-none">{n}</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ─────────────────────────────────── */}
        <section className="mt-16 mx-auto max-w-5xl px-6 sm:px-10">
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8 sm:p-10">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Why SkillPath</p>
                <h2 className="text-2xl font-extrabold text-slate-900 leading-snug">Built for the Indian job market</h2>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                  Every "why this step?" is backed by a real job-posting signal — not generic advice.
                </p>
                <button
                  onClick={() => navigate('/signup')}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                  Create free account <ArrowRight size={14} />
                </button>
              </div>
              <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
                <Feature title="Adaptive diagnostic" desc="10 questions across 5 competency areas. Results update your roadmap automatically." />
                <Feature title="Visual skill graph" desc="See which skills are prerequisites for others. Know exactly what to learn next." />
                <Feature title="Personalised roadmap" desc="Milestones are ordered by dependency, not alphabetically. Skips what you already know." />
                <Feature title="Job-match score" desc="Compares your skill profile against real JDs on Naukri, LinkedIn, and Unstop." />
                <Feature title="Project verification" desc="Submit a GitHub repo. Automated checks confirm your code actually works." />
                <Feature title="Progress analytics" desc="Track daily study hours, streak, and dimension scores — not just a completion %" />
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA footer ───────────────────────────────── */}
        <section className="mt-16 mb-16 mx-auto max-w-2xl text-center px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Ready to find your next step?</h2>
          <p className="mt-3 text-sm text-slate-500">Takes 15 minutes. No credit card.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/signup')}
              className="rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
            >
              Start the diagnostic
            </button>
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2">
              Sign in
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <span>© 2025 SkillPath · AI-Powered Upskilling for Indian Learners</span>
        <span>WCAG 2.2 AA · Secure</span>
      </footer>
    </div>
  );
}
