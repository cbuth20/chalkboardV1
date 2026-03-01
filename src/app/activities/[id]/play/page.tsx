"use client";

import { SidebarLayout } from "@/components/SidebarLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';

interface Question {
  id: string;
  question_type: string;
  question_prompt: string;
  correct_answer: string;
  options?: string[];
  explanation?: string;
  difficulty: string;
  topic: string;
}

interface QuestionResult {
  question_id: string;
  flashcard_id: string;
  correct: boolean;
  time_spent: number;
  answer_given: string;
  correct_answer: string;
  topic?: string;
}

export default function ActivityPlayPage() {
  return (
    <ProtectedRoute>
      <ActivityPlayContent />
    </ProtectedRoute>
  );
}

function ActivityPlayContent() {
  const { orgId, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const activityId = params.id as string;
  const attemptId = searchParams.get('attemptId');

  const [activity, setActivity] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [activityStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!attemptId) {
      router.push(`/activities/${activityId}`);
      return;
    }

    fetchActivityData();
  }, [attemptId]);

  const fetchActivityData = async () => {
    if (!session?.access_token) {
      console.error('No session token available');
      router.push(`/activities/${activityId}`);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/.netlify/functions/activities-start?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ activityId }),
      });

      if (!response.ok) {
        throw new Error('Failed to load activity');
      }

      const data = await response.json();
      setActivity(data.activity);
      setQuestions(data.questions);
    } catch (error) {
      console.error('Error loading activity:', error);
      showToast('Failed to load activity', 'error');
      router.push(`/activities/${activityId}`);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return; // Already answered
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    const result: QuestionResult = {
      question_id: currentQuestion.id,
      flashcard_id: currentQuestion.id,
      correct: isCorrect,
      time_spent: timeSpent,
      answer_given: selectedAnswer,
      correct_answer: currentQuestion.correct_answer,
      topic: currentQuestion.topic,
    };

    setQuestionResults([...questionResults, result]);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleFinish();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handleFinish = async () => {
    if (!session?.access_token) {
      showToast('You must be signed in to submit results', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const totalTimeSpent = Math.floor((Date.now() - activityStartTime) / 1000);

      console.log('Submitting activity results:', {
        attemptId,
        questionCount: questionResults.length,
        totalTimeSpent,
      });

      const response = await fetch(`/.netlify/functions/activities-submit?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          attemptId,
          questionResults,
          timeSpentSeconds: totalTimeSpent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Submit failed:', errorData);
        throw new Error(errorData.error || 'Failed to submit results');
      }

      const data = await response.json();
      console.log('Submit successful:', data);

      // Navigate to results page
      router.push(`/activities/${activityId}/results?attemptId=${attemptId}`);
    } catch (error) {
      console.error('Error submitting results:', error);
      showToast(error instanceof Error ? error.message : 'Failed to submit results. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
            <span className="text-sm text-slate-400">Loading questions...</span>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <SidebarLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-white text-xl mb-4">No questions available</p>
            <button
              onClick={() => router.push(`/activities/${activityId}`)}
              className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-semibold"
            >
              Back to Activity
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const correctSoFar = questionResults.filter(r => r.correct).length;

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-slate-400">
              Score: {correctSoFar}/{questionResults.length}
            </span>
          </div>
          <div className="h-2 bg-[#1B1E20] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00F6E5] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="glass-card p-8 mb-6">
          {/* Difficulty & Topic */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              currentQuestion.difficulty === 'beginner'
                ? 'bg-green-500/20 text-green-400'
                : currentQuestion.difficulty === 'intermediate'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {currentQuestion.difficulty}
            </span>
            <span className="px-2 py-1 rounded text-xs font-bold bg-[#1B1E20] text-slate-300">
              {currentQuestion.topic?.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-bold text-white mb-6">
            {currentQuestion.question_prompt}
          </h2>

          {/* Answer Options */}
          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correct_answer;
                const showCorrect = showExplanation && isCorrect;
                const showIncorrect = showExplanation && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showExplanation}
                    className={`w-full p-4 rounded-lg text-left font-semibold transition-all ${
                      showCorrect
                        ? 'bg-green-500/20 border-2 border-green-500 text-white'
                        : showIncorrect
                        ? 'bg-red-500/20 border-2 border-red-500 text-white'
                        : isSelected
                        ? 'bg-[#00F6E5]/20 border-2 border-[#00F6E5] text-white'
                        : 'bg-[#1B1E20] border-2 border-transparent text-slate-300 hover:border-[#00F6E5]/50'
                    } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showCorrect && <span className="text-green-400">✓</span>}
                      {showIncorrect && <span className="text-red-400">✗</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* True/False Options */}
          {currentQuestion.question_type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {['True', 'False'].map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correct_answer;
                const showCorrect = showExplanation && isCorrect;
                const showIncorrect = showExplanation && isSelected && !isCorrect;

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showExplanation}
                    className={`p-6 rounded-lg text-2xl font-black transition-all ${
                      showCorrect
                        ? 'bg-green-500/20 border-2 border-green-500 text-white'
                        : showIncorrect
                        ? 'bg-red-500/20 border-2 border-red-500 text-white'
                        : isSelected
                        ? 'bg-[#00F6E5]/20 border-2 border-[#00F6E5] text-white'
                        : 'bg-[#1B1E20] border-2 border-transparent text-slate-300 hover:border-[#00F6E5]/50'
                    } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* Explanation */}
          {showExplanation && activity.show_explanations && currentQuestion.explanation && (
            <div className={`p-4 rounded-lg ${
              selectedAnswer === currentQuestion.correct_answer
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <p className="text-sm font-semibold text-white mb-2">
                {selectedAnswer === currentQuestion.correct_answer
                  ? '✓ Correct!'
                  : '✗ Incorrect'}
              </p>
              <p className="text-sm text-slate-300">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={async () => {
              if (await confirm({ message: 'Are you sure you want to quit? Your progress will be lost.', variant: 'destructive', confirmLabel: 'Quit' })) {
                router.push(`/activities/${activityId}`);
              }
            }}
            className="px-6 py-3 rounded-lg bg-[#1B1E20] text-slate-400 font-semibold hover:text-white transition-all"
          >
            Quit
          </button>

          {!showExplanation ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="px-8 py-3 rounded-lg bg-[#00F6E5] text-black font-bold hover:bg-[#00F6E5]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={submitting}
              className="px-8 py-3 rounded-lg bg-[#00F6E5] text-black font-bold hover:bg-[#00F6E5]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Submitting...
                </span>
              ) : isLastQuestion ? (
                'Finish'
              ) : (
                'Next Question →'
              )}
            </button>
          )}
        </div>
      </main>
    </SidebarLayout>
  );
}
