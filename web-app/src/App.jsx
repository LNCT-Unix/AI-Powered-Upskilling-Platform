import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { isNativeMobile } from './services/mobileStorage';
import { initializeMobileDeepLinks } from './services/mobileAuth';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

function MobileBridge() {
  useEffect(() => {
    if (!isNativeMobile()) return;

    // 1. Initialize custom URL deep links (octobyte://auth/callback)
    initializeMobileDeepLinks((path) => router.navigate(path));

    // 2. Configure native Status Bar
    (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#F7F3E8' });
      } catch (err) {
        console.warn('Status bar configuration error:', err);
      }
    })();

    // 3. Android Hardware Back Button navigation
    let backListenerHandle = null;
    (async () => {
      try {
        backListenerHandle = await CapApp.addListener('backButton', ({ canGoBack }) => {
          const currentPath = window.location.pathname;
          if (currentPath === '/' || currentPath === '/dashboard') {
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

  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MobileBridge />
        <RouterProvider router={router} />
      </AuthProvider>
    </LanguageProvider>
  );
}
