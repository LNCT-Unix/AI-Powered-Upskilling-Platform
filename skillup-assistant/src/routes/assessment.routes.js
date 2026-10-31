import { Router } from 'express';
import { createInternalAuth } from '../middleware/internal-auth.middleware.js';
import { createChatRateLimiter } from '../middleware/rate-limit.middleware.js';

export function createAssessmentRouter({ controller, config }) {
  const router = Router();

  // Order matters: throttle first, then check the service key, then handle
  router.post(
    '/voice-feedback',
    createChatRateLimiter(config),
    createInternalAuth(config),
    controller.getVoiceFeedback,
  );

  // Audio retrieval endpoint for browser <audio> playback (no API key header required)
  router.get('/voice-feedback/audio/:audioId', controller.getAudioClip);

  return router;
}
