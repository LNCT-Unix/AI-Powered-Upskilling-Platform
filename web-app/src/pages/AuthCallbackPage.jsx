import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
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
      <Card className="max-w-md w-full text-center py-10">
        {status === 'processing' && (
          <div className="space-y-4">
            <Loader2 size={36} className="mx-auto animate-spin text-green-700" />
            <h1 className="text-xl font-bold text-green-950">Verifying credentials...</h1>
            <p className="text-sm text-slate-500">
              Completing secure login handshake with Spring Boot gateway.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 size={36} className="mx-auto text-green-700" />
            <h1 className="text-xl font-bold text-green-950">Login successful!</h1>
            <p className="text-sm text-slate-500">Redirecting to your personalized dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle size={36} className="mx-auto text-amber-700" />
            <h1 className="text-xl font-bold text-green-950">Authentication Issue</h1>
            <p className="text-sm text-slate-600">{errorMessage}</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Return to Homepage
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
