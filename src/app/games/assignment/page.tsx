"use client";

import { useState, useEffect } from "react";
import PlayerNavbar from "@/components/PlayerNavbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DEV_TEAM_ID, POSITION_NAMES, OFFENSE_POSITIONS } from "@/lib/constants";
import { ChevronLeft, CheckCircle, XCircle } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ApprovedPlay {
  id: string;
  name: string;
  formation_name: string;
  concept: string;
  play_type: string;
}

interface PositionAssignment {
  id: string;
  position: string;
  alignment: string;
  landmark: string;
  assignment: string;
  key_read: string;
  route_id?: string;
  route_depth?: number;
}

interface Flashcard {
  id: string;
  category: string;
  question_prompt: string;
  correct_answer: string;
  position: string;
  hints: string[]; // Multiple choice options
}

type GamePhase = "select-play" | "select-position" | "study" | "quiz";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AssignmentPage() {
  return (
    <ProtectedRoute>
      <AssignmentTracker />
    </ProtectedRoute>
  );
}

function AssignmentTracker() {
  const [teamId] = useState<string>(DEV_TEAM_ID);
  const [phase, setPhase] = useState<GamePhase>("select-play");

  // Play selection
  const [plays, setPlays] = useState<ApprovedPlay[]>([]);
  const [selectedPlay, setSelectedPlay] = useState<ApprovedPlay | null>(null);
  const [isLoadingPlays, setIsLoadingPlays] = useState(true);

  // Position selection
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Assignment data
  const [assignments, setAssignments] = useState<PositionAssignment[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Quiz state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH APPROVED PLAYS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const fetchPlays = async () => {
      try {
        setIsLoadingPlays(true);
        const response = await fetch(`/api/get-approved-plays?teamId=${teamId}&type=all`);

        if (!response.ok) throw new Error('Failed to fetch plays');

        const data = await response.json();
        setPlays(data.plays || []);
      } catch (err) {
        console.error("Failed to load plays:", err);
      } finally {
        setIsLoadingPlays(false);
      }
    };

    fetchPlays();
  }, [teamId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH ASSIGNMENTS AND FLASHCARDS
  // ═══════════════════════════════════════════════════════════════════════════

  const loadPositionData = async (playId: string, position: string) => {
    try {
      setIsLoadingData(true);

      // Fetch assignments
      const assignmentsResponse = await fetch(
        `/api/get-approved-plays?teamId=${teamId}&playId=${playId}&type=assignments`
      );
      const assignmentsData = await assignmentsResponse.json();

      // Filter for selected position
      const positionAssignments = (assignmentsData.assignments || []).filter(
        (a: PositionAssignment) => a.position === position
      );
      setAssignments(positionAssignments);

      // Fetch flashcards (assignment-type cards for this position)
      const flashcardsResponse = await fetch(
        `/api/get-approved-plays?teamId=${teamId}&playId=${playId}&type=assignment-flashcards&position=${position}`
      );
      const flashcardsData = await flashcardsResponse.json();
      setFlashcards(flashcardsData.flashcards || []);

      setPhase("study");
    } catch (err) {
      console.error("Failed to load position data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectPlay = (play: ApprovedPlay) => {
    setSelectedPlay(play);
    setPhase("select-position");
  };

  const handleSelectPosition = (position: string) => {
    setSelectedPosition(position);
    if (selectedPlay) {
      loadPositionData(selectedPlay.id, position);
    }
  };

  const handleStartQuiz = () => {
    if (flashcards.length === 0) {
      alert("No flashcards available for this position");
      return;
    }
    setPhase("quiz");
    setCurrentCardIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setIncorrectCount(0);
  };

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return; // Prevent changing answer after submission

    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentCard) return;

    setIsAnswered(true);
    const isCorrect = selectedAnswer === currentCard.correct_answer;

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Quiz complete
      const finalCorrect = correctCount;
      const finalIncorrect = incorrectCount;
      const accuracy = Math.round((finalCorrect / (finalCorrect + finalIncorrect)) * 100);

      alert(`Quiz Complete!\n\nCorrect: ${finalCorrect}\nIncorrect: ${finalIncorrect}\nAccuracy: ${accuracy}%`);
      setPhase("study");
    }
  };

  const handleBack = () => {
    if (phase === "quiz") {
      setPhase("study");
    } else if (phase === "study") {
      setPhase("select-position");
      setAssignments([]);
      setFlashcards([]);
    } else if (phase === "select-position") {
      setPhase("select-play");
      setSelectedPlay(null);
      setSelectedPosition(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PHASES
  // ═══════════════════════════════════════════════════════════════════════════

  const currentCard = flashcards[currentCardIndex];
  const currentAssignment = assignments[0]; // Should only be one per position

  return (
    <div className="min-h-screen bg-[#0A0F12] text-white">
      <PlayerNavbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          {phase !== "select-play" && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <h1 className="text-3xl font-bold">Position Assignments</h1>
          <p className="text-gray-400 mt-2">
            Study your responsibilities and test your knowledge
          </p>
        </div>

        {/* SELECT PLAY */}
        {phase === "select-play" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select a Play</h2>
            {isLoadingPlays ? (
              <div className="text-center py-12 text-gray-400">Loading plays...</div>
            ) : plays.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No approved plays available. Ask your coach to approve some plays first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plays.map((play) => (
                  <button
                    key={play.id}
                    onClick={() => handleSelectPlay(play)}
                    className="bg-[#1A1F28] border border-[#1E2732] rounded-lg p-4 hover:border-[#00D9FF] transition text-left"
                  >
                    <div className="font-semibold text-lg mb-2">{play.name}</div>
                    <div className="text-sm text-gray-400">
                      <div>{play.formation_name}</div>
                      <div>{play.concept}</div>
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-[#1E2732] rounded text-xs">
                          {play.play_type}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SELECT POSITION */}
        {phase === "select-position" && selectedPlay && (
          <div>
            <div className="bg-[#1A1F28] border border-[#1E2732] rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-400">Selected Play</div>
              <div className="text-xl font-semibold">{selectedPlay.name}</div>
              <div className="text-gray-300 mt-1">
                {selectedPlay.formation_name} • {selectedPlay.concept}
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4">Select Your Position</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {OFFENSE_POSITIONS.map((position) => (
                <button
                  key={position}
                  onClick={() => handleSelectPosition(position)}
                  className="bg-[#1A1F28] border border-[#1E2732] rounded-lg p-6 hover:border-[#00D9FF] transition"
                >
                  <div className="text-2xl font-bold text-[#00D9FF] mb-2">{position}</div>
                  <div className="text-sm text-gray-400">{POSITION_NAMES[position]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STUDY MODE */}
        {phase === "study" && currentAssignment && (
          <div>
            <div className="bg-[#1A1F28] border border-[#1E2732] rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-400">Studying</div>
                  <div className="text-2xl font-bold">
                    {selectedPosition} - {selectedPlay?.name}
                  </div>
                </div>
                <div className="text-4xl font-bold text-[#00D9FF]">{selectedPosition}</div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#0F1419] border border-[#1E2732] rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Alignment</div>
                  <div className="text-lg text-white">{currentAssignment.alignment}</div>
                </div>

                <div className="bg-[#0F1419] border border-[#1E2732] rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Assignment</div>
                  <div className="text-lg text-white">{currentAssignment.assignment}</div>
                </div>

                <div className="bg-[#0F1419] border border-[#1E2732] rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Key Read</div>
                  <div className="text-lg text-white">{currentAssignment.key_read}</div>
                </div>

                {currentAssignment.landmark && (
                  <div className="bg-[#0F1419] border border-[#1E2732] rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Landmark</div>
                    <div className="text-lg text-white">{currentAssignment.landmark}</div>
                  </div>
                )}

                {currentAssignment.route_id && (
                  <div className="bg-[#0F1419] border border-[#1E2732] rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Route</div>
                    <div className="text-lg text-white">
                      {currentAssignment.route_id}
                      {currentAssignment.route_depth && ` (${currentAssignment.route_depth} yards)`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {flashcards.length > 0 ? (
              <button
                onClick={handleStartQuiz}
                className="w-full bg-[#00D9FF] text-black font-semibold py-4 rounded-lg hover:bg-[#00B8DD] transition"
              >
                Start Quiz ({flashcards.length} questions)
              </button>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No quiz questions available for this position
              </div>
            )}
          </div>
        )}

        {/* QUIZ MODE */}
        {phase === "quiz" && currentCard && (
          <div>
            <div className="bg-[#1A1F28] border border-[#1E2732] rounded-lg p-6">
              {/* Header with progress and score */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-400">
                  Question {currentCardIndex + 1} of {flashcards.length}
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle size={16} />
                    {correctCount}
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle size={16} />
                    {incorrectCount}
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  {currentCard.category}
                </div>
                <div className="text-2xl font-semibold mb-8">{currentCard.question_prompt}</div>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-3 mb-6">
                {currentCard.hints && currentCard.hints.length > 0 ? (
                  currentCard.hints.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = option === currentCard.correct_answer;
                    const showFeedback = isAnswered;

                    let buttonClass = "w-full text-left px-6 py-4 rounded-lg border-2 transition font-medium ";

                    if (showFeedback) {
                      if (isCorrect) {
                        buttonClass += "bg-green-950/30 border-green-500 text-green-300";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "bg-red-950/30 border-red-500 text-red-300";
                      } else {
                        buttonClass += "bg-[#0F1419] border-[#1E2732] text-gray-500";
                      }
                    } else {
                      if (isSelected) {
                        buttonClass += "bg-[#00D9FF]/10 border-[#00D9FF] text-white";
                      } else {
                        buttonClass += "bg-[#0F1419] border-[#1E2732] text-white hover:border-[#00D9FF]/50";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAnswer(option)}
                        disabled={isAnswered}
                        className={buttonClass}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showFeedback && isCorrect && (
                            <CheckCircle size={20} className="text-green-400" />
                          )}
                          {showFeedback && isSelected && !isCorrect && (
                            <XCircle size={20} className="text-red-400" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No answer options available for this question
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isAnswered ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="w-full bg-[#00D9FF] text-black font-semibold py-4 rounded-lg hover:bg-[#00B8DD] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="w-full bg-[#00D9FF] text-black font-semibold py-4 rounded-lg hover:bg-[#00B8DD] transition"
                >
                  {currentCardIndex < flashcards.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </button>
              )}
            </div>
          </div>
        )}

        {isLoadingData && (
          <div className="text-center py-12 text-gray-400">Loading assignment data...</div>
        )}
      </div>
    </div>
  );
}
