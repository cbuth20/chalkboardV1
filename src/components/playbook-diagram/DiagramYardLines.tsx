// ═══════════════════════════════════════════════════════════════════════════
// DIAGRAM YARD LINES — Vertical yard lines for playbook diagrams
// 
// Uses FIELD_SPEC from @/lib/field for regulation-accurate positions.
//
// ORIENTATION:
// - Yard lines are VERTICAL (perpendicular to the long axis)
// - X-axis is horizontal (left-right, 0-100 yards)
// - Lines drawn at X positions: 5, 10, 15, 20, ... 95, 100
// - Major lines (every 10 yards) are more prominent
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { DiagramYardLinesProps } from './types';
import { FIELD_DIMENSIONS, YARDLINES, getYardLinePositions, isLabeledYardLine } from '@/lib/field';

/**
 * DiagramYardLines renders vertical lines at every 5-yard interval.
 * Major lines at 10-yard intervals are slightly more prominent.
 * All positions derived from FIELD_SPEC for regulation accuracy.
 */
export const DiagramYardLines = memo(function DiagramYardLines({
  theme,
  viewBox,
}: DiagramYardLinesProps) {
  const [minX, minY, width, height] = viewBox;
  const maxX = minX + width;
  const maxY = minY + height;

  // Generate yard line positions using FIELD_SPEC
  const yardLines = getYardLinePositions(minX, maxX);

  // Goal line positions from FIELD_SPEC
  const leftGoalLine = YARDLINES.LEFT_GOAL_LINE_X;
  const rightGoalLine = YARDLINES.RIGHT_GOAL_LINE_X;

  return (
    <g className="diagram-yard-lines">
      {yardLines.map((x) => {
        // Use FIELD_SPEC function to determine if this is a labeled (major) yard line
        const isMajor = isLabeledYardLine(x);
        const isGoalLine = x === leftGoalLine || x === rightGoalLine;

        return (
          <line
            key={`yard-line-${x}`}
            x1={x}
            y1={minY}
            x2={x}
            y2={maxY}
            stroke={
              isGoalLine
                ? 'rgba(255, 255, 255, 0.15)'
                : isMajor
                ? theme.majorYardLineColor
                : theme.yardLineColor
            }
            strokeWidth={isGoalLine ? 0.15 : isMajor ? 0.1 : 0.06}
            strokeDasharray={isMajor || isGoalLine ? undefined : '0.5 0.3'}
          />
        );
      })}

      {/* Goal lines (if visible) - using FIELD_SPEC constants */}
      {minX <= leftGoalLine && (
        <line
          x1={leftGoalLine}
          y1={minY}
          x2={leftGoalLine}
          y2={maxY}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="0.2"
        />
      )}
      {maxX >= rightGoalLine && (
        <line
          x1={rightGoalLine}
          y1={minY}
          x2={rightGoalLine}
          y2={maxY}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="0.2"
        />
      )}
    </g>
  );
});

export default DiagramYardLines;







