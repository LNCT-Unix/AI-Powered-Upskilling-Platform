import { apiClient } from './api';

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
   * Request real-time text feedback for an assessment answer.
   * Routes through Spring Boot gateway with an automatic direct fallback to
   * skillup-assistant if the gateway encounters an upstream communication error.
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
   * @returns {Promise<{isCorrect: boolean, feedback: {reaction: string, conceptReinforcement: string, bonusTip: string, speechText: string}}>}
   */
  async getVoiceFeedback(params) {
    try {
      return await apiClient('/api/v1/assessments/voice-feedback', {
        method: 'POST',
        body: params,
      });
    } catch (err) {
      console.warn('Gateway voice feedback failed, falling back to direct assistant:', err?.message || err);
      const res = await fetch(`${ASSISTANT_BASE_URL}/api/assessment/voice-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const directErr = await res.json().catch(() => ({}));
        throw new Error(directErr?.error?.message || `Voice feedback failed with HTTP ${res.status}`, { cause: err });
      }

      return res.json();
    }
  },
};
