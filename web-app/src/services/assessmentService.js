import { apiClient } from './api';

export const BACKEND_TRACK_ID = '00000000-0000-0000-0000-000000000001';

export const TRACK_UUID_MAP = {
  backend: BACKEND_TRACK_ID,
  fullstack: BACKEND_TRACK_ID,
  'ai-data': BACKEND_TRACK_ID,
  devops: BACKEND_TRACK_ID,
};

export function normalizeTrackId(id) {
  if (!id) return BACKEND_TRACK_ID;
  if (TRACK_UUID_MAP[id]) return TRACK_UUID_MAP[id];
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  return isUUID ? id : BACKEND_TRACK_ID;
}

export const assessmentService = {
  /**
   * Start a new test or resume an existing active one for a track.
   * Directly queries the Spring Boot gateway API: POST /api/v1/assessments
   * @param {string} trackId - UUID of the learning track.
   * @returns {Promise<AssessmentState>}
   */
  async startOrResume(trackId) {
    const validTrackId = normalizeTrackId(trackId);
    return apiClient('/api/v1/assessments', {
      method: 'POST',
      body: { trackId: validTrackId },
    });
  },

  /**
   * Fetch current state by assessment ID (for page reloads or active sessions).
   * Directly queries the Spring Boot gateway API: GET /api/v1/assessments/{id}
   * @param {string} assessmentId - UUID of the assessment.
   * @returns {Promise<AssessmentState>}
   */
  async getState(assessmentId) {
    if (!assessmentId) {
      throw new Error('Assessment ID is required');
    }
    return apiClient(`/api/v1/assessments/${assessmentId}`, {
      method: 'GET',
    });
  },

  /**
   * Submit an answer to the current question.
   * Directly queries the Spring Boot gateway API: POST /api/v1/assessments/{id}/responses
   * @param {string} assessmentId - UUID of the assessment.
   * @param {string} itemId - UUID of the current question.
   * @param {number} selectedOption - 0-indexed integer corresponding to choice.
   * @returns {Promise<AssessmentState>}
   */
  async submitAnswer(assessmentId, itemId, selectedOption) {
    return apiClient(`/api/v1/assessments/${assessmentId}/responses`, {
      method: 'POST',
      body: {
        itemId,
        selectedOption,
      },
    });
  },

  /**
   * Retrieve final score and skill results once status is COMPLETED.
   * Directly queries the Spring Boot gateway API: GET /api/v1/assessments/{id}/result
   * @param {string} assessmentId - UUID of the completed assessment.
   * @returns {Promise<AssessmentResultView>}
   */
  async getResult(assessmentId) {
    return apiClient(`/api/v1/assessments/${assessmentId}/result`, {
      method: 'GET',
    });
  },
};
