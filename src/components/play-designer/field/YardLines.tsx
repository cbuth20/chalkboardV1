// ═══════════════════════════════════════════════════════════════════════════
// YARD LINES — Vertical yard lines every 5 yards
// Major lines (every 10 yards) are more prominent
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { YardLinesProps } from './types';
import { FIELD_DIMENSIONS, getYardLinePositions, isMajorYardLine } from './geometry';

/**
 * YardLines renders vertical lines at every 5-yard interval
 * Major lines at 10-yard intervals are slightly more prominent
 */
export const YardLines = memo(function YardLines({ theme }: YardLinesProps) {
  const yardLines = getYardLinePositions();

  return (
    <g className="yard-lines">
      {yardLines.map((x) => {
        const isMajor = isMajorYardLine(x);
        const isGoalLine = x === FIELD_DIMENSIONS.FIELD_START || x === FIELD_DIMENSIONS.FIELD_END;

        return (
          <line
            key={`yard-line-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={FIELD_DIMENSIONS.WIDTH}
            stroke={isMajor || isGoalLine ? theme.majorYardLineColor : theme.yardLineColor}
            strokeWidth={isGoalLine ? 0.2 : isMajor ? 0.12 : 0.08}
            strokeDasharray={isMajor ? undefined : "1 0.5"}
          />
        );
      })}

      {/* Goal lines (thicker, at 10 and 110) */}
      <line
        x1={FIELD_DIMENSIONS.FIELD_START}
        y1={0}
        x2={FIELD_DIMENSIONS.FIELD_START}
        y2={FIELD_DIMENSIONS.WIDTH}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.25"
      />
      <line
        x1={FIELD_DIMENSIONS.FIELD_END}
        y1={0}
        x2={FIELD_DIMENSIONS.FIELD_END}
        y2={FIELD_DIMENSIONS.WIDTH}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.25"
      />
    </g>
  );
});

export default YardLines;








