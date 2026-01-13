"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBACK SPEED — Speed Control Dial
// Radial speed selector for quick adjustments
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useFilmRoom } from '../FilmRoomContext';
import type { PlaybackSpeed as SpeedType } from '../types';

interface PlaybackSpeedProps {
  className?: string;
}

export function PlaybackSpeed({ className = '' }: PlaybackSpeedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { playerState, setPlaybackRate } = useFilmRoom();

  const speeds: SpeedType[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  const getSpeedLabel = (speed: SpeedType) => {
    if (speed === 0.25) return '¼×';
    if (speed === 0.5) return '½×';
    if (speed === 0.75) return '¾×';
    if (speed === 1) return '1×';
    return `${speed}×`;
  };

  const getSpeedColor = (speed: SpeedType) => {
    if (speed < 1) return 'text-[#3DF3FF]';
    if (speed === 1) return 'text-white';
    return 'text-[#F5C253]';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          playerState.playbackRate !== 1
            ? 'bg-[#00F6E5]/15 border border-[#00F6E5]/30 text-[#00F6E5]'
            : 'bg-[#1B1E20] border border-transparent text-slate-400 hover:text-white hover:border-slate-700'
        }`}
      >
        <SpeedIcon className="h-4 w-4" />
        <span className="text-sm font-bold tabular-nums">{playerState.playbackRate}×</span>
        <ChevronIcon className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Speed Selector Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsExpanded(false)} />

          {/* Panel */}
          <div className="absolute bottom-full left-0 mb-2 z-20 p-3 rounded-xl bg-[#0A0A0A] border border-[#1B1E20] shadow-2xl shadow-black/60 backdrop-blur-xl animate-scale-in">
            <div className="mb-2 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Playback Speed
              </span>
            </div>

            {/* Speed Buttons */}
            <div className="flex flex-col gap-1">
              {speeds.map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackRate(speed);
                    setIsExpanded(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    playerState.playbackRate === speed
                      ? 'bg-[#00F6E5]/20 text-[#00F6E5]'
                      : 'text-slate-400 hover:bg-[#1B1E20] hover:text-white'
                  }`}
                >
                  <span className={`text-sm font-bold ${getSpeedColor(speed)}`}>
                    {getSpeedLabel(speed)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {speed < 1 ? 'Slow-mo' : speed === 1 ? 'Normal' : 'Fast'}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Keys Hint */}
            <div className="mt-3 pt-3 border-t border-[#1B1E20]">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="px-1.5 py-0.5 rounded bg-[#1B1E20] font-mono">1-7</span>
                <span>Quick select</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function SpeedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default PlaybackSpeed;








