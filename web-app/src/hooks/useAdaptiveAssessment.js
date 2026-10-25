import { useState, useEffect, useCallback, useRef } from 'react';
import { assessmentService } from '../services/assessmentService';

const ACTIVE_ASSESSMENT_KEY = 'skillpath_active_assessment_id';

export function useAdaptiveAssessment(trackId) {
  const [assessmentId, setAssessmentId] = useState(() => {
    try {
      return sessionStorage.getItem(ACTIVE_ASSESSMENT_KEY);
    } catch {
      return null;
    }
  });

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(9);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const initAttempted = useRef(false);

  // Initialize or resume on mount
  const initAssessment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we have an existing in-progress session to resume
      let state = null;
      const cachedId = sessionStorage.getItem(ACTIVE_ASSESSMENT_KEY);

      if (cachedId) {
        try {
          state = await assessmentService.getState(cachedId);
        } catch {
          // If cached ID is stale or invalid, start fresh
          state = null;
        }
      }

      if (!state) {
        state = await assessmentService.startOrResume(trackId);
      }

      if (state?.assessmentId) {
        setAssessmentId(state.assessmentId);
        try {
          sessionStorage.setItem(ACTIVE_ASSESSMENT_KEY, state.assessmentId);
        } catch {
          // ignore
        }
      }

      setAnsweredCount(state?.answered ?? 0);
      setMaxQuestions(state?.max || state?.progress?.max || 9);

      if (state?.done || state?.status === 'COMPLETED') {
        setIsCompleted(true);
        setCurrentQuestion(null);
        const finalResult = await assessmentService.getResult(state.assessmentId);
        setResults(finalResult);
      } else {
        setIsCompleted(false);
        setCurrentQuestion(state?.question || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize assessment');
    } finally {
      setIsLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    if (!initAttempted.current) {
      initAttempted.current = true;
      initAssessment();
    }
  }, [initAssessment]);

  // Answer Submission handler
  const handleAnswer = useCallback(
    async (selectedOptionIndex) => {
      if (!assessmentId || !currentQuestion || isSubmitting) return;

      try {
        setIsSubmitting(true);
        setError(null);

        const nextState = await assessmentService.submitAnswer(
          assessmentId,
          currentQuestion.itemId,
          selectedOptionIndex
        );

        setAnsweredCount(nextState?.answered ?? answeredCount + 1);
        if (nextState?.max) setMaxQuestions(nextState.max);

        if (nextState?.done || nextState?.status === 'COMPLETED') {
          setIsCompleted(true);
          setCurrentQuestion(null);
          const finalResult = await assessmentService.getResult(assessmentId);
          setResults(finalResult);
        } else {
          setCurrentQuestion(nextState?.question || null);
        }
      } catch (err) {
        setError(err.message || 'Failed to submit answer');
        // If 409 conflict, reload state from server to recover
        if (err.status === 409) {
          try {
            const reloaded = await assessmentService.getState(assessmentId);
            setAnsweredCount(reloaded?.answered ?? answeredCount);
            if (reloaded?.done || reloaded?.status === 'COMPLETED') {
              setIsCompleted(true);
              setCurrentQuestion(null);
              const finalResult = await assessmentService.getResult(assessmentId);
              setResults(finalResult);
            } else {
              setCurrentQuestion(reloaded?.question || null);
            }
          } catch {
            // ignore
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [assessmentId, currentQuestion, isSubmitting, answeredCount]
  );

  // Retest or Reset
  const resetAssessment = useCallback(async () => {
    try {
      sessionStorage.removeItem(ACTIVE_ASSESSMENT_KEY);
    } catch {
      // ignore
    }
    assessmentService.resetMockSession();
    setAssessmentId(null);
    setCurrentQuestion(null);
    setAnsweredCount(0);
    setIsCompleted(false);
    setResults(null);
    await initAssessment();
  }, [initAssessment]);

  return {
    assessmentId,
    currentQuestion,
    answeredCount,
    maxQuestions,
    isCompleted,
    results,
    isLoading,
    isSubmitting,
    error,
    handleAnswer,
    resetAssessment,
  };
}
