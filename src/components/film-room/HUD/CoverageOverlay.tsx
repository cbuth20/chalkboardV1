"use client";

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE OVERLAY — Visual Coverage Shell Display
// Shows detected defensive coverage on video
// ═══════════════════════════════════════════════════════════════════════════

import { useFilmRoom } from '../FilmRoomContext';

export function CoverageOverlay() {
  const { currentClip, playerState } = useFilmRoom();

  if (!playerState.showCoverageOverlay || !currentClip) return null;

  const coverage = currentClip.tags.find((t) => t.category === 'coverage')?.value
    || currentClip.aiAnalysis?.coverageShell?.value;
  
  const front = currentClip.tags.find((t) => t.category === 'front')?.value
    || currentClip.aiAnalysis?.defensiveFront?.value;

  const confidence = currentClip.aiAnalysis?.coverageShell?.confidence;

  if (!coverage) return null;

  return (
    <div className="absolute top-4 right-4 animate-fade-in">
      <div className="px-4 py-3 rounded-xl bg-black/70 backdrop-blur-md border border-[#F5C253]/20 shadow-xl">
        {/* Coverage */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5C253]/20">
            <ShieldIcon className="h-5 w-5 text-[#F5C253]" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block">
              Coverage
            </span>
            <div className="flex items-center gap-2">
              <p className="text-lg font-black text-white">{coverage}</p>
              {confidence && (
                <span className="text-xs text-[#F5C253]/70">
                  {Math.round(confidence * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Front */}
        {front && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6A3D]/20">
              <FrontIcon className="h-4 w-4 text-[#FF6A3D]" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block">
                Front
              </span>
              <p className="text-sm font-bold text-white">{front}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function FrontIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <circle cx="6" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="18" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export default CoverageOverlay;








