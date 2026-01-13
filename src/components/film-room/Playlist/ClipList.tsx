"use client";

// ═══════════════════════════════════════════════════════════════════════════
// CLIP LIST — Simple Clip List Component
// Lightweight list for use in other contexts
// ═══════════════════════════════════════════════════════════════════════════

import type { FilmClip } from '../types';
import { ClipCard } from './ClipCard';

interface ClipListProps {
  clips: FilmClip[];
  activeClipId?: string;
  onClipSelect: (clip: FilmClip) => void;
  emptyMessage?: string;
}

export function ClipList({
  clips,
  activeClipId,
  onClipSelect,
  emptyMessage = 'No clips available',
}: ClipListProps) {
  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <EmptyIcon className="h-12 w-12 text-slate-700 mb-4" />
        <p className="text-slate-500 text-sm text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clips.map((clip, idx) => (
        <ClipCard
          key={clip.id}
          clip={clip}
          index={idx + 1}
          isActive={clip.id === activeClipId}
          onClick={() => onClipSelect(clip)}
        />
      ))}
    </div>
  );
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export default ClipList;








