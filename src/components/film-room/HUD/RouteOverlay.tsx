"use client";

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE OVERLAY — Visual Route Tree Display
// Shows detected routes on video playback
// ═══════════════════════════════════════════════════════════════════════════

import { useFilmRoom } from '../FilmRoomContext';

export function RouteOverlay() {
  const { currentClip, playerState } = useFilmRoom();

  if (!playerState.showRouteOverlay || !currentClip) return null;

  const routes = currentClip.aiAnalysis?.routes || [];
  const concept = currentClip.tags.find((t) => t.category === 'routeConcept')?.value
    || currentClip.aiAnalysis?.concept?.value;

  if (routes.length === 0 && !concept) return null;

  return (
    <div className="absolute bottom-24 right-4 animate-fade-in">
      <div className="px-4 py-3 rounded-xl bg-black/70 backdrop-blur-md border border-[#3DF3FF]/20 shadow-xl min-w-[200px]">
        {/* Concept Header */}
        {concept && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3DF3FF]/20">
              <RouteIcon className="h-4 w-4 text-[#3DF3FF]" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block">
                Concept
              </span>
              <p className="text-sm font-bold text-white">{concept}</p>
            </div>
          </div>
        )}

        {/* Routes List */}
        {routes.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Routes
            </span>
            {routes.map((route, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-6 w-6 flex items-center justify-center rounded bg-[#3DF3FF]/20 text-xs font-bold text-[#3DF3FF]">
                  {route.player}
                </span>
                <span className="text-sm text-white flex-1">{route.routeName}</span>
                {route.depth && (
                  <span className="text-xs text-slate-500">{route.depth}yd</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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

export default RouteOverlay;








