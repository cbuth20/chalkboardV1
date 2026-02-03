'use client';

import { Target, User } from 'lucide-react';
import type { DiagramPlayer, PlayerAssignment } from '@/types/play-assignments';
import { OffensiveSkillAssignmentForm } from './assignments/OffensiveSkillAssignment';
import { OffensiveLineAssignmentForm } from './assignments/OffensiveLineAssignment';
import { QuarterbackAssignmentForm } from './assignments/QuarterbackAssignment';
import { DefensiveLineAssignmentForm } from './assignments/DefensiveLineAssignment';
import { LinebackerAssignmentForm } from './assignments/LinebackerAssignment';
import { DefensiveBackAssignmentForm } from './assignments/DefensiveBackAssignment';

interface AssignmentPanelProps {
  selectedPlayer: DiagramPlayer | null;
  allPlayers: DiagramPlayer[];
  onAssignmentChange: (playerId: string, assignment: PlayerAssignment) => void;
  onApplyRoute?: (playerId: string, routePoints: { x: number; y: number }[]) => void;
}

export function AssignmentPanel({
  selectedPlayer,
  allPlayers,
  onAssignmentChange,
  onApplyRoute,
}: AssignmentPanelProps) {
  if (!selectedPlayer) {
    return (
      <div className="p-6 bg-[#0D1117] border border-gray-800 rounded-lg">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Target className="text-gray-600 mb-4" size={48} />
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            No Player Selected
          </h3>
          <p className="text-xs text-gray-500 max-w-sm">
            Click on a player on the field to assign their role, route, coverage, or responsibility.
          </p>
        </div>
      </div>
    );
  }

  const handleAssignmentUpdate = (assignment: PlayerAssignment) => {
    onAssignmentChange(selectedPlayer.id, assignment);
  };

  // Determine which assignment form to show based on player position/group
  const renderAssignmentForm = () => {
    const position = selectedPlayer.position?.toUpperCase();
    const group = selectedPlayer.group;
    const side = selectedPlayer.side;

    // Offensive assignments
    if (side === 'offense') {
      if (position === 'QB') {
        return (
          <QuarterbackAssignmentForm
            player={selectedPlayer}
            allPlayers={allPlayers}
            assignment={selectedPlayer.assignment}
            onChange={handleAssignmentUpdate}
          />
        );
      }

      if (group === 'line' || ['LT', 'LG', 'C', 'RG', 'RT'].includes(position || '')) {
        return (
          <OffensiveLineAssignmentForm
            player={selectedPlayer}
            allPlayers={allPlayers}
            assignment={selectedPlayer.assignment}
            onChange={handleAssignmentUpdate}
          />
        );
      }

      // Skill positions (WR, TE, RB, FB)
      return (
        <OffensiveSkillAssignmentForm
          player={selectedPlayer}
          allPlayers={allPlayers}
          assignment={selectedPlayer.assignment}
          onChange={handleAssignmentUpdate}
          onApplyRoute={onApplyRoute}
        />
      );
    }

    // Defensive assignments
    if (side === 'defense') {
      if (group === 'line' || ['DE', 'DT', 'NT'].includes(position || '')) {
        return (
          <DefensiveLineAssignmentForm
            player={selectedPlayer}
            assignment={selectedPlayer.assignment}
            onChange={handleAssignmentUpdate}
          />
        );
      }

      if (group === 'linebackers' || ['LB', 'OLB', 'ILB', 'MLB'].includes(position || '')) {
        return (
          <LinebackerAssignmentForm
            player={selectedPlayer}
            assignment={selectedPlayer.assignment}
            onChange={handleAssignmentUpdate}
          />
        );
      }

      // Secondary (CB, S, FS, SS)
      return (
        <DefensiveBackAssignmentForm
          player={selectedPlayer}
          allPlayers={allPlayers.filter(p => p.side === 'offense')}
          assignment={selectedPlayer.assignment}
          onChange={handleAssignmentUpdate}
        />
      );
    }

    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Unknown player type</p>
      </div>
    );
  };

  return (
    <div className="bg-[#0D1117] border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b border-gray-800 ${
        selectedPlayer.side === 'offense' ? 'bg-[#00F6E5]/10' : 'bg-red-500/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            selectedPlayer.side === 'offense'
              ? 'bg-[#00F6E5] text-black'
              : 'bg-red-500 text-white'
          }`}>
            {selectedPlayer.label}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {selectedPlayer.position || selectedPlayer.label} Assignment
            </h3>
            <p className="text-xs text-gray-400">
              {selectedPlayer.side === 'offense' ? 'Offensive' : 'Defensive'} Player
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="p-4">
        {renderAssignmentForm()}
      </div>
    </div>
  );
}
