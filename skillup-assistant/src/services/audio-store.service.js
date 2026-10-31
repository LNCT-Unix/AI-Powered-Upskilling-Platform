import { randomUUID } from 'node:crypto';
import { AUDIO_ID_PATTERN } from '../validators/assessment.validator.js';
import { logger } from '../utils/logger.js';

export function createAudioStore({ ttlMs = 900_000, maxItems = 100 } = {}) {
  const store = new Map();

  function cleanup() {
    const now = Date.now();
    let purged = 0;
    for (const [id, item] of store.entries()) {
      if (item.expiresAt <= now) {
        store.delete(id);
        purged++;
      }
    }
    if (purged > 0) {
      logger.info('audio_store.cleaned_up', { purged, remaining: store.size });
    }
    return purged;
  }

  // Periodic cleanup every minute (unref so process can exit cleanly)
  const intervalId = setInterval(cleanup, 60_000);
  if (intervalId.unref) intervalId.unref();

  function saveAudio(buffer, contentType = 'audio/mpeg') {
    cleanup();

    // Enforce max capacity by evicting the oldest entries if needed
    if (store.size >= maxItems) {
      const oldestKey = store.keys().next().value;
      if (oldestKey) store.delete(oldestKey);
    }

    const id = `aud_${randomUUID().replace(/-/g, '')}`;
    const now = Date.now();
    store.set(id, {
      buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
      contentType,
      createdAt: now,
      expiresAt: now + ttlMs,
    });

    return {
      id,
      url: `/api/assessment/voice-feedback/audio/${id}`,
      contentType,
    };
  }

  function getAudio(id) {
    if (!id || typeof id !== 'string' || !AUDIO_ID_PATTERN.test(id)) {
      return null;
    }

    const item = store.get(id);
    if (!item) return null;

    if (item.expiresAt <= Date.now()) {
      store.delete(id);
      return null;
    }

    return {
      buffer: item.buffer,
      contentType: item.contentType,
    };
  }

  function deleteAudio(id) {
    return store.delete(id);
  }

  function close() {
    clearInterval(intervalId);
    store.clear();
  }

  return {
    saveAudio,
    getAudio,
    deleteAudio,
    cleanup,
    close,
    get size() {
      return store.size;
    },
  };
}
