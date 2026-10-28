import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import Logo from '../ui/Logo';
import { authService } from '../../services/authService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmail(value) {
  const email = value.trim();
  if (!email) return 'Email address is required.';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
  return '';
}

async function defaultSendOtp(email) {
  return authService.requestPasswordReset(email);
}

export default function ForgotPass({
  onSendOtp = defaultSendOtp, // async (email) => void
  signInHref = '/login',
}) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [step, setStep] = useState('email');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleChange(e) {
    const value = e.target.value;
    setEmail(value);
    if (touched) setError(validateEmail(value));
  }

  function handleBlur() {
    setTouched(true);
    setError(validateEmail(email));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateEmail(email);
    setError(validationError);
    setTouched(true);

    if (validationError) return;

    setLoading(true);
    setFormError('');

    try {
      const cleanEmail = email.trim();
      await onSendOtp(cleanEmail);
      setEmail(cleanEmail);
      setStep('otp');
    } catch (err) {
      setFormError(err.message || 'Could not send the OTP. Please try again.');
    } finally {
      setLoading(false);
    }

  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setFormError('');
    if (!/^\d{6}$/.test(otp)) {
      setFormError('Enter the 6-digit reset code from your email.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.verifyPasswordResetOtp(email.trim(), otp);
      setResetToken(response?.data?.resetToken);
      setStep('password');
    } catch (err) {
      setFormError(err.message || 'The reset code is invalid or expired.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setFormError('');
    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (!resetToken) {
      setFormError('Your reset session has expired. Please request a new code.');
      setStep('email');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email.trim(), resetToken, newPassword);
      navigate(signInHref, { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      setFormError(err.message || 'Unable to reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    'w-full rounded-lg border bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600';
  const okInput = 'border-slate-200';
  const badInput = 'border-rose-400 focus:border-rose-600 focus:ring-rose-600 bg-rose-50/20';

  const hasError = touched && error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6" style={{ background: '#f5f3ee' }}>
      <div className="w-full max-w-md space-y-6">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center">
          <Logo />
          <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Forgot your password?
          </h1>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Enter the email linked to your account and we'll send you a 6-digit code to reset it.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
          {formError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          {step === 'email' && <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  autoFocus
                  placeholder="name@example.com"
                  value={email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  aria-invalid={Boolean(hasError)}
                  aria-describedby={hasError ? 'email-error' : undefined}
                  className={`${inputBase} ${hasError ? badInput : okInput}`}
                />
              </div>
              {hasError && (
                <p id="email-error" className="mt-1 text-xs text-rose-600">
                  {error}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <span>Send OTP</span>
              )}
            </button>
          </form>}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-slate-500">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-center text-lg tracking-[0.3em]"
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Verify code
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-xs font-semibold text-indigo-600">Use a different email</button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-500">Choose a new password for <strong>{email}</strong>.</p>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" disabled={loading} />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" disabled={loading} />
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reset password
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            <Link
              to={signInHref}
              className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400">
          The code expires in 5 minutes. Check your spam folder if it doesn't arrive.
        </p>
      </div>
    </div>
  );
}
