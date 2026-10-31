import { randomUUID } from 'node:crypto';

// Format: "conv_" + 32 lowercase hex chars (a UUID without dashes).
export const CONVERSATION_ID_PATTERN = /^conv_[a-f0-9]{32}$/;

export function newConversationId() {
  return `conv_${randomUUID().replace(/-/g, '')}`;
}

/**
 * Lyzr's docs show session IDs shaped like "<agentId>-<random>". The session ID is
 * derived deterministically from our conversationId, so no server-side storage is
 * needed and the same conversationId always maps to the same Lyzr session.
 * Clients can only supply IDs matching CONVERSATION_ID_PATTERN, so they cannot
 * inject arbitrary session identifiers.
 */
export function toLyzrSessionId(agentId, conversationId) {
  return `${agentId}-${conversationId.slice('conv_'.length)}`;
}
