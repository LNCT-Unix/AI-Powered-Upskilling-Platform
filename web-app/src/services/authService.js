import { apiClient, setAccessToken } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const authService = {
  // 1. Initiate OAuth Redirects
  loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  },

  loginWithGitHub() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/github`;
  },

  // 2. Exchange One-Time Code for JWT Access Token
  async exchangeLoginCode(code) {
    const response = await apiClient('/api/auth/oauth2/exchange', {
      body: { code },
    });

    if (response?.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response;
  },

  // 3. Current User Profile
  async getCurrentUser() {
    return apiClient('/api/auth/me');
  },

  // 4. Token Refresh (HttpOnly cookie refresh_token automatically included)
  async refreshToken() {
    const response = await apiClient('/api/auth/refresh', {
      method: 'POST',
    });
    if (response?.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response;
  },

  // 5. Logout (Revokes refresh token cookie on server)
  async logout() {
    setAccessToken(null);
    return apiClient('/api/auth/logout', {
      method: 'POST',
    });
  },

  // 6. Email & Password Login
  async loginWithEmail(email, password) {
    const response = await apiClient('/api/auth/login', {
      body: { email, password },
    });
    if (response?.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response;
  },

  // 7. Email & Password Registration
  async registerWithEmail({ fullName, email, password }) {
    return apiClient('/api/auth/register', {
      body: { fullName, email, password },
    });
  },

  // 8. Confirm Email Verification Token
  async confirmEmailVerification(token) {
    return apiClient('/api/auth/email-verification/confirm', {
      body: { token },
    });
  },

  // 9. Resend Verification Email
  async resendEmailVerification(email) {
    return apiClient('/api/auth/email-verification/resend', {
      body: { email },
    });
  },

  // 10. Create OAuth Link Intent
  async createOAuthLinkIntent(provider, currentPassword) {
    return apiClient(`/api/auth/oauth-links/${provider}/intent`, {
      method: 'POST',
      body: currentPassword ? { currentPassword } : {},
    });
  },
};
