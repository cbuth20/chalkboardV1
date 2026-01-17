"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "@/components/SidebarLayout";
import { GameTimer, GameHeader, AnswerButton, ResultsModal } from "@/components/games";
import { type RouteId, type ConceptId } from "@/types/football";

interface RoutePrompt {
  id: string;
  routeId?: RouteId;
  conceptId?: ConceptId;
  label: string;
  description: string;
  correctAnswer: string; // Display name
  hint?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME PROMPTS — Route and concept identification
// ═══════════════════════════════════════════════════════════════════════════

const ROUTE_PROMPTS: RoutePrompt[] = [
  {
    id: "route-slant",
    routeId: "slant",
    label: "Slant",
    description: "45-degree angle cut inside, quick timing route",
    correctAnswer: "Slant",
    hint: "Inside break at 5-6 yards",
  },
  {
    id: "route-out",
    routeId: "out",
    label: "Out",
    description: "90-degree break to sideline, used to attack flat",
    correctAnswer: "Out",
    hint: "Outside break at 10-12 yards",
  },
  {
    id: "route-corner",
    routeId: "corner",
    label: "Corner",
    description: "Vertical stem then 45-degree break to corner",
    correctAnswer: "Corner",
    hint: "Outside break at 12-15 yards",
  },
  {
    id: "route-post",
    routeId: "post",
    label: "Post",
    description: "Deep route breaking to the post/goal posts",
    correctAnswer: "Post",
    hint: "Inside break at 15+ yards",
  },
  {
    id: "route-go",
    routeId: "go",
    label: "Go",
    description: "Straight vertical route, take the top off",
    correctAnswer: "Go",
    hint: "Vertical route, no break",
  },
  {
    id: "concept-mesh",
    conceptId: "mesh",
    label: "Mesh",
    description: "Two crossing routes at 5-6 yards creating natural picks",
    correctAnswer: "Mesh",
    hint: "Crossers mesh tight against man coverage",
  },
  {
    id: "concept-flood",
    conceptId: "flood",
    label: "Flood",
    description: "Three-level route concept stretching zone vertically",
    correctAnswer: "Flood",
    hint: "High-low-flat progression",
  },
];

// Helper functions
function getRouteById(id: RouteId) {
  return ROUTE_PROMPTS.find(p => p.routeId === id);
}

function getConceptById(id: ConceptId) {
  return ROUTE_PROMPTS.find(p => p.conceptId === id);
}

// Create route/concept options - combine routes and concepts for answers
const ROUTE_OPTIONS: string[] = [
  // Individual routes
  "Slant",
  "Out", 
  "In",
  "Curl",
  "Corner",
  "Post",
  "Go",
  // Concepts
  "Mesh",
  "Mills",
  "Levels",
  "Smash",
  "Flood",
];

const GAME_TIME = 60;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function RouteTagGame() {
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
  
  const [prompts, setPrompts] = useState<RoutePrompt[]>([]);
  
  useEffect(() => {
    const shuffled = [...ROUTE_PROMPTS].sort(() => Math.random() - 0.5);
    setPrompts(shuffled);
  }, []);

  const currentPrompt = prompts[currentIndex];
  
  // Get additional context from shared models
  const currentRoute = currentPrompt?.routeId ? getRouteById(currentPrompt.routeId) : undefined;
  const currentConcept = currentPrompt?.conceptId ? getConceptById(currentPrompt.conceptId) : undefined;

  const handleGameEnd = useCallback(() => {
    setIsFinished(true);
    
    const sessionSummary = {
      gameType: "route-tag",
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
    
    const shuffled = [...ROUTE_PROMPTS].sort(() => Math.random() - 0.5);
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
      <SidebarLayout>
        <main className="mx-auto max-w-2xl px-4 py-12 holographic-grid">
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[#1B1E20] px-6 py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3DF3FF] to-[#00d4ff] shadow-lg shadow-[#3DF3FF]/30">
                  <RouteIcon className="h-10 w-10 text-[#0A0A0A]" />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-wide text-[#3DF3FF]">ROUTE TAG</h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Pattern Recognition
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-700/50 bg-[#1B1E20]/50 p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  How to Play
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3DF3FF]">•</span>
                    Read the route or concept description
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3DF3FF]">•</span>
                    Identify the route name or concept
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3DF3FF]">•</span>
                    Learn to recognize routes and combos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3DF3FF]">•</span>
                    Fast and accurate = max points
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
                className="w-full !py-4 flex items-center justify-center gap-2 text-lg rounded-lg font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-[#3DF3FF] to-[#00d4ff] text-[#0A0A0A] shadow-lg shadow-[#3DF3FF]/25 hover:shadow-[#3DF3FF]/40"
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

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-3xl px-4 py-6 holographic-grid">
        <div className="mb-6 space-y-4">
          <GameHeader
            title="ROUTE TAG"
            subtitle="Pattern Recognition"
            currentQuestion={Math.min(currentIndex + 1, prompts.length)}
            totalQuestions={prompts.length}
            score={score}
            color="ice"
          />
          <GameTimer timeLeft={timeLeft} totalTime={GAME_TIME} color="teal" />
        </div>

        {currentPrompt && (
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[#1B1E20] p-6">
              {/* Code-drawn Route/Concept Diagram - Large & Readable */}
              {/* <div className="mb-6">
                <GameDiagramWrapper variant="route" scale={1.4}>
                  <RouteDiagram
                    route={currentRoute}
                    concept={currentConcept}
                    scalable={true}
                  />
                </GameDiagramWrapper>
              </div> */}

              {/* Text Description */}
              <div className="rounded-xl border border-[#3DF3FF]/20 bg-[#3DF3FF]/5 p-4">
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
              
              {/* Show additional route/concept info after answering */}
              {isAnswered && currentRoute && (
                <div className="mt-4 rounded-lg border border-slate-700/50 bg-[#1B1E20]/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Best Against
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentRoute.bestAgainst.map((coverage) => (
                      <span
                        key={coverage}
                        className="rounded bg-[#3DF3FF]/10 border border-[#3DF3FF]/30 px-2 py-1 text-xs text-[#3DF3FF]"
                      >
                        {coverage}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {isAnswered && currentConcept && (
                <div className="mt-4 rounded-lg border border-slate-700/50 bg-[#1B1E20]/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Coaching Point
                  </p>
                  <p className="text-sm text-slate-400">
                    {currentConcept.coachingPoints[0]}
                  </p>
                </div>
              )}
            </div>

            {/* Answer Buttons */}
            <div className="p-6">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                Name the Route/Concept
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {ROUTE_OPTIONS.map((option) => (
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
                    color="ice"
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
          gameName="Route Tag"
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

// Icons
function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V7" />
      <path d="M7 12l5-5 5 5" />
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

function RouteTreeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="20" r="2" />
      <path d="M12 18V10" />
      <path d="M12 10l-5-5" />
      <path d="M12 10l5-5" />
      <path d="M12 10l0-6" />
    </svg>
  );
}
