import 'dotenv/config';
import { createApp } from './app.js';
import { ConfigError, loadEnv } from './config/env.js';
import { createAudioStore } from './services/audio-store.service.js';
import { createFeedbackService } from './services/feedback.service.js';
import { createLyzrService } from './services/lyzr.service.js';
import { createOpenRouterService } from './services/openrouter.service.js';
import { createTtsService } from './services/tts.service.js';
import { logger } from './utils/logger.js';

let config;
try {
  config = loadEnv();
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(`\n${err.message}\n\nCopy .env.example to .env and fill in the missing values.\n`);
    process.exit(1);
  }
  throw err;
}

if (config.isProduction && !config.internalApiKey) {
  logger.warn('config.internal_api_key_not_set', {
    note: 'Any caller that can reach this service can use the chat endpoint.',
  });
}

const audioStore = createAudioStore({ ttlMs: config.tts?.cacheTtlMs });
const openRouterService = createOpenRouterService(config);
const ttsService = createTtsService(config, { audioStore });
const feedbackService = createFeedbackService({ openRouterService, ttsService });

const app = createApp({
  config,
  lyzrService: createLyzrService(config),
  feedbackService,
  audioStore,
});

const server = app.listen(config.port, () => {
  logger.info('server.started', { port: config.port, env: config.nodeEnv });
});

function shutdown(signal) {
  logger.info('server.shutdown_requested', { signal });
  audioStore.close();
  server.close((err) => {
    if (err) {
      logger.error('server.shutdown_failed', { errorName: err.name });
      process.exit(1);
    }
    logger.info('server.stopped');
    process.exit(0);
  });
  // Force-exit if connections refuse to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
