'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerPlay } from '@/hooks/usePlayerPlaysAPI';

interface Flashcard {
  id: string;
  position: string;
  category: string;
  question_prompt: string;
  correct_answer: string;
  hints: {
    questionType?: 'true_false' | 'multiple_choice';
    options?: string[];
  };
  explanation: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
}

export default function FlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const playId = params?.playId as string;
  const { session, orgId } = useAuth();

  const { play, loading, error } = usePlayerPlay(playId, {
    includeFlashcards: true,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<{ correct: boolean; cardId: string }[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  const flashcards: Flashcard[] = play?.flashcards || [];
  const currentCard = flashcards[currentIndex];

  const handleSubmitAnswer = (answer: string) => {
    if (!currentCard) return;

    const isCorrect = answer.trim().toLowerCase() === currentCard.correct_answer.trim().toLowerCase();
    setResults([...results, { correct: isCorrect, cardId: currentCard.id }]);
    setUserAnswer(answer);
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setUserAnswer('');
    } else {
      setSessionComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
      setUserAnswer('');
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setUserAnswer('');
    setResults([]);
    setSessionComplete(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1B1E20] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00F6E5] mx-auto mb-4"></div>
          <p className="text-slate-400">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error || !play) {
    return (
      <div className="min-h-screen bg-[#1B1E20] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Play not found'}</p>
          <button
            onClick={() => router.push('/learning-center')}
            className="text-[#00F6E5] hover:underline"
          >
            Return to Learning Center
          </button>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-[#1B1E20] p-6">
        <button
          onClick={() => router.push('/learning-center')}
          className="flex items-center gap-2 text-slate-400 hover:text-[#00F6E5] mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Library
        </button>

        <div className="max-w-2xl mx-auto text-center py-12">
          <SparklesIconLarge className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Flashcards Yet</h2>
          <p className="text-slate-400 mb-6">
            This play hasn't been processed yet. Process it to generate flashcards.
          </p>
          <button
            onClick={() => router.push('/learning-center')}
            className="px-6 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const correctCount = results.filter(r => r.correct).length;
    const totalCount = results.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    return (
      <div className="min-h-screen bg-[#1B1E20] p-6">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl font-black text-[#00F6E5] mb-2">{percentage}%</div>
              <div className="text-xl text-white font-semibold mb-1">Session Complete!</div>
              <div className="text-slate-400">
                {correctCount} correct out of {totalCount} cards
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass-card p-4 border-l-4 border-green-500">
                <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                <div className="text-xs text-slate-400 uppercase">Correct</div>
              </div>
              <div className="glass-card p-4 border-l-4 border-red-500">
                <div className="text-2xl font-bold text-red-400">{totalCount - correctCount}</div>
                <div className="text-xs text-slate-400 uppercase">Incorrect</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition-colors"
              >
                Practice Again
              </button>
              <button
                onClick={() => router.push('/learning-center')}
                className="px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
              >
                Back to Library
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1B1E20] p-6">
      <button
        onClick={() => router.push('/learning-center')}
        className="flex items-center gap-2 text-slate-400 hover:text-[#00F6E5] mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Library
      </button>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-white">{play.play?.name}</h1>
              <p className="text-slate-400 text-sm">Flashcard Practice</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#00F6E5]">
                {currentIndex + 1} / {flashcards.length}
              </div>
              <div className="text-xs text-slate-400 uppercase">Progress</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-[#00F6E5] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        {currentCard && (
          <div className="glass-card p-8 mb-6">
            {/* Card metadata */}
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-[#00F6E5]/10 text-[#00F6E5] text-xs font-semibold rounded-full">
                {currentCard.position}
              </span>
              <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-semibold rounded-full">
                {currentCard.category.replace(/_/g, ' ')}
              </span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                currentCard.difficulty === 'beginner' ? 'bg-green-500/10 text-green-400' :
                currentCard.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {currentCard.difficulty}
              </span>
            </div>

            {/* Question */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-400 mb-2">Question</h3>
              <p className="text-xl text-white font-medium">{currentCard.question_prompt}</p>
            </div>

            {/* Answer options */}
            {!showAnswer && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-3">
                  Select Your Answer
                </label>

                {/* True/False Questions */}
                {currentCard.hints?.questionType === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleSubmitAnswer('true')}
                      className="py-4 px-6 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-[#00F6E5] rounded-lg text-white font-semibold transition-all text-lg"
                    >
                      ✓ True
                    </button>
                    <button
                      onClick={() => handleSubmitAnswer('false')}
                      className="py-4 px-6 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-[#00F6E5] rounded-lg text-white font-semibold transition-all text-lg"
                    >
                      ✗ False
                    </button>
                  </div>
                )}

                {/* Multiple Choice Questions */}
                {currentCard.hints?.questionType === 'multiple_choice' && currentCard.hints?.options && (
                  <div className="space-y-3">
                    {currentCard.hints.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleSubmitAnswer(option)}
                        className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-[#00F6E5] rounded-lg text-white font-medium transition-all text-left flex items-start gap-3"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{option}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Answer display */}
            {showAnswer && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border-l-4 ${
                  results[results.length - 1]?.correct
                    ? 'bg-green-500/10 border-green-500'
                    : 'bg-red-500/10 border-red-500'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {results[results.length - 1]?.correct ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-400" />
                    )}
                    <span className={`font-semibold ${
                      results[results.length - 1]?.correct ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {results[results.length - 1]?.correct ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  {!results[results.length - 1]?.correct && (
                    <div className="text-sm text-slate-300 mb-2">
                      <strong>Your Answer:</strong> {userAnswer}
                    </div>
                  )}
                  <div className="text-sm text-slate-300">
                    <strong>Correct Answer:</strong> {currentCard.correct_answer}
                  </div>
                </div>

                {currentCard.explanation && (
                  <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="text-sm font-semibold text-slate-400 mb-2">Explanation</div>
                    <p className="text-sm text-slate-300">{currentCard.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0 || !showAnswer}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {showAnswer && (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition-colors"
                >
                  {currentIndex < flashcards.length - 1 ? 'Next Card' : 'Finish'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Session stats */}
        {results.length > 0 && (
          <div className="glass-card p-4">
            <div className="text-sm text-slate-400 mb-2">Session Progress</div>
            <div className="flex gap-1">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded ${
                    result.correct ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              ))}
              {Array(flashcards.length - results.length).fill(0).map((_, i) => (
                <div key={`empty-${i}`} className="flex-1 h-2 rounded bg-slate-700" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Icon components
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function SparklesIconLarge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z" />
      <path d="M19 3L19.5 4.5L21 5L19.5 5.5L19 7L18.5 5.5L17 5L18.5 4.5L19 3Z" />
      <path d="M19 17L19.5 18.5L21 19L19.5 19.5L19 21L18.5 19.5L17 19L18.5 18.5L19 17Z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}
