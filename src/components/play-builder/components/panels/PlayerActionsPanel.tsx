import React from 'react';
import type { DiagramPlayer, DiagramRoute, PlayMode } from '@/components/playbook-diagram/types';

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER ACTIONS PANEL
// ═══════════════════════════════════════════════════════════════════════════

export interface PlayerActionsPanelProps {
  selectedPlayer: string | null;
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
  routes: DiagramRoute[];
  playMode: PlayMode;
  copiedRoute: DiagramRoute | null;
  playerNotes: Record<string, string>;
  onCopyRoute: (playerId: string) => void;
  onPasteRoute: (playerId: string) => void;
  onDeleteRoute: (playerId: string) => void;
  onUpdatePlayerNote: (playerId: string, note: string) => void;
  onClose: () => void;
}

export const PlayerActionsPanel: React.FC<PlayerActionsPanelProps> = ({
  selectedPlayer,
  offensePlayers,
  defensePlayers,
  routes,
  playMode,
  copiedRoute,
  playerNotes,
  onCopyRoute,
  onPasteRoute,
  onDeleteRoute,
  onUpdatePlayerNote,
  onClose,
}) => {
  if (!selectedPlayer) return null;

  const player = [...offensePlayers, ...defensePlayers].find((p) => p.id === selectedPlayer);
  if (!player) return null;

  const hasRoute = routes.some((r) => r.playerId === player.id);
  const playerRoute = routes.find((r) => r.playerId === player.id);

  return (
    <div className="space-y-4">
      {/* Player Header */}
      <div className="bg-[#1B1E20]/50 rounded-lg p-4 border border-[#00F6E5]/20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-bold text-white">{player.label}</h4>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              player.side === 'offense'
                ? 'bg-[#00F6E5]/20 text-[#00F6E5]'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {player.side}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Position: {player.group} | Location: ({player.x.toFixed(1)}, {player.y.toFixed(1)})
        </p>
      </div>

      {/* Action Tabs */}
      <div className="space-y-4">
        {/* Route Actions (Offense only in pass mode) */}
        {player.side === 'offense' && playMode === 'pass' && (
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-[#00F6E5] uppercase tracking-wider">
              Route
            </h5>

            {hasRoute ? (
              <div className="space-y-2">
                <div className="bg-[#1B1E20]/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">
                    Route with {playerRoute?.points.length || 0} points
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onCopyRoute(player.id)}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition text-xs font-semibold"
                    >
                      Copy Route
                    </button>
                    <button
                      onClick={() => onDeleteRoute(player.id)}
                      className="flex-1 px-3 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition text-xs font-semibold"
                    >
                      Delete Route
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 mb-2">
                  Draw a route by clicking and dragging from this player on the field
                </p>
                {copiedRoute && (
                  <button
                    onClick={() => {
                      onPasteRoute(player.id);
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/30 transition text-xs font-semibold"
                  >
                    Paste Copied Route
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Block Actions (Offense in run mode) */}
        {player.side === 'offense' && playMode === 'run' && (
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-[#00F6E5] uppercase tracking-wider">
              Blocking
            </h5>
            <p className="text-xs text-slate-400">
              Use Shift+Drag to move {player.label} to blocking position
            </p>
          </div>
        )}

        {/* Movement */}
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-[#00F6E5] uppercase tracking-wider">
            Position
          </h5>
          <p className="text-xs text-slate-400">
            {player.side === 'offense'
              ? 'Hold Shift and drag to reposition this player'
              : 'Click and drag to reposition this player'}
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-[#00F6E5] uppercase tracking-wider">Notes</h5>
          <textarea
            value={playerNotes[player.id] || ''}
            onChange={(e) => onUpdatePlayerNote(player.id, e.target.value)}
            placeholder={`Add ${player.label}'s assignment notes...`}
            className="w-full bg-[#0A0A0A]/50 border border-[#1B1E20] rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-[#00F6E5]/50 focus:outline-none resize-none"
            rows={4}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[#1B1E20]">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-lg bg-[#00F6E5]/10 text-[#00F6E5] hover:bg-[#00F6E5]/20 transition text-sm font-semibold"
        >
          Done
        </button>
      </div>
    </div>
  );
};
