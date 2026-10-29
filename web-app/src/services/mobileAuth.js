import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { isNativeMobile } from './mobileStorage';

/**
 * Initializes deep link listener for native mobile authentication callbacks.
 * Pattern: octobyte://auth/callback?code=<ONE_TIME_CODE>
 */
export function initializeMobileDeepLinks(navigate) {
  if (!isNativeMobile()) return;

  App.addListener('appUrlOpen', async (data) => {
    try {
      const url = new URL(data.url);
      
      // Match custom scheme octobyte://auth/callback or octobyte://auth?code=...
      const isAuthCallback =
        url.hostname === 'auth' ||
        url.pathname.includes('/auth/callback') ||
        url.pathname.includes('/auth');

      if (isAuthCallback) {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        // Close in-app browser once callback is triggered
        try {
          await Browser.close();
        } catch {}

        if (code) {
          navigate(`/auth/callback?code=${encodeURIComponent(code)}`);
        } else if (error) {
          navigate(`/auth/error?error=${encodeURIComponent(error)}`);
        }
      }
    } catch (err) {
      console.warn('Error processing incoming deep link:', err);
    }
  });
}

/**
 * Opens OAuth2 provider flow in an in-app browser on mobile, or standard window redirect on web.
 */
export async function openOAuthProvider(providerAuthorizationUrl) {
  if (isNativeMobile()) {
    await Browser.open({
      url: providerAuthorizationUrl,
      windowName: '_blank',
      presentationStyle: 'popover',
      toolbarColor: '#F7F3E8',
    });
  } else {
    window.location.href = providerAuthorizationUrl;
  }
}
