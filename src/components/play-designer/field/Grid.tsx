// ═══════════════════════════════════════════════════════════════════════════
// GRID — Debug/alignment grid overlay
// Shows 1-yard x 1-yard grid for precise placement
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { GridProps } from './types';
import { FIELD_DIMENSIONS } from './geometry';

/**
 * Grid renders a 1-yard x 1-yard alignment grid
 * Useful for debugging and precise player placement
 */
export const Grid = memo(function Grid({ theme }: GridProps) {
  // Generate grid lines
  const verticalLines: number[] = [];
  const horizontalLines: number[] = [];

  for (let x = 0; x <= FIELD_DIMENSIONS.LENGTH; x++) {
    verticalLines.push(x);
  }
  for (let y = 0; y <= FIELD_DIMENSIONS.WIDTH; y++) {
    horizontalLines.push(y);
  }

  return (
    <g className="alignment-grid" opacity="0.5">
      {/* Vertical lines (every yard) */}
      {verticalLines.map((x) => (
        <line
          key={`grid-v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={FIELD_DIMENSIONS.WIDTH}
          stroke={theme.gridColor}
          strokeWidth="0.02"
        />
      ))}

      {/* Horizontal lines (every yard) */}
      {horizontalLines.map((y) => (
        <line
          key={`grid-h-${y}`}
          x1={0}
          y1={y}
          x2={FIELD_DIMENSIONS.LENGTH}
          y2={y}
          stroke={theme.gridColor}
          strokeWidth="0.02"
        />
      ))}

      {/* Major grid lines (every 5 yards) */}
      {verticalLines.filter((x) => x % 5 === 0).map((x) => (
        <line
          key={`grid-v-major-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={FIELD_DIMENSIONS.WIDTH}
          stroke={theme.gridColor}
          strokeWidth="0.05"
        />
      ))}

      {horizontalLines.filter((y) => y % 5 === 0).map((y) => (
        <line
          key={`grid-h-major-${y}`}
          x1={0}
          y1={y}
          x2={FIELD_DIMENSIONS.LENGTH}
          y2={y}
          stroke={theme.gridColor}
          strokeWidth="0.05"
        />
      ))}

      {/* Grid labels (every 10 yards on X axis) */}
      {verticalLines.filter((x) => x % 10 === 0).map((x) => (
        <text
          key={`grid-label-${x}`}
          x={x + 0.3}
          y={1}
          fill="rgba(0, 246, 229, 0.2)"
          fontSize="0.8"
          fontFamily="monospace"
        >
          {x}
        </text>
      ))}
    </g>
  );
});

export default Grid;








