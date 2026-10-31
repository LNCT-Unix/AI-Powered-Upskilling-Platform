import { z } from 'zod';
import { CONVERSATION_ID_PATTERN } from '../utils/conversation.js';
import { AppError } from '../utils/errors.js';

export function buildChatRequestSchema(maxMessageLength) {
  return z.object({
    message: z.string().trim().min(1, 'must not be empty').max(maxMessageLength, `must be at most ${maxMessageLength} characters`),
    conversationId: z.string().regex(CONVERSATION_ID_PATTERN, 'has an invalid format').nullish(),
  });
}

// Validates what this service sends back, so a coding mistake can never leak a malformed body.
export const chatResponseSchema = z.object({
  success: z.literal(true),
  conversationId: z.string().regex(CONVERSATION_ID_PATTERN),
  message: z.object({
    id: z.string().min(1),
    role: z.literal('assistant'),
    content: z.string().min(1),
    format: z.literal('text'),
    suggestions: z.array(z.string()),
  }),
  metadata: z.object({
    source: z.string().nullable(),
    model: z.string().nullable(),
  }),
});

// The ONLY shape accepted from Lyzr's documented chat response: { response: string }.
export const lyzrChatResponseSchema = z.object({
  response: z.string().trim().min(1),
});

export function toValidationError(zodError) {
  const details = zodError.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
  return new AppError('VALIDATION_ERROR', 400, 'The request is invalid.', { details });
}
