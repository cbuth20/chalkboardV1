"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER HUD — Heads-Up Display Overlay
// Madden-style overlay showing formations, routes, and coverage
// ═══════════════════════════════════════════════════════════════════════════

import { useFilmRoom } from '../FilmRoomContext';

export function PlayerHUD() {
  const { currentClip, playerState } = useFilmRoom();

  if (!currentClip) return null;

  const { tags, aiAnalysis } = currentClip;

  // Extract key info
  const formation = tags.find((t) => t.category === 'formation')?.value 
    || aiAnalysis?.offenseFormation?.value;
  const coverage = tags.find((t) => t.category === 'coverage')?.value
    || aiAnalysis?.coverageShell?.value;
  const concept = tags.find((t) => t.category === 'routeConcept')?.value
    || aiAnalysis?.concept?.value;
  const front = tags.find((t) => t.category === 'front')?.value
    || aiAnalysis?.defensiveFront?.value;

  const showOverlays = playerState.showFormationOverlay || playerState.showRouteOverlay || playerState.showCoverageOverlay;

  if (!showOverlays) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Left: Formation & Personnel */}
      {playerState.showFormationOverlay && formation && (
        <div className="absolute top-4 left-4 animate-fade-in">
          <HUDPanel>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00F6E5]/20">
                <FormationIcon className="h-4 w-4 text-[#00F6E5]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Formation
                </span>
                <p className="text-sm font-bold text-white">{formation}</p>
              </div>
            </div>
          </HUDPanel>
        </div>
      )}

      {/* Top Right: Coverage Shell */}
      {playerState.showCoverageOverlay && coverage && (
        <div className="absolute top-4 right-4 animate-fade-in">
          <HUDPanel>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5C253]/20">
                <ShieldIcon className="h-4 w-4 text-[#F5C253]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Coverage
                </span>
                <p className="text-sm font-bold text-white">{coverage}</p>
              </div>
            </div>
          </HUDPanel>
        </div>
      )}

      {/* Bottom Left: Concept / Route */}
      {playerState.showRouteOverlay && concept && (
        <div className="absolute bottom-20 left-4 animate-fade-in">
          <HUDPanel>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3DF3FF]/20">
                <RouteIcon className="h-4 w-4 text-[#3DF3FF]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Concept
                </span>
                <p className="text-sm font-bold text-white">{concept}</p>
              </div>
            </div>
          </HUDPanel>
        </div>
      )}

      {/* Bottom Right: Defensive Front */}
      {front && (
        <div className="absolute bottom-20 right-4 animate-fade-in">
          <HUDPanel>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6A3D]/20">
                <FrontIcon className="h-4 w-4 text-[#FF6A3D]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Front
                </span>
                <p className="text-sm font-bold text-white">{front}</p>
              </div>
            </div>
          </HUDPanel>
        </div>
      )}

      {/* Center Bottom: AI Confidence Indicator */}
      {aiAnalysis && aiAnalysis.status === 'complete' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-[#00F6E5]/20">
            <AIIcon className="h-3.5 w-3.5 text-[#00F6E5]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00F6E5]">
              AI Analyzed
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HUD PANEL — Reusable glass panel
// ═══════════════════════════════════════════════════════════════════════════

function HUDPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 shadow-xl">
      {children}
    </div>
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
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V7" />
      <path d="M7 12l5-5 5 5" />
    </svg>
  );
}

function FrontIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z" />
    </svg>
  );
}

export default PlayerHUD;








