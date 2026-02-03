'use client';

import { useState } from 'react';
import type { DiagramPlayer, LinebackerAssignment } from '@/types/play-assignments';

interface LinebackerAssignmentFormProps {
  player: DiagramPlayer;
  assignment?: LinebackerAssignment;
  onChange: (assignment: LinebackerAssignment) => void;
}

const COVERAGE_ZONES = ['Hook', 'Curl', 'Flat', 'Hole', 'Deep Third', 'Deep Half'];

export function LinebackerAssignmentForm({
  player,
  assignment,
  onChange,
}: LinebackerAssignmentFormProps) {
  const [type, setType] = useState<LinebackerAssignment['type']>(
    assignment?.type || 'run_fit'
  );

  const updateAssignment = (updates: Partial<LinebackerAssignment>) => {
    onChange({ ...assignment, type, ...updates } as LinebackerAssignment);
  };

  const handleTypeChange = (newType: LinebackerAssignment['type']) => {
    setType(newType);
    onChange({ type: newType } as LinebackerAssignment);
  };

  return (
    <div className="space-y-4">
      {/* Assignment Type */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          LB Assignment
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['run_fit', 'coverage', 'pressure'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-red-500 text-white'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {(['read', 'spy'] as const).map((t) => (
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

      {/* Run Fit */}
      {type === 'run_fit' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Fit Gap
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((gap) => (
                <button
                  key={gap}
                  onClick={() => updateAssignment({ fitGap: gap })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    assignment?.fitGap === gap
                      ? 'bg-red-500 text-white'
                      : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {gap}-Gap
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Fit Key
            </label>
            <input
              type="text"
              value={assignment?.fitKey || ''}
              onChange={(e) => updateAssignment({ fitKey: e.target.value })}
              placeholder="e.g., Guard, Tackle, FB"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </>
      )}

      {/* Coverage */}
      {type === 'coverage' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Coverage Zone
            </label>
            <select
              value={assignment?.coverageZone || ''}
              onChange={(e) => updateAssignment({ coverageZone: e.target.value })}
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select zone...</option>
              {COVERAGE_ZONES.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Coverage Depth (yards)
            </label>
            <input
              type="number"
              value={assignment?.coverageDepth || ''}
              onChange={(e) => updateAssignment({ coverageDepth: parseInt(e.target.value) })}
              placeholder="e.g., 10, 15"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </>
      )}

      {/* Pressure */}
      {type === 'pressure' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Pressure Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['A-gap', 'B-gap', 'C-gap', 'edge'] as const).map((pressureType) => (
              <button
                key={pressureType}
                onClick={() => updateAssignment({ pressureType })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assignment?.pressureType === pressureType
                    ? 'bg-red-500 text-white'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {pressureType}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Read */}
      {type === 'read' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Read Key
          </label>
          <input
            type="text"
            value={assignment?.readKey || ''}
            onChange={(e) => updateAssignment({ readKey: e.target.value })}
            placeholder="e.g., Guard, Back, QB"
            className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      )}

      {/* Spy */}
      {type === 'spy' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Spy Target
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['QB', 'RB'] as const).map((target) => (
              <button
                key={target}
                onClick={() => updateAssignment({ spyTarget: target })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assignment?.spyTarget === target
                    ? 'bg-red-500 text-white'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {target}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
