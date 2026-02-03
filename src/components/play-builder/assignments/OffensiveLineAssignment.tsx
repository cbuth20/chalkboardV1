'use client';

import { useState } from 'react';
import type { DiagramPlayer, OffensiveLineAssignment } from '@/types/play-assignments';

interface OffensiveLineAssignmentFormProps {
  player: DiagramPlayer;
  allPlayers: DiagramPlayer[];
  assignment?: OffensiveLineAssignment;
  onChange: (assignment: OffensiveLineAssignment) => void;
}

const PROTECTION_RULES = [
  'BOB (Big-On-Big)',
  'Slide Left',
  'Slide Right',
  'Man',
  '6-Man Protection',
  '5-Man Protection',
];

export function OffensiveLineAssignmentForm({
  player,
  allPlayers,
  assignment,
  onChange,
}: OffensiveLineAssignmentFormProps) {
  const [type, setType] = useState<OffensiveLineAssignment['type']>(
    assignment?.type || 'zone'
  );

  const updateAssignment = (updates: Partial<OffensiveLineAssignment>) => {
    onChange({ ...assignment, type, ...updates } as OffensiveLineAssignment);
  };

  const handleTypeChange = (newType: OffensiveLineAssignment['type']) => {
    setType(newType);
    onChange({ type: newType } as OffensiveLineAssignment);
  };

  return (
    <div className="space-y-4">
      {/* Assignment Type */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Block Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['zone', 'man', 'combo'] as const).map((t) => (
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
          {(['pull', 'protection'] as const).map((t) => (
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
      </div>

      {/* Zone Block */}
      {type === 'zone' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Zone Direction
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['left', 'right', 'playside', 'backside'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => updateAssignment({ direction: dir })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    assignment?.direction === dir
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
              Target (Optional)
            </label>
            <input
              type="text"
              value={assignment?.target || ''}
              onChange={(e) => updateAssignment({ target: e.target.value })}
              placeholder="e.g., MLB, 3-technique"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>
        </>
      )}

      {/* Man Block */}
      {type === 'man' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Man Assignment
          </label>
          <input
            type="text"
            value={assignment?.target || ''}
            onChange={(e) => updateAssignment({ target: e.target.value })}
            placeholder="e.g., 3-technique, nose, linebacker"
            className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
          />
        </div>
      )}

      {/* Combo Block */}
      {type === 'combo' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Combo Partner
            </label>
            <select
              value={assignment?.comboPartner || ''}
              onChange={(e) => updateAssignment({ comboPartner: e.target.value })}
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            >
              <option value="">Select partner...</option>
              {allPlayers
                .filter(p => p.side === 'offense' && p.group === 'line' && p.id !== player.id)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label} - {p.position}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Combo Target
            </label>
            <input
              type="text"
              value={assignment?.comboTarget || ''}
              onChange={(e) => updateAssignment({ comboTarget: e.target.value })}
              placeholder="e.g., DT to MLB, 3-tech to WILL"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>
        </>
      )}

      {/* Pull Block */}
      {type === 'pull' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Pull Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['left', 'right'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => updateAssignment({ pullDirection: dir })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    assignment?.pullDirection === dir
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
              Pull Target
            </label>
            <input
              type="text"
              value={assignment?.pullTarget || ''}
              onChange={(e) => updateAssignment({ pullTarget: e.target.value })}
              placeholder="e.g., Edge, first LB, force player"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>
        </>
      )}

      {/* Pass Protection */}
      {type === 'protection' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Protection Rule
            </label>
            <select
              value={assignment?.protectionRule || ''}
              onChange={(e) => updateAssignment({ protectionRule: e.target.value })}
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            >
              <option value="">Select rule...</option>
              {PROTECTION_RULES.map(rule => (
                <option key={rule} value={rule}>{rule}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Protection Assignment
            </label>
            <input
              type="text"
              value={assignment?.protectionAssignment || ''}
              onChange={(e) => updateAssignment({ protectionAssignment: e.target.value })}
              placeholder="e.g., A-gap, backside B-gap"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>
        </>
      )}
    </div>
  );
}
