import { voiceFeedbackResponseSchema } from '../validators/assessment.validator.js';

export function createFeedbackService({ openRouterService, ttsService }) {
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

    // 1. Generate companion reaction & bonus tip using OpenRouter LLM
    const feedback = await openRouterService.generateFeedback({
      skill,
      topic,
      question,
      options,
      correctAnswer,
      userAnswer,
      isCorrect,
      difficultyLevel,
    });

    // 2. Synthesize companion speech text using configured TTS provider
    // Note: TTS failure does not abort response; it degrades gracefully.
    const audio = await ttsService.synthesize(feedback.speechText);

    // 3. Assemble and validate final response payload
    const payload = {
      success: true,
      assessmentId,
      questionId,
      isCorrect,
      feedback,
      audio,
    };

    return voiceFeedbackResponseSchema.parse(payload);
  }

  return { generateVoiceFeedback };
}
