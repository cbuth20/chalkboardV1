import React, { useState } from 'react';
import type { DiagramPlayer } from '@/components/playbook-diagram/types';

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER RESPONSIBILITIES PANEL
// ═══════════════════════════════════════════════════════════════════════════

export interface PlayerResponsibilitiesPanelProps {
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
  playerNotes: Record<string, string>;
  selectedPlayer?: string | null;
  onUpdatePlayerNote: (playerId: string, note: string) => void;
}

export const PlayerResponsibilitiesPanel: React.FC<PlayerResponsibilitiesPanelProps> = ({
  offensePlayers,
  defensePlayers,
  playerNotes,
  selectedPlayer,
  onUpdatePlayerNote,
}) => {
  const [showAll, setShowAll] = useState(false);
  const allPlayers = [...offensePlayers, ...defensePlayers];

  // Filter to selected player if one is selected and showAll is false
  const displayPlayers = selectedPlayer && !showAll
    ? allPlayers.filter(p => p.id === selectedPlayer)
    : allPlayers;

  const selectedPlayerData = selectedPlayer
    ? allPlayers.find(p => p.id === selectedPlayer)
    : null;

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      {selectedPlayer && selectedPlayerData ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                selectedPlayerData.side === 'offense' ? 'bg-[#00F6E5]' : 'bg-red-500'
              }`}
            />
            <p className="text-sm text-white font-semibold">
              {showAll ? 'All Players' : `${selectedPlayerData.label} - Responsibilities`}
            </p>
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-[#00F6E5] hover:text-[#00F6E5]/80 transition px-2 py-1 rounded border border-[#00F6E5]/30 hover:border-[#00F6E5]/50"
          >
            {showAll ? `Show ${selectedPlayerData.label} Only` : 'Show All Players'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Add notes and responsibilities for each player
        </p>
      )}

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {displayPlayers.map((player) => (
          <div
            key={player.id}
            className="bg-[#1B1E20]/50 rounded-lg p-3 border border-[#1B1E20] hover:border-[#00F6E5]/20 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">{player.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  player.side === 'offense'
                    ? 'bg-[#00F6E5]/20 text-[#00F6E5]'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {player.side}
              </span>
            </div>
            <textarea
              value={playerNotes[player.id] || ''}
              onChange={(e) => onUpdatePlayerNote(player.id, e.target.value)}
              placeholder={`Add ${player.label}'s assignment notes... (e.g., "Block #54", "Run post route", "Cover RB on flats")`}
              className="w-full bg-[#0A0A0A]/50 border border-[#1B1E20] rounded px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:border-[#00F6E5]/50 focus:outline-none resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
