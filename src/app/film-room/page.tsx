"use client";

// ═══════════════════════════════════════════════════════════════════════════
// FILM ROOM — Main Page
// Pro-level film study interface with video player, tagging, and AI analysis
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import PlayerNavbar from '@/components/PlayerNavbar';
import {
  FilmRoomProvider,
  useFilmRoom,
  VideoPlayer,
  PlayerHUD,
  TagPanel,
  AIBreakdownPanel,
  TelestratorDock,
  PlaylistSidebar,
  DrawingCanvas,
} from '@/components/film-room';

// Mock clips for demo
const MOCK_CLIPS = [
  {
    id: 'clip-1',
    title: 'Cover 3 vs 2x2 - TD Pass',
    description: 'Y-Cross concept against Cover 3 shell',
    videoUrl: '/demo/clip1.mp4',
    thumbnailUrl: null,
    duration: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
    opponent: 'Ravens',
    tags: [
      { id: 't1', category: 'formation' as const, value: '2x2', isAIGenerated: false },
      { id: 't2', category: 'coverage' as const, value: 'Cover 3', isAIGenerated: true, confidence: 0.95 },
      { id: 't3', category: 'routeConcept' as const, value: 'Y-Cross', isAIGenerated: false },
    ],
    aiAnalysis: {
      id: 'ai-1',
      clipId: 'clip-1',
      createdAt: new Date(),
      status: 'complete' as const,
      offenseFormation: { value: '2x2 Spread', confidence: 0.92 },
      coverageShell: { value: 'Cover 3 Sky', confidence: 0.95 },
      concept: { value: 'Y-Cross', confidence: 0.88 },
      defensiveFront: { value: '4-3 Over', confidence: 0.9 },
      routes: [
        { player: 'X', routeName: 'Dig', depth: 12, confidence: 0.94 },
        { player: 'Z', routeName: 'Post', depth: 18, confidence: 0.91 },
        { player: 'Y', routeName: 'Cross', depth: 10, confidence: 0.96 },
      ],
      coachingNotes: [
        'Excellent release by Y receiver against the LB',
        'QB made correct read going to the dig route',
        'Safety was late rotating - window was there',
      ],
      keyReads: [
        'Read the high safety first - single high tells you it\'s likely Cover 1 or Cover 3',
        'Watch the curl/flat defender on your side',
        'If he sinks with the dig, hit the Y in the window',
      ],
    },
    viewCount: 5,
    isStudied: true,
  },
  {
    id: 'clip-2',
    title: 'Mesh vs Man Coverage',
    description: 'Mesh concept picking apart man coverage',
    videoUrl: '/demo/clip2.mp4',
    thumbnailUrl: null,
    duration: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
    opponent: 'Steelers',
    tags: [
      { id: 't4', category: 'formation' as const, value: '3x1', isAIGenerated: false },
      { id: 't5', category: 'coverage' as const, value: 'Cover 1', isAIGenerated: true, confidence: 0.88 },
    ],
    viewCount: 3,
    isStudied: false,
  },
  {
    id: 'clip-3',
    title: 'Four Verts vs Cover 4',
    description: 'Attacking quarters coverage with 4 verticals',
    videoUrl: '/demo/clip3.mp4',
    thumbnailUrl: null,
    duration: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
    opponent: 'Bengals',
    tags: [
      { id: 't6', category: 'routeConcept' as const, value: 'Four Verticals', isAIGenerated: false },
    ],
    viewCount: 8,
    isStudied: true,
  },
];

export default function FilmRoomPage() {
  return (
    <FilmRoomProvider>
      <FilmRoomContent />
    </FilmRoomProvider>
  );
}

