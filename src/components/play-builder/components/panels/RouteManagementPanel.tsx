import React from 'react';
import type { DiagramPlayer, DiagramRoute } from '@/components/playbook-diagram/types';

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE MANAGEMENT PANEL
// ═══════════════════════════════════════════════════════════════════════════

export interface RouteManagementPanelProps {
  offensePlayers: DiagramPlayer[];
  routes: DiagramRoute[];
  isDrawingRoute: boolean;
  selectedPlayer: string | null;
  copiedRoute: DiagramRoute | null;
  onCopyRoute: (playerId: string) => void;
  onPasteRoute: (playerId: string) => void;
  onDeleteRoute: (playerId: string) => void;
}

export const RouteManagementPanel: React.FC<RouteManagementPanelProps> = ({
  offensePlayers,
  routes,
  isDrawingRoute,
  selectedPlayer,
  copiedRoute,
  onCopyRoute,
  onPasteRoute,
  onDeleteRoute,
}) => {
  // Filter to skill positions and backfield only
  const routablePlayers = offensePlayers.filter(
    (p) => p.group === 'skill' || p.group === 'backfield'
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 mb-3">
        Click and drag from a player to draw their route
      </p>
      {routablePlayers.map((player) => {
        const hasRoute = routes.some((r) => r.playerId === player.id);
        const isDrawing = isDrawingRoute && selectedPlayer === player.id;

        return (
          <div key={player.id} className="flex items-center gap-2">
            <div
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
                isDrawing
                  ? 'bg-[#FFFFFF]/10 text-white ring-1 ring-[#FFFFFF]/30'
                  : hasRoute
                  ? 'bg-[#00F6E5]/10 text-[#00F6E5]'
                  : 'bg-[#1B1E20]/50 text-slate-400'
              }`}
            >
              {player.label} {hasRoute && '✓'}
            </div>
            {hasRoute && (
              <>
                <button
                  onClick={() => onCopyRoute(player.id)}
                  className="px-2 py-2 rounded-lg bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition"
                  title="Copy route"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
                <button
                  onClick={() => onDeleteRoute(player.id)}
                  className="px-2 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition"
                  title="Delete route"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
            {!hasRoute && copiedRoute && (
              <button
                onClick={() => onPasteRoute(player.id)}
                className="px-2 py-2 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/30 transition"
                title="Paste route"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
