import { apiClient } from './api';

export const mentorService = {
  // 1. Dashboard Overview
  async getOverview() {
    return apiClient('/api/v1/mentor/dashboard/overview');
  },

  // 2. Mentor Profile
  async getProfile() {
    return apiClient('/api/v1/mentor/profile');
  },

  async updateProfile(profileData) {
    return apiClient('/api/v1/mentor/profile', {
      method: 'PATCH',
      body: profileData,
    });
  },

  // 3. Students Directory
  async getStudents({ q = '', progressBand = '', sort = 'name', page = 0, size = 20 } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (progressBand && progressBand !== 'All progress') {
      const bandNormalized = progressBand.toUpperCase().replace(/\s+/g, '_');
      params.set('progressBand', bandNormalized);
    }
    if (sort) {
      const sortMap = {
        name: 'name',
        'tests-desc': 'tests_desc',
        tests_desc: 'tests_desc',
        'progress-desc': 'progress_desc',
        progress_desc: 'progress_desc',
        'progress-asc': 'progress_asc',
        progress_asc: 'progress_asc',
        recent: 'recent',
      };
      params.set('sort', sortMap[sort] || sort);
    }
    params.set('page', page);
    params.set('size', size);

    return apiClient(`/api/v1/mentor/students?${params.toString()}`);
  },

  // 4. Student Detail (modal)
  async getStudentDetail(studentId) {
    return apiClient(`/api/v1/mentor/students/${studentId}`);
  },

  // 5. Achieved Skills
  async getAchievements({ q = '', category = '', proficiency = '', studentId = '', sort = 'date_desc', page = 0, size = 50 } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category && category !== 'All categories') params.set('category', category);
    if (proficiency && proficiency !== 'All levels') params.set('proficiency', proficiency.toUpperCase());
    if (studentId) params.set('studentId', studentId);
    if (sort) params.set('sort', sort);
    params.set('page', page);
    params.set('size', size);

    return apiClient(`/api/v1/mentor/achievements?${params.toString()}`);
  },

  async getAchievementFacets() {
    return apiClient('/api/v1/mentor/achievements/facets');
  },

  // 6. Test Analytics
  async getTestAnalytics({ from = '', to = '', track = '' } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (track) params.set('track', track);

    const qs = params.toString();
    return apiClient(`/api/v1/mentor/analytics/tests${qs ? `?${qs}` : ''}`);
  },

  async getRecentActivity({ limit = 8, studentId = '', status = '' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (studentId) params.set('studentId', studentId);
    if (status) params.set('status', status.toUpperCase().replace(/\s+/g, '_'));

    return apiClient(`/api/v1/mentor/analytics/activity?${params.toString()}`);
  },

  // 7. Mentor Unique Key
  async getKey() {
    return apiClient('/api/v1/mentor/key');
  },

  async generateOrRotateKey(replaceExisting = false) {
    return apiClient('/api/v1/mentor/key', {
      method: 'POST',
      body: { replaceExisting },
    });
  },

  // 8. Student-side Mentor Linking
  async linkStudentToMentor(key) {
    return apiClient('/api/v1/students/mentor-link', {
      method: 'POST',
      body: { key },
    });
  },

  async getStudentMentorLink() {
    return apiClient('/api/v1/students/mentor-link');
  },

  async unlinkStudentFromMentor() {
    return apiClient('/api/v1/students/mentor-link', {
      method: 'DELETE',
    });
  },
};


