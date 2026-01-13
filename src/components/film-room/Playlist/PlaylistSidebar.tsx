"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PLAYLIST SIDEBAR — Clip List & Playlist Management
// Browse, filter, and organize film clips
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useFilmRoom } from '../FilmRoomContext';
import { ClipCard } from './ClipCard';
import { ClipFilters } from './ClipFilters';

export function PlaylistSidebar() {
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'all' | 'playlist'>('all');

  const { clips, currentClip, currentPlaylist, playlists, loadClip } = useFilmRoom();

  const displayClips = view === 'playlist' && currentPlaylist 
    ? currentPlaylist.clips 
    : clips;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FilmIcon className="h-5 w-5 text-[#00F6E5]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Clips
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${
                showFilters
                  ? 'bg-[#00F6E5]/20 text-[#00F6E5]'
                  : 'text-slate-400 hover:text-white hover:bg-[#1B1E20]'
              }`}
              title="Filters"
            >
              <FilterIcon className="h-4 w-4" />
            </button>
            <button
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1B1E20] transition-colors"
              title="Upload Clip"
            >
              <UploadIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0A0A0A]">
          <button
            onClick={() => setView('all')}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              view === 'all'
                ? 'bg-[#1B1E20] text-white'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            All Clips
          </button>
          <button
            onClick={() => setView('playlist')}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              view === 'playlist'
                ? 'bg-[#1B1E20] text-white'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            Playlist
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="flex-shrink-0 border-b border-[#1B1E20]">
          <ClipFilters />
        </div>
      )}

      {/* Playlist Selector (when in playlist view) */}
      {view === 'playlist' && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
          <select className="w-full px-3 py-2 rounded-lg bg-[#1B1E20] border border-transparent text-sm text-white focus:outline-none focus:border-[#00F6E5]/30">
            <option value="">Select Playlist...</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name} ({playlist.clips.length})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clip List */}
      <div className="flex-1 overflow-y-auto">
        {displayClips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4">
            <EmptyIcon className="h-12 w-12 text-slate-700 mb-4" />
            <p className="text-slate-500 text-sm text-center mb-2">
              {view === 'playlist' ? 'No clips in this playlist' : 'No clips available'}
            </p>
            <button className="text-xs font-semibold text-[#00F6E5] hover:underline">
              Upload your first clip →
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {displayClips.map((clip, idx) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                index={idx + 1}
                isActive={currentClip?.id === clip.id}
                onClick={() => loadClip(clip)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[#1B1E20]">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{displayClips.length} clips</span>
          <span>
            {displayClips.filter((c) => c.isStudied).length} studied
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 p-4 border-t border-[#1B1E20]">
        <div className="flex gap-2">
          <button className="flex-1 py-2.5 rounded-lg bg-[#1B1E20] text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2">
            <PlaylistIcon className="h-4 w-4" />
            New Playlist
          </button>
          <button className="flex-1 py-2.5 rounded-lg bg-[#1B1E20] text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2">
            <ShareIcon className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PlaylistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export default PlaylistSidebar;








