import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Signup from '../components/auth/signup';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, loginWithGitHub, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleEmailSignup = async ({ fullName, email, password }) => {
    const res = await register({ fullName, email, password });
    if (res.success) {
      navigate('/dashboard');
    } else {
      throw new Error(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <Signup
      onSubmit={handleEmailSignup}
      onGoogleSignIn={loginWithGoogle}
      onGitHubSignIn={loginWithGitHub}
      loginHref="/login"
    />
  );
}
