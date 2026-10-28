import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getAccessToken, setAccessToken } from '../services/api';
import { AuthContext } from './authContextInstance';

const USER_SESSION_KEY = 'skillpath_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(USER_SESSION_KEY);
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [, setTokenState] = useState(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(() => {
    // If on OAuth callback route, AuthCallbackPage handles code exchange lifecycle
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')) {
      return false;
    }
    // If user already restored from sessionStorage, unblock initial render
    if (typeof window !== 'undefined' && sessionStorage.getItem(USER_SESSION_KEY)) {
      return false;
    }
    return true;
  });

  const updateUserSession = useCallback((newUser, newToken) => {
    setUser(newUser);
    if (newToken) {
      setAccessToken(newToken);
      setTokenState(newToken);
    }
    if (typeof window !== 'undefined') {
      try {
        if (newUser) {
          sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(newUser));
        } else {
          sessionStorage.removeItem(USER_SESSION_KEY);
        }
      } catch {
        // Storage access blocked or unavailable
      }
    }
  }, []);

  const clearUserSession = useCallback(() => {
    setUser(null);
    setTokenState(null);
    setAccessToken(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(USER_SESSION_KEY);
      } catch {
        // Storage access blocked or unavailable
      }
    }
  }, []);

  // Restore session on initial application mount
  useEffect(() => {
    // Do NOT run initial session hydration if on OAuth callback route;
    // AuthCallbackPage will perform the code exchange directly.
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function hydrateSession() {
      try {
        // Only attempt /api/auth/me if we have a token or a saved user
        const currentToken = getAccessToken();
        const savedUser = typeof window !== 'undefined' ? sessionStorage.getItem(USER_SESSION_KEY) : null;

        if (!currentToken && !savedUser) {
          if (mounted) {
            clearUserSession();
            setIsLoading(false);
          }
          return;
        }

        const profileRes = await authService.getCurrentUser();
        if (mounted && profileRes?.data) {
          updateUserSession(profileRes.data);
        }
      } catch {
        // Session not active or unauthenticated
        if (mounted) {
          clearUserSession();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateSession();
    return () => {
      mounted = false;
    };
  }, [clearUserSession, updateUserSession]);

  const handleOAuthCallback = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const result = await authService.exchangeLoginCode(code);
      if (result?.data) {
        updateUserSession(result.data.user, result.data.accessToken);
        return { success: true };
      }
      return { success: false, error: 'Empty token response' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [updateUserSession]);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const result = await authService.loginWithEmail(email, password);
      if (result?.data) {
        updateUserSession(result.data.user, result.data.accessToken);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [updateUserSession]);

  const register = useCallback(async (details) => {
    setIsLoading(true);
    try {
      const result = await authService.registerWithEmail(details);
      if (result?.data?.accessToken) {
        updateUserSession(result.data.user, result.data.accessToken);
      }
      return { success: true, data: result?.data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [updateUserSession]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      clearUserSession();
      setIsLoading(false);
    }
  }, [clearUserSession]);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    loginWithGoogle: authService.loginWithGoogle,
    loginWithGitHub: authService.loginWithGitHub,
    logout,
    handleOAuthCallback,
    confirmEmailVerification: authService.confirmEmailVerification,
    resendEmailVerification: authService.resendEmailVerification,
    createOAuthLinkIntent: authService.createOAuthLinkIntent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
