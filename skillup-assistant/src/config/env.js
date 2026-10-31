import { z } from 'zod';

export class ConfigError extends Error {
  constructor(problems) {
    super(`Invalid configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'ConfigError';
    this.problems = problems;
  }
}

const PLACEHOLDER = /^replace_with/i;
const notPlaceholder = (v) => !PLACEHOLDER.test(v);
const PLACEHOLDER_MSG = 'is still set to the .env.example placeholder';

const intWithDefault = (min, max, def) => z.coerce.number().int().min(min).max(max).default(def);

const envSchema = z.object({
  PORT: intWithDefault(1, 65535, 3002),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_ORIGIN: z.string().optional(),
  TRUST_PROXY: intWithDefault(0, 10, 0),

  LYZR_API_KEY: z.string().min(1).refine(notPlaceholder, PLACEHOLDER_MSG),
  LYZR_AGENT_ID: z.string().min(1).refine(notPlaceholder, PLACEHOLDER_MSG),
  LYZR_API_BASE_URL: z.string().url().refine(notPlaceholder, PLACEHOLDER_MSG),
  LYZR_USER_ID: z.string().min(1).max(128).default('skillup-web-visitor'),

  INTERNAL_API_KEY: z.string().min(16, 'must be at least 16 characters').optional(),

  OPENROUTER_API_KEY: z.string().min(1).refine(notPlaceholder, PLACEHOLDER_MSG).optional(),
  OPENROUTER_MODEL: z.string().min(1).default('meta-llama/llama-3.3-70b-instruct'),
  OPENROUTER_BASE_URL: z.string().url().refine(notPlaceholder, PLACEHOLDER_MSG).default('https://openrouter.ai/api/v1'),

  TTS_PROVIDER: z.enum(['google-translate', 'openai', 'elevenlabs', 'mock', 'none']).default('google-translate'),
  OPENAI_API_KEY: z.string().min(1).refine(notPlaceholder, PLACEHOLDER_MSG).optional(),
  OPENAI_TTS_MODEL: z.string().min(1).default('tts-1'),
  OPENAI_TTS_VOICE: z.string().min(1).default('alloy'),
  ELEVENLABS_API_KEY: z.string().min(1).refine(notPlaceholder, PLACEHOLDER_MSG).optional(),
  ELEVENLABS_VOICE_ID: z.string().min(1).default('21m00Tcm4TlvDq8ikWAM'),
  AUDIO_CACHE_TTL_MS: intWithDefault(10000, 86400000, 900000),

  REQUEST_TIMEOUT_MS: intWithDefault(1, 120000, 30000),
  MAX_MESSAGE_LENGTH: intWithDefault(1, 20000, 4000),
  REQUEST_BODY_LIMIT: z.string().min(1).default('16kb'),
  RATE_LIMIT_WINDOW_MS: intWithDefault(1000, 3600000, 60000),
  RATE_LIMIT_MAX: intWithDefault(1, 10000, 20),
});

/**
 * Validates environment variables and returns a normalized config object.
 * Throws ConfigError listing every problem (variable names only, never values).
 */
export function loadEnv(source = process.env) {
  // Treat empty strings (e.g. "INTERNAL_API_KEY=") as "not set".
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, v]) => v !== undefined && v !== ''),
  );

  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    throw new ConfigError(
      result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    );
  }

  const env = result.data;
  const baseUrl = env.LYZR_API_BASE_URL.replace(/\/+$/, '');
  const openRouterBaseUrl = env.OPENROUTER_BASE_URL.replace(/\/+$/, '');

  if (env.NODE_ENV === 'production' && !baseUrl.startsWith('https://')) {
    throw new ConfigError(['LYZR_API_BASE_URL: must use https in production']);
  }
  if (env.NODE_ENV === 'production' && !openRouterBaseUrl.startsWith('https://')) {
    throw new ConfigError(['OPENROUTER_BASE_URL: must use https in production']);
  }

  return Object.freeze({
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    corsOrigins: (env.FRONTEND_ORIGIN ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    trustProxy: env.TRUST_PROXY,
    lyzr: Object.freeze({
      apiKey: env.LYZR_API_KEY,
      agentId: env.LYZR_AGENT_ID,
      baseUrl,
      userId: env.LYZR_USER_ID,
    }),
    openRouter: Object.freeze({
      apiKey: env.OPENROUTER_API_KEY ?? null,
      model: env.OPENROUTER_MODEL,
      baseUrl: openRouterBaseUrl,
    }),
    tts: Object.freeze({
      provider: env.TTS_PROVIDER,
      openaiApiKey: env.OPENAI_API_KEY ?? null,
      openaiModel: env.OPENAI_TTS_MODEL,
      openaiVoice: env.OPENAI_TTS_VOICE,
      elevenlabsApiKey: env.ELEVENLABS_API_KEY ?? null,
      elevenlabsVoiceId: env.ELEVENLABS_VOICE_ID,
      cacheTtlMs: env.AUDIO_CACHE_TTL_MS,
    }),
    internalApiKey: env.INTERNAL_API_KEY ?? null,
    requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    maxMessageLength: env.MAX_MESSAGE_LENGTH,
    bodyLimit: env.REQUEST_BODY_LIMIT,
    rateLimit: Object.freeze({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX }),
  });
}
