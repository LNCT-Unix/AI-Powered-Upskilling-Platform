import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { AuthContext } from './authContextInstance';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on initial application mount
  useEffect(() => {
    let mounted = true;

    async function hydrateSession() {
      try {
        const profileRes = await authService.getCurrentUser();
        if (mounted && profileRes?.data) {
          setUser(profileRes.data);
        }
      } catch {
        // Session not active or unauthenticated
        if (mounted) {
          setUser(null);
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
  }, []);

  const handleOAuthCallback = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const result = await authService.exchangeLoginCode(code);
      if (result?.data) {
        setTokenState(result.data.accessToken);
        setUser(result.data.user);
        return { success: true, user: result.data.user };
      }
      return { success: false, error: 'Empty token response' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const result = await authService.loginWithEmail(email, password);
      if (result?.data) {
        setTokenState(result.data.accessToken);
        setUser(result.data.user);
        return { success: true, user: result.data.user };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (details) => {
    setIsLoading(true);
    try {
      const result = await authService.registerWithEmail(details);
      if (result?.data?.accessToken) {
        setTokenState(result.data.accessToken);
        setUser(result.data.user);
      }
      return { success: true, data: result?.data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmEmailVerification = useCallback(async (email, otp) => {
    setIsLoading(true);
    try {
      const result = await authService.confirmEmailVerification(email, otp);
      if (result?.data?.accessToken && result?.data?.user) {
        setTokenState(result.data.accessToken);
        setUser(result.data.user);
        return { success: true, data: result.data, user: result.data.user };
      }
      return { success: false, error: 'Invalid verification response' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setTokenState(null);
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    loginWithGoogle: authService.loginWithGoogle,
    loginWithGitHub: authService.loginWithGitHub,
    logout,
    updateUser,
    handleOAuthCallback,
    confirmEmailVerification,
    resendEmailVerification: authService.resendEmailVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
