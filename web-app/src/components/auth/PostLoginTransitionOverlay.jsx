import { useEffect, useState, useRef } from 'react';
import OctoMascot from '../common/OctoMascot';
import './PostLoginTransition.css';

/**
 * PostLoginTransitionOverlay
 *
 * Plays the post-login sequence:
 * 1. Sliding doors (left purple door slides left, right cream door slides right)
 *    revealing the live dashboard rendered underneath.
 * 2. Mascot detaches and travels along an arc to the top navbar logo.
 * 3. Shrinks as it moves, lands with a gentle bounce settle in the navbar.
 * 4. Completely unmounts from the DOM when finished.
 */
export default function PostLoginTransitionOverlay({
  initialRect,
  onMascotLanded,
  onComplete,
}) {
  const [targetCoords, setTargetCoords] = useState(null);
  const measuredRef = useRef(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      if (onMascotLanded) onMascotLanded();
      if (onComplete) onComplete();
      return;
    }

    // Find the navbar target element (rendered underneath by DashboardShell / MentorDashboard)
    const findTarget = () => {
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

    // Attempt measurement immediately and on next animation frame
    const measure = () => {
      if (measuredRef.current) return;
      const targetRect = findTarget();
      const defaultStart = {
        top: window.innerHeight * 0.32,
        left: window.innerWidth * 0.22,
        width: Math.min(260, window.innerWidth * 0.5),
        height: Math.min(260, window.innerWidth * 0.5),
      };

      const start = initialRect && initialRect.width > 0 ? initialRect : defaultStart;

      // Fallback target if navbar target isn't mounted yet
      const fallbackTarget = {
        top: 14,
        left: window.innerWidth < 1024 ? 54 : 32,
        width: 36,
        height: 36,
      };

      const target = targetRect || fallbackTarget;

      const startCenterX = start.left + start.width / 2;
      const startCenterY = start.top + start.height / 2;
      const targetCenterX = target.left + target.width / 2;
      const targetCenterY = target.top + target.height / 2;

      const dx = targetCenterX - startCenterX;
      const dy = targetCenterY - startCenterY;
      const scale = target.width / start.width;

      setTargetCoords({
        start,
        dx,
        dy,
        scale,
      });

      measuredRef.current = true;
    };

    // Run measurement
    const rafId = requestAnimationFrame(() => {
      measure();
    });

    // Schedule settle and complete timers
    const landedTimer = setTimeout(() => {
      if (onMascotLanded) onMascotLanded();
    }, 1250);

    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1450);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(landedTimer);
      clearTimeout(completeTimer);
    };
  }, [initialRect, onMascotLanded, onComplete]);

  // If coords are not ready yet, render static doors immediately to prevent flicker
  const start = targetCoords?.start || initialRect || {
    top: typeof window !== 'undefined' ? window.innerHeight * 0.32 : 200,
    left: typeof window !== 'undefined' ? window.innerWidth * 0.22 : 200,
    width: 260,
    height: 260,
  };

  const dx = targetCoords?.dx ?? 0;
  const dy = targetCoords?.dy ?? 0;
  const scale = targetCoords?.scale ?? 0.15;

  return (
    <div className="post-login-overlay" aria-hidden="true">
      {/* ── Left Door: Purple Mascot & Brand Panel ─────────── */}
      <div className="post-login-door post-login-door-left auth-art">
        {/* Ambient glows matching AuthPage */}
        <div className="auth-glow auth-glow-a" />
        <div className="auth-glow auth-glow-b" />

        {/* Brand header */}
        <div className="art-head" style={{ opacity: 0.9 }}>
          <svg viewBox="0 0 64 64" aria-hidden="true" width="28" height="28">
            <ellipse cx="32" cy="25" rx="19" ry="18" fill="#B9A5FF" />
            <circle cx="26" cy="24" r="3" fill="#2F2A3E" />
            <circle cx="38" cy="24" r="3" fill="#2F2A3E" />
            <path d="M28 31.5q4 3.4 8 0" stroke="#2F2A3E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </svg>
          <span className="wordmark">Octobyte</span>
        </div>

        {/* Center: Copy only — mascot is detached into the flying layer */}
        <div className="art-inner" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ height: start.height, width: start.width, visibility: 'hidden' }} />
          <div className="art-copy" style={{ marginTop: '1rem' }}>
            <p className="tagline">
              Measure. Plan. <em>Track.</em>
            </p>
            <p className="art-sub">Adaptive tests, living skill maps and AI roadmaps that grow with you.</p>
          </div>
        </div>

        {/* Footer */}
        <p className="art-foot" style={{ opacity: 0.6 }}>
          © 2026 Octobyte · built by Team Unix
        </p>
      </div>

      {/* ── Right Door: Cream Form Panel ───────────────────── */}
      <div className="post-login-door post-login-door-right">
        <div
          style={{
            maxWidth: '430px',
            margin: '0 auto',
            padding: '50px 30px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span
              style={{
                fontFamily: "'Baloo 2', cursive",
                fontSize: '24px',
                fontWeight: 700,
                color: '#2F2A3E',
              }}
            >
              Octobyte
            </span>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#2F2A3E',
                marginTop: '12px',
              }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: '14px', color: '#6E6880', marginTop: '4px' }}>
              Redirecting to your dashboard…
            </p>
          </div>
          <div
            style={{
              height: '48px',
              borderRadius: '12px',
              background: '#EFEAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              color: '#7C5CFA',
            }}
          >
            Entering workspace…
          </div>
        </div>
      </div>

      {/* ── Detached Flying Mascot ─────────────────────────── */}
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
          idPrefix="flying-octo"
          animated={true}
          withBook={true}
        />
      </div>
    </div>
  );
}

