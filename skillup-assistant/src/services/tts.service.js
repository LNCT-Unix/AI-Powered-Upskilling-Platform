import { logger } from '../utils/logger.js';

// Minimal valid MP3 frame for mock/fallback testing (MPEG-1 Layer 3, 128kbps, 44.1kHz, stereo)
const MOCK_MP3_BUFFER = Buffer.from([
  0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

/**
 * Splits long text into manageable chunks (< 180 chars) for Google Translate TTS.
 */
function chunkText(text, maxLength = 180) {
  if (!text || text.length <= maxLength) return [text];

  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((current + ' ' + trimmed).trim().length <= maxLength) {
      current = current ? `${current} ${trimmed}` : trimmed;
    } else {
      if (current) chunks.push(current);

      if (trimmed.length <= maxLength) {
        current = trimmed;
      } else {
        // Words fallback if single sentence is exceptionally long
        const words = trimmed.split(/\s+/);
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLength) {
            sub = sub ? `${sub} ${w}` : w;
          } else {
            if (sub) chunks.push(sub);
            sub = w.slice(0, maxLength);
          }
        }
        current = sub;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export function createTtsService(config, { fetchImpl = globalThis.fetch, audioStore } = {}) {
  const provider = config?.tts?.provider || 'google-translate';
  const timeoutMs = Math.min(config?.requestTimeoutMs || 30_000, 20_000);

  async function synthesizeWithGoogle(text) {
    const chunks = chunkText(text);
    const audioBuffers = [];

    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const res = await fetchImpl(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SkillUp/1.0',
          Accept: 'audio/mpeg',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        throw new Error(`Google TTS upstream responded with HTTP ${res.status}`);
      }

      const ab = await res.arrayBuffer();
      audioBuffers.push(Buffer.from(ab));
    }

    return Buffer.concat(audioBuffers);
  }

  async function synthesizeWithOpenAI(text) {
    if (!config?.tts?.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured for OpenAI TTS provider');
    }

    const res = await fetchImpl('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.tts.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: config.tts.openaiModel || 'tts-1',
        input: text,
        voice: config.tts.openaiVoice || 'alloy',
        response_format: 'mp3',
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      throw new Error(`OpenAI TTS upstream responded with HTTP ${res.status}`);
    }

    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  async function synthesizeWithElevenLabs(text) {
    if (!config?.tts?.elevenlabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured for ElevenLabs TTS provider');
    }

    const voiceId = config.tts.elevenlabsVoiceId || '21m00Tcm4TlvDq8ikWAM';
    const res = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': config.tts.elevenlabsApiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs TTS upstream responded with HTTP ${res.status}`);
    }

    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  async function synthesize(text) {
    if (!text || typeof text !== 'string' || !text.trim() || provider === 'none' || !audioStore) {
      return {
        available: false,
        message: 'Audio is temporarily unavailable.',
      };
    }

    try {
      let buffer;
      switch (provider) {
        case 'mock':
          buffer = MOCK_MP3_BUFFER;
          break;
        case 'openai':
          buffer = await synthesizeWithOpenAI(text);
          break;
        case 'elevenlabs':
          buffer = await synthesizeWithElevenLabs(text);
          break;
        case 'google-translate':
        default:
          buffer = await synthesizeWithGoogle(text);
          break;
      }

      const { url, contentType } = audioStore.saveAudio(buffer, 'audio/mpeg');
      return {
        available: true,
        contentType,
        url,
      };
    } catch (err) {
      logger.warn('tts.synthesis_failed', { provider, errorName: err?.name });
      return {
        available: false,
        message: 'Audio is temporarily unavailable.',
      };
    }
  }

  return {
    synthesize,
    provider,
  };
}
