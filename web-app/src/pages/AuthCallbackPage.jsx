import { useEffect, useState } from 'react';
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

  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  const initialStatus = errorParam ? 'error' : !code ? 'error' : 'processing';
  const initialError = errorParam
    ? `Authentication failed with code: ${errorParam}`
    : !code
    ? 'No authorization code was found in the callback URL.'
    : '';

  const [status, setStatus] = useState(initialStatus);
  const [errorMessage, setErrorMessage] = useState(initialError);

  useEffect(() => {
    if (status !== 'processing') return;

    let mounted = true;
    async function exchange() {
      const res = await handleOAuthCallback(code);
      if (!mounted) return;

      if (res.success) {
        setStatus('success');
        setTimeout(() => {
          if (mounted) navigate('/dashboard');
        }, 1200);
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'Failed to exchange login code');
      }
    }

    exchange();
    return () => {
      mounted = false;
    };
  }, [code, status, handleOAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
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
