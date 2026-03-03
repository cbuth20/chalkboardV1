"use client";

import React, { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFlashcards } from '@/hooks/useFlashcardsAPI';
import { useToast } from '@/components/Toast';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
type CardCategory = 'play_concept' | 'route_recognition' | 'formation' | 'coverage' | 'technique';

export default function QuestionBankPage() {
  const { orgId, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [selectedPlayId, setSelectedPlayId] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Build filter params
  const filterParams: any = {};
  if (selectedPlayId) filterParams.playId = selectedPlayId;
  if (selectedPosition) filterParams.position = selectedPosition;
  if (selectedDifficulty) filterParams.difficulty = selectedDifficulty;
  if (selectedCategory) filterParams.category = selectedCategory;

  const { flashcards, loading, error, refetch } = useFlashcards(filterParams);

  // Filter by search query (client-side)
  const filteredCards = flashcards.filter(card =>
    card.questionPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.correctAnswer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCardSelection = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredCards.map(c => c.id));
    setSelectedCards(allIds);
  };

  const clearSelection = () => {
    setSelectedCards(new Set());
  };

  const handleCreateQuiz = () => {
    if (selectedCards.size === 0) {
      showToast('Please select at least one flashcard', 'error');
      return;
    }
    // Navigate to quiz creator with selected cards
    // TODO: Implement navigation to quiz creator with selectedCards
    showToast(`Creating quiz with ${selectedCards.size} flashcards... (TODO: Navigate to quiz creator)`, 'info');
  };

  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading question bank...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!orgId) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Authentication Issue</h2>
            <p className="text-slate-400 mb-4">No organization found. Please sign in.</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Question Bank</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00F6E5]/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl mb-2">
                Question Bank
              </h1>
              <p className="text-slate-400">
                Browse and select flashcards to create quiz assignments
              </p>
            </div>

            {isSelectionMode && (
              <button
                onClick={handleCreateQuiz}
                disabled={selectedCards.size === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-bold hover:bg-[#3DF3FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,246,229,0.3)]"
              >
                <PlusIcon className="h-5 w-5" />
                Create Quiz ({selectedCards.size})
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">{flashcards.length}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Cards</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-green-400">
                {flashcards.filter(c => c.difficulty === 'beginner').length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Beginner</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-amber-400">
                {flashcards.filter(c => c.difficulty === 'intermediate').length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Intermediate</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-red-400">
                {flashcards.filter(c => c.difficulty === 'advanced').length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Advanced</div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <input
                  type="text"
                  placeholder="Search questions or answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white placeholder-slate-500 focus:border-[#00F6E5] focus:outline-none"
                />
              </div>

              {/* Position Filter */}
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
              >
                <option value="">All Positions</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
                <option value="OL">OL</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel | '')}
                className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as CardCategory | '')}
                className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="play_concept">Play Concept</option>
                <option value="route_recognition">Route Recognition</option>
                <option value="formation">Formation</option>
                <option value="coverage">Coverage</option>
                <option value="technique">Technique</option>
              </select>
            </div>

            {/* Selection Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) {
                      clearSelection();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isSelectionMode
                      ? 'bg-[#00F6E5] text-black'
                      : 'bg-[#1B1E20] text-slate-300 hover:bg-[#2A2E30]'
                  }`}
                >
                  {isSelectionMode ? 'Exit Selection Mode' : 'Select for Quiz'}
                </button>

                {isSelectionMode && (
                  <>
                    <button
                      onClick={selectAll}
                      className="px-4 py-2 rounded-lg bg-[#1B1E20] text-slate-300 text-sm font-semibold hover:bg-[#2A2E30] transition-all"
                    >
                      Select All ({filteredCards.length})
                    </button>
                    <button
                      onClick={clearSelection}
                      disabled={selectedCards.size === 0}
                      className="px-4 py-2 rounded-lg bg-[#1B1E20] text-slate-300 text-sm font-semibold hover:bg-[#2A2E30] transition-all disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              <div className="text-sm text-slate-400">
                Showing {filteredCards.length} of {flashcards.length} cards
              </div>
            </div>
          </div>
        </header>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-slate-400 mb-2">No flashcards found</div>
            <p className="text-sm text-slate-500">
              {searchQuery || selectedPosition || selectedDifficulty || selectedCategory
                ? 'Try adjusting your filters'
                : 'Flashcards will appear here after plays are generated and approved'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className={`glass-card p-5 transition-all ${
                  isSelectionMode ? 'cursor-pointer hover:ring-2 hover:ring-[#00F6E5]/30' : ''
                } ${
                  selectedCards.has(card.id) ? 'ring-2 ring-[#00F6E5] bg-[#00F6E5]/5' : ''
                }`}
                onClick={() => isSelectionMode && toggleCardSelection(card.id)}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs rounded font-semibold ${
                      card.difficulty === 'beginner' ? 'bg-green-900/20 text-green-400' :
                      card.difficulty === 'intermediate' ? 'bg-amber-900/20 text-amber-400' :
                      'bg-red-900/20 text-red-400'
                    }`}>
                      {card.difficulty}
                    </span>
                    <span className="px-2 py-1 text-xs rounded bg-[#1B1E20] text-slate-400 font-semibold">
                      {card.position}
                    </span>
                  </div>

                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedCards.has(card.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleCardSelection(card.id);
                      }}
                      className="h-5 w-5 rounded border-[#2A2E30] bg-[#1B1E20] text-[#00F6E5] focus:ring-[#00F6E5]"
                    />
                  )}
                </div>

                {/* Question */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Question
                  </div>
                  <p className="text-sm text-white leading-relaxed">
                    {card.questionPrompt}
                  </p>
                </div>

                {/* Answer */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Answer
                  </div>
                  <p className="text-sm text-[#00F6E5] leading-relaxed">
                    {card.correctAnswer}
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-[#1B1E20]">
                  {card.category && (
                    <span className="px-2 py-0.5 rounded bg-[#1B1E20] text-slate-400">
                      {card.category.replace(/_/g, ' ')}
                    </span>
                  )}
                  {card.isAutoGenerated && (
                    <span className="px-2 py-0.5 rounded bg-purple-900/20 text-purple-400" title="AI Generated">
                      AI
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </SidebarLayout>
  );
}

// Icon Components
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
