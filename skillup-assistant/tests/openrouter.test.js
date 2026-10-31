import { describe, expect, it, vi } from 'vitest';
import { createOpenRouterService } from '../src/services/openrouter.service.js';
import { AppError } from '../src/utils/errors.js';
import { hangingFetch, jsonResponse } from './helpers.js';

describe('OpenRouter Service', () => {
  const sampleParams = {
    skill: 'Java',
    topic: 'OOP',
    question: 'What is overloading?',
    options: ['Option 1', 'Option 2'],
    correctAnswer: 'Option 1',
    userAnswer: 'Option 1',
    isCorrect: true,
    difficultyLevel: 'Beginner',
  };

  it('fails with 502 when openRouter.apiKey is not configured', async () => {
    const service = createOpenRouterService({ openRouter: { apiKey: null } });

    await expect(service.generateFeedback(sampleParams)).rejects.toMatchObject({
      name: 'AppError',
      code: 'LLM_AUTH_FAILED',
      status: 502,
    });
  });

  it('generates companion feedback successfully when OpenRouter returns valid JSON', async () => {
    const mockFeedback = {
      reaction: "Yes! That's absolutely right. Great job!",
      conceptReinforcement: 'Method overloading allows methods to share the same name with different parameters.',
      bonusTip: 'Java resolves overloaded methods at compile time.',
      speechText: "Yes! That's absolutely right. Great job! Method overloading allows methods to share the same name with different parameters. Here's a fun tip: Java resolves overloaded methods at compile time.",
    };

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { role: 'assistant', content: JSON.stringify(mockFeedback) } }],
      }),
    );

    const service = createOpenRouterService(
      {
        openRouter: {
          apiKey: 'test-key',
          model: 'test-model',
          baseUrl: 'https://openrouter.ai/api/v1',
        },
        requestTimeoutMs: 1000,
      },
      fetchMock,
    );

    const result = await service.generateFeedback(sampleParams);
    expect(result).toEqual(mockFeedback);
  });

  it('throws LLM_TIMEOUT on abort/timeout', async () => {
    const fetchMock = vi.fn().mockImplementation(hangingFetch);

    const service = createOpenRouterService(
      {
        openRouter: {
          apiKey: 'test-key',
          model: 'test-model',
          baseUrl: 'https://openrouter.ai/api/v1',
        },
        requestTimeoutMs: 50,
      },
      fetchMock,
    );

    await expect(service.generateFeedback(sampleParams)).rejects.toMatchObject({
      name: 'AppError',
      code: 'LLM_TIMEOUT',
      status: 504,
    });
  });

  it('throws LLM_INVALID_RESPONSE when LLM returns non-json content', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { role: 'assistant', content: 'Just some text without JSON' } }],
      }),
    );

    const service = createOpenRouterService(
      {
        openRouter: {
          apiKey: 'test-key',
          model: 'test-model',
          baseUrl: 'https://openrouter.ai/api/v1',
        },
        requestTimeoutMs: 1000,
      },
      fetchMock,
    );

    await expect(service.generateFeedback(sampleParams)).rejects.toMatchObject({
      name: 'AppError',
      code: 'LLM_INVALID_RESPONSE',
      status: 502,
    });
  });
});
