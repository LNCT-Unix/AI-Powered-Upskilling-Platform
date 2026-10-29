import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const REFRESH_TOKEN_KEY = 'octobyte_refresh_token';

/**
 * Returns true if running within a native mobile container (Android/iOS via Capacitor).
 */
export const isNativeMobile = () => Capacitor.isNativePlatform();

/**
 * Hardware-backed token storage adapter for mobile clients.
 * Uses Capacitor Preferences (backed by Android SharedPreferences / iOS Keychain).
 */
export const mobileStorage = {
  async getRefreshToken() {
    if (!isNativeMobile()) return null;
    try {
      const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
      return value || null;
    } catch (err) {
      console.warn('Failed to retrieve mobile refresh token:', err);
      return null;
    }
  },

  async setRefreshToken(token) {
    if (!isNativeMobile()) return;
    try {
      if (token) {
        await Preferences.set({ key: REFRESH_TOKEN_KEY, value: token });
      } else {
        await Preferences.remove({ key: REFRESH_TOKEN_KEY });
      }
    } catch (err) {
      console.warn('Failed to persist mobile refresh token:', err);
    }
  },

  async clearRefreshToken() {
    if (!isNativeMobile()) return;
    try {
      await Preferences.remove({ key: REFRESH_TOKEN_KEY });
    } catch (err) {
      console.warn('Failed to clear mobile refresh token:', err);
    }
  }
};

