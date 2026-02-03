'use client';

import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { DiagramPlayer, QuarterbackAssignment } from '@/types/play-assignments';

interface QuarterbackAssignmentFormProps {
  player: DiagramPlayer;
  allPlayers: DiagramPlayer[];
  assignment?: QuarterbackAssignment;
  onChange: (assignment: QuarterbackAssignment) => void;
}

export function QuarterbackAssignmentForm({
  player,
  allPlayers,
  assignment,
  onChange,
}: QuarterbackAssignmentFormProps) {
  const [type, setType] = useState<QuarterbackAssignment['type']>(
    assignment?.type || 'drop'
  );
  const [readProgression, setReadProgression] = useState<string[]>(
    assignment?.readProgression || []
  );

  const updateAssignment = (updates: Partial<QuarterbackAssignment>) => {
    onChange({ ...assignment, type, readProgression, ...updates } as QuarterbackAssignment);
  };

  const handleTypeChange = (newType: QuarterbackAssignment['type']) => {
    setType(newType);
    onChange({ type: newType, readProgression } as QuarterbackAssignment);
  };

  const addToProgression = (playerId: string) => {
    if (!readProgression.includes(playerId)) {
      const newProgression = [...readProgression, playerId];
      setReadProgression(newProgression);
      updateAssignment({ readProgression: newProgression });
    }
  };

  const removeFromProgression = (playerId: string) => {
    const newProgression = readProgression.filter(id => id !== playerId);
    setReadProgression(newProgression);
    updateAssignment({ readProgression: newProgression });
  };

  const receivers = allPlayers.filter(p =>
    p.side === 'offense' && ['WR', 'TE', 'RB', 'FB'].includes(p.position || '')
  );

  return (
    <div className="space-y-4">
      {/* Assignment Type */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          QB Assignment Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['drop', 'read', 'alert'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-[#00F6E5] text-black'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {(['mesh', 'rpo'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-[#00F6E5] text-black'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Drop Back */}
      {(type === 'drop' || type === 'read') && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Drop Depth
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['3-step', '5-step', '7-step', 'shotgun'] as const).map((depth) => (
              <button
                key={depth}
                onClick={() => updateAssignment({ dropDepth: depth })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assignment?.dropDepth === depth
                    ? 'bg-[#00F6E5] text-black'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {depth}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Read Progression */}
      {type === 'read' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Read Progression (in order)
          </label>

          {/* Current Progression */}
          {readProgression.length > 0 && (
            <div className="mb-3 space-y-2">
              {readProgression.map((playerId, index) => {
                const p = allPlayers.find(pl => pl.id === playerId);
                if (!p) return null;
                return (
                  <div
                    key={playerId}
                    className="flex items-center gap-2 p-2 bg-[#161B22] border border-gray-700 rounded-lg"
                  >
                    <GripVertical size={16} className="text-gray-600" />
                    <span className="flex-1 text-sm text-white">
                      {index + 1}. {p.label} ({p.position})
                    </span>
                    <button
                      onClick={() => removeFromProgression(playerId)}
                      className="px-2 py-1 text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Receivers */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Add to progression:
            </label>
            <div className="flex flex-wrap gap-2">
              {receivers
                .filter(r => !readProgression.includes(r.id))
                .map(receiver => (
                  <button
                    key={receiver.id}
                    onClick={() => addToProgression(receiver.id)}
                    className="px-3 py-1.5 bg-[#161B22] border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#00F6E5] transition-colors"
                  >
                    {receiver.label} ({receiver.position})
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      {type === 'alert' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Alert Condition
            </label>
            <input
              type="text"
              value={assignment?.alertCondition || ''}
              onChange={(e) => updateAssignment({ alertCondition: e.target.value })}
              placeholder="e.g., Hot vs blitz, pressure alert"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Alert Route
            </label>
            <input
              type="text"
              value={assignment?.alertRoute || ''}
              onChange={(e) => updateAssignment({ alertRoute: e.target.value })}
              placeholder="e.g., RB flat, hot slant"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>
        </>
      )}

      {/* Mesh (Handoff) */}
      {type === 'mesh' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Mesh Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['left', 'right'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => updateAssignment({ meshDirection: dir })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    assignment?.meshDirection === dir
                      ? 'bg-[#00F6E5] text-black'
                      : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {dir.charAt(0).toUpperCase() + dir.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Mesh Point
            </label>
            <input
              type="text"
              value={assignment?.meshPoint || ''}
              onChange={(e) => updateAssignment({ meshPoint: e.target.value })}
              placeholder="e.g., Midline, off-tackle, sweep"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>
        </>
      )}

      {/* RPO */}
      {type === 'rpo' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              RPO Read Key
            </label>
            <input
              type="text"
              value={assignment?.rpoReadKey || ''}
              onChange={(e) => updateAssignment({ rpoReadKey: e.target.value })}
              placeholder="e.g., Read LB, Read edge"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Give Option (Run)
            </label>
            <input
              type="text"
              value={assignment?.rpoGiveOption || ''}
              onChange={(e) => updateAssignment({ rpoGiveOption: e.target.value })}
              placeholder="e.g., Inside zone, counter"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Pass Option
            </label>
            <input
              type="text"
              value={assignment?.rpoPassOption || ''}
              onChange={(e) => updateAssignment({ rpoPassOption: e.target.value })}
              placeholder="e.g., Bubble screen, slant"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>
        </>
      )}
    </div>
  );
}
