import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { useAuth } from './hooks/useAuth';
import { isNativeMobile } from './services/mobileStorage';
import { initializeMobileDeepLinks } from './services/mobileAuth';
import SplashScreenOverlay from './components/mobile/SplashScreenOverlay';
import { PostLoginTransitionProvider } from './context/PostLoginTransitionContext';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

function MobileBridge() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isNativeMobile()) return;

    // 1. Initialize custom URL deep links (octobyte://auth/callback)
    initializeMobileDeepLinks((path) => router.navigate(path));

    // 2. Set dark status bar during initial splash screen
    (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#0A0A0C' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        console.warn('Splash status bar styling notice:', err);
      }
    })();

    // 3. Android Hardware Back Button navigation
    let backListenerHandle = null;
    (async () => {
      try {
        backListenerHandle = await CapApp.addListener('backButton', ({ canGoBack }) => {
          const currentPath = window.location.pathname;
          if (currentPath === '/' || currentPath === '/dashboard' || currentPath === '/login') {
            CapApp.exitApp();
          } else if (canGoBack) {
            window.history.back();
          } else {
            router.navigate('/dashboard');
          }
        });
      } catch (err) {
        console.warn('Back button listener error:', err);
      }
    })();

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove();
      }
    };
  }, []);

  // 4. Handle initial mobile startup routing once authentication hydration completes
  useEffect(() => {
    if (!isNativeMobile() || isLoading) return;

    const currentPath = window.location.pathname;

    if (user) {
      // Authenticated user on mobile: bypass landing page & login screens
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/signup') {
        router.navigate('/dashboard', { replace: true });
      }
    } else {
      // Unauthenticated user on mobile: direct to login screen rather than promotional landing page
      if (currentPath === '/') {
        router.navigate('/login', { replace: true });
      }
    }

    // Switch status bar to warm app theme once main screen is revealed and ensure it does not overlap content
    (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#F7F3E8' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        console.warn('App status bar styling notice:', err);
      }
    })();
  }, [user, isLoading]);

  return <SplashScreenOverlay isReady={!isLoading} />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PostLoginTransitionProvider>
          <MobileBridge />
          <RouterProvider router={router} />
        </PostLoginTransitionProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
