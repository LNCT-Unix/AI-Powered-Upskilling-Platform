import { apiClient, getApiBaseUrl } from './api';

const ASSISTANT_BASE_URL = (
  import.meta.env.VITE_ASSISTANT_API_URL || 'http://localhost:3002'
).replace(/\/+$/, '');

export const assistantService = {
  /**
   * Sends a message to the Lyzr-powered AI Platform Guide chatbot.
   * @param {string} message - User query text.
   * @param {string|null} conversationId - Optional conversation ID for multi-turn chats.
   * @returns {Promise<{conversationId: string, message: {content: string}}>}
   */
  async sendChatMessage(message, conversationId = null) {
    const res = await fetch(`${ASSISTANT_BASE_URL}/api/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Assistant failed with HTTP ${res.status}`);
    }

    return res.json();
  },

  /**
   * Request real-time AI Voice Companion feedback for an assessment answer.
   * Strictly communicates through the authenticated Spring Boot gateway.
   * No direct client fallback to prevent bypassing internal service authentication.
   *
   * @param {Object} params
   * @param {string} params.assessmentId
   * @param {string} params.questionId
   * @param {string} params.skill
   * @param {string} [params.topic]
   * @param {string} params.question
   * @param {string[]} params.options
   * @param {string} params.correctAnswer
   * @param {string} params.userAnswer
   * @param {boolean} params.isCorrect
   * @param {string} [params.difficultyLevel]
   * @returns {Promise<{isCorrect: boolean, feedback: {reaction: string, conceptReinforcement: string, bonusTip: string, speechText: string}, audio: {available: boolean, url: string}}>}
   */
  async getVoiceFeedback(params) {
    return apiClient('/api/v1/assessments/voice-feedback', {
      method: 'POST',
      body: params,
    });
  },

  /**
   * Resolves audio URL for browser audio streaming.
   * Relative paths are routed through the Spring Boot gateway.
   *
   * @param {string} relativeUrl
   * @returns {string}
   */
  getAudioUrl(relativeUrl) {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    const gatewayBaseUrl = getApiBaseUrl();
    return `${gatewayBaseUrl}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
  },
};
