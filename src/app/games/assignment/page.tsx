"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SidebarLayout } from "@/components/SidebarLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, CheckCircle, XCircle } from "lucide-react";
import { SkillPosition } from "@/lib/supabase/types/database";
import { POSITIONS_BY_CATEGORY, CATEGORY_LABELS, type PositionCategory, getPositionCategory } from '@/lib/positions';
import { useToast } from '@/components/Toast';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Assignment {
  id: string;
  position?: string;
  alignment?: string;
  landmark?: string;
  assignment?: string;
  key_read?: string;
  route_id?: string;
  route_depth?: number;
  read_progression?: string[];
  blocking_assignment?: string;
  coverage_adjustments?: any;

  // Fields for different content types
  contentType?: 'play' | 'coverage' | 'formation' | 'notes';

  // Formation-specific fields
  personnel?: string;
  keyFeatures?: string[];
  commonPlays?: string[];
  formations?: any[];
  isMultiFormation?: boolean;

  // Notes-specific fields
  sections?: Array<{
    heading: string;
    content: string;
    keyPoints: string[];
  }>;
  terminology?: Array<{
    term: string;
    definition: string;
  }>;
  diagrams?: Array<{
    description: string;
    keyPoints: string[];
  }>;
  coachingPoints?: string[];
  noteType?: string;

  // Coverage-specific fields
  weaknesses?: string[];

  play?: {
    id: string;
    name: string;
    formation_name: string;
    concept: string;
    play_type: string;
    ai_insights?: string;
    playbook_metadata?: {
      id: string;
      formation_name: string;
      concept_name: string;
      side_of_ball: string;
      content_type: string;
      level: string;
      position_relevance: string[];
      custom_notes: string;
    } | null;
  };

  // For non-play content types that don't have a play object
  name?: string;
  shortName?: string;
  description?: string;
  keyPoints?: string[];
  notes?: string;
}

interface Flashcard {
  id: string;
  category: string;
  question_prompt: string;
  correct_answer: string;
  position: string;
  hints: string[];
  play_id: string;
}

