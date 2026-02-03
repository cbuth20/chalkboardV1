'use client';

import { CheckCircle, AlertCircle, User } from 'lucide-react';
import type { DiagramPlayer, PlayerResponsibility } from '@/types/play-assignments';

interface ResponsibilitiesPanelProps {
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
  onPlayerSelect: (playerId: string) => void;
  onResponsibilityChange: (playerId: string, responsibility: PlayerResponsibility) => void;
  selectedPlayerId?: string;
}

export function ResponsibilitiesPanel({
  offensePlayers,
  defensePlayers,
  onPlayerSelect,
  onResponsibilityChange,
  selectedPlayerId,
}: ResponsibilitiesPanelProps) {
  const allPlayers = [...offensePlayers, ...defensePlayers];

  const generateResponsibilityText = (player: DiagramPlayer): string => {
    if (!player.assignment) return '';

    const assignment = player.assignment;

    // Auto-generate based on assignment type
    if ('type' in assignment) {
      switch (assignment.type) {
        case 'route':
          return assignment.routeType
            ? `Run a ${assignment.routeType} route${assignment.routeDepth ? ` (${assignment.routeDepth} yards)` : ''}`
            : 'Run assigned route';

        case 'motion':
          return `Motion ${assignment.motionDirection || ''} ${assignment.motionTiming === 'pre_snap' ? 'pre-snap' : 'at snap'}`;

        case 'block':
          return `Block ${assignment.blockTarget || 'assigned defender'}${assignment.blockType ? ` (${assignment.blockType})` : ''}`;

        case 'option_route':
          return `Option route: ${assignment.vsManRoute || 'TBD'} vs man, ${assignment.vsZoneRoute || 'TBD'} vs zone`;

        case 'zone':
          return `Zone block ${assignment.direction || ''}${assignment.target ? ` on ${assignment.target}` : ''}`;

        case 'man':
          return `Man block ${assignment.target || 'assigned defender'}`;

        case 'combo':
          return `Combo block${assignment.comboTarget ? ` to ${assignment.comboTarget}` : ''}`;

        case 'pull':
          return `Pull ${assignment.pullDirection || ''} to ${assignment.pullTarget || 'target'}`;

        case 'protection':
          return `Pass protection${assignment.protectionRule ? `: ${assignment.protectionRule}` : ''}`;

        case 'drop':
          return `Drop back${assignment.dropDepth ? ` (${assignment.dropDepth})` : ''}`;

        case 'read':
          return `Read progression${assignment.readProgression?.length ? ` (${assignment.readProgression.length} reads)` : ''}`;

        case 'alert':
          return `Alert: ${assignment.alertCondition || 'TBD'}`;

        case 'mesh':
          return `Mesh ${assignment.meshDirection || ''} at ${assignment.meshPoint || 'TBD'}`;

        case 'rpo':
          return `RPO read: ${assignment.rpoReadKey || 'TBD'}`;

        case 'gap':
          return `${assignment.gap || 'TBD'}-gap responsibility${assignment.technique ? ` (${assignment.technique} tech)` : ''}`;

        case 'slant':
          return `Slant ${assignment.slantDirection || ''}`;

        case 'stunt':
          return `Stunt ${assignment.stuntType || ''}`;

        case 'contain':
          return 'Contain';

        case 'rush':
          return `${assignment.rushType || 'Pass'} rush`;

        case 'run_fit':
          return `Fit ${assignment.fitGap || 'TBD'}-gap${assignment.fitKey ? ` (key ${assignment.fitKey})` : ''}`;

        case 'coverage':
          return assignment.coverageType === 'man'
            ? `Man coverage${assignment.manTarget ? ` on ${assignment.manTarget}` : ''}`
            : assignment.coverageType === 'zone'
            ? `${assignment.zoneArea || 'Zone'} coverage`
            : 'Pattern match coverage';

        case 'pressure':
          return `${assignment.pressureType || 'Pressure'}`;

        case 'spy':
          return `Spy ${assignment.spyTarget || 'QB'}`;

        case 'leverage':
          return `${assignment.leverage || 'Leverage'}${assignment.leverage ? ` leverage` : ''}`;

        case 'landmark':
          return `Landmark ${assignment.landmarkPosition || 'TBD'}`;

        case 'match':
          return assignment.matchRule || 'Match coverage';

        case 'blitz':
          return `Blitz ${assignment.blitzGap || 'TBD'}`;

        default:
          return 'Assignment defined';
      }
    }

    return '';
  };

  const handleResponsibilityChange = (playerId: string, field: keyof PlayerResponsibility, value: any) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;

    const currentResponsibility = player.responsibility || {
      assignment: player.assignment,
      responsibility: '',
      coachingNotes: '',
      includeInAI: true,
    };

    onResponsibilityChange(playerId, {
      ...currentResponsibility,
      [field]: value,
    });
  };

  const isPlayerComplete = (player: DiagramPlayer): boolean => {
    return !!(player.assignment && player.responsibility?.responsibility);
  };

  return (
    <div className="bg-[#0D1117] border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-[#161B22]">
        <h3 className="text-sm font-semibold text-white">Player Responsibilities</h3>
        <p className="text-xs text-gray-400 mt-1">
          Define each player's responsibility in plain English. Click a row to edit their assignment.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#161B22] border-b border-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">
                Player
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-48">
                Assignment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Responsibility
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-48">
                Coaching Notes
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                AI Include
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {allPlayers.map((player) => {
              const isComplete = isPlayerComplete(player);
              const isSelected = player.id === selectedPlayerId;
              const autoText = generateResponsibilityText(player);

              return (
                <tr
                  key={player.id}
                  onClick={() => onPlayerSelect(player.id)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#00F6E5]/10'
                      : 'hover:bg-[#161B22]'
                  } ${!isComplete ? 'bg-yellow-900/5' : ''}`}
                >
                  {/* Player */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          player.side === 'offense'
                            ? 'bg-[#00F6E5] text-black'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {player.label}
                      </div>
                      <div>
                        <div className="text-white font-medium">{player.position || player.label}</div>
                        <div className="text-xs text-gray-500">{player.side}</div>
                      </div>
                    </div>
                  </td>

                  {/* Assignment (Auto-filled, Read-only) */}
                  <td className="px-4 py-3">
                    <div className="text-gray-300 text-xs italic">
                      {autoText || (
                        <span className="text-gray-600">No assignment</span>
                      )}
                    </div>
                  </td>

                  {/* Responsibility (Editable) */}
                  <td className="px-4 py-3">
                    <textarea
                      value={player.responsibility?.responsibility || autoText}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleResponsibilityChange(player.id, 'responsibility', e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Describe responsibility..."
                      rows={2}
                      className="w-full px-2 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00F6E5] resize-none"
                    />
                  </td>

                  {/* Coaching Notes */}
                  <td className="px-4 py-3">
                    <textarea
                      value={player.responsibility?.coachingNotes || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleResponsibilityChange(player.id, 'coachingNotes', e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Optional coaching notes..."
                      rows={2}
                      className="w-full px-2 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00F6E5] resize-none"
                    />
                  </td>

                  {/* AI Include */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={player.responsibility?.includeInAI ?? true}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleResponsibilityChange(player.id, 'includeInAI', e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-[#00F6E5] bg-[#161B22] border-gray-700 rounded focus:ring-[#00F6E5] focus:ring-2"
                    />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {isComplete ? (
                      <CheckCircle size={16} className="text-green-500 inline" />
                    ) : (
                      <AlertCircle size={16} className="text-yellow-500 inline" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="p-4 border-t border-gray-800 bg-[#161B22]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {allPlayers.filter(isPlayerComplete).length} of {allPlayers.length} players complete
          </span>
          <span className="text-gray-500">
            Click a player row to edit their assignment
          </span>
        </div>
      </div>
    </div>
  );
}
