'use client';

import { useState } from 'react';
import type { DiagramPlayer, OffensiveSkillAssignment } from '@/types/play-assignments';

interface OffensiveSkillAssignmentFormProps {
  player: DiagramPlayer;
  allPlayers: DiagramPlayer[];
  assignment?: OffensiveSkillAssignment;
  onChange: (assignment: OffensiveSkillAssignment) => void;
  onApplyRoute?: (playerId: string, routePoints: { x: number; y: number }[]) => void;
}

const ROUTE_TYPES = [
  'Go/Fly', 'Post', 'Corner', 'Dig', 'Curl', 'Comeback', 'Slant',
  'Quick Out', 'Hitch', 'Fade', 'Wheel', 'Flat', 'Seam', 'Cross'
];

// Map route type names to template patterns
const ROUTE_TYPE_TO_TEMPLATE: Record<string, { x: number; y: number }[]> = {
  'Go/Fly': [{ x: 0, y: 0 }, { x: 0, y: -25 }],
  'Post': [{ x: 0, y: 0 }, { x: 0, y: -12 }, { x: -8, y: -22 }],
  'Corner': [{ x: 0, y: 0 }, { x: 0, y: -12 }, { x: 8, y: -22 }],
  'Dig': [{ x: 0, y: 0 }, { x: 0, y: -12 }, { x: -10, y: -12 }],
  'Curl': [{ x: 0, y: 0 }, { x: 0, y: -12 }, { x: 0, y: -8 }],
  'Comeback': [{ x: 0, y: 0 }, { x: 0, y: -18 }, { x: 0, y: -14 }],
  'Slant': [{ x: 0, y: 0 }, { x: 0, y: -5 }, { x: 8, y: -15 }],
  'Quick Out': [{ x: 0, y: 0 }, { x: 0, y: -3 }, { x: 8, y: -3 }],
  'Hitch': [{ x: 0, y: 0 }, { x: 0, y: -5 }, { x: 0, y: -4 }],
  'Fade': [{ x: 0, y: 0 }, { x: 3, y: -10 }, { x: 5, y: -20 }],
  'Wheel': [{ x: 0, y: 0 }, { x: 0, y: -3 }, { x: 6, y: -5 }, { x: 8, y: -18 }],
  'Flat': [{ x: 0, y: 0 }, { x: 0, y: -3 }, { x: 8, y: -3 }],
  'Seam': [{ x: 0, y: 0 }, { x: 0, y: -8 }, { x: 2, y: -20 }],
  'Cross': [{ x: 0, y: 0 }, { x: 0, y: -8 }, { x: -12, y: -12 }]
};

export function OffensiveSkillAssignmentForm({
  player,
  allPlayers,
  assignment,
  onChange,
  onApplyRoute,
}: OffensiveSkillAssignmentFormProps) {
  const [localAssignment, setLocalAssignment] = useState<OffensiveSkillAssignment>(
    assignment || { type: 'route' }
  );

  const updateAssignment = (updates: Partial<OffensiveSkillAssignment>) => {
    const newAssignment = { ...localAssignment, ...updates };
    setLocalAssignment(newAssignment as OffensiveSkillAssignment);
    onChange(newAssignment as OffensiveSkillAssignment);
  };

  const handleTypeChange = (newType: OffensiveSkillAssignment['type']) => {
    updateAssignment({ type: newType });
  };

  const handleRouteTypeChange = (routeType: string) => {
    updateAssignment({ routeType });

    // Apply the route template to the player if onApplyRoute is provided
    if (onApplyRoute && routeType && ROUTE_TYPE_TO_TEMPLATE[routeType]) {
      const templatePoints = ROUTE_TYPE_TO_TEMPLATE[routeType];
      onApplyRoute(player.id, templatePoints);
    }
  };

  return (
    <div className="space-y-4">
      {/* Assignment Type */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Assignment Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['route', 'motion', 'block', 'option_route'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                localAssignment.type === t
                  ? 'bg-[#00F6E5] text-black'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Route Assignment */}
      {localAssignment.type === 'route' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Route Type
            </label>
            <select
              value={localAssignment.routeType || ''}
              onChange={(e) => handleRouteTypeChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            >
              <option value="">Select route...</option>
              {ROUTE_TYPES.map(route => (
                <option key={route} value={route}>{route}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Route Depth (yards)
            </label>
            <input
              type="number"
              value={localAssignment.routeDepth || ''}
              onChange={(e) => updateAssignment({ routeDepth: parseInt(e.target.value) || 0 })}
              placeholder="e.g., 12"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>
        </>
      )}

      {/* Motion Assignment */}
      {localAssignment.type === 'motion' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Motion Direction
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['left', 'right', 'across', 'jet'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => updateAssignment({ motionDirection: dir })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localAssignment.motionDirection === dir
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
              Motion Timing
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['pre_snap', 'at_snap'] as const).map((timing) => (
                <button
                  key={timing}
                  onClick={() => updateAssignment({ motionTiming: timing })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localAssignment.motionTiming === timing
                      ? 'bg-[#00F6E5] text-black'
                      : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {timing === 'pre_snap' ? 'Pre-Snap' : 'At Snap'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Block Assignment */}
      {localAssignment.type === 'block' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Block Target
            </label>
            <input
              type="text"
              value={localAssignment.blockTarget || ''}
              onChange={(e) => updateAssignment({ blockTarget: e.target.value })}
              placeholder="e.g., Edge, LB, Safety"
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Block Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['crack', 'stalk', 'cut'] as const).map((blockType) => (
                <button
                  key={blockType}
                  onClick={() => updateAssignment({ blockType })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localAssignment.blockType === blockType
                      ? 'bg-[#00F6E5] text-black'
                      : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {blockType.charAt(0).toUpperCase() + blockType.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Option Route Assignment */}
      {localAssignment.type === 'option_route' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Vs Man Coverage
            </label>
            <select
              value={localAssignment.vsManRoute || ''}
              onChange={(e) => updateAssignment({ vsManRoute: e.target.value })}
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            >
              <option value="">Select route...</option>
              {ROUTE_TYPES.map(route => (
                <option key={route} value={route}>{route}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Vs Zone Coverage
            </label>
            <select
              value={localAssignment.vsZoneRoute || ''}
              onChange={(e) => updateAssignment({ vsZoneRoute: e.target.value })}
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            >
              <option value="">Select route...</option>
              {ROUTE_TYPES.map(route => (
                <option key={route} value={route}>{route}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Option Rule (Details)
            </label>
            <textarea
              value={localAssignment.optionRule || ''}
              onChange={(e) => updateAssignment({ optionRule: e.target.value })}
              placeholder="Describe the read and decision..."
              rows={3}
              className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5] resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}
