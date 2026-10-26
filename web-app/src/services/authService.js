import { apiClient, setAccessToken } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:8080';
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

const MOCK_USER = {
  id: 1,
  email: 'learner.unix@epam.com',
  fullName: 'Learner (Team Unix)',
  role: 'USER',
};

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
    if (USE_MOCK_AUTH && (!code || code === 'mock-dev-code')) {
      const mockToken = 'mock-jwt-token-team-unix';
      setAccessToken(mockToken);
      return {
        success: true,
        data: {
          accessToken: mockToken,
          user: MOCK_USER,
        },
      };
    }

    try {
      const response = await apiClient('/api/auth/oauth2/exchange', {
        body: { code },
      });

      if (response?.data?.accessToken) {
        setAccessToken(response.data.accessToken);
      }
      return response;
    } catch (err) {
      if (USE_MOCK_AUTH) {
        console.warn('Backend exchange failed, falling back to mock auth session:', err.message);
        const mockToken = 'mock-jwt-token-team-unix';
        setAccessToken(mockToken);
        return {
          success: true,
          data: {
            accessToken: mockToken,
            user: MOCK_USER,
          },
        };
      }
      throw err;
    }
  },

  // 3. Current User Profile
  async getCurrentUser() {
    if (USE_MOCK_AUTH) {
      return { success: true, data: MOCK_USER };
    }
    return apiClient('/api/auth/me');
  },

  // 4. Token Refresh
  async refreshToken() {
    if (USE_MOCK_AUTH) {
      return { success: true, data: { accessToken: 'mock-jwt-token-refreshed' } };
    }
    const response = await apiClient('/api/auth/refresh');
    if (response?.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response;
  },

  // 5. Logout
  async logout() {
    setAccessToken(null);
    if (USE_MOCK_AUTH) {
      return { success: true };
    }
    return apiClient('/api/auth/logout');
  },

  // 6. Email & Password Login
  async loginWithEmail(email, password) {
    if (USE_MOCK_AUTH) {
      const mockToken = 'mock-jwt-token-team-unix';
      setAccessToken(mockToken);
      return {
        success: true,
        data: {
          accessToken: mockToken,
          user: { ...MOCK_USER, email },
        },
      };
    }
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
    if (USE_MOCK_AUTH) {
      const mockToken = 'mock-jwt-token-team-unix';
      setAccessToken(mockToken);
      return {
        success: true,
        data: {
          accessToken: mockToken,
          user: { id: Date.now(), fullName: fullName || 'New Learner', email, role: 'USER' },
        },
      };
    }
    return apiClient('/api/auth/register', {
      body: { fullName, email, password },
    });
  },

  // 8. Confirm Email Verification Token
  async confirmEmailVerification(token) {
    if (USE_MOCK_AUTH) {
      return {
        success: true,
        message: 'Email verified successfully (mock mode)',
        data: { emailVerified: true },
      };
    }
    return apiClient('/api/auth/email-verification/confirm', {
      body: { token },
    });
  },

  // 9. Resend Verification Email
  async resendEmailVerification(email) {
    if (USE_MOCK_AUTH) {
      return {
        success: true,
        message: 'Verification link resent (mock mode)',
        data: { email, verificationRequired: true },
      };
    }
    return apiClient('/api/auth/email-verification/resend', {
      body: { email },
    });
  },

  // 10. Create OAuth Link Intent (Link Google or GitHub to existing account)
  async createOAuthLinkIntent(provider, currentPassword = null) {
    if (USE_MOCK_AUTH) {
      return {
        success: true,
        data: {
          authorizationPath: `/oauth2/authorization/${provider}`,
          expiresInSeconds: 300,
        },
      };
    }
    return apiClient(`/api/auth/oauth-links/${provider}/intent`, {
      method: 'POST',
      body: currentPassword ? { currentPassword } : {},
    });
  },
};


