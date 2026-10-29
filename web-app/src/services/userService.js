import { apiClient } from './api';

export const userService = {
  /**
   * Update the authenticated user's profile information.
   * @param {Object} data
   * @param {string} data.fullName
   * @param {string} [data.avatarUrl]
   * @param {string} [data.bio]
   */
  async updateProfile(data) {
    return apiClient('/api/users/profile', {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Fetch the current authenticated user's profile.
   */
  async getProfile() {
    return apiClient('/api/users/profile');
  },
};

