import { newConversationId } from '../utils/conversation.js';
import { buildChatSuccess } from '../utils/response.js';
import {
  buildChatRequestSchema,
  chatResponseSchema,
  toValidationError,
} from '../validators/assistant.validator.js';

export function createAssistantController({ groqService, config }) {
  const chatRequestSchema = buildChatRequestSchema(config.maxMessageLength);

  async function chat(req, res, next) {
    try {
      const parsed = chatRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) throw toValidationError(parsed.error);

      const { message, conversationId: provided } = parsed.data;
      const conversationId = provided ?? newConversationId();

      const { content } = await groqService.chat({ message, sessionId: conversationId });

      const body = chatResponseSchema.parse(
        buildChatSuccess({
          conversationId,
          content,
          model: config.groq.model,
        }),
      );
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  }

  return { chat };
}
