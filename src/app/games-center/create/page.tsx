"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { playerGamesAPI, GameFilters, CreateGameRequest } from '@/lib/api/player-games';

const TOPICS = [
  { id: 'coverage_recognition', label: 'Coverage Recognition', category: 'reads' },
  { id: 'pre_snap_reads', label: 'Pre-Snap Reads', category: 'reads' },
  { id: 'post_snap_reads', label: 'Post-Snap Reads', category: 'reads' },
  { id: 'hot_routes', label: 'Hot Routes', category: 'reads' },
  { id: 'route_running', label: 'Route Running', category: 'execution' },
  { id: 'blocking_assignments', label: 'Blocking Assignments', category: 'execution' },
  { id: 'pass_protection', label: 'Pass Protection', category: 'execution' },
  { id: 'run_fits', label: 'Run Fits', category: 'execution' },
  { id: 'coverage_adjustments', label: 'Coverage Adjustments', category: 'adjustments' },
  { id: 'formation_checks', label: 'Formation Checks', category: 'adjustments' },
  { id: 'play_concepts', label: 'Play Concepts', category: 'concepts' },
  { id: 'situational_football', label: 'Situational Football', category: 'concepts' },
];

const CATEGORIES = [
  { id: 'coverage_blitz', label: 'Coverage & Blitz' },
  { id: 'routes_concepts', label: 'Routes & Concepts' },
  { id: 'situational', label: 'Situational Football' },
  { id: 'assignments', label: 'Position Assignments' },
];

export default function CreateCustomGamePage() {
  const router = useRouter();
  const { session, orgId } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('coverage_blitz');
  const [positions, setPositions] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string[]>(['beginner', 'intermediate', 'advanced']);
  const [tags, setTags] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectionStrategy, setSelectionStrategy] = useState<'random' | 'difficulty_progression' | 'spaced_repetition'>('random');
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Update available questions when filters change
  useEffect(() => {
    if (session && orgId) {
      updateAvailableQuestions();
    }
  }, [session, orgId, positions, topics, difficulty, tags]);

  const updateAvailableQuestions = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const result = await playerGamesAPI.getAvailableQuestions(orgId);
      setAvailableQuestions(result.total);
    } catch (error) {
      console.error('Failed to fetch available questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePosition = (pos: string) => {
    setPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  const toggleTopic = (topic: string) => {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const toggleDifficulty = (diff: string) => {
    setDifficulty((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a game name');
      return;
    }

    if (availableQuestions < questionCount) {
      alert('Not enough questions match your filters');
      return;
    }

    if (!orgId) {
      alert('Organization ID not found. Please try refreshing the page.');
      return;
    }

    setCreating(true);
    try {
      const filters: GameFilters = {};

      if (positions.length > 0) filters.positions = positions;
      if (topics.length > 0) filters.topics = topics as any;
      if (difficulty.length > 0) filters.difficulty = difficulty as any;
      if (tags.length > 0) filters.tags = tags;

      const request: CreateGameRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category as any,
        filters,
        questionCount,
        selectionStrategy,
        passingScore: 70,
      };

      const result = await playerGamesAPI.createGame(request, orgId);

      alert('Game created successfully!');
      router.push('/games-center');
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        {/* Header */}
        <header className="border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5m7 7l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <div className="h-6 w-px bg-[#1B1E20]" />
            <h1 className="text-2xl font-bold">Create Custom Game</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Basic Info */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Game Details</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Game Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Cover 2 Recognition Practice"
                  className="w-full bg-[#1B1E20] text-white px-4 py-3 rounded-lg border border-[#2A2F33] focus:border-[#00F6E5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of what this game covers..."
                  rows={3}
                  className="w-full bg-[#1B1E20] text-white px-4 py-3 rounded-lg border border-[#2A2F33] focus:border-[#00F6E5] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1B1E20] text-white px-4 py-3 rounded-lg border border-[#2A2F33] focus:border-[#00F6E5] focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Positions Filter */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Position Filter</h2>
              <p className="text-sm text-slate-400">
                Select positions to include (leave empty for all positions)
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {['QB', 'RB', 'X', 'Z', 'H', 'Y', 'TE'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => togglePosition(pos)}
                    className={`px-4 py-2 rounded-lg border transition ${
                      positions.includes(pos)
                        ? 'bg-[#00F6E5] text-black border-[#00F6E5]'
                        : 'bg-[#1B1E20] text-white border-[#2A2F33] hover:border-[#00F6E5]'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </section>

            {/* Topics Filter */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Topics</h2>
              <p className="text-sm text-slate-400">
                Select specific topics to include
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPICS.map((topic) => (
                  <label
                    key={topic.id}
                    className="flex items-center gap-3 p-3 bg-[#1B1E20] rounded-lg border border-[#2A2F33] hover:border-[#00F6E5]/40 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={topics.includes(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                      className="w-5 h-5 rounded border-[#2A2F33] bg-[#0A0A0A] text-[#00F6E5] focus:ring-[#00F6E5]"
                    />
                    <span className="text-white">{topic.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Difficulty Filter */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Difficulty Levels</h2>
              <div className="flex gap-3">
                {['beginner', 'intermediate', 'advanced'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => toggleDifficulty(diff)}
                    className={`flex-1 px-4 py-2 rounded-lg border transition capitalize ${
                      difficulty.includes(diff)
                        ? 'bg-[#00F6E5] text-black border-[#00F6E5]'
                        : 'bg-[#1B1E20] text-white border-[#2A2F33] hover:border-[#00F6E5]'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </section>

            {/* Game Settings */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Game Settings</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-[#1B1E20] text-white px-4 py-3 rounded-lg border border-[#2A2F33] focus:border-[#00F6E5] focus:outline-none"
                >
                  <option value="5">5 questions</option>
                  <option value="10">10 questions</option>
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                  <option value="25">25 questions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Selection Strategy
                </label>
                <select
                  value={selectionStrategy}
                  onChange={(e) => setSelectionStrategy(e.target.value as any)}
                  className="w-full bg-[#1B1E20] text-white px-4 py-3 rounded-lg border border-[#2A2F33] focus:border-[#00F6E5] focus:outline-none"
                >
                  <option value="random">Random</option>
                  <option value="difficulty_progression">Difficulty Progression</option>
                  <option value="spaced_repetition">Spaced Repetition</option>
                </select>
              </div>
            </section>

            {/* Preview */}
            <section>
              <div className="bg-[#00F6E5]/10 border border-[#00F6E5]/20 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Preview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available questions:</span>
                    <span className="font-medium">
                      {loading ? 'Counting...' : availableQuestions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Game will use:</span>
                    <span className="font-medium">{questionCount} questions</span>
                  </div>
                  {availableQuestions < questionCount && (
                    <p className="text-orange-400 text-xs mt-2">
                      ⚠️ Not enough questions available. Adjust your filters.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-[#2A2F33] text-white font-semibold rounded-lg hover:bg-[#3A3F43] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !name.trim() || availableQuestions < questionCount}
                className="flex-1 px-6 py-3 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
