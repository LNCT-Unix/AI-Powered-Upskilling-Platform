// Minimal structured logger. Callers must only pass non-sensitive fields
// (codes, statuses, durations) — never message text, prompts or credentials.
const silent = process.env.NODE_ENV === 'test';

function write(level, event, fields = {}) {
  if (silent) return;
  const line = JSON.stringify({ time: new Date().toISOString(), level, event, ...fields });
  (level === 'error' ? console.error : console.log)(line);
}

export const logger = {
  info: (event, fields) => write('info', event, fields),
  warn: (event, fields) => write('warn', event, fields),
  error: (event, fields) => write('error', event, fields),
};
