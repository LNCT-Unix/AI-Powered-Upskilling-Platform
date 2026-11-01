import 'dotenv/config';
import { createApp } from './app.js';
import { ConfigError, loadEnv } from './config/env.js';
import { createFeedbackService } from './services/feedback.service.js';
import { createGroqService } from './services/groq.service.js';
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

const groqService = createGroqService(config);
const feedbackService = createFeedbackService({ groqService });

const app = createApp({
  config,
  groqService,
  feedbackService,
});

const server = app.listen(config.port, () => {
  logger.info('server.started', { port: config.port, env: config.nodeEnv });
});

function shutdown(signal) {
  logger.info('server.shutdown_requested', { signal });
  server.close((err) => {
    if (err) {
      logger.error('server.shutdown_failed', { errorName: err.name });
      process.exit(1);
    }
    logger.info('server.closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
