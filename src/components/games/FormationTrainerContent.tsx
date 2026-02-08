"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Formation {
  id: string;
  formation_name: string;
  personnel?: string;
  description?: string;
  module: string;
  positions: Record<string, { x: number; y: number }>;
  coaching_notes: Record<string, string>;
  source_pdf_ids: string[];
}

interface AnalysisStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  formations_extracted: number;
  estimated_tokens: number;
  processing_time_seconds: number;
  completed_at: string;
}

interface QuizQuestion {
  formation_id: string;
  question_type: 'identify' | 'position';
  question_text: string;
  correct_answer: string;
  options: string[];
  target_position?: string;
  formation_data: {
    positions: Record<string, { x: number; y: number }>;
    personnel?: string;
    formation_name?: string;
  };
}

interface QuizState {
  quiz_id: string;
  questions: QuizQuestion[];
  current_index: number;
  answers: Array<{ is_correct: boolean; user_answer: string }>;
  start_time: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const MODULES = [
  { id: 'posse_2x2', name: '2x2', icon: '📐', description: '2 receivers on each side' },
  { id: 'posse_trips', name: 'Trips', icon: '🎯', description: '3 receivers on one side' },
  { id: 'quads', name: 'Quads', icon: '🔷', description: '4 receivers on one side' },
  { id: 'ranger', name: 'Ranger', icon: '🎪', description: 'Spread with running back' },
  { id: 'zombie', name: 'Zombie', icon: '👻', description: 'Empty backfield variations' },
  { id: 'empty', name: 'Empty', icon: '🌟', description: 'No running back' },
  { id: 'special', name: 'Special', icon: '⚡', description: 'Goal line, short yardage' },
];

const POSITIONS = [
  { id: 'QB', name: 'Quarterback', icon: '🎯' },
  { id: 'RB', name: 'Running Back', icon: '🏃' },
  { id: 'WR', name: 'Wide Receiver', icon: '🏈' },
  { id: 'OT', name: 'Offensive Tackle', icon: '🛡️' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FormationTrainerContent() {
  const { session, orgId, loading: authLoading } = useAuth();

  const [view, setView] = useState<'home' | 'quiz' | 'results'>('home');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('mixed');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);

  // Load data on mount
  useEffect(() => {
    if (!authLoading && session && orgId) {
      const timer = setTimeout(() => {
        loadData();
      }, 300);
      return () => clearTimeout(timer);
    } else if (!authLoading && !session) {
      setLoading(false);
    }
  }, [authLoading, session, orgId]);

  const loadData = async () => {
    if (!session?.access_token || !orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/player-formations?orgId=${orgId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch formations');
      }

      const data = await response.json();
      setFormations(data.formations || []);
      setAnalysisStatus(data.latestAnalysis);

      // Check if analysis is stuck
      if (data.latestAnalysis?.status === 'processing') {
        const startedAt = new Date(data.latestAnalysis.started_at).getTime();
        const now = Date.now();
        const minutesElapsed = (now - startedAt) / 1000 / 60;

        if (minutesElapsed > 15) {
          console.warn('⚠️  Analysis appears stuck, older than 15 minutes');
          const confirmed = confirm(
            'Your previous analysis appears to be stuck. Would you like to reset it so you can start a new analysis?'
          );
          if (confirmed) {
            await clearStuckAnalysis(data.latestAnalysis.id);
          }
        }
      }

      console.log(`✅ Loaded ${data.formations?.length || 0} formations`);
    } catch (error) {
      console.error('Error loading formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearStuckAnalysis = async (analysisId: string) => {
    if (!session?.access_token || !orgId) return;

    try {
      console.log(`Clearing stuck analysis ${analysisId}`);

      const response = await fetch(`/api/player-formations-analysis-reset?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset analysis');
      }

      alert('✅ Analysis reset successfully! You can now start a new analysis.');
      await loadData();
    } catch (error) {
      console.error('Error clearing stuck analysis:', error);
      alert(`❌ ${error instanceof Error ? error.message : 'Failed to reset analysis'}`);
    }
  };

  const startAnalysis = async () => {
    if (
      !confirm(
        '⚠️ WARNING: This will analyze all your uploaded PDFs using AI. This is an expensive operation that may take several minutes. Continue?'
      )
    ) {
      return;
    }

    if (!session?.access_token || !orgId) {
      alert('Authentication error. Please sign in.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch(`/api/player-formations-analyze?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positions: ['QB', 'RB', 'WR', 'OT'],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const data = await response.json();
      alert(
        `✅ Analysis started! Processing ${data.pdfCount} PDFs. Estimated time: ${data.estimatedDuration}. Refresh this page in a few minutes to see results.`
      );

      await loadData();
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert(`❌ ${error instanceof Error ? error.message : 'Failed to start analysis'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const startQuiz = async (module: string, position: string | null) => {
    if (!session?.access_token || !orgId) {
      alert('Authentication error. Please sign in.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/player-formation-quiz/start?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module,
          position_filter: position,
          total_questions: 10,
          quiz_type: 'test',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start quiz');
      }

      const data = await response.json();
      setQuizState({
        quiz_id: data.quiz_id,
        questions: data.questions,
        current_index: 0,
        answers: [],
        start_time: Date.now(),
      });
      setSelectedAnswer(null);
      setShowFeedback(false);
      setCorrectCount(0);
      setStreak(0);
      setView('quiz');
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert(`❌ ${error instanceof Error ? error.message : 'Failed to start quiz'}`);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: string) => {
    if (!quizState || !session?.access_token || !orgId) return;

    const question = quizState.questions[quizState.current_index];
    const responseTime = Date.now() - quizState.start_time;

    setSelectedAnswer(answer);
    setShowFeedback(true);

    try {
      const response = await fetch(`/api/player-formation-quiz/submit?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_id: quizState.quiz_id,
          formation_id: question.formation_id,
          question_type: question.question_type,
          question_text: question.question_text,
          target_position: question.target_position,
          user_answer: answer,
          correct_answer: question.correct_answer,
          response_time_ms: responseTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();

      const isCorrect = data.is_correct;
      setCorrectCount(prev => (isCorrect ? prev + 1 : prev));
      setStreak(prev => (isCorrect ? prev + 1 : 0));

      const newAnswers = [...quizState.answers, { is_correct: data.is_correct, user_answer: answer }];

      setTimeout(() => {
        if (quizState.current_index < quizState.questions.length - 1) {
          setQuizState({
            ...quizState,
            current_index: quizState.current_index + 1,
            answers: newAnswers,
            start_time: Date.now(),
          });
          setSelectedAnswer(null);
          setShowFeedback(false);
        } else {
          completeQuiz(quizState.quiz_id);
          setQuizState({ ...quizState, answers: newAnswers });
          setView('results');
        }
      }, 1800);
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer');
      setShowFeedback(false);
      setSelectedAnswer(null);
    }
  };

  const completeQuiz = async (quizId: string) => {
    if (!session?.access_token || !orgId) return;

    try {
      await fetch(`/api/player-formation-quiz/complete?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quiz_id: quizId }),
      });
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-gray-400">Loading formations trainer...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-400">Please log in to access the formations trainer</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'home') {
    const formationsByModule = formations.reduce((acc, f) => {
      acc[f.module] = (acc[f.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div>
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Formation Trainer</h2>
          <p className="text-gray-400">Master your team's formations with AI-powered position quizzes</p>
        </div>

        {/* Stats Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-1">Total Formations</div>
              <div className="text-2xl font-bold text-white">{formations.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Analysis Status</div>
              <div className="text-2xl font-bold text-white">
                {analysisStatus ? (
                  <span
                    className={`text-sm ${
                      analysisStatus.status === 'completed'
                        ? 'text-green-400'
                        : analysisStatus.status === 'processing'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {analysisStatus.status === 'completed' && '✅ Complete'}
                    {analysisStatus.status === 'processing' && '⏳ Processing...'}
                    {analysisStatus.status === 'failed' && '❌ Failed'}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Not started</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Modules Covered</div>
              <div className="text-2xl font-bold text-white">{Object.keys(formationsByModule).length}/7</div>
            </div>
          </div>
        </div>

        {/* Analysis Button */}
        {formations.length === 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">📚 No Formations Found</h3>
            <p className="text-gray-300 mb-4">
              Upload your playbook PDFs in the <strong>My Notes</strong> section, then come back here to analyze them.
            </p>
            <button
              onClick={startAnalysis}
              disabled={analyzing || analysisStatus?.status === 'processing'}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {analyzing ? 'Starting Analysis...' : 'Analyze Playbooks'}
            </button>
          </div>
        )}

        {formations.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">🔄 Re-analyze Playbooks</h3>
            <p className="text-gray-300 mb-4">
              If you've added new PDFs or want to refresh your formations, run the analysis again.
            </p>
            <button
              onClick={startAnalysis}
              disabled={analyzing || analysisStatus?.status === 'processing'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {analyzing
                ? 'Starting Analysis...'
                : analysisStatus?.status === 'processing'
                ? 'Analysis In Progress...'
                : 'Re-analyze Playbooks'}
            </button>
          </div>
        )}

        {/* Modules Grid */}
        {formations.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-white mb-4">Select Module</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {MODULES.map(module => {
                const count = formationsByModule[module.id] || 0;
                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      setSelectedModule(module.id);
                      setSelectedPosition(null);
                    }}
                    disabled={count === 0}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedModule === module.id
                        ? 'bg-blue-600 border-blue-500'
                        : count === 0
                        ? 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">{module.icon}</div>
                    <div className="font-semibold text-white">{module.name}</div>
                    <div className="text-xs text-gray-400">{count} formations</div>
                  </button>
                );
              })}
            </div>

            {/* Positions */}
            <h2 className="text-xl font-bold text-white mb-4">Select Position (Optional)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {POSITIONS.map(position => (
                <button
                  key={position.id}
                  onClick={() => setSelectedPosition(position.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPosition === position.id
                      ? 'bg-green-600 border-green-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{position.icon}</div>
                  <div className="font-semibold text-white">{position.name}</div>
                </button>
              ))}
              <button
                onClick={() => setSelectedPosition(null)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPosition === null
                    ? 'bg-green-600 border-green-500'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-2">🌟</div>
                <div className="font-semibold text-white">All Positions</div>
              </button>
            </div>

            {/* Start Quiz Button */}
            <div className="text-center">
              <button
                onClick={() => startQuiz(selectedModule, selectedPosition)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105"
              >
                Start Quiz
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUIZ VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'quiz' && quizState) {
    const question = quizState.questions[quizState.current_index];
    const progress = Math.round(((quizState.current_index + 1) / quizState.questions.length) * 100);
    const totalAnswered = quizState.answers.length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>
              Question {quizState.current_index + 1} of {quizState.questions.length}
            </span>
            <span>{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-[#00F6E5] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#00F6E5]">
              {correctCount}/{totalAnswered}
            </div>
            <div className="text-xs text-gray-400">SCORE</div>
          </div>
          <div className="text-center bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#00F6E5]">{accuracy}%</div>
            <div className="text-xs text-gray-400">ACCURACY</div>
          </div>
          <div className="text-center bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#00F6E5]">{streak}🔥</div>
            <div className="text-xs text-gray-400">STREAK</div>
          </div>
        </div>

        {/* Question */}
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{question.question_text}</h2>

        {/* Formation Field Display */}
        <div className="bg-green-900/30 border-2 border-green-700 rounded-lg p-8 mb-6 relative" style={{ height: '400px' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            {Object.entries(question.formation_data.positions).map(([pos, coords]) => {
              const x = (coords.x / 100) * 100;
              const y = (coords.y / 50) * 100;
              const isTarget = question.question_type === 'position' && pos === question.target_position;

              return (
                <div
                  key={pos}
                  className={`absolute font-bold rounded-full w-12 h-12 flex items-center justify-center text-sm ${
                    isTarget
                      ? 'bg-[#00F6E5] text-black animate-pulse shadow-lg shadow-[#00F6E5]/50'
                      : 'bg-white text-black'
                  }`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {pos}
                </div>
              );
            })}
          </div>
        </div>

        {/* Multiple Choice Options */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {question.options?.map((option, index) => {
            const isCorrect = showFeedback && option === question.correct_answer;
            const isIncorrect = showFeedback && selectedAnswer === option && option !== question.correct_answer;

            return (
              <button
                key={index}
                onClick={() => !showFeedback && submitAnswer(option)}
                disabled={showFeedback}
                className={`p-4 rounded-xl border-2 transition-all font-semibold text-lg ${
                  isCorrect
                    ? 'bg-green-500/15 border-green-500 text-green-400'
                    : isIncorrect
                    ? 'bg-red-500/10 border-red-500 text-red-400'
                    : selectedAnswer === option
                    ? 'bg-[#00F6E5] border-[#00F6E5] text-black'
                    : 'bg-gray-700 border-gray-600 hover:border-[#00F6E5]/50 text-white'
                } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback */}
        {showFeedback && (
          <div
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              selectedAnswer === question.correct_answer
                ? 'bg-green-500/10 border-green-500'
                : 'bg-red-500/10 border-red-500'
            }`}
          >
            <p className="text-xl font-bold mb-2">
              {selectedAnswer === question.correct_answer
                ? '✓ Correct!'
                : `✗ Incorrect - Answer: ${question.correct_answer}`}
            </p>
            {question.formation_data.formation_name && (
              <p className="text-sm text-gray-300 mt-2">
                {question.question_type === 'identify'
                  ? `This is the ${question.formation_data.formation_name} formation`
                  : `The ${question.target_position} position is highlighted in teal`}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULTS VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'results' && quizState) {
    const correctCount = quizState.answers.filter(a => a.is_correct).length;
    const accuracy = Math.round((correctCount / quizState.answers.length) * 100);

    return (
      <div className="max-w-2xl mx-auto">
        {/* Results Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '📚'}</div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
          <p className="text-xl text-gray-300">
            You scored <span className="font-bold text-blue-400">{correctCount}/{quizState.answers.length}</span>
          </p>
          <p className="text-3xl font-bold text-white mt-2">{accuracy}%</p>
        </div>

        {/* Performance Message */}
        <div
          className={`p-6 rounded-lg mb-8 ${
            accuracy >= 80
              ? 'bg-green-900/20 border border-green-700'
              : accuracy >= 60
              ? 'bg-yellow-900/20 border border-yellow-700'
              : 'bg-red-900/20 border border-red-700'
          }`}
        >
          <p className="text-center text-white">
            {accuracy >= 80 && '🔥 Excellent work! You have a strong understanding of these formations.'}
            {accuracy >= 60 && accuracy < 80 && '💪 Good job! Keep practicing to improve your recognition.'}
            {accuracy < 60 && '📖 Keep studying! Review the coaching notes and try again.'}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setView('home');
              setQuizState(null);
            }}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={() => {
              setQuizState(null);
              startQuiz(selectedModule, selectedPosition);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
