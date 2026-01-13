"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { GameTimer, GameHeader, AnswerButton, ResultsModal } from "@/components/games";
import {
  type FormationId,
  FORMATIONS,
  getFormationById,
} from "@/domain/football";
import { FormationDiagram, GameDiagramWrapper } from "@/components/football";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface FormationPrompt {
  id: string;
  formationId: FormationId;
  label: string;
  description: string;
  correctAnswer: string; // Display name
  hint?: string;
  personnel?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME PROMPTS — Generated from shared formations
// ═══════════════════════════════════════════════════════════════════════════

const FORMATION_PROMPTS: FormationPrompt[] = FORMATIONS.map((formation) => ({
  id: `form-${formation.id}`,
  formationId: formation.id,
  label: formation.shortName,
  description: formation.description,
  correctAnswer: formation.name,
  personnel: formation.personnelLabel,
  hint: formation.keyFeatures[0],
}));

const FORMATION_OPTIONS: string[] = FORMATIONS.map((f) => f.name);

const GAME_TIME = 90; // Slightly longer for formation memory

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function FormationGame() {
  const router = useRouter();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [isFinished, setIsFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const [prompts, setPrompts] = useState<FormationPrompt[]>([]);
  
  useEffect(() => {
    const shuffled = [...FORMATION_PROMPTS].sort(() => Math.random() - 0.5);
    setPrompts(shuffled);
  }, []);

  const currentPrompt = prompts[currentIndex];
  
  // Get the full formation data for additional context
  const currentFormation = currentPrompt ? getFormationById(currentPrompt.formationId) : undefined;

  const handleGameEnd = useCallback(() => {
    setIsFinished(true);
    
    const sessionSummary = {
      gameType: "formation",
      totalQuestions: attempts,
      correctAnswers: correctCount,
      score: score,
      accuracy: attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0,
      timeSpent: GAME_TIME - timeLeft,
      timestamp: new Date().toISOString(),
    };
    
    console.log("📊 Session Summary:", sessionSummary);
  }, [attempts, correctCount, score, timeLeft]);

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
    if (isAnswered || !currentPrompt) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    setAttempts((prev) => prev + 1);

    const isCorrect = answer === currentPrompt.correctAnswer;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const timeBonus = Math.floor(timeLeft * 1.5);
      setScore((prev) => prev + 100 + timeBonus);
    }

    setTimeout(() => {
      if (currentIndex < prompts.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        handleGameEnd();
      }
    }, 1500);
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
    
    const shuffled = [...FORMATION_PROMPTS].sort(() => Math.random() - 0.5);
    setPrompts(shuffled);
  };

  const handleExit = () => {
    router.push("/games");
  };

  const startGame = () => {
    setGameStarted(true);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] holographic-grid">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-12">
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[#1B1E20] px-6 py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5C253] to-[#ffd97a] shadow-lg shadow-[#F5C253]/30">
                  <GridIcon className="h-10 w-10 text-[#0A0A0A]" />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-wide text-[#F5C253]">FORMATION</h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Memory Game
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-700/50 bg-[#1B1E20]/50 p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  How to Play
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5C253]">•</span>
                    Read the formation description
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5C253]">•</span>
                    Identify the formation name
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5C253]">•</span>
                    Learn personnel groupings
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F5C253]">•</span>
                    90 seconds to answer all questions
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/30 p-3">
                  <div className="font-mono text-xl font-bold text-white">90s</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Time</div>
                </div>
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/30 p-3">
                  <div className="font-mono text-xl font-bold text-white">{prompts.length}</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Questions</div>
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
                className="w-full !py-4 flex items-center justify-center gap-2 text-lg rounded-lg font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-[#F5C253] to-[#ffd97a] text-[#0A0A0A] shadow-lg shadow-[#F5C253]/25 hover:shadow-[#F5C253]/40"
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] holographic-grid">
      <Navbar />
      
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 space-y-4">
          <GameHeader
            title="FORMATION"
            subtitle="Memory Game"
            currentQuestion={Math.min(currentIndex + 1, prompts.length)}
            totalQuestions={prompts.length}
            score={score}
            color="gold"
          />
          <GameTimer timeLeft={timeLeft} totalTime={GAME_TIME} color="gold" />
        </div>

        {currentPrompt && (
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[#1B1E20] p-6">
              {/* Code-drawn Formation Diagram - Large & Readable */}
              {currentFormation && (
                <div className="mb-6">
                  <GameDiagramWrapper variant="formation" scale={1.4}>
                    <FormationDiagram formation={currentFormation} scalable={true} />
                  </GameDiagramWrapper>
                </div>
              )}

              {/* Text Description */}
              <div className="rounded-xl border border-[#F5C253]/20 bg-[#F5C253]/5 p-4">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-bold text-white">{currentPrompt.label}</h2>
                  {currentPrompt.personnel && (
                    <span className="rounded-full bg-[#1B1E20] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {currentPrompt.personnel}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-300">{currentPrompt.description}</p>
              </div>

              {isAnswered && selectedAnswer !== currentPrompt.correctAnswer && currentPrompt.hint && (
                <div className="mt-4 rounded-lg border border-[#F5C253]/30 bg-[#F5C253]/10 p-3">
                  <p className="text-sm text-[#F5C253]">
                    <span className="font-bold">💡 Hint:</span> {currentPrompt.hint}
                  </p>
                </div>
              )}
              
              {/* Show additional formation info after answering */}
              {isAnswered && currentFormation && (
                <div className="mt-4 rounded-lg border border-slate-700/50 bg-[#1B1E20]/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Common Plays
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentFormation.commonPlays?.map((play) => (
                      <span
                        key={play}
                        className="rounded bg-[#1B1E20] px-2 py-1 text-xs text-slate-400"
                      >
                        {play}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Answer Buttons */}
            <div className="p-6">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                Name the Formation
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {FORMATION_OPTIONS.map((option) => (
                  <AnswerButton
                    key={option}
                    label={option}
                    onClick={() => handleAnswer(option)}
                    disabled={isAnswered}
                    isSelected={selectedAnswer === option}
                    isCorrect={
                      isAnswered
                        ? option === currentPrompt.correctAnswer
                          ? true
                          : selectedAnswer === option
                          ? false
                          : null
                        : null
                    }
                    color="gold"
                  />
                ))}
              </div>

              {isAnswered && (
                <div className="mt-4 text-center animate-slide-in">
                  {selectedAnswer === currentPrompt.correctAnswer ? (
                    <p className="text-lg font-bold text-[#00F6E5]">✓ Correct! +{100 + Math.floor(timeLeft * 1.5)} pts</p>
                  ) : (
                    <p className="text-lg font-bold text-[#FF6A3D]">
                      ✗ Answer: {currentPrompt.correctAnswer}
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
          gameName="Formation"
          totalQuestions={attempts}
          correctCount={correctCount}
          score={score}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}
    </div>
  );
}

// Icons
function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

function FormationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* Offensive Line */}
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
      {/* QB */}
      <circle cx="12" cy="16" r="1.5" />
      {/* RB */}
      <circle cx="12" cy="20" r="1.5" />
      {/* WRs */}
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="21" cy="8" r="1.5" />
    </svg>
  );
}
