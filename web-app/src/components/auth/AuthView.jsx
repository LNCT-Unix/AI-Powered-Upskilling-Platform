import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Mail, CheckCircle2, RotateCcw, Server } from 'lucide-react';
import ServerSwitcherModal from '../mobile/ServerSwitcherModal';
import { isNativeMobile } from '../../services/mobileStorage';
import { useAuth } from '../../hooks/useAuth';
import './AuthPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function AuthView({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    register,
    loginWithGoogle,
    loginWithGitHub,
    confirmEmailVerification,
    resendEmailVerification,
    isAuthenticated,
  } = useAuth();

  const [mode, setMode] = useState(initialMode);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [serverModalOpen, setServerModalOpen] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem('skillpath_remember_email') || '');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Status & UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [verificationPending, setVerificationPending] = useState(null);
  const [verificationOtp, setVerificationOtp] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  const hasCompletedOnboarding = Boolean(localStorage.getItem('skillpath_onboarding_profile'));
  const defaultDestination = hasCompletedOnboarding ? '/dashboard' : '/onboarding';
  const destination = location.state?.from?.pathname || defaultDestination;

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, destination]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? '' : prev));
    }, 2800);
  };

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setError('');
    navigate(newMode === 'login' ? '/login' : '/signup', { replace: true });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = loginEmail.trim();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('skillpath_remember_email', email);
      } else {
        localStorage.removeItem('skillpath_remember_email');
      }

      const res = await login(email, loginPassword);
      if (res?.success) {
        showToast('Welcome back! Redirecting…');
        navigate(destination, { replace: true });
      } else {
        setError(res?.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fullName = signupName.trim();
    const email = signupEmail.trim();

    if (!fullName || fullName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({ fullName, email, password: signupPassword });
      if (res?.success) {
        if (res.data?.verificationRequired || !res.data?.accessToken) {
          setVerificationPending(email);
          setVerificationOtp('');
          setResendSeconds(60);
        } else {
          showToast('Account created successfully! Redirecting…');
          navigate(destination, { replace: true });
        }
      } else {
        setError(res?.error || 'Registration failed. This email may already be in use.');
      }
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!verificationPending || resending) return;
    setResending(true);
    setResendStatus('');
    try {
      await resendEmailVerification(verificationPending);
      setResendStatus('A new 6-digit verification code has been sent to your inbox.');
      setResendSeconds(60);
    } catch (err) {
      setResendStatus(err.message || 'Failed to resend. Please try again in 60 seconds.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setResendStatus('');

    const otp = verificationOtp.trim();
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit verification code from your email.');
      return;
    }

    setVerifyingEmail(true);
    try {
      const result = await confirmEmailVerification(verificationPending, otp);
      if (!result?.success) {
        setError(result?.error || 'That verification code is invalid or expired.');
        return;
      }
      setVerificationPending(null);
      setVerificationOtp('');
      showToast(hasCompletedOnboarding ? 'Email verified! Redirecting to dashboard…' : 'Email verified! Redirecting to onboarding…');
      const postVerifyDestination = location.state?.from?.pathname || (hasCompletedOnboarding ? '/dashboard' : '/onboarding');
      navigate(postVerifyDestination, { replace: true });
    } catch (err) {
      setError(err.message || 'That verification code is invalid or expired.');
    } finally {
      setVerifyingEmail(false);
    }
  };

  return (
    <div className="auth-container">
      {isNativeMobile() && (
        <button
          type="button"
          onClick={() => setServerModalOpen(true)}
          className="fixed top-3 right-3 z-50 rounded-full p-2 bg-white/80 backdrop-blur-md border border-[#E8E0CC] text-slate-600 shadow-md sm:hidden"
          aria-label="Server Settings"
        >
          <Server size={16} />
        </button>
      )}
      <ServerSwitcherModal
        isOpen={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
      />
      {/* ================= LEFT · ART ================= */}
      <aside className="auth-art">
        <div className="auth-glow auth-glow-a"></div>
        <div className="auth-glow auth-glow-b"></div>

        <span className="auth-bubble" style={{ '--x': '8%', '--s': '16px', '--t': '11s', '--d': '0s' }}></span>
        <span className="auth-bubble" style={{ '--x': '20%', '--s': '9px', '--t': '9s', '--d': '2.4s' }}></span>
        <span className="auth-bubble" style={{ '--x': '34%', '--s': '13px', '--t': '13s', '--d': '4.2s' }}></span>
        <span className="auth-bubble" style={{ '--x': '55%', '--s': '7px', '--t': '8.5s', '--d': '1.2s' }}></span>
        <span className="auth-bubble" style={{ '--x': '70%', '--s': '15px', '--t': '12s', '--d': '3.4s' }}></span>
        <span className="auth-bubble" style={{ '--x': '84%', '--s': '10px', '--t': '10s', '--d': '5.1s' }}></span>
        <span className="auth-bubble" style={{ '--x': '93%', '--s': '12px', '--t': '11.5s', '--d': '0.8s' }}></span>

        <Link to="/" className="art-head rise" style={{ '--i': 0, textDecoration: 'none' }} aria-label="Octobyte Home">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <ellipse cx="32" cy="25" rx="19" ry="18" fill="#B9A5FF" />
            <ellipse cx="25" cy="17" rx="7" ry="4.5" fill="#fff" opacity="0.25" transform="rotate(-18 25 17)" />
            <circle cx="26" cy="24" r="3" fill="#2F2A3E" />
            <circle cx="38" cy="24" r="3" fill="#2F2A3E" />
            <circle cx="27.1" cy="22.9" r="1" fill="#fff" />
            <circle cx="39.1" cy="22.9" r="1" fill="#fff" />
            <path d="M28 31.5q4 3.4 8 0" stroke="#2F2A3E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path
              d="M22 41c-5 5-2 11 2 15M32 42.5c-1 6-5 9-4 15M42 41c5 5 2 11-2 15"
              stroke="#9F85FF"
              strokeWidth="4.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <span className="wordmark">Octobyte</span>
        </Link>

        <div className="art-inner">
          <div className="octo-wrap rise" style={{ '--i': 1 }}>
            <svg className="octo" viewBox="0 0 320 320" aria-label="Octobyte octopus mascot">
              <defs>
                <linearGradient id="bodyGrad" x1="90" y1="48" x2="232" y2="192" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#C7B6FF" />
                  <stop offset="1" stopColor="#8F74F2" />
                </linearGradient>
                <linearGradient id="tentGrad" x1="0" y1="160" x2="0" y2="292" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#9F85FF" />
                  <stop offset="1" stopColor="#6A4DF0" />
                </linearGradient>
              </defs>

              <g className="octo-float">
                {/* tentacles */}
                <g className="tent" style={{ '--amp': 5, '--d': '0s', transformOrigin: '98px 168px' }}>
                  <path d="M98 162 C 70 200, 108 224, 84 262" stroke="url(#tentGrad)" strokeWidth="18" fill="none" strokeLinecap="round" />
                </g>
                <g className="tent" style={{ '--amp': 7, '--d': '-1.2s', transformOrigin: '128px 178px' }}>
                  <path d="M128 172 C 122 214, 92 228, 110 272" stroke="url(#tentGrad)" strokeWidth="20" fill="none" strokeLinecap="round" />
                </g>
                <g className="tent" style={{ '--amp': 6, '--d': '-2s', transformOrigin: '152px 184px' }}>
                  <path d="M152 178 C 158 220, 130 238, 148 282" stroke="url(#tentGrad)" strokeWidth="22" fill="none" strokeLinecap="round" />
                </g>
                <g className="tent" style={{ '--amp': 6, '--d': '-.7s', transformOrigin: '178px 184px' }}>
                  <path d="M178 178 C 172 220, 202 236, 184 278" stroke="url(#tentGrad)" strokeWidth="22" fill="none" strokeLinecap="round" />
                </g>
                <g className="tent" style={{ '--amp': 7, '--d': '-1.7s', transformOrigin: '204px 178px' }}>
                  <path d="M204 172 C 212 214, 242 226, 222 266" stroke="url(#tentGrad)" strokeWidth="20" fill="none" strokeLinecap="round" />
                </g>
                <g className="tent" style={{ '--amp': 5, '--d': '-2.5s', transformOrigin: '230px 166px' }}>
                  <path d="M230 160 C 260 198, 222 224, 248 258" stroke="url(#tentGrad)" strokeWidth="18" fill="none" strokeLinecap="round" />
                </g>

                {/* head */}
                <ellipse cx="160" cy="118" rx="76" ry="68" fill="url(#bodyGrad)" />
                <ellipse cx="128" cy="80" rx="27" ry="15" fill="#fff" opacity="0.22" transform="rotate(-18 128 80)" />

                {/* face */}
                <g className="eyes">
                  <circle cx="134" cy="116" r="11" fill="#2F2A3E" />
                  <circle cx="186" cy="116" r="11" fill="#2F2A3E" />
                  <circle cx="138" cy="112" r="3.6" fill="#fff" />
                  <circle cx="190" cy="112" r="3.6" fill="#fff" />
                </g>
                <circle cx="112" cy="138" r="8" fill="#FFB27A" opacity="0.5" />
                <circle cx="208" cy="138" r="8" fill="#FFB27A" opacity="0.5" />
                <path d="M146 140 Q160 152 174 140" stroke="#2F2A3E" strokeWidth="4" fill="none" strokeLinecap="round" />

                {/* open book */}
                <g className="book">
                  <path d="M160 214 C 138 200, 112 202, 96 210 L96 240 C 114 232, 140 232, 160 244 Z" fill="#FFC93C" />
                  <path d="M160 214 C 182 200, 208 202, 224 210 L224 240 C 206 232, 180 232, 160 244 Z" fill="#FFD966" />
                  <path d="M160 214 L160 244" stroke="#E8A821" strokeWidth="3" strokeLinecap="round" />
                  <path
                    d="M108 216 C 122 211, 140 212, 150 218 M108 226 C 122 221, 140 222, 150 228"
                    stroke="#E8A821"
                    strokeWidth="2.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M212 216 C 198 211, 180 212, 170 218 M212 226 C 198 221, 180 222, 170 228"
                    stroke="#E8A821"
                    strokeWidth="2.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              </g>

              {/* sparkles */}
              <path className="spark" style={{ '--sd': '0s' }} d="M52 62 l3.4 8.6 8.6 3.4 -8.6 3.4 -3.4 8.6 -3.4 -8.6 -8.6 -3.4 8.6 -3.4 Z" fill="#FFC93C" />
              <path className="spark" style={{ '--sd': '1.6s' }} d="M270 88 l2.7 6.8 6.8 2.7 -6.8 2.7 -2.7 6.8 -2.7 -6.8 -6.8 -2.7 6.8 -2.7 Z" fill="#fff" opacity="0.85" />
              <path className="spark" style={{ '--sd': '2.8s' }} d="M282 196 l2.2 5.6 5.6 2.2 -5.6 2.2 -2.2 5.6 -2.2 -5.6 -5.6 -2.2 5.6 -2.2 Z" fill="#FF9838" />
            </svg>
            <div className="octo-shadow"></div>
          </div>

          <div className="art-copy rise" style={{ '--i': 2 }}>
            <p className="tagline">
              Measure. Plan. <em>Track.</em>
            </p>
            <p className="art-sub">Adaptive tests, living skill maps and AI roadmaps that grow with you.</p>
          </div>
        </div>

        <p className="art-foot rise" style={{ '--i': 3 }}>
          © 2026 Octobyte · built by Team Unix
        </p>
      </aside>

      {/* ================= RIGHT · AUTH PANEL ================= */}
      <main className="auth-panel">
        <Link className="auth-back" to="/">
          &larr; Back to site
        </Link>

        <div className="form-wrap">
          <header className="panel-head rise" style={{ '--i': 0 }}>
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <ellipse cx="32" cy="25" rx="19" ry="18" fill="#8F74F2" />
              <ellipse cx="25" cy="17" rx="7" ry="4.5" fill="#fff" opacity="0.25" transform="rotate(-18 25 17)" />
              <circle cx="26" cy="24" r="3" fill="#2F2A3E" />
              <circle cx="38" cy="24" r="3" fill="#2F2A3E" />
              <circle cx="27.1" cy="22.9" r="1" fill="#fff" />
              <circle cx="39.1" cy="22.9" r="1" fill="#fff" />
              <path d="M28 31.5q4 3.4 8 0" stroke="#2F2A3E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              <path
                d="M22 41c-5 5-2 11 2 15M32 42.5c-1 6-5 9-4 15M42 41c5 5 2 11-2 15"
                stroke="#B9A5FF"
                strokeWidth="4.6"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <span className="wordmark">Octobyte</span>
          </header>

          {/* Verification Pending View */}
          {verificationPending ? (
            <div className="auth-form space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFEAFC] text-[#7C5CFA]">
                <Mail className="h-7 w-7" aria-hidden="true" />
              </div>
              <h1 className="title">Check your inbox</h1>
              <p className="subtitle" style={{ margin: '6px 0 16px' }}>
                We sent a 6-digit verification code to <strong className="text-[#2F2A3E]">{verificationPending}</strong>.
              </p>

              {(error || resendStatus) && (
                <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-[#EFEAFC] p-3 text-xs text-[#3D2C86] text-left">
                  {error ? <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7C5CFA] mt-0.5" />}
                  <span>{error || resendStatus}</span>
                </div>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-3 pt-2">
                <label htmlFor="verification-otp" className="sr-only">6-digit verification code</label>
                <input
                  id="verification-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verificationOtp}
                  onChange={(e) => {
                    setVerificationOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-[#2F2A3E] outline-none focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#EFEAFC]"
                  disabled={verifyingEmail}
                />
                <button type="submit" disabled={verifyingEmail} className="btn">
                  {verifyingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{verifyingEmail ? 'Verifying code…' : 'Verify email'}</span>
                </button>
              </form>

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendSeconds > 0}
                  className="btn-ghost w-full"
                >
                  <RotateCcw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resending ? 'Resending code…' : resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend verification code'}
                  </span>
                </button>
              </div>

              <p className="fineprint">
                Local testing? Check Mailpit at{' '}
                <a
                  href="http://localhost:8025"
                  target="_blank"
                  rel="noreferrer"
                  className="auth-link"
                >
                  localhost:8025
                </a>
              </p>
            </div>
          ) : (
            <>
              {/* Mode Tabs */}
              <div className="tabs rise" style={{ '--i': 1 }} role="tablist" aria-label="Authentication mode">
                <button
                  className={`tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => handleModeChange('login')}
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                >
                  Log in
                </button>
                <button
                  className={`tab ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => handleModeChange('signup')}
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                >
                  Sign up
                </button>
              </div>

              {/* Title & Subtitle */}
              <h1 className="title rise swap" key={`title-${mode}`} style={{ '--i': 2 }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="subtitle rise swap" key={`sub-${mode}`} style={{ '--i': 3 }}>
                {mode === 'login' ? 'Log in to continue your skill journey.' : 'Start measuring your skills in minutes.'}
              </p>

              {/* Error banner */}
              {error && (
                <div className="auth-alert" role="alert">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ============ LOGIN FORM ============ */}
              {mode === 'login' ? (
                <form className="auth-form rise" style={{ '--i': 4 }} onSubmit={handleLoginSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="login-email">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="login-pass">Password</label>
                    <div className="pass-wrap">
                      <input
                        id="login-pass"
                        type={showLoginPass ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="eye"
                        onClick={() => setShowLoginPass(!showLoginPass)}
                        aria-label={showLoginPass ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPass ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                  </div>

                  <div className="row-between">
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="box"></span>
                      Remember me
                    </label>
                    <Link className="auth-link" to="/forgot-password">
                      Forgot password?
                    </Link>
                  </div>

                  <button className="btn" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Logging in…</span>
                      </>
                    ) : (
                      'Log in'
                    )}
                  </button>
                </form>
              ) : (
                /* ============ SIGNUP FORM ============ */
                <form className="auth-form rise" style={{ '--i': 4 }} onSubmit={handleSignupSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="su-name">Full name</label>
                    <input
                      id="su-name"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="su-email">Email</label>
                    <input
                      id="su-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="su-pass">Password</label>
                    <div className="pass-wrap">
                      <input
                        id="su-pass"
                        type={showSignupPass ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create a strong password (min. 8 characters)"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="eye"
                        onClick={() => setShowSignupPass(!showSignupPass)}
                        aria-label={showSignupPass ? 'Hide password' : 'Show password'}
                      >
                        {showSignupPass ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                  </div>

                  <button className="btn" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating account…</span>
                      </>
                    ) : (
                      'Create account'
                    )}
                  </button>

                  <p className="fineprint">
                    By signing up you agree to our{' '}
                    <button
                      type="button"
                      className="auth-link bg-transparent border-none p-0 cursor-pointer"
                      onClick={() => showToast('Terms of Service: Standard educational usage policy.')}
                    >
                      Terms
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      className="auth-link bg-transparent border-none p-0 cursor-pointer"
                      onClick={() => showToast('Privacy Policy: We protect your data and privacy.')}
                    >
                      Privacy Policy
                    </button>
                    .
                  </p>
                </form>
              )}

              {/* Social Login Divider */}
              <div className="divider rise" style={{ '--i': 5 }}>
                <span>or continue with</span>
              </div>

              {/* Social Buttons */}
              <div className="social rise" style={{ '--i': 6 }}>
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => {
                    showToast('Redirecting to Google…');
                    loginWithGoogle();
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.6z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.9-5l-4 3.1C3.1 21.3 7.2 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.1 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-4-3.1C.4 8.2 0 10 0 12s.4 3.8 1.1 5.5l4-3.1z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17 1.1 15.2 0 12 0 7.2 0 3.1 2.7 1.1 6.5l4 3.1c1-2.9 3.7-4.9 6.9-4.9z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => {
                    showToast('Redirecting to GitHub…');
                    loginWithGitHub();
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#181717"
                      d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"
                    />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              {/* Mode Switcher Line */}
              <p className="switchline rise" style={{ '--i': 7 }}>
                {mode === 'login' ? (
                  <>
                    New here?{' '}
                    <button
                      type="button"
                      className="auth-link bg-transparent border-none p-0 cursor-pointer font-semibold"
                      onClick={() => handleModeChange('signup')}
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="auth-link bg-transparent border-none p-0 cursor-pointer font-semibold"
                      onClick={() => handleModeChange('login')}
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>

        <footer className="panel-foot rise" style={{ '--i': 8 }}>
          © 2026 Octobyte — built by Team Unix
        </footer>
      </main>

      {/* Floating Toast Notification */}
      <div className={`auth-toast ${toastMsg ? 'show' : ''}`} role="status">
        {toastMsg}
      </div>
    </div>
  );
}
