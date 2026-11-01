import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import {
  buildApp,
  GROQ_TEST_KEY,
  hangingFetch,
  jsonResponse,
} from './helpers.js';

const FEEDBACK_ENDPOINT = '/api/assessment/voice-feedback';

const VALID_CORRECT_REQUEST = {
  assessmentId: 'assessment_123',
  questionId: 'question_45',
  skill: 'Java',
  topic: 'OOP Concepts',
  question: 'What is method overloading in Java?',
  options: [
    'Defining multiple methods with the same name but different parameters',
    'Redefining a parent class method in a child class',
    'Creating multiple classes with the same name',
    'Calling a method multiple times',
  ],
  correctAnswer: 'Defining multiple methods with the same name but different parameters',
  userAnswer: 'Defining multiple methods with the same name but different parameters',
  isCorrect: true,
  difficultyLevel: 'Beginner',
};

const VALID_INCORRECT_REQUEST = {
  ...VALID_CORRECT_REQUEST,
  userAnswer: 'Redefining a parent class method in a child class',
  isCorrect: false,
};

const VALID_CORRECT_FEEDBACK = {
  reaction: "Yes! That's absolutely right. Great job!",
  conceptReinforcement: 'Method overloading allows methods to share the same name but use different parameters.',
  bonusTip: 'Java resolves overloaded methods at compile time, which is why it is called compile-time polymorphism.',
  speechText: "Yes! That's absolutely right. Great job! Method overloading allows methods to share the same name but use different parameters. Here's a fun tip: Java resolves overloaded methods at compile time, which is why it is called compile-time polymorphism.",
};

const VALID_INCORRECT_FEEDBACK = {
  reaction: "Oh! Not quite, but no worries, that's okay!",
  conceptReinforcement: 'Method overloading happens within the same class when methods share the same name with different parameters.',
  bonusTip: 'Remember: overloading changes parameters at compile time, while overriding replaces a method at runtime!',
  speechText: "Oh! Not quite, but no worries, that's okay! Method overloading happens within the same class when methods share a name with different parameters. Here's a fun tip: Overloading is resolved at compile time, while overriding happens at runtime!",
};

const mockGroqSuccess = (feedback = VALID_CORRECT_FEEDBACK) =>
  jsonResponse({
    id: 'gen_123',
    choices: [
      {
        message: {
          role: 'assistant',
          content: JSON.stringify(feedback),
        },
      },
    ],
  });

function expectErrorShape(res, status, code) {
  expect(res.status).toBe(status);
  expect(res.body).toMatchObject({
    success: false,
    error: { code, message: expect.any(String) },
  });
  const text = JSON.stringify(res.body);
  expect(text).not.toContain(GROQ_TEST_KEY);
  expect(text).not.toMatch(/\bat .*\.js:\d+/);
}

