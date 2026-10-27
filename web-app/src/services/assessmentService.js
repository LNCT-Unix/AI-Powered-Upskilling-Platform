import { apiClient } from './api';

export const assessmentService = {
  /**
   * Start a new test or resume an existing active one for a track.
   * @param {string} trackId - UUID of the learning track.
   * @returns {Promise<AssessmentState>}
   */
  async startOrResume(trackId) {
    return apiClient('/api/v1/assessments', {
      method: 'POST',
      body: { trackId },
    });
  },

  /**
   * Fetch current state by assessment ID (for page reloads or active sessions).
   * @param {string} assessmentId - UUID of the assessment.
   * @returns {Promise<AssessmentState>}
   */
  async getState(assessmentId) {
    return apiClient(`/api/v1/assessments/${assessmentId}`, {
      method: 'GET',
    });
  },

  /**
   * Submit an answer to the current question.
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
   * @param {string} assessmentId - UUID of the completed assessment.
   * @returns {Promise<AssessmentResultView>}
   */
  async getResult(assessmentId) {
    return apiClient(`/api/v1/assessments/${assessmentId}/result`, {
      method: 'GET',
    });
  },
};
