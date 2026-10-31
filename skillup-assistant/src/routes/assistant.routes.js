import { Router } from 'express';
import { createInternalAuth } from '../middleware/internal-auth.middleware.js';
import { createChatRateLimiter } from '../middleware/rate-limit.middleware.js';

export function createAssistantRouter({ controller, config }) {
  const router = Router();

  // Order matters: throttle first, then check the service key, then handle.
  router.post('/chat', createChatRateLimiter(config), createInternalAuth(config), controller.chat);

  return router;
}
