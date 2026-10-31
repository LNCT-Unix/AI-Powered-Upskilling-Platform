import { describe, expect, it } from 'vitest';
import { ConfigError, loadEnv } from '../src/config/env.js';
import { TEST_ENV } from './helpers.js';

describe('loadEnv', () => {
  it('fails with a clear ConfigError when required variables are missing', () => {
    let error;
    try {
      loadEnv({});
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(ConfigError);
    const text = error.problems.join('\n');
    expect(text).toContain('LYZR_API_KEY');
    expect(text).toContain('LYZR_AGENT_ID');
    expect(text).toContain('LYZR_API_BASE_URL');
  });

  it('rejects untouched .env.example placeholders', () => {
    expect(() => loadEnv({ ...TEST_ENV, LYZR_API_KEY: 'replace_with_your_lyzr_api_key' })).toThrow(ConfigError);
    expect(() => loadEnv({ ...TEST_ENV, OPENROUTER_API_KEY: 'replace_with_your_openrouter_api_key' })).toThrow(ConfigError);
  });

  it('never includes secret values in the error', () => {
    try {
      loadEnv({ ...TEST_ENV, LYZR_API_BASE_URL: 'not-a-url' });
    } catch (err) {
      expect(err.message).not.toContain(TEST_ENV.LYZR_API_KEY);
      return;
    }
    throw new Error('expected loadEnv to throw');
  });

  it('rejects a too-short internal key and non-https Lyzr URL in production', () => {
    expect(() => loadEnv({ ...TEST_ENV, INTERNAL_API_KEY: 'short' })).toThrow(ConfigError);
    expect(() => loadEnv({ ...TEST_ENV, NODE_ENV: 'production', LYZR_API_BASE_URL: 'http://lyzr.test/v3' })).toThrow(ConfigError);
    expect(() => loadEnv({ ...TEST_ENV, NODE_ENV: 'production', OPENROUTER_BASE_URL: 'http://openrouter.test/v1' })).toThrow(ConfigError);
  });

  it('applies defaults, treats empty strings as unset and normalizes the base URL', () => {
    const config = loadEnv({
      NODE_ENV: 'test',
      LYZR_API_KEY: 'k',
      LYZR_AGENT_ID: 'a',
      LYZR_API_BASE_URL: 'https://lyzr.test/v3/',
      INTERNAL_API_KEY: '',
      FRONTEND_ORIGIN: '',
    });
    expect(config.port).toBe(3002);
    expect(config.requestTimeoutMs).toBe(30000);
    expect(config.maxMessageLength).toBe(4000);
    expect(config.internalApiKey).toBeNull();
    expect(config.corsOrigins).toEqual([]);
    expect(config.lyzr.baseUrl).toBe('https://lyzr.test/v3');
    expect(config.openRouter.baseUrl).toBe('https://openrouter.ai/api/v1');
    expect(config.openRouter.model).toBe('meta-llama/llama-3.3-70b-instruct');
    expect(config.openRouter.apiKey).toBeNull();
    expect(config.tts.provider).toBe('google-translate');
  });

  it('parses a comma-separated list of CORS origins', () => {
    const config = loadEnv({ ...TEST_ENV, FRONTEND_ORIGIN: 'http://a.test, http://b.test' });
    expect(config.corsOrigins).toEqual(['http://a.test', 'http://b.test']);
  });
});
