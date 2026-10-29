import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import Button from '../ui/Button';
import { assessmentService } from '../../services/assessmentService';
import { clusterTitle } from './graphModel';

export default function SkillQuizModal({
  isOpen,
  onClose,
  node,
  onSuccess,
  assessmentId = null,
}) {
  const [stage, setStage] = useState('prompt'); // 'prompt' | 'loading' | 'quiz' | 'submitting' | 'result' | 'error'
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [prevProps, setPrevProps] = useState({ isOpen, slug: node?.slug });
  if (prevProps.isOpen !== isOpen || prevProps.slug !== node?.slug) {
    setPrevProps({ isOpen, slug: node?.slug });
    if (isOpen) {
      setStage('prompt');
      setQuizData(null);
      setCurrentIndex(0);
      setAnswers({});
      setQuizResult(null);
      setErrorMessage('');
      setShowBreakdown(false);
    }
  }

  // Derived state
  const totalQuestions = quizData?.questions?.length || 5;

  const currentQuestion = useMemo(() => {
    if (!quizData?.questions || quizData.questions.length === 0) return null;
    return quizData.questions[currentIndex] || null;
  }, [quizData, currentIndex]);

  const answeredCount = useMemo(() => {
    if (!quizData?.questions) return 0;
    return quizData.questions.filter((q) => answers[q.itemId] !== undefined).length;
  }, [quizData, answers]);

  const allAnswered = answeredCount === totalQuestions;

  // Question navigation handlers
  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
  };

  // Handle selecting an option for the current question
  const handleSelectOption = (itemId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: optionIndex,
    }));
  };

  // Load quiz from backend
  const handleStartQuiz = useCallback(async () => {
    if (!node?.slug) return;
    setStage('loading');
    setErrorMessage('');
    try {
      const data = await assessmentService.getSkillQuiz(node.slug);
      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error('No questions received from server.');
      }
      setQuizData(data);
      setAnswers({});
      setCurrentIndex(0);
      setStage('quiz');
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to load competency quiz questions.');
      setStage('error');
    }
  }, [node]);

  // Submit quiz answers to backend
  const handleSubmitQuiz = useCallback(async () => {
    if (!quizData?.questions || !node?.slug) return;
    setStage('submitting');
    setErrorMessage('');

    try {
      const answersPayload = quizData.questions.map((q) => ({
        itemId: q.itemId,
        selectedOption: answers[q.itemId] !== undefined ? answers[q.itemId] : -1,
      }));

      const result = await assessmentService.submitSkillQuiz(
        node.slug,
        answersPayload,
        assessmentId
      );

      setQuizResult(result);
      setStage('result');
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to submit quiz. Please try again.');
      setStage('error');
    }
  }, [quizData, node, answers, assessmentId]);

  // Keyboard navigation & accessibility (Escape to close, 1-4 to select option, Enter for Next/Submit)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (stage === 'quiz' && currentQuestion) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const optIdx = parseInt(e.key, 10) - 1;
          if (currentQuestion.options && optIdx < currentQuestion.options.length) {
            handleSelectOption(currentQuestion.itemId, optIdx);
          }
        } else if (e.key === 'ArrowRight') {
          if (currentIndex < totalQuestions - 1) {
            setCurrentIndex((prev) => prev + 1);
          }
        } else if (e.key === 'ArrowLeft') {
          if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
          }
        } else if (e.key === 'Enter') {
          if (currentIndex < totalQuestions - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else if (allAnswered && stage !== 'submitting') {
            handleSubmitQuiz();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, stage, currentQuestion, currentIndex, totalQuestions, allAnswered, onClose, handleSubmitQuiz]);

  if (!isOpen || !node) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/90 bg-[#FFFDF9] shadow-2xl transition-all">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600">
              <Lock size={16} />
            </span>
            <div className="min-w-0">
              <h3 id="quiz-modal-title" className="text-sm font-bold text-slate-900 truncate">
                {node.label}
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                {clusterTitle(node.cluster)} Cluster
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Switch by Stage */}
        <div className="p-5 sm:p-6">
          {/* 1. PROMPT STAGE */}
          {stage === 'prompt' && (
            <div className="text-center space-y-5 animate-slide-up">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
                <HelpCircle size={32} />
              </div>

              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-indigo-700 mb-1.5">
                  Node Competency Check
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Unlock {node.label}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Demonstrate foundational proficiency in this skill by answering a short 5-question quiz.
                </p>
              </div>

              {/* Requirement Rule Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Passing Criteria</h4>
                    <p className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">
                      Answer at least <span className="font-bold text-slate-800">3 out of 5 questions</span> correctly (60%). Once passed, this node will immediately be unlocked and marked as <strong>Ready to Learn</strong> on your graph.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <Button variant="primary" size="md" onClick={handleStartQuiz} className="w-full sm:w-auto">
                  Start 5-Question Quiz <ArrowRight size={15} />
                </Button>
                <Button variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* 2. LOADING STATE */}
          {stage === 'loading' && (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 animate-spin">
                <Loader2 size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Fetching Competency Questions</h4>
                <p className="text-xs text-slate-500 mt-1">Preparing 5 questions for {node.label}...</p>
              </div>
            </div>
          )}

          {/* 3. ERROR STATE */}
          {stage === 'error' && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertCircle size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Unable to Load Quiz</h4>
                <p className="text-xs text-rose-600 mt-1 max-w-sm mx-auto">{errorMessage}</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleStartQuiz}>
                  <RotateCcw size={14} /> Try Again
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* 4. ACTIVE QUIZ STAGE */}
          {(stage === 'quiz' || stage === 'submitting') && currentQuestion && (
            <div className="space-y-5 animate-fade-in">
              {/* Stepper Progress & Question Navigation */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                  <span>
                    Question <span className="text-indigo-600 font-bold">{currentIndex + 1}</span> of {totalQuestions}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {answeredCount} / {totalQuestions} answered
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>

                {/* Quick-jump question indicators */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {quizData.questions.map((q, idx) => {
                    const isAnswered = answers[q.itemId] !== undefined;
                    const isCurrent = idx === currentIndex;
                    return (
                      <button
                        key={q.itemId}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-7 w-7 rounded-full text-xs font-semibold transition-all ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-200'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={`Question ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
                <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {currentQuestion.stem}
                </p>

                {/* Options List */}
                <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Question choices">
                  {currentQuestion.options.map((optText, optIdx) => {
                    const isSelected = answers[currentQuestion.itemId] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQuestion.itemId, optIdx)}
                        className={`w-full flex items-start gap-3 p-3 text-left rounded-xl border text-xs sm:text-sm transition-all duration-150 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium ring-2 ring-indigo-500/20 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/60 text-slate-800'
                        }`}
                        role="radio"
                        aria-checked={isSelected}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 text-transparent'
                          }`}
                        >
                          <Check size={10} strokeWidth={3} />
                        </span>
                        <span className="flex-1 leading-relaxed">{optText}</span>
                        <span className="text-[10px] font-semibold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                          {optIdx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0 || stage === 'submitting'}
                >
                  <ArrowLeft size={14} /> Back
                </Button>

                {currentIndex < totalQuestions - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNext}
                    disabled={stage === 'submitting'}
                  >
                    Next Question <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitQuiz}
                    loading={stage === 'submitting'}
                    disabled={!allAnswered || stage === 'submitting'}
                    title={!allAnswered ? 'Please answer all questions before submitting' : ''}
                  >
                    Submit Quiz <Check size={14} />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 5. RESULT STAGE */}
          {stage === 'result' && quizResult && (
            <div className="text-center space-y-5 animate-slide-up">
              {quizResult.passed ? (
                // PASS RESULT
                <>
                  {/* Confetti celebration particles */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                    {[...Array(24)].map((_, i) => (
                      <span
                        key={i}
                        className="absolute w-2 h-2 rounded-xs animate-confetti-particle"
                        style={{
                          top: '15%',
                          left: `${8 + i * 3.6}%`,
                          backgroundColor: ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6'][i % 6],
                          transform: `rotate(${i * 25}deg)`,
                          animationDelay: `${(i % 6) * 0.12}s`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
                    <Sparkles size={32} />
                  </div>

                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 mb-2">
                      Score: {quizResult.score} / {quizResult.total} Passed
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Node Unlocked!
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      {quizResult.message || `Congratulations! You unlocked ${node.label} and it is now marked as Ready to Learn.`}
                    </p>
                  </div>

                  {/* Toggle breakdown */}
                  {quizResult.breakdown && quizResult.breakdown.length > 0 && (
                    <div className="text-left border border-slate-200 rounded-2xl p-4 bg-white">
                      <button
                        type="button"
                        onClick={() => setShowBreakdown((prev) => !prev)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                      >
                        <span>Review Quiz Breakdown ({quizResult.score}/{quizResult.total} Correct)</span>
                        {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {showBreakdown && (
                        <div className="mt-3 space-y-3 pt-3 border-t border-slate-100">
                          {quizResult.breakdown.map((item, idx) => (
                            <div key={idx} className="text-xs space-y-1">
                              <div className="flex items-start gap-2">
                                <span className={item.correct ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                  {item.correct ? '✓' : '✕'}
                                </span>
                                <span className="font-semibold text-slate-900">{item.stem}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 pl-4">
                                Your choice: {item.options?.[item.selectedOption] || 'None'}
                                {!item.correct && item.options?.[item.correctOption] && (
                                  <span className="text-emerald-700 font-medium"> (Correct: {item.options[item.correctOption]})</span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        if (onSuccess) onSuccess(quizResult);
                        onClose();
                      }}
                      className="w-full sm:w-auto"
                    >
                      <Unlock size={15} /> Unlock & View on Graph
                    </Button>
                  </div>
                </>
              ) : (
                // FAIL RESULT (< 3/5)
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 shadow-2xs">
                    <AlertCircle size={32} />
                  </div>

                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 mb-2">
                      Score: {quizResult.score} / {quizResult.total}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Quiz Incomplete
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      You need at least 3 correct answers out of 5 to unlock this node. Review prerequisites and try again anytime.
                    </p>
                  </div>

                  {/* Toggle breakdown */}
                  {quizResult.breakdown && quizResult.breakdown.length > 0 && (
                    <div className="text-left border border-slate-200 rounded-2xl p-4 bg-white">
                      <button
                        type="button"
                        onClick={() => setShowBreakdown((prev) => !prev)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                      >
                        <span>Review Questions ({quizResult.score}/{quizResult.total} Correct)</span>
                        {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {showBreakdown && (
                        <div className="mt-3 space-y-3 pt-3 border-t border-slate-100">
                          {quizResult.breakdown.map((item, idx) => (
                            <div key={idx} className="text-xs space-y-1">
                              <div className="flex items-start gap-2">
                                <span className={item.correct ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                  {item.correct ? '✓' : '✕'}
                                </span>
                                <span className="font-semibold text-slate-900">{item.stem}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 pl-4">
                                Your choice: {item.options?.[item.selectedOption] || 'None'}
                                {!item.correct && item.options?.[item.correctOption] && (
                                  <span className="text-emerald-700 font-medium"> (Correct: {item.options[item.correctOption]})</span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                    <Button variant="primary" size="md" onClick={handleStartQuiz} className="w-full sm:w-auto">
                      <RotateCcw size={15} /> Try Again
                    </Button>
                    <Button variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
                      Back to Graph
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

