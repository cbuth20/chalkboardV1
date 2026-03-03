"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';
import { playerGamesAPI, GameQuestion, ScoredResponse } from '@/lib/api/player-games';

export default function GameSessionPage() {
  const router = useRouter();
  const params = useParams();
  const { session, orgId } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const attemptId = params.attemptId as string;

  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [responses, setResponses] = useState<Array<{ questionId: string; answer: string; timeSpent: number }>>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    correct: number;
    total: number;
    breakdown: ScoredResponse[];
  } | null>(null);

  // Load game session on mount
  useEffect(() => {
    loadGameSession();
  }, [attemptId]);

  const loadGameSession = async () => {
    // For now, we don't have a way to fetch an existing attempt
    // In a real implementation, you would fetch the attempt from the backend
    // For this demo, we'll assume the questions were stored in sessionStorage during startGame
    const storedQuestions = sessionStorage.getItem(`game_${attemptId}`);
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
      setLoading(false);
    } else {
      showToast('Game session not found', 'error');
      router.push('/games-center');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      showToast('Please select an answer', 'error');
      return;
    }

    // Record response
    const timeSpent = Date.now() - questionStartTime;
    const newResponses = [
      ...responses,
      {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        timeSpent,
      },
    ];
    setResponses(newResponses);

    // Move to next question or finish
    if (isLastQuestion) {
      submitGame(newResponses);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setQuestionStartTime(Date.now());
    }
  };

  const submitGame = async (finalResponses: typeof responses) => {
    if (!orgId) {
      showToast('Organization ID not found. Please try refreshing the page.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await playerGamesAPI.submitAnswers({
        attemptId,
        responses: finalResponses,
      }, orgId);

      setResults(result);
      setGameComplete(true);
    } catch (error) {
      console.error('Failed to submit game:', error);
      showToast('Failed to submit answers. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayAgain = () => {
    router.push('/games-center');
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading game...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (gameComplete && results) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            {/* Results Card */}
            <div className="bg-[#1B1E20] rounded-2xl border border-[#2A2F33] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#00F6E5]/20 to-[#00D4C7]/20 px-8 py-6 border-b border-[#2A2F33]">
                <h2 className="text-3xl font-bold mb-2">Game Complete!</h2>
                <p className="text-slate-400">Here's how you did</p>
              </div>

              {/* Score */}
              <div className="px-8 py-12 text-center border-b border-[#2A2F33]">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-[#00F6E5]/10 border-4 border-[#00F6E5] mb-6">
                  <span className="text-5xl font-bold">{results.score}%</span>
                </div>
                <div className="flex justify-center gap-8 text-lg">
                  <div>
                    <span className="text-slate-400">Correct: </span>
                    <span className="font-bold text-green-400">{results.correct}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Incorrect: </span>
                    <span className="font-bold text-red-400">
                      {results.total - results.correct}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total: </span>
                    <span className="font-bold">{results.total}</span>
                  </div>
                </div>
              </div>

              {/* Question Breakdown */}
              <div className="px-8 py-6 max-h-96 overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">Question Breakdown</h3>
                <div className="space-y-3">
                  {results.breakdown.map((response, index) => (
                    <div
                      key={response.questionId}
                      className={`p-4 rounded-lg border ${
                        response.correct
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium">
                          Question {index + 1} - {response.position}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            response.correct ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {response.correct ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{response.questionPrompt}</p>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-slate-400">Your answer: </span>
                          <span className={response.correct ? 'text-green-400' : 'text-red-400'}>
                            {response.answer}
                          </span>
                        </div>
                        {!response.correct && (
                          <div>
                            <span className="text-slate-400">Correct answer: </span>
                            <span className="text-green-400">{response.correctAnswer}</span>
                          </div>
                        )}
                        {response.explanation && (
                          <p className="text-slate-400 mt-2 text-xs italic">
                            {response.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-8 py-6 bg-[#0D1117] flex gap-4">
                <button
                  onClick={() => router.push('/games-center')}
                  className="flex-1 px-6 py-3 bg-[#2A2F33] text-white font-semibold rounded-lg hover:bg-[#3A3F43] transition"
                >
                  Back to Games
                </button>
                <button
                  onClick={handlePlayAgain}
                  className="flex-1 px-6 py-3 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition"
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        {/* Progress Header */}
        <header className="border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <button
                onClick={async () => {
                  if (await confirm({ message: 'Are you sure you want to quit? Your progress will be lost.', variant: 'destructive', confirmLabel: 'Quit' })) {
                    router.push('/games-center');
                  }
                }}
                className="text-sm text-slate-400 hover:text-white transition"
              >
                Quit
              </button>
            </div>
            {/* Progress Bar */}
            <div className="h-2 bg-[#1B1E20] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00F6E5] transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </header>

        {/* Question Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="space-y-8">
            {/* Question Card */}
            <div className="bg-[#1B1E20] rounded-2xl p-8 border border-[#2A2F33]">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-[#00F6E5]/10 text-[#00F6E5] text-xs font-bold rounded-full">
                  {currentQuestion.position}
                </span>
                <span className="px-3 py-1 bg-[#2A2F33] text-slate-300 text-xs font-medium rounded-full capitalize">
                  {currentQuestion.difficulty}
                </span>
              </div>

              {currentQuestion.scenarioContext && (
                <div className="mb-6 p-4 bg-[#00F6E5]/5 border border-[#00F6E5]/20 rounded-lg">
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-[#00F6E5]">Scenario: </span>
                    {currentQuestion.scenarioContext}
                  </p>
                </div>
              )}

              <h2 className="text-2xl font-bold mb-8">{currentQuestion.questionPrompt}</h2>

              {/* Answer Options */}
              {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full text-left px-6 py-4 rounded-lg border-2 transition ${
                        selectedAnswer === option
                          ? 'bg-[#00F6E5] text-black border-[#00F6E5]'
                          : 'bg-[#0A0A0A] text-white border-[#2A2F33] hover:border-[#00F6E5]/50'
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                    </button>
                  ))}
                </div>
              ) : currentQuestion.questionType === 'true_false' ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswerSelect('true')}
                    className={`px-6 py-4 rounded-lg border-2 transition font-bold ${
                      selectedAnswer === 'true'
                        ? 'bg-[#00F6E5] text-black border-[#00F6E5]'
                        : 'bg-[#0A0A0A] text-white border-[#2A2F33] hover:border-[#00F6E5]/50'
                    }`}
                  >
                    TRUE
                  </button>
                  <button
                    onClick={() => handleAnswerSelect('false')}
                    className={`px-6 py-4 rounded-lg border-2 transition font-bold ${
                      selectedAnswer === 'false'
                        ? 'bg-[#00F6E5] text-black border-[#00F6E5]'
                        : 'bg-[#0A0A0A] text-white border-[#2A2F33] hover:border-[#00F6E5]/50'
                    }`}
                  >
                    FALSE
                  </button>
                </div>
              ) : (
                // Fallback: Default to True/False if questionType is missing or not recognized
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 mb-3">
                    (Question type: {currentQuestion.questionType || 'not specified'} - defaulting to True/False)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleAnswerSelect('true')}
                      className={`px-6 py-4 rounded-lg border-2 transition font-bold ${
                        selectedAnswer === 'true'
                          ? 'bg-[#00F6E5] text-black border-[#00F6E5]'
                          : 'bg-[#0A0A0A] text-white border-[#2A2F33] hover:border-[#00F6E5]/50'
                      }`}
                    >
                      TRUE
                    </button>
                    <button
                      onClick={() => handleAnswerSelect('false')}
                      className={`px-6 py-4 rounded-lg border-2 transition font-bold ${
                        selectedAnswer === 'false'
                          ? 'bg-[#00F6E5] text-black border-[#00F6E5]'
                          : 'bg-[#0A0A0A] text-white border-[#2A2F33] hover:border-[#00F6E5]/50'
                      }`}
                    >
                      FALSE
                    </button>
                  </div>
                </div>
              )}

              {/* Hints */}
              {currentQuestion.hints && Array.isArray(currentQuestion.hints) && currentQuestion.hints.length > 0 && (
                <details className="mt-6 p-4 bg-[#2A2F33] rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium text-slate-300">
                    💡 Show Hint
                  </summary>
                  <p className="mt-2 text-sm text-slate-400">{currentQuestion.hints[0]}</p>
                </details>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={!selectedAnswer || submitting}
              className="w-full px-8 py-4 bg-[#00F6E5] text-black text-lg font-bold rounded-lg hover:bg-[#00D4C7] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : isLastQuestion ? 'Finish Game' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
