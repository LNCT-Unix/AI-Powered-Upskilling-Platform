import { vi } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createFeedbackService } from '../src/services/feedback.service.js';
import { createGroqService } from '../src/services/groq.service.js';

export const GROQ_TEST_KEY = 'test-groq-secret-key';

export const TEST_ENV = {
  NODE_ENV: 'test',
  GROQ_API_KEY: GROQ_TEST_KEY,
  GROQ_MODEL: 'openai/gpt-oss-20b',
  GROQ_BASE_URL: 'https://api.groq.com/openai/v1',
  REQUEST_TIMEOUT_MS: '200',
  MAX_MESSAGE_LENGTH: '50',
  RATE_LIMIT_MAX: '100',
};

/** Builds the real app wired to a mocked upstream `fetch` — no network, no credentials needed. */
export function buildApp({ env = {}, fetchImpl, feedbackService, groqService } = {}) {
  const config = loadEnv({ ...TEST_ENV, ...env });
  const fetchMock = fetchImpl ?? vi.fn();
  const resolvedGroqService = groqService ?? createGroqService(config, fetchMock);
  const resolvedFeedbackService =
    feedbackService ??
    createFeedbackService({
      groqService: resolvedGroqService,
    });

  const app = createApp({
    config,
    groqService: resolvedGroqService,
    feedbackService: resolvedFeedbackService,
  });

  return {
    app,
    config,
    fetchMock,
    groqService: resolvedGroqService,
    feedbackService: resolvedFeedbackService,
  };
}

export const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A fetch that never answers but honours AbortSignal, like the real one. */
export const hangingFetch = (_url, { signal }) =>
  new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason));
  });
