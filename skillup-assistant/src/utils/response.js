import { randomUUID } from 'node:crypto';

export const SERVICE_NAME = 'skillup-assistant';

export function healthBody() {
  return { success: true, service: SERVICE_NAME, status: 'healthy' };
}

export function errorBody(code, message, details) {
  return {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
}

export function newMessageId() {
  return `msg_${randomUUID().replace(/-/g, '')}`;
}

export function buildChatSuccess({ conversationId, content }) {
  return {
    success: true,
    conversationId,
    message: {
      id: newMessageId(),
      role: 'assistant',
      content,
      format: 'text',
      suggestions: [],
    },
    metadata: {
      // Lyzr's documented response contains only the answer text, so neither the
      // model nor knowledge-base attribution can be verified per answer.
      source: 'lyzr_agent',
      model: null,
    },
  };
}
