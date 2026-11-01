import {
  assessmentFeedbackRequestSchema,
  toValidationError,
} from '../validators/assessment.validator.js';

export function createAssessmentController({ feedbackService }) {
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

  return {
    getVoiceFeedback,
  };
}
