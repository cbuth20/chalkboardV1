"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DEV_TEAM_ID } from "@/lib/constants";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ApprovedPlay {
  id: string;
  name: string;
  formation_name: string;
  concept: string;
}

interface KnowledgeCard {
  id: string;
  play_id: string;
  question_prompt: string;
  correct_answer: string;
  category: string;
  explanation: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function QuizCardsPage() {
  return (
    <ProtectedRoute>
      <QuizCardsGame />
    </ProtectedRoute>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ CARDS GAME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function QuizCardsGame() {
  const [plays, setPlays] = useState<ApprovedPlay[]>([]);
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [teamId] = useState<string>(DEV_TEAM_ID); // TODO: Get from auth context

  const selectedPlay = plays.find((p) => p.id === selectedPlayId) || null;
  const currentCard = knowledgeCards[currentCardIndex] || null;

  // Fetch approved plays on mount
  useEffect(() => {
    const fetchPlays = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/get-approved-plays?teamId=${teamId}&type=all`);

        if (!response.ok) {
          throw new Error('Failed to fetch plays');
        }

        const data = await response.json();
        setPlays(data.plays || []);
      } catch (err) {
        console.error('Failed to load plays:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlays();
  }, [teamId]);

  // Fetch knowledge cards when play is selected
  useEffect(() => {
    if (!selectedPlayId) {
      setKnowledgeCards([]);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      return;
    }

    const fetchKnowledgeCards = async () => {
      try {
        setIsLoadingCards(true);
        const response = await fetch(
          `/api/get-approved-plays?teamId=${teamId}&playId=${selectedPlayId}&type=knowledge`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch knowledge cards');
        }

        const data = await response.json();
        setKnowledgeCards(data.knowledgeCards || []);
        setCurrentCardIndex(0);
        setShowAnswer(false);
      } catch (err) {
        console.error('Failed to load knowledge cards:', err);
        setKnowledgeCards([]);
      } finally {
        setIsLoadingCards(false);
      }
    };

    fetchKnowledgeCards();
  }, [selectedPlayId, teamId]);

  const handleNext = () => {
    if (currentCardIndex < knowledgeCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleSelectPlay = (playId: string) => {
    setSelectedPlayId(playId);
  };

  // Loading state
  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex h-screen items-center justify-center text-white">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
            <span className="text-sm text-slate-400">Loading quiz cards...</span>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <main className="flex h-screen text-white">
        {/* Left Sidebar: Play Selection */}
        <aside className="flex w-72 flex-col border-r border-[#1B1E20] bg-[#0A0A0A]">
          <div className="flex items-center justify-between border-b border-[#1B1E20] px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Select Play
            </h2>
            <span className="rounded bg-[#1B1E20] px-2 py-0.5 text-xs font-medium text-slate-500">
              {plays.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {plays.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <p className="text-sm text-slate-500 mb-2">No approved plays yet</p>
                <p className="text-xs text-slate-600">Ask your coach to approve plays</p>
              </div>
            ) : (
              plays.map((play) => (
                <button
                  key={play.id}
                  onClick={() => handleSelectPlay(play.id)}
                  className={`group mb-1 w-full rounded-lg px-3 py-2.5 text-left transition-all ${
                    play.id === selectedPlayId
                      ? "bg-[#00F6E5]/10 ring-1 ring-[#00F6E5]/30"
                      : "hover:bg-[#1B1E20]/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          play.id === selectedPlayId ? "text-[#00F6E5]" : "text-white"
                        }`}
                      >
                        {play.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {play.formation_name} • {play.concept}
                      </p>
                    </div>
                    {play.id === selectedPlayId && (
                      <div className="ml-2 mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00F6E5]" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content: Flashcard */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
          {!selectedPlay ? (
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 mb-4 text-slate-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-sm text-slate-500">Select a play to start quizzing</p>
            </div>
          ) : isLoadingCards ? (
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
              <span className="text-sm text-slate-400">Loading quiz cards...</span>
            </div>
          ) : knowledgeCards.length === 0 ? (
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 mb-4 text-slate-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-slate-500 mb-2">No quiz cards available for this play</p>
              <p className="text-xs text-slate-600">Ask your coach to generate quiz cards</p>
            </div>
          ) : (
            <div className="max-w-2xl w-full">
              {/* Card Header */}
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">{selectedPlay.name}</h1>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                  <span>Card {currentCardIndex + 1} of {knowledgeCards.length}</span>
                  <span>•</span>
                  <span className="px-2 py-1 bg-blue-900/20 text-blue-400 rounded text-xs font-semibold uppercase">
                    {currentCard.category.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Flashcard */}
              <div className="bg-gradient-to-br from-[#151a1e] to-[#0f1215] border-2 border-[#1B1E20] rounded-2xl p-8 min-h-[300px] flex flex-col justify-center">
                {/* Question */}
                <div className="mb-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Question
                  </div>
                  <p className="text-xl text-white leading-relaxed">
                    {currentCard.question_prompt}
                  </p>
                </div>

                {/* Answer */}
                {showAnswer && (
                  <div className="border-t border-[#1B1E20] pt-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#00F6E5] mb-3">
                      Answer
                    </div>
                    <p className="text-lg text-[#00F6E5] font-semibold mb-3">
                      {currentCard.correct_answer}
                    </p>
                    {currentCard.explanation && (
                      <p className="text-sm text-slate-400 mt-2">
                        {currentCard.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentCardIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B1E20] text-white hover:bg-[#252a2e] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Previous
                </button>

                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-semibold hover:bg-[#3DF3FF] transition shadow-[0_0_15px_rgba(0,246,229,0.3)]"
                >
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentCardIndex === knowledgeCards.length - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B1E20] text-white hover:bg-[#252a2e] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="h-1 bg-[#1B1E20] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00F6E5] transition-all duration-300"
                    style={{ width: `${((currentCardIndex + 1) / knowledgeCards.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </SidebarLayout>
  );
}