type ViewMode = "assignments" | "detail" | "quiz";

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
  const { userPositions, userRole, orgId, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("assignments");

  // Assignments data
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlayType, setFilterPlayType] = useState<'all' | 'pass' | 'run'>('all');
  const [filterFormation, setFilterFormation] = useState<string>('all');
  const [filterPositionCategory, setFilterPositionCategory] = useState<PositionCategory | 'all'>('all');
  const [formations, setFormations] = useState<string[]>([]);

  // Quiz state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  // Debug logging
  console.log('[Player Assignments] userPositions:', userPositions);
  console.log('[Player Assignments] authLoading:', authLoading);

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH ASSIGNMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!orgId) return;

      try {
        setIsLoadingAssignments(true);

        if (userPositions.length === 0) {
          // No positions - fetch all assignments
          const response = await fetch(`/api/coach/assignments?orgId=${orgId}`);
          if (!response.ok) throw new Error('Failed to fetch assignments');
          const data = await response.json();
          setAssignments(data.assignments || []);
        } else {
          // Fetch assignments for all user positions
          const assignmentPromises = userPositions.map(pos =>
            fetch(`/api/coach/assignments?orgId=${orgId}&position=${pos}`)
              .then(res => res.json())
          );

          const assignmentResults = await Promise.all(assignmentPromises);
          const allAssignments = assignmentResults.flatMap(result => result.assignments || []);

          // Remove duplicates by assignment ID
          const uniqueAssignments = allAssignments.filter((assignment, index, self) =>
            index === self.findIndex(a => a.id === assignment.id)
          );

          setAssignments(uniqueAssignments);
        }

        // Extract unique formations
        const uniqueFormations = Array.from(
          new Set(
            (assignments || [])
              .map(a => a.play?.formation_name)
              .filter(Boolean)
          )
        ) as string[];
        setFormations(uniqueFormations);
      } catch (err) {
        console.error("Failed to load assignments:", err);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    if (!authLoading) {
      fetchAssignments();
    }
  }, [orgId, userPositions, authLoading]);

  // Update formations when assignments change
  useEffect(() => {
    const uniqueFormations = Array.from(
      new Set(
        assignments
          .map(a => a.play?.formation_name)
          .filter(Boolean)
      )
    ) as string[];
    setFormations(uniqueFormations);
  }, [assignments]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERED ASSIGNMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredAssignments = assignments.filter(assignment => {
    // Search filter
    const matchesSearch =
      assignment.play?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.assignment?.toLowerCase().includes(searchQuery.toLowerCase());

    // Play type filter
    const matchesPlayType =
      filterPlayType === 'all' ||
      (filterPlayType === 'pass' && (assignment.play?.play_type?.toUpperCase() === 'PASS' || assignment.play?.play_type?.toUpperCase() === 'RPO')) ||
      (filterPlayType === 'run' && assignment.play?.play_type?.toUpperCase() === 'RUN');

    // Formation filter
    const matchesFormation =
      filterFormation === 'all' || assignment.play?.formation_name === filterFormation;

    // Position category filter
    const matchesCategory = filterPositionCategory === 'all' || (assignment.position && getPositionCategory(assignment.position as SkillPosition) === filterPositionCategory);

    return matchesSearch && matchesPlayType && matchesFormation && matchesCategory;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleViewAssignment = (selectedAssignment: Assignment) => {
    setSelectedAssignment(selectedAssignment);
    setViewMode("detail");
  };

  const handleStartQuiz = async (playId: string) => {
    if (userPositions.length === 0) {
      showToast('Please set your positions in settings to take quizzes', 'error');
      return;
    }

    if (!orgId) {
      showToast('Authentication error. Please sign in.', 'error');
      return;
    }

    try {
      // Fetch flashcards for this play and user positions
      const flashcardPromises = userPositions.map(pos =>
        fetch(`/api/get-approved-plays?orgId=${orgId}&playId=${playId}&type=assignment-flashcards&position=${pos}`)
          .then(res => res.json())
      );

      const flashcardResults = await Promise.all(flashcardPromises);
      const allFlashcards = flashcardResults.flatMap(result => result.flashcards || []);

      // Remove duplicates by flashcard ID
      const uniqueFlashcards = allFlashcards.filter((card, index, self) =>
        index === self.findIndex(c => c.id === card.id)
      );

      if (uniqueFlashcards.length === 0) {
        showToast('No quiz questions available for this play', 'error');
        return;
      }

      setFlashcards(uniqueFlashcards);
      setViewMode("quiz");
      setCurrentCardIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setCorrectCount(0);
      setIncorrectCount(0);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
      showToast('Failed to load quiz questions', 'error');
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return;
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
      const accuracy = finalCorrect > 0 ? Math.round((finalCorrect / (finalCorrect + finalIncorrect)) * 100) : 0;

      showToast(`Quiz Complete! Correct: ${finalCorrect}, Incorrect: ${finalIncorrect}, Accuracy: ${accuracy}%`, 'success');
      setViewMode("detail");
    }
  };

  const handleBack = () => {
    if (viewMode === "quiz") {
      setViewMode("detail");
    } else if (viewMode === "detail") {
      setViewMode("assignments");
      setSelectedAssignment(null);
    }
  };

  const currentCard = flashcards[currentCardIndex];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 holographic-grid">
        {/* Header */}
        <header className="mb-8">
          {viewMode !== "assignments" && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
              My Assignments
            </h1>
            <p className="text-slate-400 mt-2">
              Study your responsibilities and test your knowledge
            </p>
          </div>

          {/* Stats */}
          {viewMode === "assignments" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="glass-card p-4">
                <div className="text-sm text-slate-400">Total Assignments</div>
                <div className="text-2xl font-bold text-white mt-1">{assignments.length}</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-slate-400">Plays</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {new Set(assignments.map(a => a.play?.id)).size}
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-slate-400">My Positions</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {userPositions.length > 0 ? userPositions.join(', ') : 'Not Set'}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* NO POSITION INFO */}
        {userPositions.length === 0 && !authLoading && viewMode === "assignments" && (
          <div className="mb-6">
            <div className="bg-[#FF6A3D]/5 border border-[#FF6A3D]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertIcon className="h-6 w-6 text-[#FF6A3D] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white mb-1">No Positions Assigned</h3>
                  <p className="text-gray-300 text-sm">
                    You're viewing all assignments. To see only your assignments and take quizzes, <Link href="/settings" className="text-[#00F6E5] hover:underline">set your positions in settings</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGNMENTS LIST VIEW */}
        {viewMode === "assignments" && (
          <div>
            {/* Filter Bar */}
            <div className="glass-card p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by play name, position, or assignment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
                  />
                </div>

                {/* Position Category Filter */}
                <select
                  value={filterPositionCategory}
                  onChange={(e) => setFilterPositionCategory(e.target.value as PositionCategory | 'all')}
                  className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
                >
                  <option value="all">All Categories</option>
                  <option value="offense">Offense</option>
                  <option value="defense">Defense</option>
                  <option value="special-teams">Special Teams</option>
                </select>

                {/* Play Type Filter */}
                <select
                  value={filterPlayType}
                  onChange={(e) => setFilterPlayType(e.target.value as 'all' | 'pass' | 'run')}
                  className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
                >
                  <option value="all">All Play Types</option>
                  <option value="pass">Pass</option>
                  <option value="run">Run</option>
                </select>

                {/* Formation Filter */}
                <select
                  value={filterFormation}
                  onChange={(e) => setFilterFormation(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
                >
                  <option value="all">All Formations</option>
                  {formations.map(formation => (
                    <option key={formation} value={formation}>{formation}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignments Table */}
            {isLoadingAssignments ? (
              <div className="text-center py-12 text-slate-400">Loading assignments...</div>
            ) : filteredAssignments.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-slate-400 mb-4">
                  {assignments.length === 0
                    ? "No assignments available yet. Ask your coach to create assignments."
                    : "No assignments match the selected filters."}
                </div>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1B1E20]">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Play Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Formation
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Assignment
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map((assignment) => {
                        const isUserPosition = userPositions.includes(assignment.position as SkillPosition);
                        return (
                          <tr
                            key={assignment.id}
                            className={`border-b border-[#1B1E20]/50 hover:bg-[#1B1E20]/30 transition cursor-pointer ${
                              isUserPosition ? 'bg-[#00F6E5]/5' : ''
                            }`}
                            onClick={() => handleViewAssignment(assignment)}
                          >
                            <td className="px-6 py-4 text-white font-medium">
                              {assignment.play?.name || 'Unknown Play'}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {assignment.play?.formation_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                  isUserPosition
                                    ? 'bg-[#00F6E5]/20 text-[#00F6E5] border border-[#00F6E5]/30'
                                    : 'bg-[#00F6E5]/10 text-[#00F6E5]'
                                }`}>
                                  {assignment.position}
                                </span>
                                {isUserPosition && (
                                  <span className="text-xs text-[#00F6E5] font-semibold">YOUR POSITION</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300 max-w-md truncate">
                              {assignment.assignment}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded bg-[#1B1E20] text-slate-300 text-xs">
                                {assignment.play?.play_type || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewAssignment(assignment);
                                }}
                                className="text-[#00F6E5] hover:text-[#3DF3FF] font-semibold transition"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="mt-4 text-sm text-slate-400">
              Showing {filteredAssignments.length} of {assignments.length} assignments
            </div>
          </div>
        )}

        {/* ASSIGNMENT DETAIL VIEW */}
        {viewMode === "detail" && selectedAssignment && (
          <div>
            {/* Render based on content type */}
            {selectedAssignment.contentType === 'formation' ? (
              <FormationDetailView assignment={selectedAssignment} />
            ) : selectedAssignment.contentType === 'notes' ? (
              <NotesDetailView assignment={selectedAssignment} />
            ) : selectedAssignment.contentType === 'coverage' ? (
              <CoverageDetailView assignment={selectedAssignment} userPositions={userPositions} handleStartQuiz={handleStartQuiz} />
            ) : (
              /* Default: Play/Assignment detail view */
              <PlayDetailView assignment={selectedAssignment} userPositions={userPositions} handleStartQuiz={handleStartQuiz} />
            )}
          </div>
        )}

        {/* QUIZ MODE */}
        {viewMode === "quiz" && currentCard && (
          <div className="glass-card p-6">
            {/* Header with progress and score */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-slate-400">
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
              <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
                {currentCard.category}
              </div>
              <div className="text-2xl font-semibold mb-8 text-white">{currentCard.question_prompt}</div>
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
                      buttonClass += "bg-[#00F6E5]/10 border-[#00F6E5] text-white";
                    } else {
                      buttonClass += "bg-[#0F1419] border-[#1E2732] text-white hover:border-[#00F6E5]/50";
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
                <div className="text-center py-8 text-slate-400">
                  No answer options available for this question
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isAnswered ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="w-full bg-[#00F6E5] text-black font-semibold py-4 rounded-lg hover:bg-[#3DF3FF] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full bg-[#00F6E5] text-black font-semibold py-4 rounded-lg hover:bg-[#3DF3FF] transition"
              >
                {currentCardIndex < flashcards.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            )}
          </div>
        )}
      </main>
    </SidebarLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL VIEW COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Play/Assignment Detail View Component
function PlayDetailView({ assignment, userPositions, handleStartQuiz }: {
  assignment: Assignment;
  userPositions: SkillPosition[];
  handleStartQuiz: (playId: string) => void;
}) {
  return (
    <>
            {/* Quiz Button - Moved to Top */}
            {userPositions.length > 0 ? (
              <button
                onClick={() => assignment.play && handleStartQuiz(assignment.play.id)}
                className="w-full glass-card p-4 text-[#00F6E5] font-semibold hover:bg-[#00F6E5]/5 transition flex items-center justify-center gap-2 mb-6"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                Take Quiz for This Play
              </button>
            ) : (
              <div className="glass-card p-4 text-center text-slate-400 text-sm mb-6">
                To take quizzes, <Link href="/settings" className="text-[#00F6E5] hover:underline">set your positions in settings</Link>
              </div>
            )}

            <div className="glass-card p-6">
              {/* Play Info Header */}
              <div className="mb-6 pb-6 border-b border-[#1B1E20]">
                <h2 className="text-2xl font-bold text-white mb-2">{assignment.play?.name}</h2>
                <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                  <span>{assignment.play?.formation_name}</span>
                  <span>•</span>
                  <span>{assignment.play?.concept}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-[#1B1E20] rounded text-slate-300">
                    {assignment.play?.play_type}
                  </span>
                </div>
              </div>

              {/* Position Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-[#00F6E5]/10 text-[#00F6E5] text-lg font-bold border border-[#00F6E5]/30">
                  {assignment.position}
                </span>
                {userPositions.includes(assignment.position as SkillPosition) && (
                  <span className="ml-3 text-sm text-[#00F6E5] font-semibold">YOUR POSITION</span>
                )}
              </div>

              {/* Main Content Grid - Coach Insights + Assignment Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Coach-Approved Insights */}
                <div className="bg-gradient-to-br from-[#151a1e] to-[#0f1215] border border-[#1B1E20] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#00F6E5]/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Coach-Approved Insights</h3>
                      <p className="text-xs text-slate-500">AI-generated and reviewed by your coach</p>
                    </div>
                  </div>

                  {/* AI Insights Content */}
                  {assignment.play?.ai_insights ? (
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm max-h-[400px] overflow-y-auto pr-2">
                      {assignment.play.ai_insights}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      <svg className="h-12 w-12 mx-auto mb-2 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">No insights available for this play</p>
                      <p className="text-xs mt-1">Ask your coach to generate insights</p>
                    </div>
                  )}

                  {/* Play Metadata */}
                  {assignment.play?.playbook_metadata && (
                    <div className="mt-4 pt-4 border-t border-[#1B1E20]">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {assignment.play.playbook_metadata.level && (
                          <div>
                            <div className="text-slate-500 mb-1">Level</div>
                            <div className="text-white capitalize">
                              {assignment.play.playbook_metadata.level.replace('_', ' ')}
                            </div>
                          </div>
                        )}
                        {assignment.play.playbook_metadata.content_type && (
                          <div>
                            <div className="text-slate-500 mb-1">Type</div>
                            <div className="text-white capitalize">
                              {assignment.play.playbook_metadata.content_type.replace('_', ' ')}
                            </div>
                          </div>
                        )}
                      </div>
                      {assignment.play.playbook_metadata.custom_notes && (
                        <div className="mt-3">
                          <div className="text-slate-500 mb-1">Coach Notes</div>
                          <div className="text-slate-300 text-sm">{assignment.play.playbook_metadata.custom_notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Core Assignment Details - Compact Grid */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Alignment</div>
                    <div className="text-white text-lg">{assignment.alignment}</div>
                  </div>

                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Landmark</div>
                    <div className="text-white text-lg">{assignment.landmark}</div>
                  </div>

                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Assignment</div>
                    <div className="text-white text-lg">{assignment.assignment}</div>
                  </div>

                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Key Read</div>
                    <div className="text-white text-lg">{assignment.key_read}</div>
                  </div>
                </div>
              </div>

              {/* Additional Details - Full Width Below */}
              <div className="space-y-4">
                {assignment.read_progression && assignment.read_progression.length > 0 && (
                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Read Progression</div>
                    <ol className="list-decimal list-inside space-y-1">
                      {assignment.read_progression.map((read, idx) => (
                        <li key={idx} className="text-white">{read}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {assignment.route_id && (
                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Route</div>
                    <div className="text-white text-lg">
                      {assignment.route_id}
                      {assignment.route_depth && (
                        <span className="text-slate-400 text-base ml-2">({assignment.route_depth} yards)</span>
                      )}
                    </div>
                  </div>
                )}

                {assignment.blocking_assignment && (
                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Blocking Assignment</div>
                    <div className="text-white text-lg">{assignment.blocking_assignment}</div>
                  </div>
                )}

                {assignment.coverage_adjustments && Object.keys(assignment.coverage_adjustments).length > 0 && (
                  <div className="glass-card p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Coverage Adjustments</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(assignment.coverage_adjustments).map(([coverage, adjustment]) => (
                        <div key={coverage} className="bg-[#1B1E20]/50 rounded p-3">
                          <div className="text-xs text-[#00F6E5] font-semibold mb-1">
                            {coverage.replace('vs_', 'vs ').replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="text-white text-sm">{String(adjustment)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
    </>
  );
}

// Coverage Detail View Component
function CoverageDetailView({ assignment, userPositions, handleStartQuiz }: {
  assignment: Assignment;
  userPositions: SkillPosition[];
  handleStartQuiz: (playId: string) => void;
}) {
  // Similar to PlayDetailView but tailored for defensive coverage
  return <PlayDetailView assignment={assignment} userPositions={userPositions} handleStartQuiz={handleStartQuiz} />;
}

// Formation Detail View Component
function FormationDetailView({ assignment }: { assignment: Assignment }) {
  return (
    <div className="glass-card p-6">
      <div className="mb-6 pb-6 border-b border-[#1B1E20]">
        <h2 className="text-2xl font-bold text-white mb-2">{assignment.name || 'Formation'}</h2>
        <p className="text-slate-400">{assignment.description}</p>
      </div>

      {assignment.isMultiFormation && assignment.formations ? (
        /* Multi-Formation Sheet */
        <div className="space-y-6">
          {assignment.formations.map((formation: any, idx: number) => (
            <div key={idx} className="glass-card p-5">
              <h3 className="text-xl font-bold text-white mb-3">{formation.name}</h3>
              {formation.personnel && (
                <div className="text-sm text-slate-400 mb-2">
                  <span className="font-semibold">Personnel:</span> {formation.personnel}
                </div>
              )}
              {formation.alignment && (
                <div className="text-sm text-slate-300 mb-3">{formation.alignment}</div>
              )}
              {formation.keyFeatures && formation.keyFeatures.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Key Features</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                    {formation.keyFeatures.map((feature: string, i: number) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              {formation.commonPlays && formation.commonPlays.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Common Plays</div>
                  <div className="flex flex-wrap gap-2">
                    {formation.commonPlays.map((play: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-[#1B1E20] rounded text-sm text-slate-300">{play}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Single Formation */
        <div className="space-y-4">
          {assignment.personnel && (
            <div className="glass-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Personnel</div>
              <div className="text-white text-lg">{assignment.personnel}</div>
            </div>
          )}
          {assignment.alignment && (
            <div className="glass-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Alignment</div>
              <div className="text-white text-lg">{assignment.alignment}</div>
            </div>
          )}
          {assignment.keyFeatures && assignment.keyFeatures.length > 0 && (
            <div className="glass-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Key Features</div>
              <ul className="list-disc list-inside space-y-1 text-white">
                {assignment.keyFeatures.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
          {assignment.commonPlays && assignment.commonPlays.length > 0 && (
            <div className="glass-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Common Plays</div>
              <div className="flex flex-wrap gap-2">
                {assignment.commonPlays.map((play, i) => (
                  <span key={i} className="px-3 py-1 bg-[#1B1E20] rounded text-slate-300">{play}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {assignment.notes && (
        <div className="mt-6 glass-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Notes</div>
          <div className="text-slate-300 whitespace-pre-wrap">{assignment.notes}</div>
        </div>
      )}
    </div>
  );
}

// Notes/Reference Material Detail View Component
function NotesDetailView({ assignment }: { assignment: Assignment }) {
  return (
    <div className="glass-card p-6">
      <div className="mb-6 pb-6 border-b border-[#1B1E20]">
        <h2 className="text-2xl font-bold text-white mb-2">{assignment.name || 'Reference Material'}</h2>
        <p className="text-slate-400">{assignment.description}</p>
        {assignment.noteType && (
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-[#00F6E5]/10 text-[#00F6E5] rounded text-sm font-semibold capitalize">
              {assignment.noteType.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Sections */}
        {assignment.sections && assignment.sections.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Content</h3>
            {assignment.sections.map((section, idx) => (
              <div key={idx} className="glass-card p-5 mb-4">
                <h4 className="text-md font-semibold text-[#00F6E5] mb-2">{section.heading}</h4>
                <p className="text-slate-300 mb-3">{section.content}</p>
                {section.keyPoints && section.keyPoints.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                    {section.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Terminology */}
        {assignment.terminology && assignment.terminology.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Terminology</h3>
            <div className="space-y-3">
              {assignment.terminology.map((term, idx) => (
                <div key={idx} className="border-l-2 border-[#00F6E5] pl-3">
                  <div className="font-semibold text-[#00F6E5]">{term.term}</div>
                  <div className="text-slate-300 text-sm">{term.definition}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagrams */}
        {assignment.diagrams && assignment.diagrams.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Diagrams</h3>
            {assignment.diagrams.map((diagram, idx) => (
              <div key={idx} className="glass-card p-5 mb-4">
                <p className="text-white mb-2">{diagram.description}</p>
                {diagram.keyPoints && diagram.keyPoints.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                    {diagram.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Coaching Points */}
        {assignment.coachingPoints && assignment.coachingPoints.length > 0 && (
          <div className="glass-card p-5 bg-gradient-to-br from-[#00F6E5]/5 to-transparent border-[#00F6E5]/20">
            <h3 className="text-lg font-bold text-white mb-4">Coaching Points</h3>
            <ul className="space-y-2">
              {assignment.coachingPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-[#00F6E5] mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* General Notes */}
        {assignment.notes && (
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold text-white mb-3">Additional Notes</h3>
            <div className="text-slate-300 whitespace-pre-wrap">{assignment.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Icon component
function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
