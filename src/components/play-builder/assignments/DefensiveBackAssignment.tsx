'use client';

import { useState } from 'react';
import type { DiagramPlayer, DefensiveBackAssignment } from '@/types/play-assignments';

interface DefensiveBackAssignmentFormProps {
  player: DiagramPlayer;
  allPlayers: DiagramPlayer[]; // Offensive players for man coverage
  assignment?: DefensiveBackAssignment;
  onChange: (assignment: DefensiveBackAssignment) => void;
}

const ZONE_AREAS = [
  'Deep Third', 'Deep Half', 'Deep Quarter',
  'Flat', 'Curl', 'Hook', 'Middle Read'
];

export function DefensiveBackAssignmentForm({
  player,
  allPlayers,
  assignment,
  onChange,
}: DefensiveBackAssignmentFormProps) {
  const [type, setType] = useState<DefensiveBackAssignment['type']>(
    assignment?.type || 'coverage'
  );

  const updateAssignment = (updates: Partial<DefensiveBackAssignment>) => {
    onChange({ ...assignment, type, ...updates } as DefensiveBackAssignment);
  };

  const handleTypeChange = (newType: DefensiveBackAssignment['type']) => {
    setType(newType);
    onChange({ type: newType } as DefensiveBackAssignment);
  };

  return (
    <div className="space-y-4">
      {/* Assignment Type */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          DB Assignment
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['coverage', 'leverage', 'landmark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-red-500 text-white'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {(['match', 'blitz'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-red-500 text-white'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Coverage */}
      {type === 'coverage' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Coverage Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['man', 'zone', 'pattern_match'] as const).map((covType) => (
                <button
                  key={covType}
                  onClick={() => updateAssignment({ coverageType: covType })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    assignment?.coverageType === covType
                      ? 'bg-red-500 text-white'
                      : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {covType === 'pattern_match' ? 'Match' : covType.charAt(0).toUpperCase() + covType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Man Coverage */}
          {assignment?.coverageType === 'man' && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Man Target
              </label>
              <select
                value={assignment?.manTarget || ''}
                onChange={(e) => updateAssignment({ manTarget: e.target.value })}
                className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select target...</option>
                {allPlayers
                  .filter(p => ['WR', 'TE', 'RB', 'FB'].includes(p.position || ''))
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.position})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Zone Coverage */}
          {assignment?.coverageType === 'zone' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Zone Area
                </label>
                <select
                  value={assignment?.zoneArea || ''}
                  onChange={(e) => updateAssignment({ zoneArea: e.target.value })}
                  className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select zone...</option>
                  {ZONE_AREAS.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Zone Depth (yards)
                </label>
                <input
                  type="number"
                  value={assignment?.zoneDepth || ''}
                  onChange={(e) => updateAssignment({ zoneDepth: parseInt(e.target.value) })}
                  placeholder="e.g., 12, 20"
                  className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </>
          )}

          {/* Pattern Match */}
          {assignment?.coverageType === 'pattern_match' && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Match Rule
              </label>
              <input
                type="text"
                value={assignment?.matchRule || ''}
                onChange={(e) => updateAssignment({ matchRule: e.target.value })}
                placeholder="e.g., #2 vertical = match #3"
                className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </>
      )}

      {/* Leverage */}
      {type === 'leverage' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Leverage Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['inside', 'outside', 'over_top'] as const).map((lev) => (
              <button
                key={lev}
                onClick={() => updateAssignment({ leverage: lev })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assignment?.leverage === lev
                    ? 'bg-red-500 text-white'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {lev.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Landmark */}
      {type === 'landmark' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Landmark Position
            </label>
            <input
              type="text"
              value={assignment?.landmarkPosition || ''}
              onChange={(e) => updateAssignment({ landmarkPosition: e.target.value })}
              placeholder="e.g., #2 receiver, near hash"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Landmark Depth (yards)
            </label>
            <input
              type="number"
              value={assignment?.landmarkDepth || ''}
              onChange={(e) => updateAssignment({ landmarkDepth: parseInt(e.target.value) })}
              placeholder="e.g., 5, 10"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </>
      )}

      {/* Match (simplified pattern match) */}
      {type === 'match' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Match Rule
          </label>
          <textarea
            value={assignment?.matchRule || ''}
            onChange={(e) => updateAssignment({ matchRule: e.target.value })}
            placeholder="Describe the match rule..."
            rows={3}
            className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>
      )}

      {/* Blitz */}
      {type === 'blitz' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Blitz Gap
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['A', 'B', 'C', 'edge'] as const).map((gap) => (
              <button
                key={gap}
                onClick={() => updateAssignment({ blitzGap: gap as any })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assignment?.blitzGap === gap
                    ? 'bg-red-500 text-white'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {gap === 'edge' ? 'Edge' : `${gap}-Gap`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
