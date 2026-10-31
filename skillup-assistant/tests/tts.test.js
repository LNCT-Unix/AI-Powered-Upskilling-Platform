import { describe, expect, it, vi } from 'vitest';
import { createAudioStore } from '../src/services/audio-store.service.js';
import { createTtsService } from '../src/services/tts.service.js';

describe('TTS Service Providers', () => {
  it('synthesizes speech using google-translate (mock fetch)', async () => {
    const audioStore = createAudioStore();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from([0x01, 0x02, 0x03]),
    });

    const tts = createTtsService(
      { tts: { provider: 'google-translate' }, requestTimeoutMs: 1000 },
      { fetchImpl: fetchMock, audioStore },
    );

    const result = await tts.synthesize('This is a test speech script.');
    expect(result.available).toBe(true);
    expect(result.contentType).toBe('audio/mpeg');
    expect(result.url).toMatch(/^\/api\/assessment\/voice-feedback\/audio\/aud_/);
    expect(fetchMock).toHaveBeenCalled();

    audioStore.close();
  });

  it('chunks long text properly for google-translate', async () => {
    const audioStore = createAudioStore();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from([0x01]),
    });

    const tts = createTtsService(
      { tts: { provider: 'google-translate' } },
      { fetchImpl: fetchMock, audioStore },
    );

    const longText =
      'First sentence about Java concepts. Second sentence about method overloading. Third sentence explaining the difference from method overriding. Fourth sentence providing tips. Fifth sentence giving further details about object-oriented programming in Java.';
    const result = await tts.synthesize(longText);

    expect(result.available).toBe(true);
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);

    audioStore.close();
  });

  it('synthesizes speech using openai provider', async () => {
    const audioStore = createAudioStore();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from([0x09, 0x08]),
    });

    const tts = createTtsService(
      {
        tts: {
          provider: 'openai',
          openaiApiKey: 'test-openai-key',
          openaiModel: 'tts-1',
          openaiVoice: 'alloy',
        },
      },
      { fetchImpl: fetchMock, audioStore },
    );

    const result = await tts.synthesize('Hello from OpenAI speech.');
    expect(result.available).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/audio/speech');
    expect(opts.headers.Authorization).toBe('Bearer test-openai-key');

    audioStore.close();
  });

  it('fails gracefully when openaiApiKey is missing', async () => {
    const audioStore = createAudioStore();
    const fetchMock = vi.fn();

    const tts = createTtsService(
      {
        tts: {
          provider: 'openai',
          openaiApiKey: null,
        },
      },
      { fetchImpl: fetchMock, audioStore },
    );

    const result = await tts.synthesize('Hello');
    expect(result.available).toBe(false);
    expect(result.message).toBe('Audio is temporarily unavailable.');
    expect(fetchMock).not.toHaveBeenCalled();

    audioStore.close();
  });

  it('synthesizes speech using elevenlabs provider', async () => {
    const audioStore = createAudioStore();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from([0x11, 0x22]),
    });

    const tts = createTtsService(
      {
        tts: {
          provider: 'elevenlabs',
          elevenlabsApiKey: 'test-eleven-key',
          elevenlabsVoiceId: 'voice_123',
        },
      },
      { fetchImpl: fetchMock, audioStore },
    );

    const result = await tts.synthesize('Hello from ElevenLabs.');
    expect(result.available).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.elevenlabs.io/v1/text-to-speech/voice_123');
    expect(opts.headers['xi-api-key']).toBe('test-eleven-key');

    audioStore.close();
  });

  it('fails gracefully when elevenlabsApiKey is missing', async () => {
    const audioStore = createAudioStore();
    const fetchMock = vi.fn();

    const tts = createTtsService(
      {
        tts: {
          provider: 'elevenlabs',
          elevenlabsApiKey: null,
        },
      },
      { fetchImpl: fetchMock, audioStore },
    );

    const result = await tts.synthesize('Hello');
    expect(result.available).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    audioStore.close();
  });

  it('returns unavailable for empty, whitespace, or invalid text', async () => {
    const audioStore = createAudioStore();
    const tts = createTtsService({ tts: { provider: 'mock' } }, { audioStore });

    expect((await tts.synthesize('')).available).toBe(false);
    expect((await tts.synthesize('   ')).available).toBe(false);
    expect((await tts.synthesize(null)).available).toBe(false);

    audioStore.close();
  });
});
