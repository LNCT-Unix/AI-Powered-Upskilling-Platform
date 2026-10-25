import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

const ERROR_DESCRIPTIONS = {
  OAUTH_EMAIL_REQUIRED:
    'Your external account does not have a public verified email address. Please verify your email on your provider settings and try again.',
  OAUTH_ACCOUNT_EXISTS:
    'An account with this email already exists with password credentials. Please sign in with your email and password to link your external account.',
  OAUTH_ALREADY_LINKED:
    'This external identity is already associated with another learner profile on this platform.',
  OAUTH_ACCOUNT_DISABLED:
    'This account has been deactivated or suspended. Please reach out to platform administrators.',
  OAUTH_ACCESS_DENIED:
    'Authentication request was cancelled or authorization consent was denied by provider.',
  OAUTH_PROVIDER_ERROR:
    'An error occurred communicating with the identity provider. Please try again.',
  MISSING_CODE:
    'No valid OAuth authorization code was supplied in the callback handshake.',
  LOGIN_CODE_INVALID:
    'The authorization code is invalid, has expired, or was already consumed. Please sign in again.',
};

export default function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const errorCode = searchParams.get('error') || 'OAUTH_PROVIDER_ERROR';
  const customMessage = searchParams.get('message');
  const description =
    customMessage ||
    ERROR_DESCRIPTIONS[errorCode] ||
    'An unexpected authentication error occurred while validating your session.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full text-center py-10 px-6 sm:px-8 space-y-6">
        <div className="flex justify-center">
          <Logo asLink={false} />
        </div>

        <div className="space-y-4 pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto">
            <ShieldAlert size={32} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">Authentication Failed</h1>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-left space-y-1">
            <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
              <AlertCircle size={14} className="shrink-0" />
              <span>Error Code: {errorCode}</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed pl-5">
              {description}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={16} />
              <span>Return to Sign In</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
