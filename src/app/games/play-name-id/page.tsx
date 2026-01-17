"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "@/components/SidebarLayout";
import { GameTimer, GameHeader, AnswerButton, ResultsModal } from "@/components/games";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Play {
  id: string;
  name: string;
  short_name: string | null;
  formation_name: string;
  concept: string;
  play_type: string;
  playbook_metadata?: {
    file_paths?: {
      image_url?: string;
    };
  };
}

interface PlayQuestion {
  play: Play;
  options: string[]; // 4 play names (1 correct, 3 wrong)
  imageUrl: string | null;
}

const GAME_TIME = 90;
const QUESTIONS_PER_GAME = 10;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateQuestion(allPlays: Play[], correctPlay: Play): PlayQuestion {
  // Get plays with similar formation for realistic wrong answers
  const sameFormation = allPlays.filter(
    p => p.formation_name === correctPlay.formation_name && p.id !== correctPlay.id
  );

  // Get plays with different formation as backup
  const otherPlays = allPlays.filter(
    p => p.formation_name !== correctPlay.formation_name && p.id !== correctPlay.id
  );

  // Pick 3 wrong answers, preferring same formation
  let wrongAnswers: string[] = [];

  if (sameFormation.length >= 3) {
    wrongAnswers = shuffleArray(sameFormation).slice(0, 3).map(p => p.name);
  } else {
    // Mix same formation and other plays
    wrongAnswers = [
      ...sameFormation.map(p => p.name),
      ...shuffleArray(otherPlays).slice(0, 3 - sameFormation.length).map(p => p.name)
    ];
  }

  // Ensure we have exactly 3 wrong answers
  while (wrongAnswers.length < 3 && otherPlays.length > 0) {
    const randomPlay = otherPlays[Math.floor(Math.random() * otherPlays.length)];
    if (!wrongAnswers.includes(randomPlay.name) && randomPlay.name !== correctPlay.name) {
      wrongAnswers.push(randomPlay.name);
    }
  }

  const options = shuffleArray([correctPlay.name, ...wrongAnswers.slice(0, 3)]);

  return {
    play: correctPlay,
    options,
    imageUrl: correctPlay.playbook_metadata?.file_paths?.image_url || null
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function PlayNameIdGame() {
  const router = useRouter();
  const { teamId } = useAuth();

  const [allPlays, setAllPlays] = useState<Play[]>([]);
  const [questions, setQuestions] = useState<PlayQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [isFinished, setIsFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];

  // Fetch plays on mount
  useEffect(() => {
    const fetchPlays = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/get-approved-plays?teamId=${teamId}&type=all`);

        if (!response.ok) {
          throw new Error('Failed to fetch plays');
        }

        const data = await response.json();
        const plays = data.plays || [];

        if (plays.length < 4) {
          setError('Not enough plays available. You need at least 4 approved plays to play this game.');
          return;
        }

        setAllPlays(plays);
      } catch (err) {
        console.error('Failed to load plays:', err);
        setError('Failed to load plays. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (teamId) {
      fetchPlays();
    }
  }, [teamId]);

  // Generate questions when plays are loaded
  useEffect(() => {
    if (allPlays.length >= 4 && questions.length === 0) {
      generateNewQuestions();
    }
  }, [allPlays]);

  const generateNewQuestions = () => {
    const numQuestions = Math.min(QUESTIONS_PER_GAME, allPlays.length);
    const selectedPlays = shuffleArray(allPlays).slice(0, numQuestions);
    const newQuestions = selectedPlays.map(play => generateQuestion(allPlays, play));
    setQuestions(newQuestions);
  };

  const handleGameEnd = useCallback(() => {
    setIsFinished(true);

    const sessionSummary = {
      gameType: "play-name-id",
      totalQuestions: attempts,
      correctAnswers: correctCount,
      score: score,
      accuracy: attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0,
      timeSpent: GAME_TIME - timeLeft,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Session Summary:", sessionSummary);
  }, [attempts, correctCount, score, timeLeft]);

  // Timer effect
  useEffect(() => {
    if (!gameStarted || isFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, isFinished, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !isFinished) {
      handleGameEnd();
    }
  }, [timeLeft, isFinished, handleGameEnd]);

  const handleAnswer = (answer: string) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    setAttempts((prev) => prev + 1);

    const isCorrect = answer === currentQuestion.play.name;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const timeBonus = Math.floor(timeLeft * 2);
      setScore((prev) => prev + 150 + timeBonus);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        handleGameEnd();
      }
    }, 2000);
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setAttempts(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(GAME_TIME);
    setIsFinished(false);
    setGameStarted(true);

    generateNewQuestions();
  };

  const handleExit = () => {
    router.push("/games");
  };

  const startGame = () => {
    setGameStarted(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <SidebarLayout>
        <main className="mx-auto max-w-2xl px-4 py-12">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading plays...</p>
          </div>
        </main>
      </SidebarLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <SidebarLayout>
        <main className="mx-auto max-w-2xl px-4 py-12">
          <div className="glass-card p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6A3D]/10">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Unable to Start Game</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => router.push("/games")}
              className="px-6 py-3 rounded-lg bg-[#1B1E20] text-white hover:bg-[#252a2e] transition"
            >
              Back to Games
            </button>
          </div>
        </main>
      </SidebarLayout>
    );
  }

  // Start screen
  if (!gameStarted) {
    return (
      <SidebarLayout>
        <main className="mx-auto max-w-2xl px-4 py-12 holographic-grid">
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[#1B1E20] px-6 py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00F6E5] to-[#00d4c5] shadow-lg shadow-[#00F6E5]/30">
                  <PlayDiagramIcon className="h-10 w-10 text-[#0A0A0A]" />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-wide text-[#00F6E5]">PLAY NAME ID</h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Play Recognition Challenge
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-700/50 bg-[#1B1E20]/50 p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  How to Play
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F6E5]">•</span>
                    Study the play diagram carefully
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F6E5]">•</span>
                    Select the correct play name from 4 options
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F6E5]">•</span>
                    Pay attention to formation and concept
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F6E5]">•</span>
                    Fast answers earn bonus points
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/30 p-3">
                  <div className="font-mono text-xl font-bold text-white">{GAME_TIME}s</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Time</div>
                </div>
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/30 p-3">
                  <div className="font-mono text-xl font-bold text-white">{Math.min(QUESTIONS_PER_GAME, allPlays.length)}</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Plays</div>
                </div>
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/30 p-3">
                  <div className="font-mono text-xl font-bold text-[#F5C253]">+XP</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Reward</div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={startGame}
                className="w-full !py-4 flex items-center justify-center gap-2 text-lg rounded-lg font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-[#00F6E5] to-[#00d4c5] text-[#0A0A0A] shadow-lg shadow-[#00F6E5]/25 hover:shadow-[#00F6E5]/40"
              >
                <PlayIcon className="h-5 w-5" />
                Start Game
              </button>
            </div>
          </div>
        </main>
      </SidebarLayout>
    );
  }

  // Game screen
  return (
    <SidebarLayout>
      <main className="mx-auto max-w-4xl px-4 py-6 holographic-grid">
        <div className="mb-6 space-y-4">
          <GameHeader
            title="PLAY NAME ID"
            subtitle="Play Recognition"
            currentQuestion={Math.min(currentIndex + 1, questions.length)}
            totalQuestions={questions.length}
            score={score}
            color="teal"
          />
          <GameTimer timeLeft={timeLeft} totalTime={GAME_TIME} color="teal" />
        </div>

        {currentQuestion && (
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[#1B1E20] p-6">
              {/* Play Diagram */}
              {currentQuestion.imageUrl ? (
                <div className="mb-6 rounded-xl border border-[#00F6E5]/20 bg-[#0A0A0A] p-4 overflow-hidden">
                  <div className="relative w-full h-96">
                    <Image
                      src={currentQuestion.imageUrl}
                      alt="Play diagram"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-xl border border-[#00F6E5]/20 bg-[#0A0A0A] p-4">
                  <div className="flex items-center justify-center h-96 text-slate-500">
                    <div className="text-center">
                      <PlayDiagramIcon className="h-16 w-16 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Diagram not available</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Play Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-slate-700/50 bg-[#1B1E20]/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Formation
                  </p>
                  <p className="text-sm font-bold text-white">{currentQuestion.play.formation_name}</p>
                </div>
                <div className="rounded-lg border border-slate-700/50 bg-[#1B1E20]/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Concept
                  </p>
                  <p className="text-sm font-bold text-white">{currentQuestion.play.concept || 'N/A'}</p>
                </div>
              </div>

              {/* Feedback after answering */}
              {isAnswered && (
                <div className={`rounded-lg border p-3 animate-slide-in ${
                  selectedAnswer === currentQuestion.play.name
                    ? 'border-[#00F6E5]/30 bg-[#00F6E5]/10'
                    : 'border-[#FF6A3D]/30 bg-[#FF6A3D]/10'
                }`}>
                  <p className={`text-sm font-bold ${
                    selectedAnswer === currentQuestion.play.name
                      ? 'text-[#00F6E5]'
                      : 'text-[#FF6A3D]'
                  }`}>
                    {selectedAnswer === currentQuestion.play.name
                      ? '✓ Correct! Great recognition!'
                      : `✗ The correct play is: ${currentQuestion.play.name}`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Answer Buttons */}
            <div className="p-6">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                What is this play called?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={isAnswered}
                    className={`px-6 py-4 rounded-lg text-sm font-bold text-center transition-all border-2 ${
                      isAnswered
                        ? option === currentQuestion.play.name
                          ? 'border-[#00F6E5] bg-[#00F6E5]/10 text-[#00F6E5]'
                          : selectedAnswer === option
                          ? 'border-[#FF6A3D] bg-[#FF6A3D]/10 text-[#FF6A3D]'
                          : 'border-slate-700/50 bg-[#1B1E20]/30 text-slate-500'
                        : 'border-slate-700 bg-[#1B1E20] text-white hover:border-[#00F6E5] hover:bg-[#00F6E5]/5'
                    } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {isAnswered && (
                <div className="mt-4 text-center animate-slide-in">
                  {selectedAnswer === currentQuestion.play.name ? (
                    <p className="text-lg font-bold text-[#00F6E5]">
                      +{150 + Math.floor(timeLeft * 2)} pts
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Better luck next time!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {isFinished && (
        <ResultsModal
          gameName="Play Name ID"
          totalQuestions={attempts}
          correctCount={correctCount}
          score={score}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}
    </SidebarLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function PlayDiagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 10V6" />
      <path d="M12 18v-4" />
      <path d="M10 12H6" />
      <path d="M18 12h-4" />
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
