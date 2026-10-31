import { vi } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createAudioStore } from '../src/services/audio-store.service.js';
import { createFeedbackService } from '../src/services/feedback.service.js';
import { createLyzrService } from '../src/services/lyzr.service.js';
import { createOpenRouterService } from '../src/services/openrouter.service.js';
import { createTtsService } from '../src/services/tts.service.js';

export const LYZR_TEST_KEY = 'test-lyzr-secret-key';
export const OPENROUTER_TEST_KEY = 'test-openrouter-secret-key';

export const TEST_ENV = {
  NODE_ENV: 'test',
  LYZR_API_KEY: LYZR_TEST_KEY,
  LYZR_AGENT_ID: 'agent_test_123',
  LYZR_API_BASE_URL: 'https://lyzr.test/v3',
  OPENROUTER_API_KEY: OPENROUTER_TEST_KEY,
  OPENROUTER_MODEL: 'test-model',
  OPENROUTER_BASE_URL: 'https://openrouter.test/v1',
  TTS_PROVIDER: 'mock',
  REQUEST_TIMEOUT_MS: '200',
  MAX_MESSAGE_LENGTH: '50',
  RATE_LIMIT_MAX: '100',
};

/** Builds the real app wired to a mocked upstream `fetch` — no network, no credentials needed. */
export function buildApp({ env = {}, fetchImpl, feedbackService, audioStore } = {}) {
  const config = loadEnv({ ...TEST_ENV, ...env });
  const fetchMock = fetchImpl ?? vi.fn();
  const resolvedAudioStore = audioStore ?? createAudioStore({ ttlMs: config.tts?.cacheTtlMs });
  const resolvedFeedbackService =
    feedbackService ??
    createFeedbackService({
      openRouterService: createOpenRouterService(config, fetchMock),
      ttsService: createTtsService(config, { fetchImpl: fetchMock, audioStore: resolvedAudioStore }),
    });

  const app = createApp({
    config,
    lyzrService: createLyzrService(config, fetchMock),
    feedbackService: resolvedFeedbackService,
    audioStore: resolvedAudioStore,
  });

  return {
    app,
    config,
    fetchMock,
    audioStore: resolvedAudioStore,
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
