import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/auth/login';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithGitHub, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleEmailLogin = async ({ email, password }) => {
    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
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
