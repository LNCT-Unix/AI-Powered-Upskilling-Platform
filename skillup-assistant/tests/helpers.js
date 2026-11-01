import { vi } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createFeedbackService } from '../src/services/feedback.service.js';
import { createLyzrService } from '../src/services/lyzr.service.js';
import { createGroqService } from '../src/services/groq.service.js';

export const LYZR_TEST_KEY = 'test-lyzr-secret-key';
export const GROQ_TEST_KEY = 'test-groq-secret-key';

export const TEST_ENV = {
  NODE_ENV: 'test',
  LYZR_API_KEY: LYZR_TEST_KEY,
  LYZR_AGENT_ID: 'agent_test_123',
  LYZR_API_BASE_URL: 'https://lyzr.test/v3',
  GROQ_API_KEY: GROQ_TEST_KEY,
  GROQ_MODEL: 'openai/gpt-oss-20b',
  GROQ_BASE_URL: 'https://api.groq.com/openai/v1',
  REQUEST_TIMEOUT_MS: '200',
  MAX_MESSAGE_LENGTH: '50',
  RATE_LIMIT_MAX: '100',
};

/** Builds the real app wired to a mocked upstream `fetch` — no network, no credentials needed. */
export function buildApp({ env = {}, fetchImpl, feedbackService } = {}) {
  const config = loadEnv({ ...TEST_ENV, ...env });
  const fetchMock = fetchImpl ?? vi.fn();
  const resolvedFeedbackService =
    feedbackService ??
    createFeedbackService({
      groqService: createGroqService(config, fetchMock),
    });

  const app = createApp({
    config,
    lyzrService: createLyzrService(config, fetchMock),
    feedbackService: resolvedFeedbackService,
  });

  return {
    app,
    config,
    fetchMock,
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
