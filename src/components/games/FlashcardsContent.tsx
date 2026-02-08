"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { playerGamesAPI, PlayerGame, GameFilters } from '@/lib/api/player-games';

// ═══════════════════════════════════════════════════════════════════════════
// GAME CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

const GAME_CATEGORIES = [
  {
    id: 'coverage_blitz',
    title: 'Coverage & Blitz',
    description: 'Recognition and adjustments',
    topics: ['coverage_recognition', 'pre_snap_reads', 'hot_routes', 'coverage_adjustments'],
    icon: '🛡️',
    color: 'teal',
  },
  {
    id: 'routes_concepts',
    title: 'Routes & Concepts',
    description: 'Execution and assignments',
    topics: ['route_running', 'play_concepts', 'alignment_rules', 'blocking_assignments'],
    icon: '🎯',
    color: 'ice',
  },
  {
    id: 'situational',
    title: 'Situational Football',
    description: 'Game scenarios and decisions',
    tags: ['3rd_down', 'red_zone', '2_minute'],
    topics: ['situational_football', 'game_planning'],
    icon: '⚡',
    color: 'orange',
  },
  {
    id: 'assignments',
    title: 'Position Assignments',
    description: 'Role-specific knowledge',
    topics: ['blocking_assignments', 'pass_protection', 'run_fits'],
    icon: '📋',
    color: 'gold',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FlashcardsContentProps {
  orgId: string;
  positionFilter: string;
  questionCounts: Record<string, number>;
  customGames: PlayerGame[];
}

export function FlashcardsContent({
  orgId,
  positionFilter,
  questionCounts,
  customGames,
}: FlashcardsContentProps) {
  const router = useRouter();

  const startQuickGame = async (category: string, filters: GameFilters) => {
    try {
      const result = await playerGamesAPI.startGame(
        {
          adHocFilters: {
            ...filters,
            ...(positionFilter !== 'all' ? { positions: [positionFilter] } : {}),
          },
          questionCount: 10,
        },
        orgId
      );

      // Store questions in sessionStorage for the game session
      sessionStorage.setItem(`game_${result.attemptId}`, JSON.stringify(result.questions));

      router.push(`/games-center/play/${result.attemptId}`);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const openCustomGameCreator = () => {
    router.push('/games-center/create');
  };

  const playCustomGame = async (gameId: string) => {
    try {
      const result = await playerGamesAPI.startGame({ gameId }, orgId);

      // Store questions in sessionStorage for the game session
      sessionStorage.setItem(`game_${result.attemptId}`, JSON.stringify(result.questions));

      router.push(`/games-center/play/${result.attemptId}`);
    } catch (error) {
      console.error('Failed to start custom game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  return (
    <div className="space-y-12">
      {/* Game Categories */}
      {GAME_CATEGORIES.map(category => (
        <section key={category.id} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <h2 className="text-2xl font-bold">{category.title}</h2>
              <p className="text-sm text-slate-400">{category.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.topics?.map(topic => {
              const count = questionCounts[topic] || 0;
              return (
                <GameCard
                  key={topic}
                  title={formatTopic(topic)}
                  questionCount={count}
                  color={category.color}
                  onPlay={() =>
                    startQuickGame(category.id, {
                      topics: [topic],
                      difficulty: ['beginner', 'intermediate', 'advanced'],
                    })
                  }
                />
              );
            })}
          </div>
        </section>
      ))}

      {/* Custom Games Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">MY CUSTOM GAMES</h2>
            <p className="text-sm text-slate-400">Games you've created with custom filters</p>
          </div>
          <button
            onClick={openCustomGameCreator}
            className="flex items-center gap-2 px-4 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition"
          >
            <span className="text-xl">+</span>
            Create Custom Game
          </button>
        </div>

        {customGames.length === 0 ? (
          <div className="bg-[#1B1E20] rounded-xl p-8 text-center border border-[#2A2F33]">
            <p className="text-slate-400 mb-4">
              No custom games yet. Create one to practice specific topics!
            </p>
            <button
              onClick={openCustomGameCreator}
              className="px-6 py-3 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition"
            >
              Create Your First Game
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customGames.map(game => (
              <CustomGameCard key={game.id} game={game} onPlay={() => playCustomGame(game.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHILD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function GameCard({
  title,
  questionCount,
  color,
  onPlay,
}: {
  title: string;
  questionCount: number;
  color: string;
  onPlay: () => void;
}) {
  const colorClasses: Record<string, string> = {
    teal: 'border-[#00F6E5]/20 bg-[#00F6E5]/5 hover:border-[#00F6E5]/40',
    ice: 'border-[#A8E6CF]/20 bg-[#A8E6CF]/5 hover:border-[#A8E6CF]/40',
    orange: 'border-[#FFB84D]/20 bg-[#FFB84D]/5 hover:border-[#FFB84D]/40',
    gold: 'border-[#FFD700]/20 bg-[#FFD700]/5 hover:border-[#FFD700]/40',
  };

  return (
    <div
      className={`rounded-xl p-6 border transition cursor-pointer ${
        colorClasses[color] || colorClasses.teal
      }`}
      onClick={questionCount > 0 ? onPlay : undefined}
    >
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{questionCount} questions</span>
        {questionCount > 0 ? (
          <button className="px-4 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition">
            Play
          </button>
        ) : (
          <span className="text-xs text-slate-500">No questions</span>
        )}
      </div>
    </div>
  );
}

function CustomGameCard({ game, onPlay }: { game: PlayerGame; onPlay: () => void }) {
  return (
    <div className="rounded-xl p-6 border border-[#2A2F33] bg-[#1B1E20] hover:border-[#00F6E5]/40 transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold mb-1">{game.name}</h3>
          {game.description && <p className="text-sm text-slate-400">{game.description}</p>}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Questions:</span>
          <span className="font-medium">{game.questionCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Best Score:</span>
          <span className="font-medium">
            {game.bestScore !== null ? `${game.bestScore}%` : 'Not played'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Attempts:</span>
          <span className="font-medium">{game.totalAttempts}</span>
        </div>
      </div>

      <button
        onClick={onPlay}
        className="w-full px-4 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition"
      >
        Play Game
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatTopic(topic: string): string {
  return topic
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
