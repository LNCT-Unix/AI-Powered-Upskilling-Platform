import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { errorBody } from '../utils/response.js';

export function notFoundHandler(_req, res) {
  res.status(404).json(errorBody('NOT_FOUND', 'Resource not found.'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Errors raised by express.json(): malformed JSON / body too large.
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json(errorBody('INVALID_JSON', 'The request body is not valid JSON.'));
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json(errorBody('PAYLOAD_TOO_LARGE', 'The request body is too large.'));
  }

  if (err instanceof AppError) {
    // Log the code and non-sensitive context only; never message text or credentials.
    if (err.status >= 500) {
      logger.error('request.failed', { code: err.code, status: err.status, ...err.logContext });
    }
    return res.status(err.status).json(errorBody(err.code, err.message, err.details));
  }

  logger.error('request.unhandled_error', { errorName: err?.name });
  return res.status(500).json(errorBody('INTERNAL_ERROR', 'Something went wrong. Please try again later.'));
}