describe('POST /api/assessment/voice-feedback — Request Validation', () => {
  it('rejects requests when isCorrect is missing', async () => {
    const { app, fetchMock } = buildApp();
    const { isCorrect, ...withoutIsCorrect } = VALID_CORRECT_REQUEST;
    const res = await request(app).post(FEEDBACK_ENDPOINT).send(withoutIsCorrect);

    expectErrorShape(res, 400, 'VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('isCorrect');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects non-boolean isCorrect values', async () => {
    const { app, fetchMock } = buildApp();

    const res1 = await request(app)
      .post(FEEDBACK_ENDPOINT)
      .send({ ...VALID_CORRECT_REQUEST, isCorrect: 'true' });
    expectErrorShape(res1, 400, 'VALIDATION_ERROR');

    const res2 = await request(app)
      .post(FEEDBACK_ENDPOINT)
      .send({ ...VALID_CORRECT_REQUEST, isCorrect: 1 });
    expectErrorShape(res2, 400, 'VALIDATION_ERROR');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects requests containing difficultyDescription (legacy field removed)', async () => {
    const { app, fetchMock } = buildApp();
    const res = await request(app)
      .post(FEEDBACK_ENDPOINT)
      .send({ ...VALID_CORRECT_REQUEST, difficultyDescription: 'I was confused' });

    expectErrorShape(res, 400, 'VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('difficultyDescription');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('succeeds without difficultyDescription', async () => {
    const fetchMock = vi.fn().mockImplementation(() => mockGroqSuccess());
    const { app } = buildApp({ fetchImpl: fetchMock });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects missing required fields', async () => {
    const { app, fetchMock } = buildApp();

    const missingQuestion = { ...VALID_CORRECT_REQUEST };
    delete missingQuestion.question;
    const res1 = await request(app).post(FEEDBACK_ENDPOINT).send(missingQuestion);
    expectErrorShape(res1, 400, 'VALIDATION_ERROR');

    const missingUserAnswer = { ...VALID_CORRECT_REQUEST };
    delete missingUserAnswer.userAnswer;
    const res2 = await request(app).post(FEEDBACK_ENDPOINT).send(missingUserAnswer);
    expectErrorShape(res2, 400, 'VALIDATION_ERROR');

    const missingCorrectAnswer = { ...VALID_CORRECT_REQUEST };
    delete missingCorrectAnswer.correctAnswer;
    const res3 = await request(app).post(FEEDBACK_ENDPOINT).send(missingCorrectAnswer);
    expectErrorShape(res3, 400, 'VALIDATION_ERROR');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid options array (less than 2 options or non-array)', async () => {
    const { app, fetchMock } = buildApp();

    const res1 = await request(app)
      .post(FEEDBACK_ENDPOINT)
      .send({ ...VALID_CORRECT_REQUEST, options: ['Only one option'] });
    expectErrorShape(res1, 400, 'VALIDATION_ERROR');

    const res2 = await request(app)
      .post(FEEDBACK_ENDPOINT)
      .send({ ...VALID_CORRECT_REQUEST, options: 'not-an-array' });
    expectErrorShape(res2, 400, 'VALIDATION_ERROR');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post(FEEDBACK_ENDPOINT)
      .set('Content-Type', 'application/json')
      .send('{"skill": "Java", ');

    expectErrorShape(res, 400, 'INVALID_JSON');
  });
});

describe('POST /api/assessment/voice-feedback — Groq Pure-Text Generation', () => {
  it('generates text feedback for correct answers with NO audio fields', async () => {
    const fetchMock = vi.fn().mockImplementation(() => mockGroqSuccess(VALID_CORRECT_FEEDBACK));
    const { app } = buildApp({ fetchImpl: fetchMock });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      assessmentId: 'assessment_123',
      questionId: 'question_45',
      isCorrect: true,
      feedback: {
        reaction: VALID_CORRECT_FEEDBACK.reaction,
        conceptReinforcement: VALID_CORRECT_FEEDBACK.conceptReinforcement,
        bonusTip: VALID_CORRECT_FEEDBACK.bonusTip,
        speechText: VALID_CORRECT_FEEDBACK.speechText,
      },
    });
    expect(res.body.audio).toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [callUrl, callOptions] = fetchMock.mock.calls[0];
    expect(callUrl).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(callOptions.headers.Authorization).toBe(`Bearer ${GROQ_TEST_KEY}`);

    const sentBody = JSON.parse(callOptions.body);
    expect(sentBody.messages[1].content).toContain('Answer Result: CORRECT');
    expect(sentBody.messages[1].content).toContain(VALID_CORRECT_REQUEST.topic);
  });

  it('generates text feedback for incorrect answers with NO audio fields', async () => {
    const fetchMock = vi.fn().mockImplementation(() => mockGroqSuccess(VALID_INCORRECT_FEEDBACK));
    const { app } = buildApp({ fetchImpl: fetchMock });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_INCORRECT_REQUEST);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      assessmentId: 'assessment_123',
      questionId: 'question_45',
      isCorrect: false,
      feedback: {
        reaction: VALID_INCORRECT_FEEDBACK.reaction,
        conceptReinforcement: VALID_INCORRECT_FEEDBACK.conceptReinforcement,
        bonusTip: VALID_INCORRECT_FEEDBACK.bonusTip,
        speechText: VALID_INCORRECT_FEEDBACK.speechText,
      },
    });
    expect(res.body.audio).toBeUndefined();

    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.messages[1].content).toContain('Answer Result: INCORRECT');
    expect(sentBody.messages[1].content).toContain(VALID_INCORRECT_REQUEST.userAnswer);
  });

  it('handles LLM responses enclosed in markdown code fences', async () => {
    const markdownWrapped = `\`\`\`json\n${JSON.stringify(VALID_CORRECT_FEEDBACK)}\n\`\`\``;
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        choices: [{ message: { role: 'assistant', content: markdownWrapped } }],
      }),
    );
    const { app } = buildApp({ fetchImpl: fetchMock });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);

    expect(res.status).toBe(200);
    expect(res.body.feedback.reaction).toBe(VALID_CORRECT_FEEDBACK.reaction);
  });

  it('maps Groq 429 to 429 LLM_RATE_LIMITED', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ error: 'rate limit' }, 429));
    const { app } = buildApp({ fetchImpl: fetchMock });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expectErrorShape(res, 429, 'LLM_RATE_LIMITED');
  });

  it('maps Groq 401/403 to 502 without leaking secrets', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, 401));
    const { app } = buildApp({ fetchImpl: fetchMock });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expectErrorShape(res, 502, 'LLM_AUTH_FAILED');
    expect(JSON.stringify(res.body)).not.toContain(GROQ_TEST_KEY);
  });

  it('maps Groq 5xx to 503', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ error: 'server error' }, 500));
    const { app } = buildApp({ fetchImpl: fetchMock });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expectErrorShape(res, 503, 'LLM_SERVICE_UNAVAILABLE');
  });

  it('maps network timeouts to 504', async () => {
    const fetchMock = vi.fn().mockImplementation(hangingFetch);
    const { app } = buildApp({ fetchImpl: fetchMock, env: { REQUEST_TIMEOUT_MS: '50' } });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expectErrorShape(res, 504, 'LLM_TIMEOUT');
  });

  it('rejects malformed JSON returned by LLM with 502', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        choices: [{ message: { role: 'assistant', content: 'not valid json {{{' } }],
      }),
    );
    const { app } = buildApp({ fetchImpl: fetchMock });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expectErrorShape(res, 502, 'LLM_INVALID_RESPONSE');
  });

  it('rejects LLM response missing required schema fields with 502', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                reaction: 'Nice try!',
                // missing conceptReinforcement, bonusTip, speechText
              }),
            },
          },
        ],
      }),
    );
    const { app } = buildApp({ fetchImpl: fetchMock });

    const res = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expectErrorShape(res, 502, 'LLM_INVALID_RESPONSE');
  });
});

