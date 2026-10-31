import rateLimit from 'express-rate-limit';
import { errorBody } from '../utils/response.js';

/**
 * Per-client limiter for the chat endpoint (keyed by req.ip).
 * Note: in-memory counters are per process. This reduces casual abuse and cost
 * runaway; it is not complete protection against abuse or prompt injection.
 */
export function createChatRateLimiter(config) {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(errorBody('RATE_LIMITED', 'Too many requests. Please wait a moment and try again.'));
    },
  });
}
