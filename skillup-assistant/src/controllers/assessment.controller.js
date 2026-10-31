import {
  assessmentFeedbackRequestSchema,
  AUDIO_ID_PATTERN,
  toValidationError,
} from '../validators/assessment.validator.js';
import { errorBody } from '../utils/response.js';

export function createAssessmentController({ feedbackService, audioStore }) {
  async function getVoiceFeedback(req, res, next) {
    try {
      const parsed = assessmentFeedbackRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw toValidationError(parsed.error);
      }

      const result = await feedbackService.generateVoiceFeedback(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  function getAudioClip(req, res, next) {
    try {
      const { audioId } = req.params;

      if (!audioId || !AUDIO_ID_PATTERN.test(audioId)) {
        return res
          .status(404)
          .json(errorBody('AUDIO_NOT_FOUND', 'Audio clip not found or has expired.'));
      }

      const audio = audioStore.getAudio(audioId);
      if (!audio) {
        return res
          .status(404)
          .json(errorBody('AUDIO_NOT_FOUND', 'Audio clip not found or has expired.'));
      }

      const range = req.headers.range;
      if (range) {
        const total = audio.buffer.length;
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

        if (isNaN(start) || start >= total || (parts[1] && isNaN(end)) || end >= total || start > end) {
          res.status(416).setHeader('Content-Range', `bytes */${total}`);
          return res.end();
        }

        const chunk = audio.buffer.subarray(start, end + 1);
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunk.length);
        res.setHeader('Content-Type', audio.contentType);
        res.setHeader('Cache-Control', 'private, max-age=900');
        return res.end(chunk);
      }

      res.status(200);
      res.setHeader('Content-Type', audio.contentType);
      res.setHeader('Content-Length', audio.buffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'private, max-age=900');
      return res.end(audio.buffer);
    } catch (err) {
      next(err);
    }
  }

  return {
    getVoiceFeedback,
    getAudioClip,
  };
}
