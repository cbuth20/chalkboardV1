// ═══════════════════════════════════════════════════════════════════════════
// DIAGRAM NUMBERS — Sideline yard numbers with faint background boxes
// 
// Uses FIELD_SPEC from @/lib/field for regulation-accurate positions.
// 
// Like traditional playbook diagrams and FirstDown Playbook:
// - Numbers positioned along both sideline areas (6 yards from sideline)
// - Faint rectangular boxes behind numbers
// - Numbers: 10, 20, 30, 40, 50, 40, 30, 20, 10
// - Very subtle, low-opacity so players/routes read on top
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { DiagramNumbersProps } from './types';
import { NUMBERS, FIELD_DIMENSIONS, YARDLINES, yardLineToDisplayNumber } from '@/lib/field';

// Use FIELD_SPEC constants for number positions
const NUMBERS_TOP_Y = NUMBERS.TOP_Y;
const NUMBERS_BOTTOM_Y = NUMBERS.BOTTOM_Y;

// Box dimensions
const BOX_WIDTH = 4;
const BOX_HEIGHT = 2.5;

/**
 * DiagramNumbers renders yard numbers along both sideline areas
 * with faint background boxes for traditional playbook look
 */
export const DiagramNumbers = memo(function DiagramNumbers({
  theme,
  viewBox,
}: DiagramNumbersProps) {
  const [minX, minY, width, height] = viewBox;
  const maxX = minX + width;
  const maxY = minY + height;

  // Generate number positions (every 10 yards) using FIELD_SPEC
  const numberPositions: number[] = [];
  for (let x = YARDLINES.LABEL_INTERVAL_YARDS; x <= FIELD_DIMENSIONS.LENGTH_YARDS - YARDLINES.LABEL_INTERVAL_YARDS; x += YARDLINES.LABEL_INTERVAL_YARDS) {
    if (x >= minX && x <= maxX) {
      numberPositions.push(x);
    }
  }

  // Check which number rows are visible
  const showTopNumbers = NUMBERS_TOP_Y >= minY && NUMBERS_TOP_Y <= maxY;
  const showBottomNumbers = NUMBERS_BOTTOM_Y >= minY && NUMBERS_BOTTOM_Y <= maxY;

  return (
    <g className="diagram-numbers">
      {numberPositions.map((x) => {
        // Use FIELD_SPEC function for display number conversion
        const displayNum = yardLineToDisplayNumber(x);
        if (displayNum === 0) return null;

        const displayText = displayNum.toString();

        return (
          <g key={`numbers-${x}`}>
            {/* Top sideline numbers */}
            {showTopNumbers && (
              <g className="top-number">
                {/* Background box */}
                <rect
                  x={x - BOX_WIDTH / 2}
                  y={NUMBERS_TOP_Y - BOX_HEIGHT / 2}
                  width={BOX_WIDTH}
                  height={BOX_HEIGHT}
                  rx={0.3}
                  fill={theme.numberBoxColor}
                  opacity={0.5}
                />
                {/* Number text */}
                <text
                  x={x}
                  y={NUMBERS_TOP_Y}
                  fill={theme.numbersColor}
                  fontSize={1.8}
                  fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  letterSpacing="0.05em"
                >
                  {displayText}
                </text>
              </g>
            )}

            {/* Bottom sideline numbers */}
            {showBottomNumbers && (
              <g className="bottom-number">
                {/* Background box */}
                <rect
                  x={x - BOX_WIDTH / 2}
                  y={NUMBERS_BOTTOM_Y - BOX_HEIGHT / 2}
                  width={BOX_WIDTH}
                  height={BOX_HEIGHT}
                  rx={0.3}
                  fill={theme.numberBoxColor}
                  opacity={0.5}
                />
                {/* Number text */}
                <text
                  x={x}
                  y={NUMBERS_BOTTOM_Y}
                  fill={theme.numbersColor}
                  fontSize={1.8}
                  fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  letterSpacing="0.05em"
                >
                  {displayText}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Direction arrows (optional, very subtle) */}
      <g className="direction-arrows" opacity="0.15">
        {/* Left-pointing arrows (toward X=0) on left half */}
        {numberPositions
          .filter((x) => x <= 50 && x >= 20)
          .map((x) => (
            <g key={`arrow-left-${x}`}>
              {showTopNumbers && (
                <path
                  d={`M ${x - 2.5} ${NUMBERS_TOP_Y} l -0.8 -0.5 l 0 1 z`}
                  fill={theme.numbersColor}
                />
              )}
              {showBottomNumbers && (
                <path
                  d={`M ${x - 2.5} ${NUMBERS_BOTTOM_Y} l -0.8 -0.5 l 0 1 z`}
                  fill={theme.numbersColor}
                />
              )}
            </g>
          ))}

        {/* Right-pointing arrows (toward X=100) on right half */}
        {numberPositions
          .filter((x) => x >= 50 && x <= 80)
          .map((x) => (
            <g key={`arrow-right-${x}`}>
              {showTopNumbers && (
                <path
                  d={`M ${x + 2.5} ${NUMBERS_TOP_Y} l 0.8 -0.5 l 0 1 z`}
                  fill={theme.numbersColor}
                />
              )}
              {showBottomNumbers && (
                <path
                  d={`M ${x + 2.5} ${NUMBERS_BOTTOM_Y} l 0.8 -0.5 l 0 1 z`}
                  fill={theme.numbersColor}
                />
              )}
            </g>
          ))}
      </g>
    </g>
  );
});

export default DiagramNumbers;







