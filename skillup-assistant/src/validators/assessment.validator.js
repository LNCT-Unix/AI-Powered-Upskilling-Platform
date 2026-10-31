import { z } from 'zod';
import { AppError } from '../utils/errors.js';

export const AUDIO_ID_PATTERN = /^aud_[a-zA-Z0-9_-]{10,64}$/;

export const assessmentFeedbackRequestSchema = z.object({
  assessmentId: z
    .string({ required_error: 'assessmentId is required' })
    .trim()
    .min(1, 'assessmentId must not be empty')
    .max(128, 'assessmentId must be at most 128 characters'),
  questionId: z
    .string({ required_error: 'questionId is required' })
    .trim()
    .min(1, 'questionId must not be empty')
    .max(128, 'questionId must be at most 128 characters'),
  skill: z
    .string({ required_error: 'skill is required' })
    .trim()
    .min(1, 'skill must not be empty')
    .max(100, 'skill must be at most 100 characters'),
  topic: z
    .string()
    .trim()
    .max(100, 'topic must be at most 100 characters')
    .optional(),
  question: z
    .string({ required_error: 'question is required' })
    .trim()
    .min(1, 'question must not be empty')
    .max(2000, 'question must be at most 2000 characters'),
  options: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'options elements must not be empty')
        .max(1000, 'options elements must be at most 1000 characters'),
      { required_error: 'options is required' },
    )
    .min(2, 'options must contain at least 2 items')
    .max(10, 'options must contain at most 10 items'),
  correctAnswer: z
    .string({ required_error: 'correctAnswer is required' })
    .trim()
    .min(1, 'correctAnswer must not be empty')
    .max(1000, 'correctAnswer must be at most 1000 characters'),
  userAnswer: z
    .string({ required_error: 'userAnswer is required' })
    .trim()
    .min(1, 'userAnswer must not be empty')
    .max(1000, 'userAnswer must be at most 1000 characters'),
  isCorrect: z.boolean({
    required_error: 'isCorrect is required',
    invalid_type_error: 'isCorrect must be a boolean',
  }),
  difficultyLevel: z
    .string()
    .trim()
    .max(50, 'difficultyLevel must be at most 50 characters')
    .optional(),
  difficultyDescription: z
    .never({
      invalid_type_error: 'difficultyDescription is no longer accepted. The voice companion reacts to all answers without requiring student confusion input.',
    })
    .optional(),
});

// Validates structured JSON returned by LLM for the voice companion response
export const llmFeedbackSchema = z.object({
  reaction: z.string().trim().min(1).max(300),
  conceptReinforcement: z.string().trim().min(1).max(1000),
  bonusTip: z.string().trim().min(1).max(1000),
  speechText: z.string().trim().min(1).max(2000),
});

export const audioAvailableSchema = z.object({
  available: z.literal(true),
  contentType: z.literal('audio/mpeg'),
  url: z.string().min(1),
});

export const audioUnavailableSchema = z.object({
  available: z.literal(false),
  message: z.string().min(1),
});

export const audioInfoSchema = z.discriminatedUnion('available', [
  audioAvailableSchema,
  audioUnavailableSchema,
]);

// Final API response validation
export const voiceFeedbackResponseSchema = z.object({
  success: z.literal(true),
  assessmentId: z.string().min(1),
  questionId: z.string().min(1),
  isCorrect: z.boolean(),
  feedback: llmFeedbackSchema,
  audio: audioInfoSchema,
});

export function toValidationError(zodError) {
  const details = zodError.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
  return new AppError('VALIDATION_ERROR', 400, 'The request is invalid.', { details });
}
