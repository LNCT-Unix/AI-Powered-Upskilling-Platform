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

const SYSTEM_PROMPT = `You are a friendly, energetic AI learning companion for college students on the SkillUp upskilling platform.
Your role is to give a quick, fun, and memorable voice reaction whenever a student answers an assessment question.
You are NOT a formal classroom lecturer. You sound like an enthusiastic, supportive study partner or mentor.

CRITICAL RULES:
1. ADAPT TO ANSWER CORRECTNESS:
   - When isCorrect is TRUE:
     * Congratulate the student with high energy (e.g., "Yes! That's absolutely right. Great job!").
     * Briefly reinforce why the answer is correct in 1 clear sentence.
     * Share ONE interesting bonus tip, shortcut, real-world use case, or memorable fun fact about the concept.
   - When isCorrect is FALSE:
     * React naturally, gently, and warmly (e.g., "Oh! Not quite, but no worries, that's okay!").
     * Never shame or discourage the student.
     * Briefly state the correct concept clearly.
     * Share ONE interesting bonus tip, shortcut, or memorable insight related to the topic.
2. BREVITY: Keep the total spoken script brief (approx. 15–25 seconds spoken, around 30–50 words). Avoid long lectures or step-by-step dissertations.
3. FACTUALITY: The bonus tip must be relevant, accurate, and educational. Never invent false facts.
4. "speechText" is the exact conversational script to be read aloud via Text-to-Speech. It must sound natural, positive, and engaging.
5. OUTPUT FORMAT: You MUST return ONLY a valid raw JSON object (no markdown backticks, no markdown formatting) with these exact 4 keys:
   - "reaction": The opening enthusiastic congratulation or gentle encouragement
   - "conceptReinforcement": Brief 1-sentence reinforcement of the correct concept
   - "bonusTip": Exactly one interesting bonus tip, shortcut, or fun fact
   - "speechText": The complete voice companion script combining reaction, reinforcement, and the bonus tip`;

export function createOpenRouterService(config, fetchImpl = globalThis.fetch) {
  const openRouter = config?.openRouter;
  const url = `${openRouter?.baseUrl || 'https://openrouter.ai/api/v1'}/chat/completions`;
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
    // If mock mode is explicitly configured for offline/local testing
    if (openRouter?.apiKey === 'mock') {
      return {
        reaction: isCorrect
          ? "Yes! That's absolutely right. Great job!"
          : "Oh! Not quite, but no worries, that's okay!",
        conceptReinforcement: isCorrect
          ? `Great job understanding ${skill} ${topic || 'concepts'}. Method overloading allows multiple methods with the same name but different parameters.`
          : `The correct concept is: ${correctAnswer}.`,
        bonusTip: `Here's a fun tip: Overloading is resolved at compile time, while overriding is resolved at runtime!`,
        speechText: isCorrect
          ? `Yes! That's absolutely right. Great job! Method overloading allows multiple methods to share a name with different parameters. Here's a fun tip: Java resolves overloaded methods at compile time!`
          : `Oh! Not quite, but no worries, that's okay! The correct concept is ${correctAnswer}. Here's a fun tip: Overloading is resolved at compile time, while overriding happens at runtime!`,
      };
    }

    if (!openRouter?.apiKey) {
      throw unavailable('LLM_AUTH_FAILED', 502, { reason: 'openrouter_api_key_not_configured' });
    }

    const userPrompt = `Subject/Skill: ${skill}
Topic: ${topic || 'General'}
Difficulty Level: ${difficultyLevel || 'Not specified'}

Question:
${question}

Options:
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

Verified Correct Answer:
${correctAnswer}

Student's Submitted Answer:
${userAnswer}

Assessment Result:
${isCorrect ? 'CORRECT (isCorrect: true)' : 'INCORRECT (isCorrect: false)'}

Generate your short voice companion response as raw JSON matching the required schema.`;

    let res;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${openRouter.apiKey}`,
          'HTTP-Referer': 'https://skillup.platform',
          'X-Title': 'SkillUp Assessment Voice Companion',
        },
        body: JSON.stringify({
          model: openRouter.model || 'meta-llama/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.35,
          max_tokens: 600,
          response_format: { type: 'json_object' },
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (isTimeout(err)) {
        throw new AppError(
          'LLM_TIMEOUT',
          504,
          'The feedback service took too long to respond. Please try again.',
        );
      }
      logger.warn('openrouter.network_error', { errorName: err?.name });
      throw unavailable('LLM_SERVICE_UNAVAILABLE', 503, { errorName: err?.name });
    }

    if (!res.ok) {
      await res.body?.cancel?.().catch(() => {});
      throw mapUpstreamStatus(res.status);
    }

    let payload;
    try {
      payload = await res.json();
    } catch (err) {
      if (isTimeout(err)) {
        throw new AppError(
          'LLM_TIMEOUT',
          504,
          'The feedback service took too long to respond. Please try again.',
        );
      }
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'non_json_body' });
    }

    const rawContent = payload?.choices?.[0]?.message?.content;
    if (!rawContent || typeof rawContent !== 'string') {
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'missing_choices_content' });
    }

    let parsedJson;
    try {
      const cleanJsonString = extractJson(rawContent);
      parsedJson = JSON.parse(cleanJsonString);
    } catch (err) {
      logger.warn('openrouter.json_parse_error', { errorName: err?.name });
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'malformed_llm_json' });
    }

    const parsed = llmFeedbackSchema.safeParse(parsedJson);
    if (!parsed.success) {
      logger.warn('openrouter.schema_validation_error', { issues: parsed.error.issues.length });
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'unexpected_llm_feedback_shape' });
    }

    return parsed.data;
  }

  return { generateFeedback };
}
