"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PlayerNavbar from "@/components/PlayerNavbar";
import { GameTimer, GameHeader, ResultsModal } from "@/components/games";
import {
  PLAYS,
  type PlayDefinition,
  type SkillPosition,
  type AssignmentCategory,
  type AssignmentQuestion,
  getPositionsForPlay,
  getPositionAssignment,
  generateQuestionsForPosition,
} from "@/domain/football";
import { getFormationById } from "@/domain/football";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type GameMode = "learn" | "test";
type GamePhase = "select-play" | "select-position" | "quiz" | "results" | "generate-test";

interface TestConfig {
  selectedPlays: string[];
  selectedPositions: SkillPosition[];
  questionCount: number;
}

const QUIZ_CATEGORIES: AssignmentCategory[] = [
  "alignment",
  "landmark", 
  "assignment",
  "read",
  "adjustment",
];

const CATEGORY_LABELS: Record<AssignmentCategory, string> = {
  alignment: "ALIGNMENT",
  landmark: "LANDMARK",
  assignment: "ASSIGNMENT",
  motion: "MOTION",
  read: "READ",
  adjustment: "ADJUSTMENT",
};

const CATEGORY_QUESTIONS: Record<AssignmentCategory, string> = {
  alignment: "Where do you line up?",
  landmark: "What's your aiming point?",
  assignment: "What's your assignment?",
  motion: "What's your pre-snap motion?",
  read: "What are you reading?",
  adjustment: "How do you adjust vs Man?",
};

const POSITION_LABELS: Record<SkillPosition, string> = {
  QB: "Quarterback",
  RB: "Running Back",
  FB: "Fullback",
  X: "X Receiver (Split End)",
  Z: "Z Receiver (Flanker)",
  H: "H-Back / Slot",
  Y: "Y Receiver / TE",
  TE: "Tight End",
};

const GAME_TIME = 120; // 2 minutes for test mode

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE
// ═══════════════════════════════════════════════════════════════════════════

interface AssignmentResults {
  playId: string;
  position: SkillPosition;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timestamp: string;
}

