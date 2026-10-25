import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Logo from '../ui/Logo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values) {
  const errors = {};
  const fullName = values.fullName.trim();
  const email = values.email.trim();

  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length < 2) {
    errors.fullName = 'Name must be at least 2 characters.';
  }

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!values.agreeTerms) {
    errors.agreeTerms = 'You must accept the terms of service.';
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

export default function Signup({
  onSubmit,
  onGoogleSignIn,
  onGitHubSignIn,
  loginHref = '/login',
}) {
  const [values, setValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const next = {
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    };
    setValues(next);

    if (touched[name]) {
      setErrors(validate(next));
    }
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(values));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const found = validate(values);
    setErrors(found);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    if (Object.keys(found).length > 0) return;

    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password,
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSuccessMessage('Registration submitted successfully! Check your email to verify.');
      }
    } catch (err) {
      setFormError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    'w-full rounded-lg border bg-slate-50 py-2 pl-9 pr-3.5 text-xs sm:text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600';
  const okInput = 'border-slate-200';
  const badInput = 'border-rose-400 focus:border-rose-600 focus:ring-rose-600 bg-rose-50/20';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Start your personalized adaptive learning journey.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          {formError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="mb-1 block text-xs font-semibold text-slate-700">
                Full name
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={values.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  aria-invalid={Boolean(touched.fullName && errors.fullName)}
                  className={`${inputBase} ${touched.fullName && errors.fullName ? badInput : okInput}`}
                />
              </div>
              {touched.fullName && errors.fullName && (
                <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@example.com"
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-700">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  aria-invalid={Boolean(touched.password && errors.password)}
                  className={`${inputBase} pr-9 ${touched.password && errors.password ? badInput : okInput}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-xs font-semibold text-slate-700">
                Confirm password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
                  className={`${inputBase} ${touched.confirmPassword && errors.confirmPassword ? badInput : okInput}`}
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={values.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span>
                  I agree to the Terms of Service and Privacy Policy.
                </span>
              </label>
              {touched.agreeTerms && errors.agreeTerms && (
                <p className="mt-1 text-xs text-rose-600">{errors.agreeTerms}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              or sign up with
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* OAuth Buttons */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
            >
              <GoogleIcon />
              <span>Google</span>
            </button>

            {onGitHubSignIn && (
              <button
                type="button"
                onClick={onGitHubSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
              >
                <GitHubIcon />
                <span>GitHub</span>
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to={loginHref}
              className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
