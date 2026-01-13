// ═══════════════════════════════════════════════════════════════════════════
// HASH MARKS — NFL or Youth hash mark positions
// Short horizontal ticks at each yard line
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { HashMarksProps } from './types';
import { FIELD_DIMENSIONS, HASH_MARKS, getAllHashY } from './geometry';

/**
 * HashMarks renders horizontal tick marks at hash positions
 * 
 * NFL hashes: 70' 9" from each sideline (~23.58 yards), 18' 6" apart (~6.17 yards)
 * Youth hashes: Single row at center of field
 */
export const HashMarks = memo(function HashMarks({ type, theme }: HashMarksProps) {
  const hashYPositions = getAllHashY(type);
  const tickLength = 0.5; // Length of each tick mark in yards

  // Generate X positions for hash marks (every yard from 11 to 109)
  const xPositions: number[] = [];
  for (let x = 11; x <= 109; x++) {
    xPositions.push(x);
  }

  return (
    <g className="hash-marks">
      {hashYPositions.map((y) =>
        xPositions.map((x) => (
          <line
            key={`hash-${x}-${y}`}
            x1={x - tickLength / 2}
            y1={y}
            x2={x + tickLength / 2}
            y2={y}
            stroke={theme.hashMarkColor}
            strokeWidth="0.1"
            strokeLinecap="round"
          />
        ))
      )}

      {/* Additional center field tick marks for NFL (between hashes) */}
      {type === 'NFL' && (
        <g className="center-ticks">
          {xPositions.map((x) => (
            <line
              key={`center-tick-${x}`}
              x1={x - tickLength / 4}
              y1={FIELD_DIMENSIONS.WIDTH / 2}
              x2={x + tickLength / 4}
              y2={FIELD_DIMENSIONS.WIDTH / 2}
              stroke="rgba(0, 246, 229, 0.05)"
              strokeWidth="0.08"
              strokeLinecap="round"
            />
          ))}
        </g>
      )}
    </g>
  );
});

export default HashMarks;








