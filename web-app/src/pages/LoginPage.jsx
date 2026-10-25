import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Login from '../components/auth/login';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithGitHub, isAuthenticated } = useAuth();

  const hasCompletedOnboarding = Boolean(localStorage.getItem('skillpath_onboarding_profile'));
  const defaultDestination = hasCompletedOnboarding ? '/dashboard' : '/onboarding';
  const destination = location.state?.from?.pathname || defaultDestination;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, destination]);

  const handleEmailLogin = async ({ email, password }) => {
    const res = await login(email, password);
    if (res.success) {
      navigate(destination);
    } else {
      throw new Error(res.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  return (
    <Login
      userName="Learner"
      onSubmit={handleEmailLogin}
      onGoogleSignIn={loginWithGoogle}
      onGitHubSignIn={loginWithGitHub}
      signUpHref="/signup"
      forgotPasswordHref="/forgot-password"
    />
  );
}
