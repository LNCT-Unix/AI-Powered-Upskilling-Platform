import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const exchangeAttempted = useRef(false);

  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  const [status, setStatus] = useState(() => {
    if (errorParam || !code) return 'error';
    return 'processing';
  });

  const [errorMessage, setErrorMessage] = useState(() => {
    if (errorParam) return `Authentication failed with code: ${errorParam}`;
    if (!code) return 'No authorization code was found in the callback URL.';
    return '';
  });

  useEffect(() => {
    if (errorParam) {
      navigate(`/auth/error?error=${encodeURIComponent(errorParam)}`, { replace: true });
      return;
    }

    if (!code) {
      navigate('/auth/error?error=MISSING_CODE', { replace: true });
      return;
    }

    // Prevent duplicate exchange in React StrictMode
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    async function performExchange() {
      try {
        const res = await handleOAuthCallback(code);

        if (res.success) {
          setStatus('success');
          setTimeout(() => {
            const hasCompletedOnboarding = Boolean(localStorage.getItem('skillpath_onboarding_profile'));
            navigate(hasCompletedOnboarding ? '/dashboard' : '/onboarding', { replace: true });
          }, 800);
        } else {
          setStatus('error');
          setErrorMessage(res.error || 'Failed to exchange login code');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred during code exchange');
      }
    }

    performExchange();
  }, [code, errorParam, handleOAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f3ee' }}>
      <Card className="max-w-md w-full text-center py-10 px-6 sm:px-8 space-y-6">
        <div className="flex justify-center">
          <Logo asLink={false} />
        </div>

        {status === 'processing' && (
          <div className="space-y-3 pt-2">
            <Loader2 size={36} className="mx-auto animate-spin text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-900">Verifying session handshake...</h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Exchanging single-use OAuth authorization code with secure Spring Boot gateway.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3 pt-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
            <h1 className="text-lg font-bold text-slate-900">Handshake verified!</h1>
            <p className="text-xs text-slate-500">Redirecting to your personalized learning dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 pt-2">
            <AlertCircle size={36} className="mx-auto text-rose-600" />
            <h1 className="text-lg font-bold text-slate-900">Authentication Error</h1>
            <p className="text-xs text-slate-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
              {errorMessage}
            </p>
            <div className="pt-2">
              <Button variant="primary" onClick={() => navigate('/login')}>
                Return to Sign In
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
