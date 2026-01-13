"use client";

// ═══════════════════════════════════════════════════════════════════════════
// FORMATION OVERLAY — Visual Formation Diagram
// Displays detected offensive formation on video
// ═══════════════════════════════════════════════════════════════════════════

import { useFilmRoom } from '../FilmRoomContext';

export function FormationOverlay() {
  const { currentClip, playerState } = useFilmRoom();

  if (!playerState.showFormationOverlay || !currentClip) return null;

  // Get formation data
  const formation = currentClip.tags.find((t) => t.category === 'formation')?.value
    || currentClip.aiAnalysis?.offenseFormation?.value;

  if (!formation) return null;

  return (
    <div className="absolute bottom-24 left-4 animate-fade-in">
      <div className="px-4 py-3 rounded-xl bg-black/70 backdrop-blur-md border border-[#00F6E5]/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00F6E5]/20">
            <FormationIcon className="h-5 w-5 text-[#00F6E5]" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block">
              Formation
            </span>
            <p className="text-lg font-black text-white">{formation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="8" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export default FormationOverlay;








