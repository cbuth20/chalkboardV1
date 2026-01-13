// ═══════════════════════════════════════════════════════════════════════════
// DIAGRAM HASH MARKS — Short horizontal ticks at hash positions
// 
// Uses FIELD_SPEC from @/lib/field for regulation-accurate positions:
// - NFL hashes: 23.583 yards from each sideline, 6.167 yards apart
// - NCAA hashes: 20 yards from each sideline, 13.333 yards apart
// - HIGH_SCHOOL hashes: 17.778 yards from each sideline
// 
// Hash marks are short HORIZONTAL ticks crossing each yard line
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { DiagramHashMarksProps } from './types';
import { HASHMARKS, FIELD_DIMENSIONS, getCenterY, type HashStandard } from '@/lib/field';

/**
 * Get hash Y positions for a given standard.
 * Returns array of Y positions where hash marks should be drawn.
 */
function getHashYPositions(hashType: HashStandard): number[] {
  const spec = HASHMARKS[hashType];
  if (!spec) {
    // Fallback to NFL if unknown type
    return [HASHMARKS.NFL.LEFT_HASH_Y, HASHMARKS.NFL.RIGHT_HASH_Y];
  }
  return [spec.LEFT_HASH_Y, spec.RIGHT_HASH_Y];
}

/**
 * DiagramHashMarks renders horizontal tick marks at hash positions.
 * All positions derived from FIELD_SPEC for regulation accuracy.
 */
export const DiagramHashMarks = memo(function DiagramHashMarks({
  theme,
  viewBox,
  hashType,
}: DiagramHashMarksProps) {
  const [minX, minY, width, height] = viewBox;
  const maxX = minX + width;
  const maxY = minY + height;

  // Get hash Y positions from FIELD_SPEC
  const hashYPositions = getHashYPositions(hashType);
  const centerY = getCenterY();

  // Only render hashes within the visible viewBox
  const visibleHashes = hashYPositions.filter(y => y >= minY && y <= maxY);
  const showCenterTicks = centerY >= minY && centerY <= maxY;

  // Generate X positions for hash marks (every yard)
  const xPositions: number[] = [];
  const startX = Math.ceil(minX);
  for (let x = startX; x <= maxX; x++) {
    if (x >= 1 && x <= FIELD_DIMENSIONS.LENGTH_YARDS - 1) {
      xPositions.push(x);
    }
  }

  const tickLength = 0.4; // Length of each tick mark in yards

  return (
    <g className="diagram-hash-marks">
      {/* Hash mark ticks at regulation positions */}
      {visibleHashes.map((y) =>
        xPositions.map((x) => (
          <line
            key={`hash-${x}-${y.toFixed(2)}`}
            x1={x - tickLength / 2}
            y1={y}
            x2={x + tickLength / 2}
            y2={y}
            stroke={theme.hashMarkColor}
            strokeWidth="0.08"
            strokeLinecap="round"
          />
        ))
      )}

      {/* Center field ticks (between the hashes) */}
      {showCenterTicks && (
        <g className="center-ticks">
          {xPositions.map((x) => (
            <line
              key={`center-tick-${x}`}
              x1={x - tickLength / 4}
              y1={centerY}
              x2={x + tickLength / 4}
              y2={centerY}
              stroke="rgba(0, 246, 229, 0.04)"
              strokeWidth="0.06"
              strokeLinecap="round"
            />
          ))}
        </g>
      )}
    </g>
  );
});

export default DiagramHashMarks;







