"use client";

// ═══════════════════════════════════════════════════════════════════════════
// CLIP CARD — Individual Clip Preview
// Compact card showing clip thumbnail, tags, and status
// ═══════════════════════════════════════════════════════════════════════════

import type { FilmClip } from '../types';

interface ClipCardProps {
  clip: FilmClip;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export function ClipCard({ clip, index, isActive, onClick }: ClipCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const primaryTag = clip.tags.find((t) => 
    ['formation', 'coverage', 'routeConcept'].includes(t.category)
  );

  const hasAI = clip.aiAnalysis && clip.aiAnalysis.status === 'complete';

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer rounded-lg overflow-hidden transition-all ${
        isActive
          ? 'ring-2 ring-[#00F6E5] bg-[#00F6E5]/10'
          : 'bg-[#1B1E20] hover:bg-[#1B1E20]/80'
      }`}
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden bg-black">
          {clip.thumbnailUrl ? (
            <img
              src={clip.thumbnailUrl}
              alt={clip.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1B1E20] to-[#0A0A0A]">
              <FilmIcon className="h-6 w-6 text-slate-700" />
            </div>
          )}

          {/* Duration Badge */}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-semibold text-white">
            {formatDuration(clip.duration)}
          </div>

          {/* Index Badge */}
          <div className="absolute top-1 left-1 h-5 w-5 flex items-center justify-center rounded bg-black/80 text-[10px] font-bold text-slate-300">
            {index}
          </div>

          {/* Playing Indicator */}
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex items-center gap-1">
                <span className="w-1 h-4 bg-[#00F6E5] rounded-full animate-pulse" />
                <span className="w-1 h-3 bg-[#00F6E5] rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                <span className="w-1 h-4 bg-[#00F6E5] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className={`text-sm font-semibold truncate mb-1 ${
            isActive ? 'text-[#00F6E5]' : 'text-white'
          }`}>
            {clip.title}
          </h4>

          {/* Tags */}
          <div className="flex items-center gap-1.5 mb-2">
            {primaryTag && (
              <span className="px-1.5 py-0.5 rounded bg-[#00F6E5]/15 text-[10px] font-semibold text-[#00F6E5] truncate max-w-[80px]">
                {primaryTag.value}
              </span>
            )}
            {clip.tags.length > 1 && (
              <span className="text-[10px] text-slate-500">
                +{clip.tags.length - 1}
              </span>
            )}
          </div>

          {/* Meta Row */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            {/* AI Badge */}
            {hasAI && (
              <span className="flex items-center gap-1 text-[#F5C253]">
                <AIIcon className="h-3 w-3" />
                AI
              </span>
            )}

            {/* View Count */}
            <span className="flex items-center gap-1">
              <EyeIcon className="h-3 w-3" />
              {clip.viewCount}
            </span>

            {/* Studied Indicator */}
            {clip.isStudied && (
              <span className="flex items-center gap-1 text-[#00F6E5]">
                <CheckIcon className="h-3 w-3" />
                Studied
              </span>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="h-6 w-6 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            title="Add to Playlist"
            onClick={(e) => {
              e.stopPropagation();
              // Handle add to playlist
            }}
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
          <button
            className="h-6 w-6 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            title="More Options"
            onClick={(e) => {
              e.stopPropagation();
              // Handle more options
            }}
          >
            <MoreIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Hover Overlay Play Button */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#00F6E5]/20 backdrop-blur-sm">
            <PlayIcon className="h-5 w-5 text-[#00F6E5] ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
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

export default ClipCard;








