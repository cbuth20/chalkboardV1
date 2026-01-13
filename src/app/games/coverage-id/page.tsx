"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PlayerNavbar from "@/components/PlayerNavbar";
import { CoverageDiagram } from "./CoverageDiagram";
import {
  COVERAGE_CHOICES,
  getRandomQuestions,
  getCoverageLabel,
  type CoverageId,
  type CoverageQuestion,
} from "./coverageQuestions";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL_TIME = 60;
const QUESTIONS_PER_GAME = 12;
const ANSWER_DELAY_MS = 800;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type GameState = 'idle' | 'playing' | 'finished';

interface MissedQuestion {
  question: CoverageQuestion;
  userAnswer: CoverageId;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CoverageIdGame() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [questions, setQuestions] = useState<CoverageQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<CoverageId | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([]);

  const currentQuestion = questions[currentIndex];

  // ─────────────────────────────────────────────────────────────────────────
  // Timer Logic
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState]);

  // ─────────────────────────────────────────────────────────────────────────
  // Game Actions
  // ─────────────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    // Get random questions
    const randomQuestions = getRandomQuestions(QUESTIONS_PER_GAME);
    
    // Reset all state
    setQuestions(randomQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setAnsweredCount(0);
    setTimeLeft(TOTAL_TIME);
    setMissedQuestions([]);
    setGameState('playing');
  }, []);

  const handleAnswer = useCallback((choice: CoverageId) => {
    // Ignore if already answered or not playing
    if (selectedAnswer !== null || gameState !== 'playing' || !currentQuestion) {
      return;
    }

    setSelectedAnswer(choice);
    setAnsweredCount((prev) => prev + 1);

    const correct = choice === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    } else {
      // Track missed question
      setMissedQuestions((prev) => [
        ...prev,
        { question: currentQuestion, userAnswer: choice },
      ]);
    }

    // Auto-advance after delay
    setTimeout(() => {
      // Check if we should end the game
      if (currentIndex >= questions.length - 1 || timeLeft <= 0) {
        setGameState('finished');
      } else {
        // Advance to next question
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
    }, ANSWER_DELAY_MS);
  }, [selectedAnswer, gameState, currentQuestion, currentIndex, questions.length, timeLeft]);

  const handlePlayAgain = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleStudyCoverages = useCallback(() => {
    // Stub for now - will connect to Playbook later
    console.log('📚 Study These Coverages clicked');
    console.log('Missed coverages:', missedQuestions.map(m => ({
      coverage: m.question.correctAnswer,
      userAnswer: m.userAnswer,
      coachNote: m.question.coachNote,
    })));
  }, [missedQuestions]);

  const handleExit = useCallback(() => {
    router.push("/games");
  }, [router]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Start Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (gameState === 'idle') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] holographic-grid">
        <PlayerNavbar />
        <main className="mx-auto max-w-2xl px-4 py-12">
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="border-b border-[#1B1E20] px-6 py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00F6E5] to-[#00d4c5] shadow-lg shadow-[#00F6E5]/30">
                  <ShieldIcon className="h-10 w-10 text-[#0A0A0A]" />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-wide text-[#00F6E5]">COVERAGE ID</h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Recognition Test
              </p>
            </div>

            {/* Instructions */}
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-700/50 bg-[#1B1E20]/50 p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  How to Play
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F6E5]">•</span>
                    Study the defensive coverage diagram
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F6E5]">•</span>
                    Read the pre-snap description
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F6E5]">•</span>
                    Identify the coverage scheme
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F6E5]">•</span>
                    Answer as many as you can in {TOTAL_TIME} seconds
                  </li>
                </ul>
              </div>

              {/* Stats Preview */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/30 p-3">
                  <div className="font-mono text-xl font-bold text-white">{TOTAL_TIME}s</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Time</div>
                </div>
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/30 p-3">
                  <div className="font-mono text-xl font-bold text-white">{QUESTIONS_PER_GAME}</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Questions</div>
                </div>
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/30 p-3">
                  <div className="font-mono text-xl font-bold text-[#F5C253]">+XP</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Reward</div>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="p-6 pt-0">
              <button
                onClick={startGame}
                className="btn-primary w-full !py-4 flex items-center justify-center gap-2 text-lg"
              >
                <PlayIcon className="h-5 w-5" />
                Start Game
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Results Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (gameState === 'finished') {
    const percentage = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
    
    // Group missed questions by coverage type
    const missedByCoverage = missedQuestions.reduce((acc, item) => {
      const coverage = item.question.correctAnswer;
      if (!acc[coverage]) {
        acc[coverage] = [];
      }
      acc[coverage].push(item);
      return acc;
    }, {} as Record<CoverageId, MissedQuestion[]>);

    // Sort by most missed
    const sortedMissedCoverages = Object.entries(missedByCoverage)
      .sort(([, a], [, b]) => b.length - a.length);

    return (
      <div className="min-h-screen bg-[#0A0A0A] holographic-grid">
        <PlayerNavbar />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="border-b border-[#1B1E20] px-6 py-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Game Complete
              </p>
              <h1 className="text-3xl font-black tracking-wide text-white">
                {percentage >= 80 ? '🔥 Great Work!' : percentage >= 60 ? '💪 Solid Effort!' : '📚 Keep Studying!'}
              </h1>
            </div>

            {/* Score Stats */}
            <div className="p-6 border-b border-[#1B1E20]">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl border border-[#00F6E5]/30 bg-[#00F6E5]/5 p-4">
                  <div className="font-mono text-3xl font-black text-[#00F6E5]">{score}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                    Correct
                  </div>
                </div>
                <div className="rounded-xl border border-[#F5C253]/30 bg-[#F5C253]/5 p-4">
                  <div className="font-mono text-3xl font-black text-[#F5C253]">{percentage}%</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                    Accuracy
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/50 p-4">
                  <div className="font-mono text-3xl font-black text-white">{answeredCount}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                    Answered
                  </div>
                </div>
              </div>
            </div>

            {/* Missed Coverages Breakdown */}
            {sortedMissedCoverages.length > 0 && (
              <div className="p-6 border-b border-[#1B1E20]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Coverages to Study
                </h3>
                <div className="space-y-3">
                  {sortedMissedCoverages.map(([coverage, items]) => (
                    <div
                      key={coverage}
                      className="flex items-center justify-between rounded-lg border border-[#FF6A3D]/20 bg-[#FF6A3D]/5 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6A3D]/20">
                          <span className="text-sm font-bold text-[#FF6A3D]">{items.length}</span>
                        </div>
                        <span className="font-semibold text-white">
                          {getCoverageLabel(coverage as CoverageId)}
                        </span>
                      </div>
                      <span className="text-sm text-slate-400">
                        {items.length === 1 ? '1 miss' : `${items.length} misses`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Perfect Score Message */}
            {missedQuestions.length === 0 && answeredCount > 0 && (
              <div className="p-6 border-b border-[#1B1E20]">
                <div className="rounded-xl border border-[#00F6E5]/30 bg-[#00F6E5]/5 p-4 text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <p className="font-bold text-[#00F6E5]">Perfect Score!</p>
                  <p className="text-sm text-slate-400 mt-1">You know your coverages!</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-6 flex flex-col gap-3">
              <button
                onClick={handlePlayAgain}
                className="btn-primary w-full !py-4 flex items-center justify-center gap-2 text-lg"
              >
                <PlayIcon className="h-5 w-5" />
                Play Again
              </button>
              
              {missedQuestions.length > 0 && (
                <button
                  onClick={handleStudyCoverages}
                  className="w-full rounded-lg border border-[#F5C253]/30 bg-[#F5C253]/10 py-4 flex items-center justify-center gap-2 text-[#F5C253] font-bold uppercase tracking-wider transition-all hover:bg-[#F5C253]/20"
                >
                  <BookIcon className="h-5 w-5" />
                  Study These Coverages
                </button>
              )}
              
              <button
                onClick={handleExit}
                className="w-full rounded-lg border border-slate-700 bg-[#1B1E20] py-3 text-sm font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
              >
                Back to Games
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Game Screen
  // ─────────────────────────────────────────────────────────────────────────
  const timerPercentage = (timeLeft / TOTAL_TIME) * 100;
  const isTimeLow = timeLeft <= 10;

  return (
    <div className="min-h-screen bg-[#0A0A0A] holographic-grid">
      <PlayerNavbar />
      
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Game HUD */}
        <div className="mb-6 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <Link
                href="/games"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#1B1E20]/80 text-slate-400 transition-all hover:border-slate-600 hover:text-white"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-black tracking-wide text-[#00F6E5]">COVERAGE ID</h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recognition Test</p>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-4">
              {/* Question Counter */}
              <div className="flex items-center gap-2 rounded-lg border border-[#00F6E5]/30 bg-[#00F6E5]/10 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Q</span>
                <span className="font-mono text-lg font-bold text-[#00F6E5]">
                  {currentIndex + 1}/{questions.length}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2 rounded-lg border border-[#F5C253]/30 bg-[#F5C253]/10 px-3 py-2">
                <span className="font-mono text-lg font-bold text-[#F5C253]">{score}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">/ {answeredCount}</span>
              </div>
            </div>
          </div>

          {/* Timer Bar */}
          <div className="flex items-center gap-4">
            <div className={`font-mono text-2xl font-bold ${isTimeLow ? 'text-[#FF6A3D] animate-pulse' : 'text-[#00F6E5]'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex-1 h-3 rounded-full bg-[#1B1E20] border border-[#1B1E20] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  isTimeLow 
                    ? 'bg-gradient-to-r from-[#FF6A3D] to-[#ff8a5c] shadow-lg shadow-[#FF6A3D]/30' 
                    : 'bg-gradient-to-r from-[#00F6E5] to-[#3DF3FF] shadow-lg shadow-[#00F6E5]/30'
                }`}
                style={{ width: `${timerPercentage}%` }}
              >
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="glass-card overflow-hidden">
            {/* Diagram Area - Code-drawn coverage visualization */}
            <div className="border-b border-[#1B1E20] p-6">
              <CoverageDiagram coverageId={currentQuestion.correctAnswer} />
            </div>

            {/* Description */}
            <div className="border-b border-[#1B1E20] p-6">
              <div className="rounded-xl border border-[#00F6E5]/20 bg-[#00F6E5]/5 p-4">
                <p className="text-sm leading-relaxed text-slate-300">
                  {currentQuestion.description}
                </p>
              </div>

              {/* Coach Note (shown after answering) */}
              {selectedAnswer !== null && (
                <div className={`mt-4 rounded-lg border p-3 animate-slide-in ${
                  isCorrect 
                    ? 'border-[#00F6E5]/30 bg-[#00F6E5]/10' 
                    : 'border-[#F5C253]/30 bg-[#F5C253]/10'
                }`}>
                  <p className={`text-sm ${isCorrect ? 'text-[#00F6E5]' : 'text-[#F5C253]'}`}>
                    <span className="font-bold">🎓 Coach Note:</span> {currentQuestion.coachNote}
                  </p>
                </div>
              )}
            </div>

            {/* Answer Buttons */}
            <div className="p-6">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                Identify the Coverage
              </p>
              <div className="grid grid-cols-4 gap-3">
                {COVERAGE_CHOICES.map((choice) => {
                  const isSelected = selectedAnswer === choice;
                  const isCorrectAnswer = choice === currentQuestion.correctAnswer;
                  const showCorrect = selectedAnswer !== null && isCorrectAnswer;
                  const showIncorrect = selectedAnswer !== null && isSelected && !isCorrect;

                  let buttonClass = 'relative flex items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200 ';
                  
                  if (showCorrect) {
                    buttonClass += 'border-[#00F6E5] bg-[#00F6E5]/20 text-[#00F6E5] shadow-lg shadow-[#00F6E5]/20';
                  } else if (showIncorrect) {
                    buttonClass += 'border-[#FF6A3D] bg-[#FF6A3D]/20 text-[#FF6A3D] shadow-lg shadow-[#FF6A3D]/20';
                  } else if (selectedAnswer !== null) {
                    buttonClass += 'border-slate-700/50 bg-[#1B1E20]/50 text-slate-500 cursor-not-allowed';
                  } else {
                    buttonClass += 'border-[#1B1E20] bg-[#1B1E20]/80 text-white hover:border-[#00F6E5]/50 hover:bg-[#00F6E5]/10 hover:text-[#00F6E5] cursor-pointer';
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleAnswer(choice)}
                      disabled={selectedAnswer !== null}
                      className={buttonClass}
                    >
                      {choice}
                      
                      {/* Correct Icon */}
                      {showCorrect && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#00F6E5]">
                          <CheckIcon className="h-3 w-3 text-[#0A0A0A]" />
                        </span>
                      )}
                      
                      {/* Incorrect Icon */}
                      {showIncorrect && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6A3D]">
                          <XIcon className="h-3 w-3 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Message */}
              {selectedAnswer !== null && (
                <div className="mt-4 text-center animate-slide-in">
                  {isCorrect ? (
                    <p className="text-lg font-bold text-[#00F6E5]">✓ Correct!</p>
                  ) : (
                    <p className="text-lg font-bold text-[#FF6A3D]">
                      ✗ It&apos;s {getCoverageLabel(currentQuestion.correctAnswer)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}