function FilmRoomContent() {
  const { currentClip, activePanel, setActivePanel, isPanelCollapsed, togglePanel, loadClip, playerState } = useFilmRoom();
  const [leftPanelWidth] = useState(320);
  const [rightPanelWidth] = useState(360);

  // Load mock clips on mount
  useEffect(() => {
    // In a real app, this would fetch from Supabase
    if (MOCK_CLIPS.length > 0) {
      loadClip(MOCK_CLIPS[0] as any);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <PlayerNavbar />

      <main className="flex h-[calc(100vh-64px)]">
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT SIDEBAR — Clips & Playlists
        ═══════════════════════════════════════════════════════════════════ */}
        <aside
          className="flex-shrink-0 border-r border-[#1B1E20] bg-[#0A0A0A]"
          style={{ width: leftPanelWidth }}
        >
          <PlaylistSidebar />
        </aside>

        {/* ═══════════════════════════════════════════════════════════════════
            CENTER — Video Player & HUD
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Control Bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-[#1B1E20] bg-[#0A0A0A]/80 backdrop-blur-sm">
            {/* Clip Info */}
            <div className="flex items-center gap-3">
              {currentClip && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Now Playing
                    </span>
                    <span className="text-sm font-bold text-white truncate max-w-[300px]">
                      {currentClip.title}
                    </span>
                  </div>
                  {currentClip.opponent && (
                    <span className="px-2 py-0.5 rounded bg-[#1B1E20] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      vs {currentClip.opponent}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Toggle Buttons */}
            <div className="flex items-center gap-1">
              <ToggleButton
                icon={<FormationIcon className="h-4 w-4" />}
                label="Formation"
                isActive={playerState.showFormationOverlay}
              />
              <ToggleButton
                icon={<RouteIcon className="h-4 w-4" />}
                label="Routes"
                isActive={playerState.showRouteOverlay}
              />
              <ToggleButton
                icon={<ShieldIcon className="h-4 w-4" />}
                label="Coverage"
                isActive={playerState.showCoverageOverlay}
              />
              <div className="w-px h-6 bg-[#1B1E20] mx-2" />
              <ToggleButton
                icon={<DrawIcon className="h-4 w-4" />}
                label="Draw"
                isActive={playerState.showTelestrator}
              />
            </div>
          </div>

          {/* Video Player Container */}
          <div className="flex-1 relative flex items-center justify-center p-4 bg-[#0A0A0A]">
            <div className="relative w-full max-w-5xl aspect-video">
              <VideoPlayer className="w-full" />
              <PlayerHUD />
              <DrawingCanvas width={1920} height={1080} />
            </div>
          </div>

          {/* Bottom Panel Tabs */}
          <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-t border-[#1B1E20] bg-[#0A0A0A]">
            <PanelTab
              label="Tags"
              icon={<TagIcon className="h-4 w-4" />}
              isActive={activePanel === 'tags'}
              onClick={() => setActivePanel(activePanel === 'tags' ? null : 'tags')}
            />
            <PanelTab
              label="AI Coach"
              icon={<AIIcon className="h-4 w-4" />}
              isActive={activePanel === 'ai'}
              onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
            />
            <PanelTab
              label="Telestrator"
              icon={<DrawIcon className="h-4 w-4" />}
              isActive={activePanel === 'telestrator'}
              onClick={() => setActivePanel(activePanel === 'telestrator' ? null : 'telestrator')}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT SIDEBAR — Active Panel
        ═══════════════════════════════════════════════════════════════════ */}
        {activePanel && !isPanelCollapsed && (
          <aside
            className="flex-shrink-0 border-l border-[#1B1E20] bg-[#0A0A0A] animate-slide-in-right"
            style={{ width: rightPanelWidth }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1B1E20]">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {activePanel === 'tags' && 'Clip Tags'}
                {activePanel === 'ai' && 'AI Coach'}
                {activePanel === 'telestrator' && 'Telestrator'}
              </span>
              <button
                onClick={togglePanel}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1B1E20] transition-colors"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="h-[calc(100%-52px)] overflow-hidden">
              {activePanel === 'tags' && <TagPanel />}
              {activePanel === 'ai' && <AIBreakdownPanel />}
              {activePanel === 'telestrator' && <TelestratorDock />}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ToggleButton({
  icon,
  label,
  isActive,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}) {
  return (
    <button
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
        isActive
          ? 'bg-[#00F6E5]/20 text-[#00F6E5] border border-[#00F6E5]/30'
          : 'text-slate-500 hover:text-white hover:bg-[#1B1E20] border border-transparent'
      }`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function PanelTab({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
        isActive
          ? 'bg-[#00F6E5]/20 text-[#00F6E5] border border-[#00F6E5]/30'
          : 'text-slate-500 hover:text-white hover:bg-[#1B1E20] border border-transparent'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function FormationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="8" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V7" />
      <path d="M7 12l5-5 5 5" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function DrawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

