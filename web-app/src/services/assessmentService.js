import { apiClient } from './api';

// Fixed UUID for Backend Engineering track matching backend seed
export const BACKEND_TRACK_ID = '00000000-0000-0000-0000-000000000001';

/**
 * @deprecated Legacy mapping kept for temporary backward compatibility during step-by-step migration.
 */
export const TRACK_UUID_MAP = {
  backend: BACKEND_TRACK_ID,
  fullstack: BACKEND_TRACK_ID,
  'ai-data': BACKEND_TRACK_ID,
  devops: BACKEND_TRACK_ID,
};

const tracksCache = new Map();
const skillsCache = new Map();

/**
 * Ensures a valid UUID is returned for track references.
 * @param {string} id - Track slug or UUID.
 * @returns {string}
 */
export function normalizeTrackId(id) {
  if (!id) return BACKEND_TRACK_ID;
  if (TRACK_UUID_MAP[id]) return TRACK_UUID_MAP[id];
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  return isUUID ? id : BACKEND_TRACK_ID;
}

export const assessmentService = {
  /**
   * Fetch all active learning tracks for the onboarding dropdown.
   * Endpoint: GET /api/v1/assessments/tracks
   * @returns {Promise<Array<{trackId: string, slug: string, name: string}>>}
   */
  async getTracks() {
    if (!tracksCache.has('all')) {
      const request = apiClient('/api/v1/assessments/tracks', {
        method: 'GET',
      }).catch((error) => {
        tracksCache.delete('all');
        throw error;
      });
      tracksCache.set('all', request);
    }
    return tracksCache.get('all');
  },

  /**
   * Fetch all skills of a given track for the onboarding pre-selection checklist.
   * Endpoint: GET /api/v1/assessments/tracks/{trackId}/skills
   * @param {string} trackId - UUID of the track.
   * @returns {Promise<Array<{skillId: string, slug: string, name: string, cluster: string, difficulty: number}>>}
   */
  async getSkillsForTrack(trackId) {
    if (!trackId) {
      throw new Error('Track ID is required');
    }
    if (!skillsCache.has(trackId)) {
      const request = apiClient(`/api/v1/assessments/tracks/${trackId}/skills`, {
        method: 'GET',
      }).catch((error) => {
        skillsCache.delete(trackId);
        throw error;
      });
      skillsCache.set(trackId, request);
    }
    return skillsCache.get(trackId);
  },

  /**
   * Start a new assessment (or resume existing active test) with initial theta = 0.0.
   * Learner-declared known skills are passed to calibrate the test and graph unlock.
   * Endpoint: POST /api/v1/assessments
   * @param {string} trackId - UUID of the learning track.
   * @param {string[]} [knownSkillSlugs=[]] - Slugs of skills the user is comfortable with.
   * @returns {Promise<AssessmentState>}
   */
  async startAssessment(trackId, knownSkillSlugs = []) {
    if (!trackId) {
      throw new Error('Track ID is required');
    }
    return apiClient('/api/v1/assessments', {
      method: 'POST',
      body: {
        trackId,
        knownSkillSlugs: Array.isArray(knownSkillSlugs) ? knownSkillSlugs : [],
      },
    });
  },

  /**
   * Backward-compatible alias for starting or resuming tests.
   * @param {string} trackId - Track slug or UUID.
   * @param {string[]} [knownSkillSlugs=[]] - Optional declared skills.
   * @returns {Promise<AssessmentState>}
   */
  async startOrResume(trackId, knownSkillSlugs = []) {
    const validTrackId = normalizeTrackId(trackId);
    return this.startAssessment(validTrackId, knownSkillSlugs);
  },

  /**
   * Fetch current state by assessment ID (for page reloads or active sessions).
   * Endpoint: GET /api/v1/assessments/{id}
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
   * Endpoint: POST /api/v1/assessments/{id}/responses
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
   * Retrieve legacy summary result once status is COMPLETED.
   * Endpoint: GET /api/v1/assessments/{id}/result
   * @param {string} assessmentId - UUID of the completed assessment.
   * @returns {Promise<AssessmentResultView>}
   */
  async getResult(assessmentId) {
    return apiClient(`/api/v1/assessments/${assessmentId}/result`, {
      method: 'GET',
    });
  },

  /**
   * Retrieve the full comprehensive post-assessment report once COMPLETED.
   * Includes per-question answer breakdown (answers given, correct answers, skill tested)
   * and the unlocked skills list to update the competency graph.
   * Endpoint: GET /api/v1/assessments/{id}/report
   * @param {string} assessmentId - UUID of the completed assessment.
   * @returns {Promise<AssessmentReport>}
   */
  async getReport(assessmentId) {
    if (!assessmentId) {
      throw new Error('Assessment ID is required');
    }
    return apiClient(`/api/v1/assessments/${assessmentId}/report`, {
      method: 'GET',
    });
  },

  /**
   * Retrieve the list of all previously taken diagnostic tests for the authenticated user.
   * Endpoint: GET /api/v1/assessments/history
   * @returns {Promise<Array<{assessmentId: string, trackId: string, trackName: string, status: string, level: string, theta: number, itemsAdministered: number, correctCount: number, accuracyPct: number, stopReason: string, completedAt: string}>>}
   */
  async getHistory() {
    return apiClient('/api/v1/assessments/history', {
      method: 'GET',
    });
  },

  /**
   * Fetch 5 questions served all together directly to unlock a specific skill node.
   * Endpoint: GET /api/v1/assessments/skills/{skillSlug}/quiz
   * @param {string} skillSlug - Human-readable unique skill slug (e.g. 'sql-joins-aggregation').
   * @returns {Promise<{skillSlug: string, skillName: string, totalQuestions: number, passingScore: number, questions: Array<{itemId: string, questionNumber: number, stem: string, options: string[]}>}>}
   */
  async getSkillQuiz(skillSlug) {
    if (!skillSlug) {
      throw new Error('Skill slug is required');
    }
    return apiClient(`/api/v1/assessments/skills/${encodeURIComponent(skillSlug)}/quiz`, {
      method: 'GET',
    });
  },

  /**
   * Submit all 5 answers for a skill unlock quiz.
   * If the user answers at least 3/5 correctly, the node is marked as ready to learn and unlocked.
   * Endpoint: POST /api/v1/assessments/skills/{skillSlug}/quiz/submit
   * @param {string} skillSlug - Skill slug being unlocked.
   * @param {Array<{itemId: string, selectedOption: number}>} answers - List of 5 answers.
   * @param {string|null} [assessmentId=null] - Optional current assessment ID.
   * @returns {Promise<{passed: boolean, score: number, total: number, passingScore: number, skillSlug: string, newState: string, message: string, breakdown: Array}>}
   */
  async submitSkillQuiz(skillSlug, answers, assessmentId = null) {
    if (!skillSlug) {
      throw new Error('Skill slug is required');
    }
    return apiClient(`/api/v1/assessments/skills/${encodeURIComponent(skillSlug)}/quiz/submit`, {
      method: 'POST',
      body: {
        assessmentId,
        answers: Array.isArray(answers) ? answers : [],
      },
    });
  },
};