function saveResults(results: AssignmentResults) {
  try {
    const existing = localStorage.getItem("chalkboard_assignment_results");
    const allResults: AssignmentResults[] = existing ? JSON.parse(existing) : [];
    allResults.push(results);
    // Keep last 50 results
    const trimmed = allResults.slice(-50);
    localStorage.setItem("chalkboard_assignment_results", JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save results:", e);
  }
}

function getResults(): AssignmentResults[] {
  try {
    const existing = localStorage.getItem("chalkboard_assignment_results");
    return existing ? JSON.parse(existing) : [];
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AssignmentTrackerPage() {
  const router = useRouter();

  // Game state
  const [mode, setMode] = useState<GameMode>("learn");
  const [phase, setPhase] = useState<GamePhase>("select-play");
  const [selectedPlay, setSelectedPlay] = useState<PlayDefinition | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<SkillPosition | null>(null);

  // Quiz state
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);

  // Timer state (only for test mode)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [isFinished, setIsFinished] = useState(false);

  // Animation state
  const [showFlash, setShowFlash] = useState(false);

  // Test Generator state
  const [testConfig, setTestConfig] = useState<TestConfig>({
    selectedPlays: [],
    selectedPositions: [],
    questionCount: 15,
  });
  const [isCustomTest, setIsCustomTest] = useState(false);

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  // Timer effect for test mode
  useEffect(() => {
    if (mode !== "test" || phase !== "quiz" || isFinished || timeLeft <= 0) return;

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
  }, [mode, phase, isFinished, timeLeft]);

  // Handle end of quiz
  const handleQuizEnd = useCallback(() => {
    setIsFinished(true);
    
    // For custom tests, save with "custom-test" as playId
    const results: AssignmentResults = {
      playId: isCustomTest ? "custom-test" : (selectedPlay?.id || "unknown"),
      position: isCustomTest ? ("MIX" as SkillPosition) : (selectedPosition || "QB"),
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
      timestamp: new Date().toISOString(),
    };
    
    saveResults(results);
  }, [selectedPlay, selectedPosition, questions.length, correctCount, isCustomTest]);

  // Check if time is up
  useEffect(() => {
    if (timeLeft === 0 && !isFinished) {
      handleQuizEnd();
    }
  }, [timeLeft, isFinished, handleQuizEnd]);

  // Select a play
  const handlePlaySelect = (play: PlayDefinition) => {
    setSelectedPlay(play);
    setPhase("select-position");
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);
  };

  // Select a position and start quiz
  const handlePositionSelect = (position: SkillPosition) => {
    if (!selectedPlay) return;
    
    setSelectedPosition(position);
    const generatedQuestions = generateQuestionsForPosition(selectedPlay, position);
    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setPhase("quiz");
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);
  };

  // Handle answer selection
  const handleAnswer = (answer: string) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      const basePoints = 100;
      const streakBonus = streak * 10;
      const timeBonus = mode === "test" ? Math.floor(timeLeft * 0.5) : 0;
      setScore((prev) => prev + basePoints + streakBonus + timeBonus);
    } else {
      setStreak(0);
    }

    // Auto-advance in test mode, manual in learn mode
    const delay = mode === "learn" ? 2500 : 1500;
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        handleQuizEnd();
      }
    }, delay);
  };

  // Reset and start over
  const handleRestart = () => {
    setPhase("select-play");
    setSelectedPlay(null);
    setSelectedPosition(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setTimeLeft(GAME_TIME);
    setIsFinished(false);
    setIsCustomTest(false);
    setTestConfig({
      selectedPlays: [],
      selectedPositions: [],
      questionCount: 15,
    });
  };

  // Toggle play selection for custom test
  const togglePlaySelection = (playId: string) => {
    setTestConfig(prev => ({
      ...prev,
      selectedPlays: prev.selectedPlays.includes(playId)
        ? prev.selectedPlays.filter(id => id !== playId)
        : [...prev.selectedPlays, playId]
    }));
  };

  // Toggle position selection for custom test
  const togglePositionSelection = (position: SkillPosition) => {
    setTestConfig(prev => ({
      ...prev,
      selectedPositions: prev.selectedPositions.includes(position)
        ? prev.selectedPositions.filter(p => p !== position)
        : [...prev.selectedPositions, position]
    }));
  };

  // Generate custom test questions
  const generateCustomTest = () => {
    const allQuestions: AssignmentQuestion[] = [];
    
    // Get questions for each selected play/position combination
    for (const playId of testConfig.selectedPlays) {
      const play = PLAYS.find(p => p.id === playId);
      if (!play) continue;
      
      const playPositions = getPositionsForPlay(playId);
      const positionsToUse = testConfig.selectedPositions.length > 0
        ? testConfig.selectedPositions.filter(pos => playPositions.includes(pos))
        : playPositions;
      
      for (const position of positionsToUse) {
        const questions = generateQuestionsForPosition(play, position);
        // Add play name to each question for context
        questions.forEach(q => {
          (q as AssignmentQuestion & { playName?: string }).playName = play.shortName;
        });
        allQuestions.push(...questions);
      }
    }
    
    // Shuffle and limit questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const limited = shuffled.slice(0, testConfig.questionCount);
    
    // Only start quiz if we have questions
    if (limited.length === 0) return;
    
    setQuestions(limited);
    setCurrentQuestionIndex(0);
    setIsCustomTest(true);
    setMode("test"); // Custom tests always use test mode
    setTimeLeft(limited.length * 15); // 15 seconds per question
    setPhase("quiz");
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);
  };

  // Generate random quick test
  const generateQuickTest = () => {
    // Select 3 random plays
    const shuffledPlays = [...PLAYS].sort(() => Math.random() - 0.5).slice(0, 3);
    const allQuestions: AssignmentQuestion[] = [];
    
    for (const play of shuffledPlays) {
      const positions = getPositionsForPlay(play.id);
      // Pick 1-2 random positions per play
      const randomPositions = [...positions].sort(() => Math.random() - 0.5).slice(0, 2);
      
      for (const position of randomPositions) {
        const questions = generateQuestionsForPosition(play, position);
        questions.forEach(q => {
          (q as AssignmentQuestion & { playName?: string }).playName = play.shortName;
        });
        allQuestions.push(...questions);
      }
    }
    
    // Shuffle and take 10 questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const limited = shuffled.slice(0, 10);
    
    // Only start quiz if we have questions
    if (limited.length === 0) return;
    
    setQuestions(limited);
    setCurrentQuestionIndex(0);
    setIsCustomTest(true);
    setMode("test");
    setTimeLeft(150); // 2.5 minutes for quick test
    setPhase("quiz");
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);
  };

  // Play again with same play/position
  const handlePlayAgain = () => {
    if (!selectedPlay || !selectedPosition) return;
    
    const generatedQuestions = generateQuestionsForPosition(selectedPlay, selectedPosition);
    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setTimeLeft(GAME_TIME);
    setIsFinished(false);
    setPhase("quiz");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] holographic-grid">
      <PlayerNavbar />

      {/* Flash overlay for transitions */}
      {showFlash && (
        <div className="fixed inset-0 z-50 bg-[#00F6E5]/10 pointer-events-none animate-flash" />
      )}

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* ═══════════════════════════════════════════════════════════════════
            MODE TOGGLE (shown when not in quiz)
        ═══════════════════════════════════════════════════════════════════ */}
        {phase !== "quiz" && (
          <div className="mb-6 flex justify-center">
            <div className="relative flex rounded-xl border border-[#1B1E20] bg-[#0A0A0A] p-1">
              <div
                className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg bg-gradient-to-r transition-all duration-300 ${
                  mode === "learn"
                    ? "left-1 from-[#00F6E5] to-[#00d4c5]"
                    : "left-[calc(50%+2px)] from-[#FF6A3D] to-[#ff8a5c]"
                }`}
              />
              <button
                onClick={() => setMode("learn")}
                className={`relative z-10 flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${
                  mode === "learn" ? "text-[#0A0A0A]" : "text-slate-400 hover:text-white"
                }`}
              >
                <BookIcon className="h-4 w-4" />
                Learn
              </button>
              <button
                onClick={() => setMode("test")}
                className={`relative z-10 flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${
                  mode === "test" ? "text-[#0A0A0A]" : "text-slate-400 hover:text-white"
                }`}
              >
                <TimerIcon className="h-4 w-4" />
                Test
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PHASE: SELECT PLAY
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === "select-play" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00F6E5] to-[#00d4c5] shadow-lg shadow-[#00F6E5]/30 animate-pulse-glow">
                  <ClipboardIcon className="h-10 w-10 text-[#0A0A0A]" />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-wide text-[#00F6E5]">ASSIGNMENT TRACKER</h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                {mode === "learn" ? "Learning Mode — No Timer" : "Test Mode — Beat the Clock"}
              </p>
            </div>

            {/* Generate Personal Test Section */}
            <div className="glass-card p-6 border-[#F5C253]/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5C253]/15 border border-[#F5C253]/30">
                    <TestTubeIcon className="h-5 w-5 text-[#F5C253]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#F5C253]">
                      Generate Personal Test
                    </h2>
                    <p className="text-xs text-slate-500">Create a custom quiz with multiple plays</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Quick Random Test */}
                <button
                  onClick={generateQuickTest}
                  className="group relative overflow-hidden rounded-xl border border-[#FF6A3D]/30 bg-gradient-to-br from-[#FF6A3D]/10 to-transparent p-4 text-left transition-all hover:border-[#FF6A3D]/50 hover:shadow-lg hover:shadow-[#FF6A3D]/10"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <ZapIcon className="h-5 w-5 text-[#FF6A3D]" />
                    <span className="font-bold text-white">Quick Random Test</span>
                  </div>
                  <p className="text-xs text-slate-400">10 questions from random plays • 2.5 min</p>
                  <div className="absolute top-2 right-2">
                    <span className="rounded-full bg-[#FF6A3D]/20 px-2 py-0.5 text-[9px] font-bold uppercase text-[#FF6A3D]">
                      Fast
                    </span>
                  </div>
                </button>

                {/* Custom Test Builder */}
                <button
                  onClick={() => setPhase("generate-test")}
                  className="group relative overflow-hidden rounded-xl border border-[#F5C253]/30 bg-gradient-to-br from-[#F5C253]/10 to-transparent p-4 text-left transition-all hover:border-[#F5C253]/50 hover:shadow-lg hover:shadow-[#F5C253]/10"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <SettingsIcon className="h-5 w-5 text-[#F5C253]" />
                    <span className="font-bold text-white">Build Custom Test</span>
                  </div>
                  <p className="text-xs text-slate-400">Choose plays, positions & question count</p>
                  <div className="absolute top-2 right-2">
                    <span className="rounded-full bg-[#F5C253]/20 px-2 py-0.5 text-[9px] font-bold uppercase text-[#F5C253]">
                      Custom
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Play Selection Grid */}
            <div className="glass-card p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                Or Select a Single Play to Study
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLAYS.map((play) => (
                  <PlayCard
                    key={play.id}
                    play={play}
                    onClick={() => handlePlaySelect(play)}
                  />
                ))}
              </div>
            </div>

            {/* Recent Results */}
            <RecentResults />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PHASE: GENERATE TEST
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === "generate-test" && (
          <div className="space-y-6 animate-fade-in">
            {/* Back button */}
            <button
              onClick={() => setPhase("select-play")}
              className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back
            </button>

            {/* Header */}
            <div className="glass-card p-6 border-[#F5C253]/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#F5C253] to-[#ffd97a] shadow-lg shadow-[#F5C253]/30">
                  <TestTubeIcon className="h-7 w-7 text-[#0A0A0A]" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-wide text-[#F5C253]">BUILD YOUR TEST</h1>
                  <p className="text-sm text-slate-400">Select plays and positions to generate a custom quiz</p>
                </div>
              </div>

              {/* Stats preview */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[#1B1E20]/50 border border-slate-800">
                <div className="text-center">
                  <div className="font-mono text-2xl font-bold text-[#00F6E5]">{testConfig.selectedPlays.length}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Plays</div>
                </div>
                <div className="text-center border-x border-slate-700">
                  <div className="font-mono text-2xl font-bold text-[#F5C253]">{testConfig.selectedPositions.length || "All"}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Positions</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl font-bold text-[#FF6A3D]">{testConfig.questionCount}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Questions</div>
                </div>
              </div>
            </div>

            {/* Play Selection */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Select Plays to Include
                </h2>
                <button
                  onClick={() => setTestConfig(prev => ({
                    ...prev,
                    selectedPlays: prev.selectedPlays.length === PLAYS.length ? [] : PLAYS.map(p => p.id)
                  }))}
                  className="text-xs font-semibold text-[#00F6E5] hover:text-[#3DF3FF] transition-colors"
                >
                  {testConfig.selectedPlays.length === PLAYS.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLAYS.map((play) => {
                  const isSelected = testConfig.selectedPlays.includes(play.id);
                  return (
                    <button
                      key={play.id}
                      onClick={() => togglePlaySelection(play.id)}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? "border-[#00F6E5] bg-[#00F6E5]/10"
                          : "border-slate-700/50 bg-[#1B1E20]/30 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? "border-[#00F6E5] bg-[#00F6E5]" 
                            : "border-slate-600"
                        }`}>
                          {isSelected && <CheckIcon className="h-3 w-3 text-[#0A0A0A]" />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${
                          play.playType === "pass" ? "text-[#00F6E5]" :
                          play.playType === "run" ? "text-[#F5C253]" :
                          "text-[#FF6A3D]"
                        }`}>
                          {play.playType}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-300"}`}>
                        {play.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position Selection */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Filter by Position (Optional)
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">Leave empty to include all positions</p>
                </div>
                {testConfig.selectedPositions.length > 0 && (
                  <button
                    onClick={() => setTestConfig(prev => ({ ...prev, selectedPositions: [] }))}
                    className="text-xs font-semibold text-slate-500 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(["QB", "RB", "FB", "X", "Z", "H", "Y", "TE"] as SkillPosition[]).map((pos) => {
                  const isSelected = testConfig.selectedPositions.includes(pos);
                  return (
                    <button
                      key={pos}
                      onClick={() => togglePositionSelection(pos)}
                      className={`rounded-lg border px-4 py-2 font-bold transition-all ${
                        isSelected
                          ? "border-[#F5C253] bg-[#F5C253]/10 text-[#F5C253]"
                          : "border-slate-700/50 bg-[#1B1E20]/30 text-slate-400 hover:border-slate-600 hover:text-white"
                      }`}
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Count */}
            <div className="glass-card p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                Number of Questions
              </h2>
              <div className="flex items-center gap-4">
                {[10, 15, 20, 25, 30].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTestConfig(prev => ({ ...prev, questionCount: count }))}
                    className={`rounded-lg border px-4 py-2 font-mono font-bold transition-all ${
                      testConfig.questionCount === count
                        ? "border-[#FF6A3D] bg-[#FF6A3D]/10 text-[#FF6A3D]"
                        : "border-slate-700/50 bg-[#1B1E20]/30 text-slate-400 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Estimated time: {Math.ceil(testConfig.questionCount * 15 / 60)} minutes
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateCustomTest}
              disabled={testConfig.selectedPlays.length === 0}
              className={`w-full rounded-xl py-4 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 ${
                testConfig.selectedPlays.length > 0
                  ? "bg-gradient-to-r from-[#F5C253] to-[#ffd97a] text-[#0A0A0A] shadow-lg shadow-[#F5C253]/25 hover:shadow-[#F5C253]/40"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <RocketIcon className="h-5 w-5" />
              Generate Test ({testConfig.selectedPlays.length} plays, {testConfig.questionCount} questions)
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PHASE: SELECT POSITION
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === "select-position" && selectedPlay && (
          <div className="space-y-6 animate-slide-in">
            {/* Back button */}
            <button
              onClick={() => setPhase("select-play")}
              className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back to Plays
            </button>

            {/* Play Info Header */}
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00F6E5]/20 to-[#00F6E5]/5 border border-[#00F6E5]/30">
                  <PlayIcon className="h-8 w-8 text-[#00F6E5]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00F6E5]">
                      {selectedPlay.concept || selectedPlay.playType}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      selectedPlay.playType === "pass" 
                        ? "bg-[#00F6E5]/10 text-[#00F6E5]" 
                        : selectedPlay.playType === "run"
                        ? "bg-[#F5C253]/10 text-[#F5C253]"
                        : "bg-[#FF6A3D]/10 text-[#FF6A3D]"
                    }`}>
                      {selectedPlay.playType}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{selectedPlay.name}</h2>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {selectedPlay.description}
                  </p>
                </div>
              </div>

              {/* Key Points */}
              <div className="mt-4 pt-4 border-t border-[#1B1E20]">
                <div className="flex flex-wrap gap-2">
                  {selectedPlay.keyPoints.map((point, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-[#1B1E20] px-2.5 py-1 text-xs text-slate-300"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Play Diagram */}
            <div className="glass-card overflow-hidden">
              <div className="border-b border-[#1B1E20] px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Formation: {getFormationById(selectedPlay.formation)?.name || selectedPlay.formation}
                </span>
                <span className="text-xs text-slate-500">Tap a position to start</span>
              </div>
              <div className="p-4">
                <PlayDiagram
                  play={selectedPlay}
                  onPositionSelect={handlePositionSelect}
                />
              </div>
            </div>

            {/* Position Grid */}
            <div className="glass-card p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                Select Your Position
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {getPositionsForPlay(selectedPlay.id).map((pos) => (
                  <PositionButton
                    key={pos}
                    position={pos}
                    onClick={() => handlePositionSelect(pos)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PHASE: QUIZ
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === "quiz" && currentQuestion && (
          <div className="space-y-4 animate-fade-in">
            {/* Header with Timer */}
            <GameHeader
              title={isCustomTest ? "CUSTOM TEST" : (selectedPlay?.shortName || "Quiz")}
              subtitle={isCustomTest 
                ? `${testConfig.selectedPlays.length} Plays • Mixed Positions`
                : `${POSITION_LABELS[selectedPosition!]} Quiz`
              }
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              score={score}
              color={isCustomTest ? "gold" : "teal"}
            />

            {mode === "test" && (
              <GameTimer timeLeft={timeLeft} totalTime={isCustomTest ? testConfig.questionCount * 15 : GAME_TIME} color={isCustomTest ? "gold" : "teal"} />
            )}

            {/* Streak indicator */}
            {streak >= 2 && (
              <div className="flex justify-center animate-scale-in">
                <div className="flex items-center gap-2 rounded-full bg-[#F5C253]/10 border border-[#F5C253]/30 px-4 py-1.5">
                  <FireIcon className="h-4 w-4 text-[#F5C253] flame-icon" />
                  <span className="font-mono text-sm font-bold text-[#F5C253]">{streak} STREAK</span>
                </div>
              </div>
            )}

            {/* Quiz Card */}
            <div className="glass-card overflow-hidden">
              {/* Category Header */}
              <div className={`bg-gradient-to-r ${isCustomTest ? "from-[#F5C253]/10" : "from-[#00F6E5]/10"} to-transparent border-b ${isCustomTest ? "border-[#F5C253]/20" : "border-[#00F6E5]/20"} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isCustomTest ? "bg-[#F5C253]/15 border-[#F5C253]/30" : "bg-[#00F6E5]/15 border-[#00F6E5]/30"} border`}>
                      <CategoryIcon category={currentQuestion.category} className={`h-5 w-5 ${isCustomTest ? "text-[#F5C253]" : "text-[#00F6E5]"}`} />
                    </div>
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${isCustomTest ? "text-[#F5C253]" : "text-[#00F6E5]"}`}>
                        {CATEGORY_LABELS[currentQuestion.category]}
                      </span>
                      <p className="text-lg font-semibold text-white">
                        {CATEGORY_QUESTIONS[currentQuestion.category]}
                      </p>
                    </div>
                  </div>
                  {/* Show play name badge for custom tests */}
                  {isCustomTest && (currentQuestion as AssignmentQuestion & { playName?: string }).playName && (
                    <div className="rounded-lg bg-[#1B1E20] border border-slate-700 px-3 py-1.5">
                      <span className="text-xs font-bold text-[#00F6E5]">
                        {(currentQuestion as AssignmentQuestion & { playName?: string }).playName}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">• {currentQuestion.position}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6">
                {/* Learning Mode: Show play context */}
                {mode === "learn" && !isCustomTest && selectedPlay && selectedPosition && (
                  <div className="mb-6 rounded-xl border border-slate-700/50 bg-[#1B1E20]/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {selectedPlay.name}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-500">
                        {POSITION_LABELS[selectedPosition]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{selectedPlay.description}</p>
                  </div>
                )}

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const isSelected = selectedAnswer === option;
                    
                    let buttonStyle = "border-slate-700/50 bg-[#1B1E20]/50 hover:bg-[#1B1E20] hover:border-slate-600";
                    
                    if (isAnswered) {
                      if (isCorrect) {
                        buttonStyle = "border-[#00F6E5] bg-[#00F6E5]/10 text-[#00F6E5]";
                      } else if (isSelected && !isCorrect) {
                        buttonStyle = "border-[#FF6A3D] bg-[#FF6A3D]/10 text-[#FF6A3D]";
                      } else {
                        buttonStyle = "border-slate-800 bg-[#1B1E20]/30 text-slate-600";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        disabled={isAnswered}
                        className={`w-full rounded-xl border p-4 text-left transition-all ${buttonStyle} ${
                          !isAnswered ? "hover:scale-[1.01] active:scale-[0.99]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isAnswered && isCorrect
                              ? "bg-[#00F6E5] text-[#0A0A0A]"
                              : isAnswered && isSelected && !isCorrect
                              ? "bg-[#FF6A3D] text-white"
                              : "bg-slate-700 text-slate-300"
                          }`}>
                            {isAnswered && isCorrect ? "✓" : isAnswered && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + index)}
                          </span>
                          <span className={`text-sm leading-relaxed ${
                            isAnswered && !isCorrect && !isSelected ? "text-slate-600" : "text-slate-200"
                          }`}>
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {isAnswered && (
                  <div className={`mt-6 rounded-xl p-4 animate-slide-in ${
                    selectedAnswer === currentQuestion.correctAnswer
                      ? "bg-[#00F6E5]/10 border border-[#00F6E5]/30"
                      : "bg-[#FF6A3D]/10 border border-[#FF6A3D]/30"
                  }`}>
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00F6E5] text-[#0A0A0A]">
                          <CheckIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-[#00F6E5]">Correct!</p>
                          <p className="text-sm text-slate-400">
                            +{100 + streak * 10}{mode === "test" ? ` (+${Math.floor(timeLeft * 0.5)} time bonus)` : ""} points
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6A3D] text-white">
                            <XIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[#FF6A3D]">Incorrect</p>
                            <p className="text-sm text-slate-400">
                              Streak reset to 0
                            </p>
                          </div>
                        </div>
                        <div className="rounded-lg bg-[#1B1E20]/50 p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Correct Answer:
                          </p>
                          <p className="text-sm text-[#00F6E5]">{currentQuestion.correctAnswer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-[#1B1E20]">
                <div
                  className="h-full bg-gradient-to-r from-[#00F6E5] to-[#3DF3FF] transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            RESULTS MODAL
        ═══════════════════════════════════════════════════════════════════ */}
        {isFinished && (
          <ResultsModal
            gameName={`${selectedPlay?.shortName || "Assignment"} - ${selectedPosition || ""}`}
            totalQuestions={questions.length}
            correctCount={correctCount}
            score={score}
            onPlayAgain={handlePlayAgain}
            onExit={() => router.push("/games")}
          />
        )}
      </main>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function PlayCard({ play, onClick }: { play: PlayDefinition; onClick: () => void }) {
  const typeColors = {
    pass: { bg: "bg-[#00F6E5]/10", border: "border-[#00F6E5]/30", text: "text-[#00F6E5]" },
    run: { bg: "bg-[#F5C253]/10", border: "border-[#F5C253]/30", text: "text-[#F5C253]" },
    rpo: { bg: "bg-[#FF6A3D]/10", border: "border-[#FF6A3D]/30", text: "text-[#FF6A3D]" },
    screen: { bg: "bg-[#3DF3FF]/10", border: "border-[#3DF3FF]/30", text: "text-[#3DF3FF]" },
  };
  
  const colors = typeColors[play.playType];

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-[#1B1E20]/50 p-4 text-left transition-all hover:border-[#00F6E5]/40 hover:bg-[#1B1E20] hover:shadow-lg hover:shadow-[#00F6E5]/10 hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${colors.bg} ${colors.text}`}>
          {play.playType}
        </span>
        {play.concept && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {play.concept}
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-white group-hover:text-[#00F6E5] transition-colors">
        {play.name}
      </h3>
      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
        {play.description}
      </p>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#00F6E5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function PositionButton({ 
  position, 
  onClick 
}: { 
  position: SkillPosition; 
  onClick: () => void;
}) {
  const positionStyles: Record<SkillPosition, { bg: string; border: string }> = {
    QB: { bg: "from-[#F5C253]/20", border: "border-[#F5C253]/30" },
    RB: { bg: "from-[#FF6A3D]/20", border: "border-[#FF6A3D]/30" },
    FB: { bg: "from-[#FF6A3D]/20", border: "border-[#FF6A3D]/30" },
    X: { bg: "from-[#00F6E5]/20", border: "border-[#00F6E5]/30" },
    Z: { bg: "from-[#00F6E5]/20", border: "border-[#00F6E5]/30" },
    H: { bg: "from-[#3DF3FF]/20", border: "border-[#3DF3FF]/30" },
    Y: { bg: "from-[#3DF3FF]/20", border: "border-[#3DF3FF]/30" },
    TE: { bg: "from-[#F5C253]/20", border: "border-[#F5C253]/30" },
  };

  const style = positionStyles[position];

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} to-transparent p-4 text-center transition-all hover:scale-105 hover:shadow-lg active:scale-95`}
    >
      <div className="text-2xl font-black text-white">{position}</div>
      <div className="text-xs text-slate-400 mt-1 truncate">{POSITION_LABELS[position]}</div>
    </button>
  );
}

function PlayDiagram({ 
  play, 
  onPositionSelect 
}: { 
  play: PlayDefinition; 
  onPositionSelect: (pos: SkillPosition) => void;
}) {
  // Get formation for positioning
  const formation = getFormationById(play.formation);
  
  // Position coordinates on the diagram (percentages)
  const getPositionCoords = (pos: SkillPosition): { x: number; y: number } => {
    const coords: Record<SkillPosition, { x: number; y: number }> = {
      QB: { x: 50, y: 55 },
      RB: { x: 50, y: 75 },
      FB: { x: 50, y: 65 },
      X: { x: 10, y: 40 },
      Z: { x: 90, y: 40 },
      H: { x: 30, y: 40 },
      Y: { x: 70, y: 40 },
      TE: { x: 75, y: 40 },
    };
    return coords[pos] || { x: 50, y: 50 };
  };

  const positions = getPositionsForPlay(play.id);

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#0c1612] to-[#0a0f0c] border border-slate-800">
      {/* Field markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">
        {/* Line of scrimmage */}
        <line x1="5" y1="38" x2="95" y2="38" stroke="rgba(0, 246, 229, 0.5)" strokeWidth="0.5" />
        
        {/* Yard lines */}
        {[20, 28, 46, 54].map((y) => (
          <line key={y} x1="10" y1={y} x2="90" y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.2" strokeDasharray="2 1" />
        ))}
        
        {/* Hash marks */}
        {[20, 28, 38, 46, 54].map((y) => (
          <g key={`hash-${y}`}>
            <line x1="35" y1={y - 0.5} x2="35" y2={y + 0.5} stroke="rgba(255,255,255,0.15)" strokeWidth="0.2" />
            <line x1="65" y1={y - 0.5} x2="65" y2={y + 0.5} stroke="rgba(255,255,255,0.15)" strokeWidth="0.2" />
          </g>
        ))}

        {/* Offensive line placeholders */}
        {[35, 42, 50, 58, 65].map((x) => (
          <rect key={x} x={x - 2} y="37" width="4" height="3" rx="0.5" fill="rgba(100,116,139,0.3)" stroke="rgba(100,116,139,0.5)" strokeWidth="0.2" />
        ))}
      </svg>

      {/* Position markers */}
      {positions.map((pos) => {
        const coords = getPositionCoords(pos);
        const assignment = getPositionAssignment(play.id, pos);
        
        // Color based on position group
        const getColor = (p: SkillPosition) => {
          if (p === "QB") return "#F5C253";
          if (p === "RB" || p === "FB") return "#FF6A3D";
          if (p === "X" || p === "Z") return "#00F6E5";
          return "#3DF3FF";
        };
        
        return (
          <button
            key={pos}
            onClick={() => onPositionSelect(pos)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
          >
            {/* Pulse ring */}
            <div 
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ 
                backgroundColor: getColor(pos),
                animationDuration: "2s",
              }}
            />
            
            {/* Main circle */}
            <div 
              className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all group-hover:scale-110 group-hover:shadow-lg"
              style={{ 
                backgroundColor: `${getColor(pos)}20`,
                borderColor: getColor(pos),
                boxShadow: `0 0 15px ${getColor(pos)}40`,
              }}
            >
              <span className="text-xs font-black" style={{ color: getColor(pos) }}>
                {pos}
              </span>
            </div>
            
            {/* Route indicator (for pass plays) */}
            {play.playType === "pass" && assignment?.routeId && (
              <div 
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase whitespace-nowrap"
                style={{ 
                  backgroundColor: `${getColor(pos)}20`,
                  color: getColor(pos),
                }}
              >
                {assignment.routeId}
              </div>
            )}
          </button>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex items-center gap-2 rounded-lg bg-[#0A0A0A]/80 px-2 py-1">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          Tap position to start
        </span>
      </div>
    </div>
  );
}

function RecentResults() {
  const [results, setResults] = useState<AssignmentResults[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setResults(getResults().slice(-5).reverse());
  }, []);

  // Don't render anything on server to prevent hydration mismatch
  if (!mounted) return null;
  if (results.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
        Recent Sessions
      </h3>
      <div className="space-y-2">
        {results.map((result, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#1B1E20]/30 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00F6E5]/10 border border-[#00F6E5]/30">
                <span className="text-xs font-bold text-[#00F6E5]">{result.position}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-white">{result.playId}</span>
                <span className="block text-xs text-slate-500">
                  {new Date(result.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-mono text-lg font-bold ${
                result.accuracy >= 80 ? "text-[#00F6E5]" : 
                result.accuracy >= 60 ? "text-[#F5C253]" : "text-[#FF6A3D]"
              }`}>
                {result.accuracy}%
              </span>
              <span className="block text-xs text-slate-500">
                {result.correctAnswers}/{result.totalQuestions}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryIcon({ category, className }: { category: AssignmentCategory; className?: string }) {
  switch (category) {
    case "alignment":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      );
    case "landmark":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "assignment":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "read":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "adjustment":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 3v18M3 12h18M7.5 7.5l9 9M16.5 7.5l-9 9" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function TimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.43 5-7.87V4c0-.55.45-1 1-1s1 .45 1 1v2.13c2.96 1.44 5 4.34 5 7.87 0 4.97-4.03 9-9 9z" />
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

function TestTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2" />
      <path d="M8.5 2h7" />
      <path d="M14.5 16h-5" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

