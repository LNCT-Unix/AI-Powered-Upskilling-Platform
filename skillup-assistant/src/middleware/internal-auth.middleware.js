import { createHash, timingSafeEqual } from 'node:crypto';
import { AppError } from '../utils/errors.js';

const digest = (value) => createHash('sha256').update(String(value)).digest();

/**
 * Optional shared-secret check for service-to-service calls (Spring Boot -> this service).
 * Disabled when INTERNAL_API_KEY is not configured. Entirely separate from the Lyzr key.
 */
export function createInternalAuth(config) {
  if (!config.internalApiKey) return (_req, _res, next) => next();

  const expected = digest(config.internalApiKey);
  return (req, _res, next) => {
    const provided = req.get('x-internal-api-key');
    if (provided && timingSafeEqual(digest(provided), expected)) return next();
    return next(new AppError('UNAUTHORIZED', 401, 'Missing or invalid service credentials.'));
  };
}
