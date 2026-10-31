/**
 * Error with a stable machine-readable code and an HTTP status.
 * `message` is always safe to show to clients; put sensitive context in `logContext`
 * (which is only ever written to server logs, never returned).
 */
export class AppError extends Error {
  constructor(code, status, message, { details, logContext } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.logContext = logContext;
  }
}
