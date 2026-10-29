import { useState, useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativeMobile } from '../../services/mobileStorage';

/**
 * Industry Best-Practice Monochrome In-App Splash Screen Overlay.
 * Designed exclusively for native mobile app launch.
 * Provides a seamless cross-fade from Android native boot to React routes.
 */
export default function SplashScreenOverlay({ isReady, onFinish }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Only execute on native mobile containers
    if (!isNativeMobile()) {
      setVisible(false);
      return;
    }

    // Hide native Capacitor window splash immediately once React overlay is mounted
    (async () => {
      try {
        await SplashScreen.hide({ fadeOutDuration: 150 });
      } catch (err) {
        console.warn('Native splash hide notice:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isNativeMobile()) return;

    // Enforce a minimum display window (600ms) for smooth visual rhythm,
    // then gracefully fade out once auth hydration / routing is ready.
    if (isReady) {
      const timer = setTimeout(() => {
        setFading(true);
        const finishTimer = setTimeout(() => {
          setVisible(false);
          if (onFinish) onFinish();
        }, 350); // Matches CSS transition duration
        return () => clearTimeout(finishTimer);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isReady, onFinish]);

  if (!visible || !isNativeMobile()) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none transition-opacity duration-350 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#0A0A0C' }}
    >
      {/* Ambient background glow ring */}
      <div className="absolute h-64 w-64 rounded-full bg-white/[0.04] blur-3xl animate-pulse pointer-events-none" />

      {/* Centered Logo with gentle breathing micro-animation */}
      <div className="relative z-10 flex flex-col items-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-white/10 blur-xl opacity-60 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
          <img
            src="/octobyte-logo.png"
            alt="octoByte"
            className="h-24 w-24 object-contain filter drop-shadow-[0_0_24px_rgba(255,255,255,0.22)] transition-transform duration-700 ease-out transform scale-100"
          />
        </div>

        {/* Minimalist monochrome brand typography */}
        <div className="text-center pt-2">
          <h1 className="text-2xl font-black tracking-wider text-white">
            octo<span className="text-purple-400">Byte</span>
          </h1>
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-zinc-500 mt-1">
            AI Upskilling Platform
          </p>
        </div>
      </div>

      {/* Sleek ultra-thin bottom loading indicator */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center space-y-2">
        <div className="h-[2px] w-24 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent w-full animate-[shimmer_1.5s_infinite]" />
        </div>
        <span className="text-[10px] font-semibold text-zinc-600 tracking-wider">
          Initializing…
        </span>
      </div>

      {/* Embedded keyframe for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
