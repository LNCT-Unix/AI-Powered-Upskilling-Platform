import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { lyzrChatResponseSchema } from '../validators/assistant.validator.js';

const isTimeout = (err) => err?.name === 'TimeoutError' || err?.name === 'AbortError';

const unavailable = (code, status, logContext) =>
  new AppError(code, status, 'The assistant is temporarily unavailable.', { logContext });

function mapUpstreamStatus(status) {
  if (status === 429) {
    return new AppError('LLM_RATE_LIMITED', 429, 'The assistant is receiving too many requests. Please try again shortly.', {
      logContext: { upstreamStatus: status },
    });
  }
  if (status === 401 || status === 403) {
    // Our credentials are wrong: an operator problem, not something the client can fix.
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

/**
 * Wrapper around the documented Lyzr Agent Inference API (v3):
 *   POST {baseUrl}/inference/chat/
 *   header  x-api-key: <key>
 *   body    { user_id, agent_id, session_id, message }
 *   200 ->  { response: string }
 * Source: https://docs.lyzr.ai/agent-apis/agents/Chat.md
 *
 * `fetchImpl` is injectable so tests can mock the upstream.
 */
export function createLyzrService(config, fetchImpl = globalThis.fetch) {
  const url = `${config.lyzr.baseUrl}/inference/chat/`;

  async function chat({ message, sessionId }) {
    let res;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': config.lyzr.apiKey,
        },
        body: JSON.stringify({
          user_id: config.lyzr.userId,
          agent_id: config.lyzr.agentId, // always from server config, never from the client
          session_id: sessionId,
          message,
        }),
        redirect: 'error', // never follow redirects with the API key attached
        signal: AbortSignal.timeout(config.requestTimeoutMs),
      });
    } catch (err) {
      if (isTimeout(err)) {
        throw new AppError('LLM_TIMEOUT', 504, 'The assistant took too long to respond. Please try again.');
      }
      logger.warn('lyzr.network_error', { errorName: err?.name });
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
        throw new AppError('LLM_TIMEOUT', 504, 'The assistant took too long to respond. Please try again.');
      }
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'non_json_body' });
    }

    const parsed = lyzrChatResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw unavailable('LLM_INVALID_RESPONSE', 502, { reason: 'unexpected_shape' });
    }

    return { content: parsed.data.response };
  }

  return { chat };
}
