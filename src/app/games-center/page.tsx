"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { playerGamesAPI, PlayerGame, GameFilters } from '@/lib/api/player-games';
import { GamesTabs, GamesTab } from '@/components/games/GamesTabs';
import { FlashcardsContent } from '@/components/games/FlashcardsContent';
import { FormationTrainerContent } from '@/components/games/FormationTrainerContent';
import { AlignmentTrainerContent } from '@/components/games/AlignmentTrainerContent';
import { BlockCoverageContent } from '@/components/games/BlockCoverageContent';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function GamesCenterPage() {
  const router = useRouter();
  const { session, orgId, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<GamesTab>('flashcards');
  const [stats, setStats] = useState({
    playsReady: 0,
    questionsAvailable: 0,
    avgAccuracy: 0,
  });
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [customGames, setCustomGames] = useState<PlayerGame[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load data on mount - only after auth is ready
  useEffect(() => {
    if (!authLoading && session && orgId) {
      // Add a small delay to ensure Supabase session is fully initialized
      const timer = setTimeout(() => {
        loadData();
      }, 300);
      return () => clearTimeout(timer);
    } else if (!authLoading && !session) {
      // Auth loaded but no session - stop loading
      setLoading(false);
    }
  }, [authLoading, session, orgId, positionFilter]);

  const loadData = async () => {
    if (!session || !orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch available questions
      const availability = await playerGamesAPI.getAvailableQuestions(
        orgId,
        positionFilter !== 'all' ? { position: positionFilter } : {}
      );

      setStats({
        playsReady: availability.plays.length,
        questionsAvailable: availability.total,
        avgAccuracy: 0, // TODO: Calculate from attempts
      });

      setQuestionCounts(availability.byTopic);

      // Fetch custom games
      const { games } = await playerGamesAPI.listGames(orgId, { isActive: true });
      setCustomGames(games);
    } catch (error) {
      console.error('Failed to load games data:', error);
      // Don't show alert for auth errors - they're expected during load
      if (error instanceof Error && !error.message.includes('authorization')) {
        alert('Failed to load games. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };


  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading games...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        {/* Header with Stats */}
        <header className="border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">MY GAMES</h1>

            {/* Tabs */}
            <GamesTabs activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

            {/* Stats Grid - Only show for flashcards tab */}
            {activeTab === 'flashcards' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <StatCard
                    label="Plays Ready"
                    value={stats.playsReady}
                    icon="📚"
                    color="teal"
                  />
                  <StatCard
                    label="Questions Available"
                    value={stats.questionsAvailable}
                    icon="❓"
                    color="ice"
                  />
                  <StatCard
                    label="Avg Accuracy"
                    value={`${stats.avgAccuracy}%`}
                    icon="🎯"
                    color="orange"
                  />
                </div>

                {/* Position Filter */}
                <div className="flex items-center gap-4">
                  <label className="text-sm text-slate-400 font-medium">Position:</label>
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="bg-[#1B1E20] text-white px-4 py-2 rounded-lg border border-[#2A2F33] focus:border-[#00F6E5] focus:outline-none"
                  >
                    <option value="all">All Positions</option>
                    <option value="QB">QB</option>
                    <option value="RB">RB</option>
                    <option value="X">X Receiver</option>
                    <option value="Z">Z Receiver</option>
                    <option value="H">H-Back</option>
                    <option value="Y">Y Tight End</option>
                    <option value="TE">Tight End</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Tab Content */}
          {activeTab === 'flashcards' && (
            <FlashcardsContent
              orgId={orgId!}
              positionFilter={positionFilter}
              questionCounts={questionCounts}
              customGames={customGames}
            />
          )}

          {activeTab === 'formations' && <FormationTrainerContent />}

          {activeTab === 'alignment' && <AlignmentTrainerContent />}

          {activeTab === 'block-coverage' && <BlockCoverageContent />}
        </div>
      </div>
    </SidebarLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHILD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    teal: 'border-[#00F6E5]/20 bg-[#00F6E5]/5',
    ice: 'border-[#A8E6CF]/20 bg-[#A8E6CF]/5',
    orange: 'border-[#FFB84D]/20 bg-[#FFB84D]/5',
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color] || colorClasses.teal}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
    </div>
  );
}
