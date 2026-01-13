// ═══════════════════════════════════════════════════════════════════════════
// NUMBERS — Yard numbers (10, 20, 30, 40, 50, 40, 30, 20, 10)
// 
// ORIENTATION RULES:
// - ALL numbers are readable left-to-right (NO ROTATION)
// - Numbers positioned 12 yards from each sideline
// - Top row at Y = 12, Bottom row at Y = 41.3 (53.3 - 12)
// - Numbers appear at 10-yard intervals along the X-axis
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { NumbersProps } from './types';
import { NUMBERS, getMajorYardLinePositions, yardLineToNumber } from './geometry';

/**
 * Numbers renders yard numbers on the field.
 * 
 * ALL TEXT IS HORIZONTAL - NO ROTATION TRANSFORMS.
 * Numbers read left-to-right from the viewer's perspective.
 * 
 * Layout:
 * - Top row: Y = 12 yards from top sideline
 * - Bottom row: Y = 41.3 yards (12 from bottom sideline)
 * - X positions: 20, 30, 40, 50, 60, 70, 80, 90, 100 (every 10 yards)
 * - Display numbers: 10, 20, 30, 40, 50, 40, 30, 20, 10
 */
export const Numbers = memo(function Numbers({ theme }: NumbersProps) {
  const yardLines = getMajorYardLinePositions();
  const fontSize = 3;

  return (
    <g className="yard-numbers">
      {yardLines.map((x) => {
        const number = yardLineToNumber(x);
        if (number === 0) return null;

        // Format: single digit gets leading space for alignment
        const displayNumber = number.toString();

        return (
          <g key={`numbers-${x}`}>
            {/* Top row numbers (near Y = 0 sideline) */}
            <text
              x={x}
              y={NUMBERS.BOTTOM_Y}
              fill={theme.numbersColor}
              fontSize={fontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ letterSpacing: '0.5px' }}
            >
              {displayNumber}
            </text>

            {/* Bottom row numbers (near Y = 53.3 sideline) */}
            <text
              x={x}
              y={NUMBERS.TOP_Y}
              fill={theme.numbersColor}
              fontSize={fontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ letterSpacing: '0.5px' }}
            >
              {displayNumber}
            </text>
          </g>
        );
      })}

      {/* Direction arrows - pointing toward end zones */}
      <g className="direction-arrows" opacity="0.2">
        {/* Left-pointing arrows (toward X=0 end zone) on left half */}
        {[20, 30, 40, 50].map((x) => (
          <g key={`arrow-left-${x}`}>
            {/* Top row arrow */}
            <path
              d={`M ${x - 3} ${NUMBERS.BOTTOM_Y} L ${x - 5} ${NUMBERS.BOTTOM_Y - 0.8} L ${x - 5} ${NUMBERS.BOTTOM_Y + 0.8} Z`}
              fill={theme.numbersColor}
            />
            {/* Bottom row arrow */}
            <path
              d={`M ${x - 3} ${NUMBERS.TOP_Y} L ${x - 5} ${NUMBERS.TOP_Y - 0.8} L ${x - 5} ${NUMBERS.TOP_Y + 0.8} Z`}
              fill={theme.numbersColor}
            />
          </g>
        ))}

        {/* Right-pointing arrows (toward X=120 end zone) on right half */}
        {[70, 80, 90, 100].map((x) => (
          <g key={`arrow-right-${x}`}>
            {/* Top row arrow */}
            <path
              d={`M ${x + 3} ${NUMBERS.BOTTOM_Y} L ${x + 5} ${NUMBERS.BOTTOM_Y - 0.8} L ${x + 5} ${NUMBERS.BOTTOM_Y + 0.8} Z`}
              fill={theme.numbersColor}
            />
            {/* Bottom row arrow */}
            <path
              d={`M ${x + 3} ${NUMBERS.TOP_Y} L ${x + 5} ${NUMBERS.TOP_Y - 0.8} L ${x + 5} ${NUMBERS.TOP_Y + 0.8} Z`}
              fill={theme.numbersColor}
            />
          </g>
        ))}
      </g>
    </g>
  );
});

export default Numbers;
