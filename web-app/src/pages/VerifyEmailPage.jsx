import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmEmailVerification } = useAuth();
  const [email, setEmail] = useState(() => location.state?.email || new URLSearchParams(location.search).get('email') || '');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('form');
  const [errorMessage, setErrorMessage] = useState('');

  async function verify(e) {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !/^\d{6}$/.test(otp)) {
      setErrorMessage('Enter your email and the 6-digit verification code.');
      return;
    }
    try {
      await confirmEmailVerification(email.trim(), otp);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'The verification code is invalid or expired.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f3ee' }}>
      <Card className="max-w-md w-full text-center py-10 px-6 sm:px-8 space-y-6">
        <div className="flex justify-center">
          <Logo asLink={false} />
        </div>

        {status === 'form' && (
          <form onSubmit={verify} className="space-y-4 pt-2">
            <h1 className="text-lg font-bold text-slate-900">Verify your email</h1>
            <p className="text-xs text-slate-500">Enter the 6-digit code sent by the Spring Boot authentication gateway.</p>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-lg tracking-[0.3em]" />
            <Button type="submit" variant="primary">Verify email</Button>
            {errorMessage && <p className="text-xs text-rose-600">{errorMessage}</p>}
          </form>
        )}

        {status === 'success' && (
          <div className="space-y-3 pt-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-600" aria-hidden="true" />
            <h1 className="text-lg font-bold text-slate-900">Email Verified Successfully!</h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Your account is active. You can now sign in to access your personalized learning roadmap.
            </p>
            <div className="pt-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <span>Sign In to Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Your email is verified. Sign in to continue.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 pt-2">
            <AlertCircle size={36} className="mx-auto text-rose-600" aria-hidden="true" />
            <h1 className="text-lg font-bold text-slate-900">Verification Link Invalid</h1>
            <p className="text-xs text-slate-600 bg-rose-50 p-3 rounded-lg border border-rose-100 text-left">
              {errorMessage}
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="primary" onClick={() => navigate('/login')}>
                Go to Sign In
              </Button>
              <Button variant="outline" onClick={() => navigate('/signup')}>
                Create New Account
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
