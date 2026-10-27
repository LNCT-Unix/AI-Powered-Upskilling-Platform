import { useEffect, useState, useTransition } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';

function extractVerificationToken() {
  if (typeof window === 'undefined') return null;

  // 1. Try URL fragment (#token=RAW_TOKEN)
  const hash = window.location.hash;
  if (hash && hash.includes('token=')) {
    const match = hash.match(/token=([^&]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  }

  // 2. Try URL search parameter (?token=RAW_TOKEN)
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();
  const { confirmEmailVerification } = useAuth();

  const [token] = useState(() => extractVerificationToken());
  const [status, setStatus] = useState(() => (token ? 'processing' : 'error'));
  const [errorMessage, setErrorMessage] = useState(() =>
    token ? '' : 'No activation token was found in the link. Please check your email or register again.'
  );

  useEffect(() => {
    if (!token || status !== 'processing') return;

    let mounted = true;

    async function verify() {
      try {
        const res = await confirmEmailVerification(token);
        if (!mounted) return;

        if (res.success) {
          setStatus('success');
          // Optional smooth auto-redirect after 3 seconds
          setTimeout(() => {
            if (mounted) {
              startTransition(() => {
                navigate('/login');
              });
            }
          }, 3000);
        } else {
          setStatus('error');
          setErrorMessage(res.message || 'Verification token is invalid or has expired.');
        }
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'Unable to confirm verification token. It may have expired.');
      }
    }

    verify();

    return () => {
      mounted = false;
    };
  }, [token, status, confirmEmailVerification, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f3ee' }}>
      <Card className="max-w-md w-full text-center py-10 px-6 sm:px-8 space-y-6">
        <div className="flex justify-center">
          <Logo asLink={false} />
        </div>

        {status === 'processing' && (
          <div className="space-y-3 pt-2">
            <Loader2 size={36} className="mx-auto animate-spin text-indigo-600" aria-hidden="true" />
            <h1 className="text-lg font-bold text-slate-900">Activating your account...</h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Verifying your security token with the Spring Boot authentication gateway.
            </p>
          </div>
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
              Redirecting to sign in automatically in a few seconds...
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
