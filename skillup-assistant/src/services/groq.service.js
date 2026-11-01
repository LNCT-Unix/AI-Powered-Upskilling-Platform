import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { llmFeedbackSchema } from '../validators/assessment.validator.js';

const isTimeout = (err) => err?.name === 'TimeoutError' || err?.name === 'AbortError';

const unavailable = (code, status, logContext) =>
  new AppError(code, status, 'The feedback service is temporarily unavailable.', { logContext });

function mapUpstreamStatus(status) {
  if (status === 429) {
    return new AppError(
      'LLM_RATE_LIMITED',
      429,
      'The feedback service is receiving too many requests. Please try again shortly.',
      { logContext: { upstreamStatus: status } },
    );
  }
  if (status === 401 || status === 403) {
    return unavailable('LLM_AUTH_FAILED', 502, { upstreamStatus: status });
  }
  if (status >= 400 && status < 500) {
    return unavailable('LLM_REQUEST_REJECTED', 502, { upstreamStatus: status });
  }
  if (status >= 500) {
    return unavailable('LLM_SERVICE_UNAVAILABLE', 503, { upstreamStatus: status });
  }
  return unavailable('LLM_INVALID_RESPONSE', 502, { upstreamStatus: status });
}

function extractJson(content) {
  if (typeof content !== 'string') return null;
  const trimmed = content.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

const SYSTEM_PROMPT = `You are a supportive, positive learning companion for college students on an upskilling platform.
Your task is to provide an encouraging, memorable voice reaction whenever a student answers an assessment question.

CRITICAL RULES:
1. ADAPT TO ANSWER ACCURACY:
   - When isCorrect is TRUE:
     * Enthusiastically celebrate the correct answer (e.g., "Awesome job! You nailed that concept.").
     * Briefly reinforce why the answer is right in one simple sentence.
     * Share ONE engaging real-world insight, shortcut, or memorable tip about the topic.
   - When isCorrect is FALSE:
     * React gently and warmly without any shame (e.g., "Good try! Don't worry, that's a tricky one.").
     * Clearly state the correct understanding in one simple sentence.
     * Share ONE helpful memory tip or quick explanation.
2. SPOKEN BREVITY: Keep the total "speechText" concise (approx. 20–35 words, 6–10 seconds of speech).
3. NATURAL SPEECH: "speechText" will be read aloud by browser text-to-speech. Make it flow smoothly like natural dialogue.
4. STRICT JSON OUTPUT: Return ONLY a valid JSON object matching these exact 4 keys:
   - "reaction": Opening congratulatory or encouraging sentence
   - "conceptReinforcement": 1 sentence reinforcing the concept
   - "bonusTip": 1 concise tip or insight
   - "speechText": The complete voice script combining reaction, reinforcement, and tip`;

export function createGroqService(config, fetchImpl = globalThis.fetch) {
  const groq = config?.groq;
  const url = `${groq?.baseUrl || 'https://api.groq.com/openai/v1'}/chat/completions`;
  const timeoutMs = config?.requestTimeoutMs || 30_000;

  async function generateFeedback({
    skill,
    topic,
    question,
    options,
    correctAnswer,
    userAnswer,
    isCorrect,
    difficultyLevel,
  }) {
    // Mock mode for local testing
    if (groq?.apiKey === 'mock') {
      return {
        reaction: isCorrect
          ? "Awesome job! You nailed that concept."
          : "Good try! Don't worry, that's a tricky one.",
        conceptReinforcement: isCorrect
          ? `Great understanding of ${skill} ${topic || 'concepts'}. Method overloading allows multiple methods to share a name with different parameters.`
          : `The correct concept is: ${correctAnswer}.`,
        bonusTip: "Remember: Overloading is resolved at compile time, while overriding happens at runtime!",
        speechText: isCorrect
          ? `Awesome job! Method overloading allows multiple methods to share a name with different parameters. Remember: Java resolves overloading at compile time!`
          : `Good try! The correct concept is ${correctAnswer}. Quick tip: method overloading happens at compile time, while overriding is at runtime!`,
      };
    }

    if (!groq?.apiKey) {
      throw unavailable('LLM_AUTH_FAILED', 502, { reason: 'groq_api_key_not_configured' });
    }

    const userPrompt = `Subject/Skill: ${skill}
Topic: ${topic || 'General'}
Difficulty Level: ${difficultyLevel || 'Intermediate'}
Question: ${question}
Answer Choices:
${(options || []).map((opt, i) => `${i + 1}. ${opt}`).join('\n')}
Correct Answer: ${correctAnswer}
Student's Selected Answer: ${userAnswer}
Answer Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`;

    const requestBody = {
      model: groq.model || 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    };

    let response;
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groq.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (isTimeout(err)) {
        throw new AppError('LLM_TIMEOUT', 504, 'The feedback service took too long to respond. Please try again.');
      }
      throw unavailable('LLM_NETWORK_ERROR', 502, { errorName: err?.name });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logger.error('groq.upstream_error', {
        status: response.status,
        bodySnippet: errorText.slice(0, 300),
      });
      throw mapUpstreamStatus(response.status);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'groq_json_parse_failed' });
    }

    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'groq_empty_choices' });
    }

    const jsonString = extractJson(rawContent);
    if (!jsonString) {
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'groq_markdown_extraction_failed' });
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(jsonString);
    } catch {
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'groq_response_not_valid_json' });
    }

    const validation = llmFeedbackSchema.safeParse(parsedContent);
    if (!validation.success) {
      logger.error('groq.schema_validation_failed', {
        issues: validation.error.issues,
      });
      throw unavailable('LLM_INVALID_RESPONSE', 502, {
        reason: 'groq_schema_validation_failed',
      });
    }

    return validation.data;
  }

  return { generateFeedback };
}
