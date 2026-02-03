'use client';

import { useState } from 'react';
import type { DiagramPlayer, DefensiveLineAssignment } from '@/types/play-assignments';

interface DefensiveLineAssignmentFormProps {
  player: DiagramPlayer;
  assignment?: DefensiveLineAssignment;
  onChange: (assignment: DefensiveLineAssignment) => void;
}

const TECHNIQUES = ['0', '1', '2i', '3', '4i', '5', '6', '7', '9'];

export function DefensiveLineAssignmentForm({
  player,
  assignment,
  onChange,
}: DefensiveLineAssignmentFormProps) {
  const [type, setType] = useState<DefensiveLineAssignment['type']>(
    assignment?.type || 'gap'
  );

  const updateAssignment = (updates: Partial<DefensiveLineAssignment>) => {
    onChange({ ...assignment, type, ...updates } as DefensiveLineAssignment);
  };

  const handleTypeChange = (newType: DefensiveLineAssignment['type']) => {
    setType(newType);
    onChange({ type: newType } as DefensiveLineAssignment);
  };

  return (
    <div className="space-y-4">
      {/* Assignment Type */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          D-Line Assignment
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['gap', 'slant', 'stunt', 'contain', 'rush'] as const).map((t) => (
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

      {/* Technique */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Technique
        </label>
        <div className="grid grid-cols-5 gap-2">
          {TECHNIQUES.map((tech) => (
            <button
              key={tech}
              onClick={() => updateAssignment({ technique: tech as any })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                assignment?.technique === tech
                  ? 'bg-red-500 text-white'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>

      {/* Gap Assignment */}
      {type === 'gap' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Gap Responsibility
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['A', 'B', 'C', 'D'] as const).map((gap) => (
              <button
                key={gap}
                onClick={() => updateAssignment({ gap })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assignment?.gap === gap
                    ? 'bg-red-500 text-white'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {gap}-Gap
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slant */}
      {type === 'slant' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Slant Direction
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['left', 'right'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => updateAssignment({ slantDirection: dir })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assignment?.slantDirection === dir
                    ? 'bg-red-500 text-white'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {dir.charAt(0).toUpperCase() + dir.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stunt */}
      {type === 'stunt' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Stunt Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['T-E', 'E-T', 'line', 'LB-line'] as const).map((stuntType) => (
                <button
                  key={stuntType}
                  onClick={() => updateAssignment({ stuntType })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    assignment?.stuntType === stuntType
                      ? 'bg-red-500 text-white'
                      : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {stuntType}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Stunt Partner
            </label>
            <input
              type="text"
              value={assignment?.stuntPartner || ''}
              onChange={(e) => updateAssignment({ stuntPartner: e.target.value })}
              placeholder="e.g., DT, DE, LB"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </>
      )}

      {/* Rush */}
      {type === 'rush' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Rush Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['speed', 'power', 'contain'] as const).map((rushType) => (
              <button
                key={rushType}
                onClick={() => updateAssignment({ rushType })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assignment?.rushType === rushType
                    ? 'bg-red-500 text-white'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {rushType.charAt(0).toUpperCase() + rushType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
