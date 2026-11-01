import { describe, expect, it, vi } from 'vitest';
import { createGroqService, OCTO_CHAT_SYSTEM_PROMPT } from '../src/services/groq.service.js';
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

describe('GroqService — Assessment Feedback', () => {
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

describe('GroqService — Octo Chatbot', () => {
  it('generates chat responses and preserves conversation history across turns', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [{ message: { role: 'assistant', content: 'Hello! I am Octo 🐙' } }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [{ message: { role: 'assistant', content: 'You can test your skills on the assessment page!' } }],
        }),
      );

    const config = loadEnv(TEST_ENV);
    const service = createGroqService(config, fetchMock);

    // Turn 1
    const res1 = await service.chat({ message: 'Hi there', sessionId: 'conv_123' });
    expect(res1.content).toBe('Hello! I am Octo 🐙');

    // Turn 2
    const res2 = await service.chat({ message: 'How do I start?', sessionId: 'conv_123' });
    expect(res2.content).toBe('You can test your skills on the assessment page!');

    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Verify turn 2 included turn 1 history in the prompt
    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondCallBody.messages).toHaveLength(4); // system, user(1), assistant(1), user(2)
    expect(secondCallBody.messages[1].content).toBe('Hi there');
    expect(secondCallBody.messages[2].content).toBe('Hello! I am Octo 🐙');
    expect(secondCallBody.messages[3].content).toBe('How do I start?');
  });

  it('handles empty chat choices with 502', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ choices: [] }));
    const config = loadEnv(TEST_ENV);
    const service = createGroqService(config, fetchMock);

    await expect(service.chat({ message: 'Hello', sessionId: 'conv_empty' })).rejects.toMatchObject({
      code: 'LLM_INVALID_RESPONSE',
      status: 502,
    });
  });

  it('includes guardrails restricting answers to studies and the website in system prompt', async () => {
    expect(OCTO_CHAT_SYSTEM_PROMPT).toContain('STRICT GUARDRAILS & TOPIC RESTRICTIONS');
    expect(OCTO_CHAT_SYSTEM_PROMPT).toMatch(/studies & technical learning/i);
    expect(OCTO_CHAT_SYSTEM_PROMPT).toMatch(/octobyte website & platform/i);
    expect(OCTO_CHAT_SYSTEM_PROMPT).toMatch(/forbidden off-topic subjects/i);
    expect(OCTO_CHAT_SYSTEM_PROMPT).toMatch(/refusal & redirection protocol/i);

    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        choices: [{ message: { role: 'assistant', content: 'Here is what you need to know about the platform!' } }],
      }),
    );
    const config = loadEnv(TEST_ENV);
    const service = createGroqService(config, fetchMock);

    await service.chat({ message: 'What is octoByte?', sessionId: 'conv_guardrail_test' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.messages[0]).toEqual({
      role: 'system',
      content: OCTO_CHAT_SYSTEM_PROMPT,
    });
  });
});
