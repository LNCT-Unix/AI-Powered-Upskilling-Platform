import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, CheckCircle2, LogOut, MessageSquare, Sparkles, BrainCircuit, Network, GraduationCap, GitPullRequest, Briefcase } from 'lucide-react';
import Logo from '../components/ui/Logo';
import OctoMascotAnimation from '../components/ui/OctoMascotAnimation';
import { ASSIGNED_QUESTIONS } from '../data/chatbotQuestions';
import { useAuth } from '../hooks/useAuth';
import './LandingPage.css';

const LandingChatbot = lazy(() => import('../components/feature/LandingChatbot'));

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealEls = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealEls.forEach((el) => {
      if (reduced) el.classList.add('in');
      else io.observe(el);
    });

    const countEls = document.querySelectorAll('[data-count]');
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          const el = e.target;
          const end = parseFloat(el.getAttribute('data-count'));
          const dec = +(el.getAttribute('data-dec') || 0);
          if (reduced) {
            el.textContent = end.toFixed(dec);
            return;
          }
          const t0 = performance.now();
          const tick = (t) => {
            const p = Math.min((t - t0) / 1400, 1);
            const v = end * (1 - Math.pow(1 - p, 3));
            el.textContent = v.toFixed(dec);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.3 }
    );

    countEls.forEach((el) => {
      if (reduced) {
        el.textContent = parseFloat(el.getAttribute('data-count')).toFixed(+(el.getAttribute('data-dec') || 0));
      } else {
        cio.observe(el);
      }
    });

    return () => {
      io.disconnect();
      cio.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen text-slate-900" style={{ background: '#F7F3E8', fontFamily: 'Inter, sans-serif' }}>
      {/* ── Navbar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#F7F3E8]/90 backdrop-blur-md border-b border-[#E8E0CC]/80">
        <div className="flex items-center justify-between px-6 sm:px-10 py-3.5 max-w-7xl mx-auto">
          <Logo />

          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#top" className="text-[#7C5CFA] font-bold">Home</a>
            <a href="#how" className="hover:text-slate-900 transition">How it works</a>
            <a href="#graph" className="hover:text-slate-900 transition">Skill graph</a>
            <a href="#features" className="hover:text-slate-900 transition">Platform features</a>
            <a href="#projects" className="hover:text-slate-900 transition">Lab &amp; Career</a>
            <a href="#faq" className="hover:text-slate-900 transition flex items-center gap-1">
              <span>FAQ</span>
              <span className="text-[10px] bg-[#EFEAFC] text-[#7C5CFA] font-bold px-1.5 py-0.5 rounded-full">AI</span>
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-[#7C5CFA] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#6244E8] transition shadow-md shadow-[#7C5CFA]/20"
                >
                  Go to Dashboard <span className="arr">&rarr;</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition cursor-pointer"
                >
                  <LogOut size={14} className="text-slate-400 group-hover:text-rose-500" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-bold text-slate-700 hover:text-slate-900 px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#7C5CFA] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#6244E8] transition shadow-md shadow-[#7C5CFA]/20"
                >
                  Get Started <span className="arr">&rarr;</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-200/50 transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E8E0CC] bg-[#FFFDF7] px-6 py-4 shadow-xl space-y-3">
            <nav className="flex flex-col gap-2.5 text-sm font-semibold text-slate-700">
              <a href="#top" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#7C5CFA]">Home</a>
              <a href="#how" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#7C5CFA]">How it works</a>
              <a href="#graph" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#7C5CFA]">Skill graph</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#7C5CFA]">Platform features</a>
              <a href="#projects" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#7C5CFA]">Project Lab &amp; Career</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#7C5CFA]">AI FAQ Bot</a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-full bg-[#7C5CFA] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6244E8]"
                  >
                    Go to Dashboard &rarr;
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <LogOut size={15} />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full text-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="w-full text-center rounded-full bg-[#7C5CFA] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6244E8]"
                  >
                    Get Started &rarr;
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <main id="top" className="relative overflow-hidden pt-6">
        {/* Heading block */}
        <div className="text-center pt-8 pb-4 px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
            Diagnose your gaps,<br />
            build real skills with <span className="text-[#7C5CFA]">octoByte</span>.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Stop guessing what to learn. Take a short quiz that adapts to your level, get a personalised step-by-step learning plan, and build real projects that show employers you’re job-ready.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate(user ? '/assessment' : '/signup')}
              className="inline-flex items-center gap-2 rounded-full bg-[#7C5CFA] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#6244E8] transition shadow-lg shadow-[#7C5CFA]/25 cursor-pointer"
            >
              {user ? 'Start Diagnostic Test' : 'Start for free'} <span className="arr">&rarr;</span>
            </button>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              See how it works
            </a>
          </div>
          <div className="mt-4 text-xs text-slate-500 font-medium">
            Free for learners &middot; 56 Backend skills across 9 core clusters &middot; Takes ~4 minutes
          </div>
        </div>

        {/* Mascot Animation in Center of Hero */}
        <div className="relative mx-auto max-w-3xl px-4 py-6 flex justify-center items-center">
          <OctoMascotAnimation />
        </div>

        {/* ── Stats ─────────────────────────────────────── */}
        <div className="landing-container">
          <div className="stats">
            <div className="stat reveal" style={{ '--d': '0s' }}>
              <div className="stat-n"><span data-count="7.5" data-dec="1">0</span></div>
              <p>avg questions to find your baseline</p>
            </div>
            <div className="stat reveal" style={{ '--d': '.08s' }}>
              <div className="stat-n"><span data-count="56">0</span></div>
              <p>skills mapped in the Backend track</p>
            </div>
            <div className="stat reveal" style={{ '--d': '.16s' }}>
              <div className="stat-n"><span data-count="9">0</span></div>
              <p>clusters, from foundations to DevOps</p>
            </div>
            <div className="stat reveal" style={{ '--d': '.24s' }}>
              <div className="stat-n"><span data-count="90">0</span><em>%</em></div>
              <p>estimate accuracy vs true ability</p>
            </div>
          </div>
        </div>

        {/* ── Cluster Marquee ───────────────────────────── */}
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <span>Foundations</span><i>&#10022;</i><span>Web APIs</span><i>&#10022;</i><span>Databases</span><i>&#10022;</i><span>Security</span><i>&#10022;</i><span>Architecture &amp; Design</span><i>&#10022;</i><span>Performance</span><i>&#10022;</i><span>Async &amp; Distributed</span><i>&#10022;</i><span>Quality &amp; Observability</span><i>&#10022;</i><span>DevOps</span><i>&#10022;</i>
            <span>Foundations</span><i>&#10022;</i><span>Web APIs</span><i>&#10022;</i><span>Databases</span><i>&#10022;</i><span>Security</span><i>&#10022;</i><span>Architecture &amp; Design</span><i>&#10022;</i><span>Performance</span><i>&#10022;</i><span>Async &amp; Distributed</span><i>&#10022;</i><span>Quality &amp; Observability</span><i>&#10022;</i><span>DevOps</span><i>&#10022;</i>
          </div>
        </div>
      </main>

      {/* ── How it works ─────────────────────────────── */}
      <section className="section" id="how">
        <div className="landing-container">
          <div className="sec-head">
            <span className="kicker reveal">How it works</span>
            <h2 className="reveal" style={{ '--d': '.08s' }}>Three steps. Zero guesswork.</h2>
            <p className="sec-sub reveal" style={{ '--d': '.16s' }}>A loop that repeats every time you level up &mdash; each cycle starts from evidence about you, not vibes.</p>
          </div>
          <div className="steps">
            <article className="step reveal" style={{ '--d': '0s' }}>
              <span className="step-num">01</span>
              <div className="step-ic">
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 15.5a7 7 0 1 1 14 0" />
                  <path d="M12 15.5l3.6-4.2" />
                  <circle cx="12" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h3>Measure</h3>
              <p>Take a short quiz that adjusts to you. Each answer helps us understand your level, so the questions get easier or harder as you go. It usually takes just 7 or 8 questions (never more than 9), and the same answers always give the same result.</p>
              <span className="step-tag">Smart quiz · fair results</span>
            </article>

            <article className="step reveal" style={{ '--d': '.12s' }}>
              <span className="step-num">02</span>
              <div className="step-ic">
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 17c5.5 0 6.5-10 12-10" />
                  <circle cx="6" cy="17" r="2.1" fill="currentColor" stroke="none" />
                  <circle cx="18" cy="7" r="2.1" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h3>Plan</h3>
              <p>We compare your results with the skills for your track and show what you already know, what you can learn next, and what needs a foundation first. Then our AI builds a step-by-step plan: what to learn first, what you can skip, and roughly how long each step will take.</p>
              <span className="step-tag">Personal AI plan · accuracy</span>
            </article>

            <article className="step reveal" style={{ '--d': '.24s' }}>
              <span className="step-num">03</span>
              <div className="step-ic">
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8.5" />
                  <path d="M15 6.5h6v6" />
                </svg>
              </div>
              <h3>Track</h3>
              <p>Learn at your own pace. Tick off each step as you finish, watch your skill map fill up, and retake the quiz anytime to see how far you’ve come. Mentors and team admins can follow your progress, but only for learners in their own team.</p>
              <span className="step-tag">Live progress · retake anytime</span>
            </article>
          </div>
        </div>
      </section>

      {/* ── Skill graph ──────────────────────────────── */}
      <section className="section" id="graph">
        <div className="landing-container">
          <div className="graph-grid">
            <div className="split-head">
              <span className="kicker reveal">The skill graph</span>
              <h2 className="reveal" style={{ '--d': '.08s' }}>See exactly where you stand &mdash; and what unlocks next.</h2>
              <p className="lede reveal" style={{ '--d': '.16s' }}>Every track is a clear map of skills, arranged so each one builds on the last. Your quiz result shows where you stand, so your plan always starts at the right place.</p>
              <div className="legend">
                <div className="legend-item reveal" style={{ '--d': '.2s' }}>
                  <span className="dot g"></span>
                  <span>
                    <b>Ready to learn</b>
                    <p>Proven by your test result or unlocked for your study path.</p>
                  </span>
                </div>
                <div className="legend-item reveal" style={{ '--d': '.36s' }}>
                  <span className="dot l"></span>
                  <span>
                    <b>Locked</b>
                    <p>Not yet. Each one unlocks automatically as its prerequisites turn green.</p>
                  </span>
                </div>
              </div>
              <div className="gstats reveal" style={{ '--d': '.44s' }}>
                <span className="gstat"><b>56</b> skills</span>
                <span className="gstat"><b>72</b> prerequisite links</span>
                <span className="gstat"><b>9</b> clusters</span>
                <span className="gstat"><b>6</b>-deep chains</span>
              </div>
            </div>

            <div className="map-card reveal in" style={{ '--d': '.15s' }}>
              <div className="map-head">
                <span className="map-title"><i />backend-engineering &middot; skill map</span>
                <span className="live">LIVE VIEW</span>
              </div>
              <svg className="map-svg" viewBox="0 0 520 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A mini skill map showing ready to learn and locked skills">
                <g stroke="#DCD2BC" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" fill="none">
                  <path d="M245 70 C220 95 130 105 108 132" />
                  <path d="M103 178 C103 205 103 225 103 252" />
                  <path d="M417 178 C417 205 417 225 417 252" />
                  <path d="M118 178 C150 245 205 282 222 310" />
                  <path d="M402 178 C370 245 315 282 298 310" />
                </g>
                <path className="edge-on" d="M275 70 C300 92 392 100 414 130" stroke="#FF9838" strokeWidth="2.5" strokeDasharray="7 7" fill="none" />
                <circle r="5.5" fill="#FF9838" stroke="#fff" strokeWidth="2.5">
                  <animateMotion dur="2.8s" repeatCount="indefinite" path="M275 70 C300 92 392 100 414 130" />
                </circle>
                <circle className="ping" cx="417" cy="155" r="24" fill="none" stroke="#FF9838" />
                <g fontFamily="'Baloo 2',sans-serif" fontSize="14.5" fontWeight="600" textAnchor="middle">
                  <g><rect className="nd g" x="185" y="24" width="150" height="46" rx="14" /><text x="249" y="52" fill="#1F7A55">Foundations</text><circle cx="317" cy="47" r="4.5" fill="#2FBF8F" /></g>
                  <g><rect className="nd g" x="28" y="132" width="150" height="46" rx="14" /><text x="92" y="160" fill="#1F7A55">HTTP &amp; APIs</text><circle cx="160" cy="155" r="4.5" fill="#2FBF8F" /></g>
                  <g><rect className="nd o" x="342" y="132" width="150" height="46" rx="14" /><text x="406" y="160" fill="#B45A14">Databases</text><circle cx="474" cy="155" r="4.5" fill="#FF9838" /></g>
                  <g><rect className="nd l" x="28" y="252" width="150" height="46" rx="14" /><text x="92" y="280" fill="#8D8471">Security</text><circle cx="160" cy="275" r="4.5" fill="#C6BBA2" /></g>
                  <g><rect className="nd l" x="185" y="310" width="150" height="46" rx="14" /><text x="249" y="338" fill="#8D8471">Caching</text><circle cx="317" cy="333" r="4.5" fill="#C6BBA2" /></g>
                  <g><rect className="nd l" x="342" y="252" width="150" height="46" rx="14" /><text x="406" y="280" fill="#8D8471">Async</text><circle cx="474" cy="275" r="4.5" fill="#C6BBA2" /></g>
                </g>
                <g className="here">
                  <rect x="357" y="94" width="120" height="24" rx="12" fill="#FF9838" />
                  <text x="417" y="110" textAnchor="middle" fontFamily="'Inter',sans-serif" fontSize="10.5" fontWeight="700" fill="#fff" letterSpacing="1.5">YOU ARE HERE</text>
                </g>
              </svg>
              <div className="map-foot">
                <div className="map-foot-t"><span>Track progress</span><b>18%</b></div>
                <div className="bar"><span></span></div>
                <p>Next milestone: Databases &mdash; 4 skills in queue.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="section" id="features">
        <div className="landing-container">
          <div className="sec-head">
            <span className="kicker reveal">Why octoByte</span>
            <h2 className="reveal" style={{ '--d': '.08s' }}>Built like a product, measured like a science.</h2>
            <p className="sec-sub reveal" style={{ '--d': '.16s' }}>Everything on the platform exists to answer one question honestly: what do you actually know?</p>
          </div>
          <div className="feat-grid">
            <article className="feat reveal" style={{ '--d': '0s' }}>
              <div className="f-ic">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="4.6" />
                  <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h3>Fair Results</h3>
              <p>Our IRT engine is pure, seeded logic &mdash; no randomness anywhere. Replaying the same answers reproduces the same level, so every progress number is one you can trust.</p>
            </article>

            <article className="feat reveal" style={{ '--d': '.08s' }}>
              <div className="f-ic">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" />
                  <circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none" />
                  <circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none" />
                  <circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h3>Roadmaps </h3>
              <p>Every AI-made plan comes as a clear list of steps in the right order, with the skills each step covers, handpicked learning resources and time estimates. We double-check every plan before you see it.</p>
            </article>

            <article className="feat reveal" style={{ '--d': '.16s' }}>
              <div className="f-ic">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                  <circle cx="6" cy="12" r="2.4" />
                  <circle cx="18" cy="5.5" r="2.4" />
                  <circle cx="18" cy="18.5" r="2.4" />
                  <path d="M8.2 10.9l7.6-4.2" />
                  <path d="M8.2 13.1l7.6 4.2" />
                </svg>
              </div>
              <h3>A map</h3>
              <p>Skills are connected, not just listed. Mark one step as done and watch the skills that depend on it unlock for you right away.</p>
            </article>

            <article className="feat reveal" style={{ '--d': '.24s' }}>
              <div className="f-ic">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8.5" />
                  <path d="M15 6.5h6v6" />
                </svg>
              </div>
              <h3>Re-test </h3>
              <p>Retake the quiz whenever you like. We save your level after every attempt, so “I feel better” turns into “I can see I’m improving.”</p>
            </article>

            <article className="feat reveal" id="projects" style={{ '--d': '.32s' }}>
              <div className="f-ic">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </div>
              <h3>Project Lab &amp; Verification</h3>
              <p>Connect what you learn to real code. Submit your GitHub projects and get automatic feedback that checks whether you really understood the skills.</p>
            </article>

            <article className="feat reveal" style={{ '--d': '.4s' }}>
              <div className="f-ic">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>Career Match Scoring</h3>
              <p>Your demonstrated ability score is automatically benchmarked against real software engineering specs across Indian product startups and tech leaders.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Interactive FAQ & AI Chatbot Showcase ─────── */}
      <section className="section" id="faq">
        <div className="landing-container">
          <div className="sec-head">
            <span className="kicker reveal">Interactive Assistant</span>
            <h2 className="reveal" style={{ '--d': '.08s' }}>Common Questions? Ask Octo AI</h2>
            <p className="sec-sub reveal" style={{ '--d': '.16s' }}>
              Select any of the 6 core questions below for instant scientific explanations, or chat with Octo directly.
            </p>
          </div>

          <div className="stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: '36px' }}>
            {ASSIGNED_QUESTIONS.map((q, idx) => {
              const IconComp = {
                BrainCircuit,
                Network,
                GraduationCap,
                GitPullRequest,
                Briefcase,
                CheckCircle2,
              }[q.icon] || Sparkles;

              return (
                <div
                  key={q.id}
                  className="stat reveal flex flex-col justify-between text-left cursor-pointer group"
                  style={{ '--d': `${idx * 0.08}s` }}
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('octobyte:open-chat', {
                        detail: { questionId: q.id },
                      })
                    )
                  }
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFEAFC] text-[#6244E8] px-3 py-1 text-xs font-bold">
                        <IconComp size={13} />
                        {q.badge}
                      </span>
                      <span className="text-xs font-extrabold text-[#FF9838]">Q{idx + 1}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#2F2A3E] group-hover:text-[#7C5CFA] transition-colors leading-snug mb-2">
                      {q.question}
                    </h3>
                    <p className="text-xs text-[#6E6880] leading-relaxed line-clamp-3">
                      {q.answer.replace(/[*#•-]/g, '').trim()}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E8E0CC]/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C5CFA] group-hover:text-[#6244E8]">
                      <span>Ask Octo in Chat</span>
                      <ArrowRight size={13} />
                    </span>
                    <span className="text-[11px] text-[#8D8471] font-semibold">{q.tag}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-9 text-center">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('octobyte:open-chat'))}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7C5CFA] to-[#6244E8] px-7 py-3.5 text-sm font-bold text-white hover:opacity-95 transition shadow-lg shadow-[#7C5CFA]/25 cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>Open AI Chatbot with 6 Assigned Questions</span>
              <span className="text-base">💬</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="cta-wrap" id="cta">
        <div className="landing-container">
          <div className="cta reveal in">
            <h2>Ready to meet your real level?</h2>
            <p>Take the skill check &mdash; it&rsquo;s shorter than making coffee. Your personalised roadmap is waiting on the other side.</p>
            <Link className="btn btn-white" to={user ? '/assessment' : '/signup'}>
              {user ? 'Launch Diagnostic CAT' : 'Start for free'} <span className="arr">&rarr;</span>
            </Link>
            <div className="peek" aria-hidden="true">
              <svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg">
                <g className="peek-bob">
                  <path d="M20 100 C20 46 44 20 70 20 C96 20 120 46 120 100 Z" fill="#A78BFA" />
                  <path d="M30 100 q7 -15 16 -7 M110 100 q-7 -15 -16 -7" stroke="#8F74F2" strokeWidth="11" fill="none" strokeLinecap="round" />
                  <g className="eye">
                    <ellipse cx="52" cy="60" rx="7" ry="8" fill="#2F2A3E" />
                    <circle cx="54.5" cy="57" r="2.4" fill="#fff" />
                  </g>
                  <g className="eye e2">
                    <ellipse cx="88" cy="60" rx="7" ry="8" fill="#2F2A3E" />
                    <circle cx="90.5" cy="57" r="2.4" fill="#fff" />
                  </g>
                  <path d="M61 74 Q70 81 79 74" stroke="#2F2A3E" strokeWidth="3.6" fill="none" strokeLinecap="round" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="landing-container">
          <div className="foot-grid">
            <div className="foot-brand">
              <a className="brand" href="#top" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <svg width="38" height="34" viewBox="0 0 48 44" aria-hidden="true">
                  <ellipse cx="24" cy="19" rx="16.5" ry="15.5" fill="#9077F2" />
                  <circle cx="10.5" cy="31" r="5" fill="#9077F2" />
                  <circle cx="24" cy="34.5" r="5.5" fill="#9077F2" />
                  <circle cx="37.5" cy="31" r="5" fill="#9077F2" />
                  <circle cx="17.5" cy="21" r="2.7" fill="#2F2A3E" />
                  <circle cx="30.5" cy="21" r="2.7" fill="#2F2A3E" />
                  <path d="M18.5 27.5q5.5 4.5 11 0" stroke="#2F2A3E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                </svg>
                <span className="wordmark" style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink)' }}>octo<b style={{ color: 'var(--purple)' }}>Byte</b></span>
              </a>
              <p>The AI learning platform that measures where you really stand, plans what to learn next, and tracks every skill you master. Measure. Plan. Track. Repeat.</p>
            </div>
            <div className="foot-col">
              <h4>Explore</h4>
              <a href="#how">How it works</a>
              <a href="#graph">Skill graph</a>
              <a href="#features">Features</a>
              <Link to="/signup">Get started</Link>
            </div>
            <div className="foot-col">
              <h4>The team</h4>
              <span>Team Unix &middot; 12 members</span>
              <span>Lakshmi Narain College of Technology, Bhopal</span>
              <span>Built for the EPAM CoE programme</span>
              <span>Maintained by Dev Sharma</span>
            </div>
          </div>
          <div className="foot-bottom">
            <span>&copy; 2026 octoByte &mdash; Team Unix, LNCT Bhopal</span>
            <span>Made with care for the EPAM CoE mentors</span>
          </div>
        </div>
      </footer>

      {/* ── Octo AI Landing Chatbot ───────────────────── */}
      <Suspense fallback={null}>
        <LandingChatbot />
      </Suspense>
    </div>
  );
}
