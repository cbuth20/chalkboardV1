"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER CONTROLS — Pro-Level Playback Controls
// Frame-by-frame, speed control, zoom, fullscreen
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useFilmRoom } from '../FilmRoomContext';
import type { PlaybackSpeed } from '../types';

export function PlayerControls() {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const {
    playerState,
    togglePlay,
    seekFrame,
    setPlaybackRate,
    setZoom,
    resetZoom,
    toggleFullscreen,
    nextClip,
    prevClip,
  } = useFilmRoom();

  const speeds: PlaybackSpeed[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between mt-3">
      {/* Left Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Clip */}
        <ControlButton
          onClick={prevClip}
          tooltip="Previous clip (B)"
          icon={<PrevIcon className="h-4 w-4" />}
        />

        {/* Frame Back */}
        <ControlButton
          onClick={() => seekFrame('back')}
          tooltip="Frame back (,)"
          icon={<FrameBackIcon className="h-4 w-4" />}
        />

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00F6E5] to-[#00d4c5] text-[#0A0A0A] shadow-lg shadow-[#00F6E5]/30 hover:shadow-[#00F6E5]/50 hover:scale-105 transition-all"
        >
          {playerState.isPlaying ? (
            <PauseIcon className="h-5 w-5" />
          ) : (
            <PlayIcon className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Frame Forward */}
        <ControlButton
          onClick={() => seekFrame('forward')}
          tooltip="Frame forward (.)"
          icon={<FrameForwardIcon className="h-4 w-4" />}
        />

        {/* Next Clip */}
        <ControlButton
          onClick={nextClip}
          tooltip="Next clip (N)"
          icon={<NextIcon className="h-4 w-4" />}
        />
      </div>

      {/* Center: Time Display */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-semibold text-white tabular-nums">
          {formatTime(playerState.currentTime)}
        </span>
        <span className="text-slate-500">/</span>
        <span className="font-mono text-sm text-slate-400 tabular-nums">
          {formatTime(playerState.duration)}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Playback Speed */}
        <div className="relative">
          <ControlButton
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            tooltip="Playback speed"
            isActive={playerState.playbackRate !== 1}
          >
            <span className="text-xs font-bold tabular-nums">{playerState.playbackRate}×</span>
          </ControlButton>

          {/* Speed Menu */}
          {showSpeedMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-lg bg-[#1B1E20] border border-[#00F6E5]/20 shadow-xl shadow-black/50 overflow-hidden">
              <div className="py-1">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackRate(speed);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-sm font-semibold text-left transition-colors ${
                      playerState.playbackRate === speed
                        ? 'bg-[#00F6E5]/20 text-[#00F6E5]'
                        : 'text-slate-300 hover:bg-[#00F6E5]/10 hover:text-white'
                    }`}
                  >
                    {speed}×
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Zoom */}
        <ControlButton
          onClick={() => (playerState.zoom === 1 ? setZoom(1.5) : resetZoom())}
          tooltip={playerState.zoom === 1 ? 'Zoom in (Z)' : 'Reset zoom (Z)'}
          isActive={playerState.zoom !== 1}
          icon={<ZoomIcon className="h-4 w-4" />}
        />

        {/* Fullscreen */}
        <ControlButton
          onClick={toggleFullscreen}
          tooltip="Fullscreen (F)"
          icon={playerState.isFullscreen ? <ExitFullscreenIcon className="h-4 w-4" /> : <FullscreenIcon className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROL BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface ControlButtonProps {
  onClick: () => void;
  tooltip?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  isActive?: boolean;
}

function ControlButton({ onClick, tooltip, icon, children, isActive }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
        isActive
          ? 'bg-[#00F6E5]/20 text-[#00F6E5] border border-[#00F6E5]/30'
          : 'text-slate-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon || children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function PrevIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  );
}

function NextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

function FrameBackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="11 17 6 12 11 7" />
      <line x1="18" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FrameForwardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="13 17 18 12 13 7" />
      <line x1="6" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function ExitFullscreenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export default PlayerControls;








