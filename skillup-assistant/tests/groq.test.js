import { describe, expect, it, vi } from 'vitest';
import { createGroqService } from '../src/services/groq.service.js';
import { AppError } from '../src/utils/errors.js';
import { GROQ_TEST_KEY, hangingFetch, jsonResponse, TEST_ENV } from './helpers.js';
import { loadEnv } from '../src/config/env.js';

const VALID_FEEDBACK_DATA = {
  reaction: 'Great job!',
  conceptReinforcement: 'Polymorphism allows objects to take multiple forms.',
  bonusTip: 'Use interfaces for loose coupling in production.',
  speechText: 'Great job! Polymorphism allows objects to take multiple forms. Use interfaces for loose coupling in production.',
};

const REQUEST_PARAMS = {
  skill: 'Java',
  topic: 'OOP',
  question: 'What is polymorphism?',
  options: ['A', 'B'],
  correctAnswer: 'A',
  userAnswer: 'A',
  isCorrect: true,
  difficultyLevel: 'INTERMEDIATE',
};

describe('GroqService', () => {
  it('successfully generates structured feedback using native JSON response', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        id: 'chatcmpl_123',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify(VALID_FEEDBACK_DATA),
            },
          },
        ],
      }),
    );

    const config = loadEnv(TEST_ENV);
    const service = createGroqService(config, fetchMock);
    const result = await service.generateFeedback(REQUEST_PARAMS);

    expect(result).toEqual(VALID_FEEDBACK_DATA);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(options.headers.Authorization).toBe(`Bearer ${GROQ_TEST_KEY}`);
    expect(options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body.model).toBe('openai/gpt-oss-20b');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[1].content).toContain('CORRECT');
  });

  it('unwraps markdown code fences if returned by the LLM', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        choices: [
          {
            message: {
              role: 'assistant',
              content: `\`\`\`json\n${JSON.stringify(VALID_FEEDBACK_DATA)}\n\`\`\``,
            },
          },
        ],
      }),
    );

    const config = loadEnv(TEST_ENV);
    const service = createGroqService(config, fetchMock);
    const result = await service.generateFeedback(REQUEST_PARAMS);

    expect(result).toEqual(VALID_FEEDBACK_DATA);
  });

  it('maps 429 to LLM_RATE_LIMITED', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ error: 'rate limited' }, 429));
    const config = loadEnv(TEST_ENV);
    const service = createGroqService(config, fetchMock);

    await expect(service.generateFeedback(REQUEST_PARAMS)).rejects.toMatchObject({
      code: 'LLM_RATE_LIMITED',
      status: 429,
    });
  });

  it('maps 401/403 to LLM_AUTH_FAILED without leaking API key', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, 401));
    const config = loadEnv(TEST_ENV);
    const service = createGroqService(config, fetchMock);

    let caught;
    try {
      await service.generateFeedback(REQUEST_PARAMS);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(AppError);
    expect(caught.code).toBe('LLM_AUTH_FAILED');
    expect(caught.status).toBe(502);
    expect(JSON.stringify(caught)).not.toContain(GROQ_TEST_KEY);
  });

  it('maps timeouts to LLM_TIMEOUT (504)', async () => {
    const config = loadEnv({ ...TEST_ENV, REQUEST_TIMEOUT_MS: '20' });
    const service = createGroqService(config, hangingFetch);

    await expect(service.generateFeedback(REQUEST_PARAMS)).rejects.toMatchObject({
      code: 'LLM_TIMEOUT',
      status: 504,
    });
  });

  it('rejects malformed non-JSON output with LLM_INVALID_RESPONSE (502)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        choices: [{ message: { role: 'assistant', content: 'not valid json' } }],
      }),
    );
    const config = loadEnv(TEST_ENV);
    const service = createGroqService(config, fetchMock);

    await expect(service.generateFeedback(REQUEST_PARAMS)).rejects.toMatchObject({
      code: 'LLM_INVALID_RESPONSE',
      status: 502,
    });
  });

  it('rejects payload missing required schema keys with LLM_INVALID_RESPONSE (502)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({ reaction: 'Good job!' }),
            },
          },
        ],
      }),
    );
    const config = loadEnv(TEST_ENV);
    const service = createGroqService(config, fetchMock);

    await expect(service.generateFeedback(REQUEST_PARAMS)).rejects.toMatchObject({
      code: 'LLM_INVALID_RESPONSE',
      status: 502,
    });
  });
});

