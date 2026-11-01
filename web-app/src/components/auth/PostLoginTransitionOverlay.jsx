import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import OctoMascot from '../common/OctoMascot';
import './PostLoginTransition.css';

/**
 * PostLoginTransitionOverlay
 *
 * Plays the post-login sequence:
 * 1. Split reveal:
 *    - Left purple panel slides fully off-screen to the left (or up on mobile).
 *    - Right cream panel slides fully off-screen to the right (or down on mobile).
 *    - Together they act like sliding doors, exposing the dashboard underneath.
 * 2. Mascot to navbar:
 *    - Octopus detaches and swoops across the screen to the top navbar.
 *    - Shrinks smoothly as it travels and lands next to the Octobyte logo in the navbar.
 *    - Settles with a gentle bounce and remains permanently in the navbar.
 * 3. Interaction blocked during transition; unmounts when animation completes.
 * 4. Transform and opacity only (GPU-friendly).
 * 5. Respects prefers-reduced-motion.
 */
export default function PostLoginTransitionOverlay({
  initialRect,
  email = '',
  onMascotLanded,
  onComplete,
}) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    // Respect prefers-reduced-motion: finish immediately without animation
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (onMascotLanded) onMascotLanded();
      if (onComplete) onComplete();
      return undefined;
    }

    const measureTarget = () => {
      const el =
        document.getElementById('navbar-octobyte-mascot-target') ||
        document.getElementById('mentor-navbar-mascot-target') ||
        document.querySelector('.navbar-octo-target');

      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          return rect;
        }
      }
      return null;
    };

    const updateCoords = () => {
      const targetRect = measureTarget();
      const isMobile = window.innerWidth <= 880;
      const isSmallMobile = window.innerWidth <= 640;

      const defaultStart = isMobile
        ? {
            top: isSmallMobile ? 48 : 72,
            left: 20,
            width: isSmallMobile ? 64 : 132,
            height: isSmallMobile ? 64 : 132,
          }
        : {
            top: window.innerHeight * 0.30,
            left: window.innerWidth * 0.20,
            width: Math.min(300, window.innerWidth * 0.25),
            height: Math.min(300, window.innerWidth * 0.25),
          };

      const start = initialRect && initialRect.width > 0 ? initialRect : defaultStart;

      const fallbackTarget = {
        top: 14,
        left: isMobile ? 56 : (window.innerWidth >= 1024 ? 288 : 56),
        width: 32,
        height: 32,
      };

      const target = targetRect || fallbackTarget;

      const startCenterX = start.left + start.width / 2;
      const startCenterY = start.top + start.height / 2;
      const targetCenterX = target.left + target.width / 2;
      const targetCenterY = target.top + target.height / 2;

      const dx = targetCenterX - startCenterX;
      const dy = targetCenterY - startCenterY;
      const scale = target.width / start.width;

      setCoords({ start, dx, dy, scale });
    };

    // First measurement immediately on mount
    updateCoords();

    // Re-check measurement on next frame to lock onto rendered navbar DOM rect
    const rafId = requestAnimationFrame(() => {
      updateCoords();
    });

    const checkTimer = setTimeout(() => {
      updateCoords();
    }, 45);

    // Schedule handoff to permanent navbar mascot (landing touchdown)
    const landedTimer = setTimeout(() => {
      if (onMascotLanded) onMascotLanded();
    }, 1280);

    // Schedule full completion and unmount from DOM
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1450);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(checkTimer);
      clearTimeout(landedTimer);
      clearTimeout(completeTimer);
    };
  }, [initialRect, onMascotLanded, onComplete]);

  // Initial coords fallback before measurement resolves
  const isMobileInitial = typeof window !== 'undefined' && window.innerWidth <= 880;
  const isSmallMobileInitial = typeof window !== 'undefined' && window.innerWidth <= 640;

  const defaultStartFallback = isMobileInitial
    ? {
        top: isSmallMobileInitial ? 48 : 72,
        left: 20,
        width: isSmallMobileInitial ? 64 : 132,
        height: isSmallMobileInitial ? 64 : 132,
      }
    : {
        top: typeof window !== 'undefined' ? window.innerHeight * 0.30 : 200,
        left: typeof window !== 'undefined' ? window.innerWidth * 0.20 : 200,
        width: 280,
        height: 280,
      };

  const start = coords?.start || initialRect || defaultStartFallback;
  const dx = coords?.dx ?? 0;
  const dy = coords?.dy ?? 0;
  const scale = coords?.scale ?? 0.14;

  return (
    <div className="post-login-overlay" aria-hidden="true">
      {/* ── Split Doors Wrapper ────────────────────────────── */}
      <div className="post-login-split-wrap">
        {/* ── Left Door: Purple Mascot & Brand Panel ─────────── */}
        <aside className="post-login-door post-login-door-left auth-art">
          <div className="auth-glow auth-glow-a" />
          <div className="auth-glow auth-glow-b" />

          {/* Floating decorative bubbles matching AuthPage */}
          <span className="auth-bubble" style={{ '--x': '8%', '--s': '16px', '--t': '11s', '--d': '0s' }} />
          <span className="auth-bubble" style={{ '--x': '20%', '--s': '9px', '--t': '9s', '--d': '2.4s' }} />
          <span className="auth-bubble" style={{ '--x': '34%', '--s': '13px', '--t': '13s', '--d': '4.2s' }} />
          <span className="auth-bubble" style={{ '--x': '55%', '--s': '7px', '--t': '8.5s', '--d': '1.2s' }} />
          <span className="auth-bubble" style={{ '--x': '70%', '--s': '15px', '--t': '12s', '--d': '3.4s' }} />
          <span className="auth-bubble" style={{ '--x': '84%', '--s': '10px', '--t': '10s', '--d': '5.1s' }} />
          <span className="auth-bubble" style={{ '--x': '93%', '--s': '12px', '--t': '11.5s', '--d': '0.8s' }} />

          {/* Brand header */}
          <div className="art-head" style={{ textDecoration: 'none' }}>
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
          </div>

          {/* Art Inner with mascot placeholder (mascot detached to flying layer) */}
          <div className="art-inner">
            <div className="octo-wrap" style={{ visibility: 'hidden' }}>
              <div style={{ width: `${start.width}px`, height: `${start.height}px` }} />
              <div className="octo-shadow" />
            </div>

            <div className="art-copy">
              <p className="tagline">
                Measure. Plan. <em>Track.</em>
              </p>
              <p className="art-sub">Adaptive tests, living skill maps and AI roadmaps that grow with you.</p>
            </div>
          </div>

          {/* Footer */}
          <p className="art-foot">
            © 2026 Octobyte · built by Team Unix
          </p>
        </aside>

        {/* ── Right Door: Cream Form Panel ───────────────────── */}
        <main className="post-login-door post-login-door-right auth-panel">
          <span className="auth-back" style={{ visibility: 'hidden' }}>
            &larr; Back to site
          </span>

          <div className="form-wrap">
            <header className="panel-head">
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

            {/* Mode Tabs */}
            <div className="tabs" role="tablist">
              <button className="tab active" type="button">Log in</button>
              <button className="tab" type="button">Sign up</button>
            </div>

            <h1 className="title">Welcome back</h1>
            <p className="subtitle">Log in to continue your skill journey.</p>

            <div className="auth-form">
              <div className="field">
                <label>Email</label>
                <input type="email" value={email || 'you@example.com'} readOnly />
              </div>

              <div className="field">
                <label>Password</label>
                <div className="pass-wrap">
                  <input type="password" value="••••••••••••" readOnly />
                </div>
              </div>

              <div className="row-between">
                <label className="check">
                  <input type="checkbox" checked readOnly />
                  <span className="box"></span>
                  Remember me
                </label>
                <span className="auth-link">Forgot password?</span>
              </div>

              <button className="btn" type="button" disabled>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Entering workspace…</span>
                </span>
              </button>
            </div>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <div className="social">
              <button className="btn-ghost" type="button" disabled>
                <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                  <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.6z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.9-5l-4 3.1C3.1 21.3 7.2 24 12 24z" />
                  <path fill="#FBBC05" d="M5.1 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-4-3.1C.4 8.2 0 10 0 12s.4 3.8 1.1 5.5l4-3.1z" />
                  <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17 1.1 15.2 0 12 0 7.2 0 3.1 2.7 1.1 6.5l4 3.1c1-2.9 3.7-4.9 6.9-4.9z" />
                </svg>
                <span>Google</span>
              </button>
              <button className="btn-ghost" type="button" disabled>
                <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                  <path fill="#181717" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            <p className="switchline">
              New here? <span className="auth-link font-semibold">Create an account</span>
            </p>
          </div>

          <footer className="panel-foot">
            © 2026 Octobyte — built by Team Unix
          </footer>
        </main>
      </div>

      {/* ── Detached Flying Octopus Mascot ─────────────────── */}
      <div
        className="post-login-flying-mascot"
        style={{
          top: `${start.top}px`,
          left: `${start.left}px`,
          width: `${start.width}px`,
          height: `${start.height}px`,
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          '--target-scale': scale,
        }}
      >
        <OctoMascot
          size={start.width}
          idPrefix="post-login-flying-octo"
          animated={true}
          withBook={true}
        />
      </div>
    </div>
  );
}
