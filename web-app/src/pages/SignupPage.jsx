import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import Signup from '../components/auth/signup';
import Logo from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, resendEmailVerification, loginWithGoogle, loginWithGitHub, isAuthenticated } = useAuth();
  const [verificationPending, setVerificationPending] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleEmailSignup = async ({ fullName, email, password }) => {
    const res = await register({ fullName, email, password });
    if (res.success) {
      if (res.data?.verificationRequired || !res.data?.accessToken) {
        setVerificationPending(email);
      } else {
        navigate('/onboarding');
      }
    } else {
      throw new Error(res.error || 'Registration failed. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!verificationPending || resending) return;
    setResending(true);
    setResendStatus('');
    try {
      await resendEmailVerification(verificationPending);
      setResendStatus('A new activation link has been sent to your inbox.');
    } catch (err) {
      setResendStatus(err.message || 'Failed to resend. Please try again in 60 seconds.');
    } finally {
      setResending(false);
    }
  };

  if (verificationPending) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <Logo />
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Verify your email
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              One last step before you start learning.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Mail className="h-7 w-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900">
                Check your inbox
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                We sent a secure activation link to{' '}
                <span className="font-semibold text-slate-900">{verificationPending}</span>.
                Click the link to verify your account and sign in.
              </p>
            </div>

            {resendStatus && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-indigo-900 text-left"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                <span>{resendStatus}</span>
              </div>
            )}

            <div className="pt-2 space-y-2.5">
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? 'Resending link...' : 'Resend verification link'}</span>
              </button>
            </div>

            <p className="pt-2 text-[11px] text-slate-400">
              Local testing? Check Mailpit at{' '}
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-indigo-600 underline hover:text-indigo-800"
              >
                localhost:8025
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Signup
      onSubmit={handleEmailSignup}
      onGoogleSignIn={loginWithGoogle}
      onGitHubSignIn={loginWithGitHub}
      loginHref="/login"
    />
  );
}
