"use client";

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE SCRUBBER — Interactive Video Timeline
// Shows clip tags, AI analysis markers, and time-stamped annotations
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useState, useCallback } from 'react';
import { useFilmRoom } from '../FilmRoomContext';

export function TimelineScrubber() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const { playerState, currentClip, seek } = useFilmRoom();

  const progress = playerState.duration ? (playerState.currentTime / playerState.duration) * 100 : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Seek Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const calculateTime = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return percentage * playerState.duration;
    },
    [playerState.duration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      const time = calculateTime(e.clientX);
      seek(time);
    },
    [calculateTime, seek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverX(x);
      setHoverTime(calculateTime(e.clientX));

      if (isDragging) {
        seek(calculateTime(e.clientX));
      }
    },
    [isDragging, calculateTime, seek]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setHoverTime(null);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Format Time
  // ─────────────────────────────────────────────────────────────────────────

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Tag Markers
  // ─────────────────────────────────────────────────────────────────────────

  const tagMarkers =
    currentClip?.tags
      .filter((tag) => tag.timestamp !== undefined)
      .map((tag) => ({
        ...tag,
        position: ((tag.timestamp ?? 0) / playerState.duration) * 100,
      })) ?? [];

  return (
    <div
      ref={trackRef}
      className="relative h-8 cursor-pointer group"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Track Background */}
      <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-slate-700/60 overflow-hidden">
        {/* Buffered Progress (simulated) */}
        <div
          className="absolute top-0 left-0 h-full bg-slate-600/50"
          style={{ width: `${Math.min(progress + 20, 100)}%` }}
        />

        {/* Playback Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00F6E5] to-[#3DF3FF] rounded-full transition-all duration-75"
          style={{ width: `${progress}%` }}
        >
          {/* Glow Effect */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[#00F6E5] blur-md opacity-50" />
        </div>
      </div>

      {/* Scrubber Head */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform duration-75"
        style={{ left: `${progress}%` }}
      >
        {/* Outer Ring */}
        <div className="h-4 w-4 rounded-full bg-[#00F6E5] shadow-lg shadow-[#00F6E5]/40 border-2 border-white group-hover:scale-125 transition-transform" />
      </div>

      {/* Tag Markers */}
      {tagMarkers.map((tag) => (
        <div
          key={tag.id}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${tag.position}%` }}
          title={`${tag.category}: ${tag.value}`}
        >
          <div
            className={`h-2.5 w-2.5 rounded-full border-2 ${
              tag.isAIGenerated
                ? 'bg-[#F5C253] border-[#F5C253]/50'
                : 'bg-[#00F6E5] border-[#00F6E5]/50'
            }`}
          />
        </div>
      ))}

      {/* Hover Time Tooltip */}
      {hoverTime !== null && (
        <div
          className="absolute bottom-full mb-2 px-2 py-1 rounded bg-black/90 border border-[#00F6E5]/30 backdrop-blur-sm transform -translate-x-1/2 pointer-events-none"
          style={{ left: hoverX }}
        >
          <span className="font-mono text-xs font-semibold text-[#00F6E5]">
            {formatTime(hoverTime)}
          </span>
        </div>
      )}

      {/* Hover Preview Line */}
      {hoverTime !== null && (
        <div
          className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none"
          style={{ left: hoverX }}
        />
      )}
    </div>
  );
}

export default TimelineScrubber;








