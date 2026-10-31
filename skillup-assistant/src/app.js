import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createAssistantController } from './controllers/assistant.controller.js';
import { createAssessmentController } from './controllers/assessment.controller.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { createAssistantRouter } from './routes/assistant.routes.js';
import { createAssessmentRouter } from './routes/assessment.routes.js';
import { createAudioStore } from './services/audio-store.service.js';
import { createFeedbackService } from './services/feedback.service.js';
import { createOpenRouterService } from './services/openrouter.service.js';
import { createTtsService } from './services/tts.service.js';
import { healthBody } from './utils/response.js';

/**
 * Builds the Express app. Config and services are injected so tests can
 * supply mocked upstreams; nothing here reads process.env.
 */
export function createApp({ config, lyzrService, feedbackService, audioStore }) {
  const app = express();

  app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  app.use(
    cors({
      // Empty list => no CORS headers at all (server-to-server use only).
      origin: config.corsOrigins.length > 0 ? config.corsOrigins : false,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'x-internal-api-key'],
    }),
  );
  app.use(express.json({ limit: config.bodyLimit }));

  app.get('/health', (_req, res) => {
    res.status(200).json(healthBody());
  });

  const assistantController = createAssistantController({ lyzrService, config });
  app.use('/api/assistant', createAssistantRouter({ controller: assistantController, config }));

  const resolvedAudioStore = audioStore ?? createAudioStore({ ttlMs: config.tts?.cacheTtlMs });
  const resolvedFeedbackService =
    feedbackService ??
    createFeedbackService({
      openRouterService: createOpenRouterService(config),
      ttsService: createTtsService(config, { audioStore: resolvedAudioStore }),
    });

  const assessmentController = createAssessmentController({
    feedbackService: resolvedFeedbackService,
    audioStore: resolvedAudioStore,
  });
  app.use('/api/assessment', createAssessmentRouter({ controller: assessmentController, config }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