describe('Deleted Audio Clip Routes', () => {
  it('returns 404 for removed /api/assessment/voice-feedback/audio/:audioId', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/assessment/voice-feedback/audio/aud_12345');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/assessment/voice-feedback — Security & Rate Limiting', () => {
  it('requires internal auth key when configured', async () => {
    const fetchMock = vi.fn();
    const { app } = buildApp({
      fetchImpl: fetchMock,
      env: { INTERNAL_API_KEY: 'a-very-long-internal-key-1234' },
    });

    const resNoKey = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expectErrorShape(resNoKey, 401, 'UNAUTHORIZED');

    const resWrongKey = await request(app)
      .post(FEEDBACK_ENDPOINT)
      .set('x-internal-api-key', 'wrong-key-value-1234')
      .send(VALID_CORRECT_REQUEST);
    expectErrorShape(resWrongKey, 401, 'UNAUTHORIZED');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rate limits voice feedback endpoint', async () => {
    const fetchMock = vi.fn().mockImplementation(() => mockGroqSuccess(VALID_CORRECT_FEEDBACK));
    const { app } = buildApp({
      fetchImpl: fetchMock,
      env: { RATE_LIMIT_MAX: '2' },
    });

    const res1 = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expect(res1.status).toBe(200);

    const res2 = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expect(res2.status).toBe(200);

    const res3 = await request(app).post(FEEDBACK_ENDPOINT).send(VALID_CORRECT_REQUEST);
    expectErrorShape(res3, 429, 'RATE_LIMITED');
  });
});
