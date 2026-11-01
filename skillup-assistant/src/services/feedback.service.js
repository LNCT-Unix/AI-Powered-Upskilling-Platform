import { voiceFeedbackResponseSchema } from '../validators/assessment.validator.js';

export function createFeedbackService({ groqService }) {
  async function generateVoiceFeedback(params) {
    const {
      assessmentId,
      questionId,
      skill,
      topic,
      question,
      options,
      correctAnswer,
      userAnswer,
      isCorrect,
      difficultyLevel,
    } = params;

    // 1. Generate text feedback & speechText script using Groq
    const feedback = await groqService.generateFeedback({
      skill,
      topic,
      question,
      options,
      correctAnswer,
      userAnswer,
      isCorrect,
      difficultyLevel,
    });

    // 2. Assemble and validate pure-text response payload
    const payload = {
      success: true,
      assessmentId,
      questionId,
      isCorrect,
      feedback,
    };

    return voiceFeedbackResponseSchema.parse(payload);
  }

  return { generateVoiceFeedback };
}
