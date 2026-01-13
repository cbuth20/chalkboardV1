"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PlayerNavbar from "@/components/PlayerNavbar";
import { GameTimer, GameHeader, AnswerButton, ResultsModal } from "@/components/games";
import {
  type ProtectionId,
  PROTECTIONS,
  getProtectionById,
} from "@/domain/football";
import { BlitzDiagram, getBlitzScenarioForPrompt, GameDiagramWrapper } from "@/components/football";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface BlitzPrompt {
  id: string;
  protectionId: ProtectionId;
  label: string;
  description: string;
  correctAnswer: string; // Display name
  hint?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME PROMPTS — Using shared protection data
// ═══════════════════════════════════════════════════════════════════════════

const BLITZ_PROMPTS: BlitzPrompt[] = [
  {
    id: "blitz-1",
    protectionId: "slide-left",
    label: "Overload Left",
    description: "Pre-snap: DE/OLB stack on left side. Mike shifted weak. Safety creeping down to A-gap. 6 in the box with numbers advantage left.",
    correctAnswer: "Slide Left",
    hint: "Slide protection goes toward the overload",
  },
  {
    id: "blitz-2",
    protectionId: "slide-right",
    label: "Field Pressure",
    description: "Pre-snap: Nickel and boundary safety showing blitz from right. Corner rolled down. Overload to the field side.",
    correctAnswer: "Slide Right",
    hint: "Identify where the pressure is coming from",
  },
  {
    id: "blitz-3",
    protectionId: "max-protect",
    label: "Zero Blitz Look",
    description: "Pre-snap: All DBs in press. Both safeties walked up. LBs spread across the front. No deep help showing.",
    correctAnswer: "Max Protect",
    hint: "Keep extra blockers when you expect heavy pressure",
  },
  {
    id: "blitz-4",
    protectionId: "full-slide",
    label: "A-Gap Mugged",
    description: "Pre-snap: Mike and Will both showing A-gap blitz. Both guards have 1-on-1 threats. Center reading dual threats.",
    correctAnswer: "Full Slide",
    hint: "When both A-gaps are threatened, slide everyone",
  },
  {
    id: "blitz-5",
    protectionId: "slide-right",
    label: "Weak Side Fire",
    description: "Pre-snap: Sam backer walked up weak. Weak DE in wide-9. SS rotating down late. Strong side looks clean.",
    correctAnswer: "Slide Right",
    hint: "Slide away from the pressure",
  },
  {
    id: "blitz-6",
    protectionId: "bob",
    label: "Cross Dog",
    description: "Pre-snap: LBs showing movement. Mike walking toward A-gap, Will crossing behind. Twist/stunt look incoming.",
    correctAnswer: "BOB",
    hint: "Big on Big keeps RB clean for late blitzers",
  },
  {
    id: "blitz-7",
    protectionId: "rb-scan",
    label: "Delayed Pressure",
    description: "Pre-snap: 4-man rush look. LBs at depth. But safety eyes suggest late add. RB needs to read and react.",
    correctAnswer: "RB Scan",
    hint: "RB should check for late add-ons",
  },
  {
    id: "blitz-8",
    protectionId: "screen",
    label: "Corner Blitz",
    description: "Pre-snap: Field corner backed off, then creeping at snap. Nickel replacing deep. Quick pressure from the edge.",
    correctAnswer: "Screen",
    hint: "Use the pressure against itself",
  },
  {
    id: "blitz-9",
    protectionId: "full-slide",
    label: "Bear Front",
    description: "Pre-snap: 0-tech NT with DTs in 4i. Both guards covered. OLBs threatening off edge. Heavy run-stop look.",
    correctAnswer: "Full Slide",
    hint: "When the front is loaded, protect the middle",
  },
  {
    id: "blitz-10",
    protectionId: "max-protect",
    label: "Edge Pressure",
    description: "Pre-snap: 3-4 front. OLBs showing speed rush. DEs in 5-tech. LBs at depth reading. Speed off the edge is primary threat.",
    correctAnswer: "Max Protect",
    hint: "Keep the RB/TE in for edge protection",
  },
];

const PROTECTION_OPTIONS: string[] = PROTECTIONS.map((p) => p.name);

const GAME_TIME = 60;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function BlitzIdGame() {
  const router = useRouter();
  
  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [isFinished, setIsFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const [prompts, setPrompts] = useState<BlitzPrompt[]>([]);
  
  useEffect(() => {
    const shuffled = [...BLITZ_PROMPTS].sort(() => Math.random() - 0.5);
    setPrompts(shuffled);
  }, []);

  const currentPrompt = prompts[currentIndex];
  
  // Get the full protection data for additional context
  const currentProtection = currentPrompt ? getProtectionById(currentPrompt.protectionId) : undefined;

  const handleGameEnd = useCallback(() => {
    setIsFinished(true);
    
    const sessionSummary = {
      gameType: "blitz-id",
      totalQuestions: attempts,
      correctAnswers: correctCount,
      score: score,
      accuracy: attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0,
      timeSpent: GAME_TIME - timeLeft,
      timestamp: new Date().toISOString(),
    };
    
    console.log("📊 Session Summary:", sessionSummary);
  }, [attempts, correctCount, score, timeLeft]);

  // Timer logic
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
    
    const shuffled = [...BLITZ_PROMPTS].sort(() => Math.random() - 0.5);
    setPrompts(shuffled);
  };

  const handleExit = () => {
    router.push("/games");
  };

  const startGame = () => {
    setGameStarted(true);
  };

  // Start screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] holographic-grid">
        <PlayerNavbar />
        <main className="mx-auto max-w-2xl px-4 py-12">
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[#1B1E20] px-6 py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6A3D] to-[#ff8a5c] shadow-lg shadow-[#FF6A3D]/30">
                  <FlameIcon className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-wide text-[#FF6A3D]">BLITZ ID</h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Protection Challenge
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-700/50 bg-[#1B1E20]/50 p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  How to Play
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6A3D]">•</span>
                    Read the defensive front and pressure look
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6A3D]">•</span>
                    Call the right protection adjustment
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6A3D]">•</span>
                    Keep the QB clean for 60 seconds
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6A3D]">•</span>
                    Quick reads = bonus points
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-700/30 bg-[#1B1E20]/30 p-3">
                  <div className="font-mono text-xl font-bold text-white">60s</div>
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
                className="w-full !py-4 flex items-center justify-center gap-2 text-lg rounded-lg font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-[#FF6A3D] to-[#ff8a5c] text-white shadow-lg shadow-[#FF6A3D]/25 hover:shadow-[#FF6A3D]/40"
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
      <PlayerNavbar />
      
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 space-y-4">
          <GameHeader
            title="BLITZ ID"
            subtitle="Protection Challenge"
            currentQuestion={Math.min(currentIndex + 1, prompts.length)}
            totalQuestions={prompts.length}
            score={score}
            color="orange"
          />
          <GameTimer timeLeft={timeLeft} totalTime={GAME_TIME} color="orange" />
        </div>

        {currentPrompt && (
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[#1B1E20] p-6">
              {/* Code-drawn Blitz/Pressure Diagram - Large & Readable */}
              <div className="mb-6">
                <GameDiagramWrapper variant="blitz" scale={1.4}>
                  <BlitzDiagram
                    blitzType={getBlitzScenarioForPrompt(currentPrompt.label)}
                    protection={currentProtection}
                    scalable={true}
                  />
                </GameDiagramWrapper>
              </div>

              {/* Text Description */}
              <div className="rounded-xl border border-[#FF6A3D]/20 bg-[#FF6A3D]/5 p-4">
                <h2 className="mb-2 text-lg font-bold text-white">{currentPrompt.label}</h2>
                <p className="text-sm leading-relaxed text-slate-300">{currentPrompt.description}</p>
              </div>

              {isAnswered && selectedAnswer !== currentPrompt.correctAnswer && currentPrompt.hint && (
                <div className="mt-4 rounded-lg border border-[#F5C253]/30 bg-[#F5C253]/10 p-3">
                  <p className="text-sm text-[#F5C253]">
                    <span className="font-bold">💡 Hint:</span> {currentPrompt.hint}
                  </p>
                </div>
              )}
              
              {/* Show additional protection info after answering */}
              {isAnswered && currentProtection && (
                <div className="mt-4 rounded-lg border border-slate-700/50 bg-[#1B1E20]/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Coaching Point
                  </p>
                  <p className="text-sm text-slate-400">
                    {currentProtection.coachingPoints[0]}
                  </p>
                </div>
              )}
            </div>

            {/* Answer Buttons */}
            <div className="p-6">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                Call the Protection
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROTECTION_OPTIONS.map((option) => (
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
                    color="orange"
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
          gameName="Blitz ID"
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
function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
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

function BlitzIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
