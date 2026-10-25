import { apiClient } from './api';

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

// Mock adaptive session for standalone development without running Spring Boot gateway
const MOCK_ASSESSMENT_STATE = {
  assessmentId: 'mock-assessment-uuid-1234',
  status: 'IN_PROGRESS',
  done: false,
  question: {
    itemId: 'mock-item-1',
    stem: 'What is the primary difference between a process and a thread in modern operating systems?',
    options: [
      'Processes share memory by default, threads do not',
      'Threads share the same address space of their process, while processes have isolated address spaces',
      'Threads have separate page tables, processes do not',
      'Processes cannot spawn threads',
    ],
  },
  answered: 0,
  max: 9,
  progress: {
    answered: 0,
    max: 9,
  },
};

const MOCK_RESULT = {
  assessmentId: 'mock-assessment-uuid-1234',
  level: 'INTERMEDIATE',
  theta: 0.35,
  answered: 7,
  correct: 5,
  skills: [
    {
      skillId: 's1',
      name: 'HTTP / REST API Fundamentals',
      cluster: 'Web Protocols',
      state: 'MASTERED',
    },
    {
      skillId: 's2',
      name: 'Database Indexing & B-Trees',
      cluster: 'Storage Engines',
      state: 'MASTERED',
    },
    {
      skillId: 's3',
      name: 'Distributed Caching with Redis',
      cluster: 'System Architecture',
      state: 'FRONTIER',
    },
    {
      skillId: 's4',
      name: 'Consensus Protocols & Paxos',
      cluster: 'System Architecture',
      state: 'LOCKED',
    },
  ],
};

export const assessmentService = {
  /**
   * Start a new test or resume an existing active one for a track.
   * @param {string} trackId - UUID of the learning track.
   * @returns {Promise<import('./types').AssessmentState>}
   */
  async startOrResume(trackId) {
    if (USE_MOCK_AUTH) {
      return MOCK_ASSESSMENT_STATE;
    }
    return apiClient('/api/v1/assessments', {
      method: 'POST',
      body: { trackId },
    });
  },

  /**
   * Fetch current state by assessment ID (for page reloads or active sessions).
   * @param {string} assessmentId - UUID of the assessment.
   * @returns {Promise<import('./types').AssessmentState>}
   */
  async getState(assessmentId) {
    if (USE_MOCK_AUTH) {
      return MOCK_ASSESSMENT_STATE;
    }
    return apiClient(`/api/v1/assessments/${assessmentId}`, {
      method: 'GET',
    });
  },

  /**
   * Submit an answer to the current question.
   * @param {string} assessmentId - UUID of the assessment.
   * @param {string} itemId - UUID of the current question.
   * @param {number} selectedOption - 0-indexed integer corresponding to choice.
   * @returns {Promise<import('./types').AssessmentState>}
   */
  async submitAnswer(assessmentId, itemId, selectedOption) {
    if (USE_MOCK_AUTH) {
      return {
        ...MOCK_ASSESSMENT_STATE,
        answered: 1,
        progress: { answered: 1, max: 9 },
      };
    }
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
   * @returns {Promise<import('./types').AssessmentResultView>}
   */
  async getResult(assessmentId) {
    if (USE_MOCK_AUTH) {
      return MOCK_RESULT;
    }
    return apiClient(`/api/v1/assessments/${assessmentId}/result`, {
      method: 'GET',
    });
  },
};
