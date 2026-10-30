import { apiClient, setAccessToken, getApiBaseUrl } from './api';
import { isNativeMobile, mobileStorage } from './mobileStorage';
import { openOAuthProvider } from './mobileAuth';

export const authService = {
  // 1. Initiate OAuth Redirects (In-App Browser on Mobile, Standard Redirect on Web)
  async loginWithGoogle() {
    const isMobile = isNativeMobile();
    const query = isMobile ? '?client=mobile' : '';
    await openOAuthProvider(`${getApiBaseUrl()}/oauth2/authorization/google${query}`);
  },

  async loginWithGitHub() {
    const isMobile = isNativeMobile();
    const query = isMobile ? '?client=mobile' : '';
    await openOAuthProvider(`${getApiBaseUrl()}/oauth2/authorization/github${query}`);
  },

  // 2. Exchange One-Time Code for JWT Access Token
  async exchangeLoginCode(code) {
    const response = await apiClient('/api/auth/oauth2/exchange', {
      body: { code },
    });

    if (response?.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    if (isNativeMobile() && response?.data?.refreshToken) {
      await mobileStorage.setRefreshToken(response.data.refreshToken);
    }
    return response;
  },

  // 3. Current User Profile
  async getCurrentUser() {
    return apiClient('/api/auth/me');
  },

  // 4. Token Refresh (HttpOnly cookie on web, JSON body on mobile)
  async refreshToken() {
    let refreshBody = undefined;
    if (isNativeMobile()) {
      const storedToken = await mobileStorage.getRefreshToken();
      if (storedToken) {
        refreshBody = { refreshToken: storedToken };
      }
    }

    const response = await apiClient('/api/auth/refresh', {
      method: 'POST',
      ...(refreshBody ? { body: refreshBody } : {}),
    });

    if (response?.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    if (isNativeMobile() && response?.data?.refreshToken) {
      await mobileStorage.setRefreshToken(response.data.refreshToken);
    }
    return response;
  },

  // 5. Logout (Revokes refresh token cookie on server / clears mobile storage)
  async logout() {
    let logoutBody = undefined;
    if (isNativeMobile()) {
      const storedToken = await mobileStorage.getRefreshToken();
      if (storedToken) {
        logoutBody = { refreshToken: storedToken };
      }
      await mobileStorage.clearRefreshToken();
    }
    setAccessToken(null);

    return apiClient('/api/auth/logout', {
      method: 'POST',
      ...(logoutBody ? { body: logoutBody } : {}),
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
    if (isNativeMobile() && response?.data?.refreshToken) {
      await mobileStorage.setRefreshToken(response.data.refreshToken);
    }
    return response;
  },

  // 7. Email & Password Registration
  async registerWithEmail({ fullName, email, password }) {
    return apiClient('/api/auth/register', {
      body: { fullName, email, password },
    });
  },

  // 7b. Mentor Registration
  async registerMentor({ fullName, username, email, password, confirmPassword }) {
    return apiClient('/api/auth/mentor/register', {
      body: { fullName, username, email, password, confirmPassword },
    });
  },

  // 8. Confirm the six-digit email verification OTP
  async confirmEmailVerification(email, otp) {
    const response = await apiClient('/api/auth/email-verification/confirm', {
      body: { email, otp },
    });
    if (response?.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    if (isNativeMobile() && response?.data?.refreshToken) {
      await mobileStorage.setRefreshToken(response.data.refreshToken);
    }
    return response;
  },

  // 9. Resend Verification Email
  async resendEmailVerification(email) {
    return apiClient('/api/auth/email-verification/resend', {
      body: { email },
    });
  },

  async requestPasswordReset(email) {
    return apiClient('/api/auth/forgot-password', {
      body: { email },
    });
  },

  async verifyPasswordResetOtp(email, otp) {
    return apiClient('/api/auth/verify-reset-otp', {
      body: { email, otp },
    });
  },

  async resetPassword(email, resetToken, newPassword) {
    return apiClient('/api/auth/reset-password', {
      body: { email, resetToken, newPassword },
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
