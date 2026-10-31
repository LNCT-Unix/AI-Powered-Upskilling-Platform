import { newConversationId, toLyzrSessionId } from '../utils/conversation.js';
import { buildChatSuccess } from '../utils/response.js';
import {
  buildChatRequestSchema,
  chatResponseSchema,
  toValidationError,
} from '../validators/assistant.validator.js';

export function createAssistantController({ lyzrService, config }) {
  const chatRequestSchema = buildChatRequestSchema(config.maxMessageLength);

  async function chat(req, res, next) {
    try {
      const parsed = chatRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) throw toValidationError(parsed.error);

      const { message, conversationId: provided } = parsed.data;
      const conversationId = provided ?? newConversationId();
      const sessionId = toLyzrSessionId(config.lyzr.agentId, conversationId);

      const { content } = await lyzrService.chat({ message, sessionId });

      const body = chatResponseSchema.parse(buildChatSuccess({ conversationId, content }));
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  }

  return { chat };
}
