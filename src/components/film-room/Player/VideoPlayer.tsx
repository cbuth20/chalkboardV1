"use client";

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO PLAYER — Pro-Level Film Player
// Custom HTML5 video player with frame-by-frame control
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useCallback } from 'react';
import { useFilmRoom } from '../FilmRoomContext';
import { PlayerControls } from './PlayerControls';
import { TimelineScrubber } from './TimelineScrubber';

interface VideoPlayerProps {
  className?: string;
}

export function VideoPlayer({ className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    currentClip,
    playerState,
    play,
    pause,
    togglePlay,
    seek,
    seekFrame,
    setPlaybackRate,
    setZoom,
    resetZoom,
    toggleFullscreen,
    telestratorState,
  } = useFilmRoom();

  // ─────────────────────────────────────────────────────────────────────────
  // Sync Video Element with State
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playerState.isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playerState.playbackRate;
  }, [playerState.playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.currentTime - playerState.currentTime) > 0.1) {
      video.currentTime = playerState.currentTime;
    }
  }, [playerState.currentTime]);

  // ─────────────────────────────────────────────────────────────────────────
  // Video Event Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      seek(video.currentTime);
    }
  }, [seek]);

  const handleEnded = useCallback(() => {
    pause();
  }, [pause]);

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard Shortcuts
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, playerState.currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(playerState.duration, playerState.currentTime + 5));
          break;
        case ',':
          e.preventDefault();
          seekFrame('back');
          break;
        case '.':
          e.preventDefault();
          seekFrame('forward');
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'j':
          e.preventDefault();
          seek(Math.max(0, playerState.currentTime - 10));
          break;
        case 'l':
          e.preventDefault();
          seek(Math.min(playerState.duration, playerState.currentTime + 10));
          break;
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'z':
          e.preventDefault();
          if (playerState.zoom === 1) {
            setZoom(1.5);
          } else {
            resetZoom();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerState, togglePlay, seek, seekFrame, toggleFullscreen, setZoom, resetZoom]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const zoomStyle = {
    transform: `scale(${playerState.zoom}) translate(${playerState.panX}px, ${playerState.panY}px)`,
    transformOrigin: 'center center',
  };

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video bg-black rounded-xl overflow-hidden group ${className} ${
        playerState.isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Video Element */}
      {currentClip ? (
        <video
          ref={videoRef}
          src={currentClip.videoUrl}
          className="w-full h-full object-contain"
          style={zoomStyle}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onClick={togglePlay}
          playsInline
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <FilmIcon className="h-16 w-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm uppercase tracking-wider font-semibold">
              Select a clip to begin
            </p>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay Icon */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
          playerState.isPlaying ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="h-20 w-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10">
          <PlayIcon className="h-10 w-10 text-white ml-1" />
        </div>
      </div>

      {/* Zoom Indicator */}
      {playerState.zoom !== 1 && (
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-[#00F6E5]/30">
          <ZoomIcon className="h-4 w-4 text-[#00F6E5]" />
          <span className="text-sm font-semibold text-[#00F6E5]">{playerState.zoom.toFixed(1)}×</span>
        </div>
      )}

      {/* Playback Speed Indicator */}
      {playerState.playbackRate !== 1 && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-[#F5C253]/30">
          <SpeedIcon className="h-4 w-4 text-[#F5C253]" />
          <span className="text-sm font-semibold text-[#F5C253]">{playerState.playbackRate}×</span>
        </div>
      )}

      {/* HUD Controls Container */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Timeline Scrubber */}
        <TimelineScrubber />

        {/* Player Controls */}
        <PlayerControls />
      </div>

      {/* Telestrator Canvas Overlay */}
      {playerState.showTelestrator && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Telestrator elements render here */}
          <svg className="w-full h-full">
            {telestratorState.elements.map((element) => (
              <TelestratorElement key={element.id} element={element} />
            ))}
          </svg>
        </div>
      )}

      {/* Current Clip Info Badge */}
      {currentClip && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Now Viewing
            </span>
            <span className="text-sm font-bold text-white">{currentClip.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TELESTRATOR ELEMENT RENDERER
// ═══════════════════════════════════════════════════════════════════════════

import type { DrawingElement } from '../types';

function TelestratorElement({ element }: { element: DrawingElement }) {
  const { type, points, color, strokeWidth, text, playerLabel } = element;

  if (points.length === 0) return null;

  switch (type) {
    case 'pen':
    case 'route':
      const pathData = points.reduce((acc, point, i) => {
        return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
      }, '');
      return (
        <path
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={type === 'route' ? '8 4' : 'none'}
        />
      );

    case 'arrow':
    case 'line':
      if (points.length < 2) return null;
      const start = points[0];
      const end = points[points.length - 1];
      return (
        <>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {type === 'arrow' && (
            <ArrowHead x={end.x} y={end.y} angle={Math.atan2(end.y - start.y, end.x - start.x)} color={color} />
          )}
        </>
      );

    case 'circle':
      if (points.length < 2) return null;
      const cx = (points[0].x + points[1].x) / 2;
      const cy = (points[0].y + points[1].y) / 2;
      const rx = Math.abs(points[1].x - points[0].x) / 2;
      const ry = Math.abs(points[1].y - points[0].y) / 2;
      return (
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      );

    case 'rectangle':
      if (points.length < 2) return null;
      const x = Math.min(points[0].x, points[1].x);
      const y = Math.min(points[0].y, points[1].y);
      const width = Math.abs(points[1].x - points[0].x);
      const height = Math.abs(points[1].y - points[0].y);
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          rx={4}
        />
      );

    case 'playerSpot':
      return (
        <g>
          <circle
            cx={points[0].x}
            cy={points[0].y}
            r={16}
            fill={color}
            stroke="white"
            strokeWidth={2}
          />
          {playerLabel && (
            <text
              x={points[0].x}
              y={points[0].y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              {playerLabel}
            </text>
          )}
        </g>
      );

    case 'text':
      return (
        <text
          x={points[0].x}
          y={points[0].y}
          fill={color}
          fontSize="16"
          fontWeight="bold"
        >
          {text}
        </text>
      );

    default:
      return null;
  }
}

function ArrowHead({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  const size = 12;
  const x1 = x - size * Math.cos(angle - Math.PI / 6);
  const y1 = y - size * Math.sin(angle - Math.PI / 6);
  const x2 = x - size * Math.cos(angle + Math.PI / 6);
  const y2 = y - size * Math.sin(angle + Math.PI / 6);

  return <polygon points={`${x},${y} ${x1},${y1} ${x2},${y2}`} fill={color} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
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

function SpeedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export default VideoPlayer;








