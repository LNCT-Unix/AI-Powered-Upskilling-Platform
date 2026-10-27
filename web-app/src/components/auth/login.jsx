import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Video,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Logo from '../ui/Logo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values) {
  const errors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current shrink-0" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

/* ── Floating Stat Badge from Landing Page ── */
function FloatingBadge({ icon: Icon, value, label, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-xs shadow-md border border-slate-100 px-4 py-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 shrink-0">
        <Icon size={16} className="text-indigo-600" />
      </span>
      <div>
        <p className="text-xs font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-[10px] font-medium text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Colorful Avatar Card from Landing Page ── */
function AvatarBadge({ initials, bg, rotate = 0, className = '' }) {
  return (
    <div
      className={`h-16 w-14 rounded-2xl flex items-center justify-center font-black text-white text-sm select-none shadow-md ${bg} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export default function Login({
  onSubmit,
  onGoogleSignIn,
  onGitHubSignIn,
  signUpHref = '/signup',
  forgotPasswordHref = '/forgot-password',
  initialValues = { email: '', password: '' },
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);

    if (touched[name]) {
      const fieldErrors = validate(nextValues);
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const fieldErrors = validate(values);
    setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    setTouched({ email: true, password: true });
    const fieldErrors = validate(values);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    'w-full rounded-full border bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100';
  const okInput = 'border-slate-200';
  const badInput = 'border-rose-400 focus:border-rose-600 focus:ring-rose-100 bg-rose-50/20';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-slate-900" style={{ background: '#f5f3ee' }}>
      {/* ── Left Column: Art & Visual Showcase ───────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-center items-center p-8 xl:p-14 relative overflow-hidden select-none border-r border-slate-200/60">
        {/* Soft background glow circles */}
        <div className="absolute top-1/4 -right-12 w-96 h-96 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-12 w-96 h-96 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />

        {/* Art Container Card */}
        <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-white/90 via-white/80 to-indigo-50/50 p-8 xl:p-10 border border-slate-100 shadow-xl backdrop-blur-xs space-y-8">
          {/* Header pill */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              <Sparkles size={13} /> ADAPTIVE LEARNING STUDIO
            </span>
            <span className="text-xs font-bold text-slate-400">Phase 1 — 5</span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
              Diagnose gaps,<br />
              learn with focus,<br />
              <span className="text-indigo-600">get job-ready.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Personalized Computerized Adaptive Testing (CAT) and topological prerequisite roadmaps tailored for Indian tech learners.
            </p>
          </div>

          {/* Visual Showcase collage */}
          <div className="relative h-64 w-full rounded-2xl bg-gradient-to-br from-indigo-500/10 via-amber-500/10 to-teal-500/10 border border-slate-200/60 p-4 overflow-hidden flex items-center justify-center">
            {/* Background avatar badges with angles matching landing page */}
            <AvatarBadge initials="PK" bg="bg-yellow-400" rotate={-8} className="absolute left-6 top-6" />
            <AvatarBadge initials="RS" bg="bg-teal-400" rotate={6} className="absolute left-10 bottom-6" />
            <AvatarBadge initials="AM" bg="bg-purple-400" rotate={5} className="absolute right-6 top-8" />
            <AvatarBadge initials="VJ" bg="bg-pink-400" rotate={-6} className="absolute right-12 bottom-6" />

            {/* Central hero badge */}
            <div className="relative z-10 rounded-2xl bg-white p-4 shadow-xl border border-slate-100 text-center space-y-1">
              <div className="text-4xl">👩‍💻</div>
              <p className="text-xs font-extrabold text-slate-900">CAT Adaptive Engine</p>
              <p className="text-[10px] text-indigo-600 font-bold">Item Response Theory</p>
            </div>

            {/* Floating stat pill cards */}
            <FloatingBadge
              icon={Video}
              value="3K+"
              label="Practice problems"
              className="absolute -left-2 top-24 z-20 shadow-md"
            />
            <FloatingBadge
              icon={CheckCircle2}
              value="120+"
              label="Skills verified"
              className="absolute -right-2 top-24 z-20 shadow-md"
            />
          </div>

          {/* Three Feature Highlights */}
          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            {[
              { title: '15-Min Test', sub: 'Adaptive diagnostic' },
              { title: 'DAG Roadmap', sub: 'Skip what you know' },
              { title: 'Job Matching', sub: 'Naukri & LinkedIn' },
            ].map(({ title, sub }) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-white/90 p-3 text-center shadow-xs">
                <p className="text-xs font-extrabold text-slate-900">{title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Column: Login Form ────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-white/80 lg:bg-white backdrop-blur-xs shadow-xs">
        {/* Top: Logo */}
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Center: Auth Form Container */}
        <div className="w-full max-w-sm mx-auto my-8 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Welcome back
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Sign in to octoByte
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Access your personalized adaptive learning roadmap.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email input */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  aria-invalid={Boolean(touched.email && errors.email)}
                  className={`${inputBase} ${touched.email && errors.email ? badInput : okInput}`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
              )}
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to={forgotPasswordHref}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  aria-invalid={Boolean(touched.password && errors.password)}
                  className={`${inputBase} pr-10 ${touched.password && errors.password ? badInput : okInput}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              or continue with
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* OAuth Buttons */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 cursor-pointer"
            >
              <GoogleIcon />
              <span>Google</span>
            </button>

            {onGitHubSignIn && (
              <button
                type="button"
                onClick={onGitHubSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 cursor-pointer"
              >
                <GitHubIcon />
                <span>GitHub</span>
              </button>
            )}
          </div>

          <p className="text-center text-xs text-slate-500 pt-2">
            Don't have an account?{' '}
            <Link
              to={signUpHref}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Create free account
            </Link>
          </p>
        </div>

        {/* Bottom */}
        <p className="text-center text-[11px] text-slate-400">
          Protected by Enterprise OAuth2 & JWT session encryption.
        </p>
      </div>
    </div>
  );
}
