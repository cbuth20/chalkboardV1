// ═══════════════════════════════════════════════════════════════════════════
// LOS LINE — Line of Scrimmage with optional depth reference lines
// Prominent highlighted line at configurable X position
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { LOSLineProps } from './types';
import { FIELD_DIMENSIONS } from './geometry';

/**
 * LOSLine renders the line of scrimmage and optional depth reference lines
 * The LOS is a prominent, glowing line
 * Depth lines appear every 1 yard behind the LOS (toward offense)
 */
export const LOSLine = memo(function LOSLine({
  x,
  showDepthLines,
  theme,
}: LOSLineProps) {
  // Generate depth lines behind LOS (1-10 yards back)
  const depthLines = showDepthLines
    ? Array.from({ length: 10 }, (_, i) => x + i + 1).filter(pos => pos <= FIELD_DIMENSIONS.LENGTH)
    : [];

  return (
    <g className="los-line">
      {/* Depth reference lines (faint, behind LOS) */}
      {depthLines.map((depthX, i) => (
        <line
          key={`depth-${depthX}`}
          x1={depthX}
          y1={0}
          x2={depthX}
          y2={FIELD_DIMENSIONS.WIDTH}
          stroke="rgba(0, 246, 229, 0.03)"
          strokeWidth="0.08"
          strokeDasharray="0.5 0.5"
          opacity={1 - i * 0.08} // Fade out further back
        />
      ))}

      {/* Main LOS line */}
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={FIELD_DIMENSIONS.WIDTH}
        stroke={theme.losColor}
        strokeWidth="0.25"
        filter="url(#losGlow)"
      />

      {/* LOS glow effect (double line for bloom) */}
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={FIELD_DIMENSIONS.WIDTH}
        stroke={theme.losColor}
        strokeWidth="0.5"
        opacity="0.3"
      />

      {/* Ball marker at center of LOS */}
      <g className="ball-marker">
        <ellipse
          cx={x}
          cy={FIELD_DIMENSIONS.WIDTH / 2}
          rx="0.6"
          ry="0.35"
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="0.08"
        />
        {/* Ball laces */}
        <line
          x1={x - 0.25}
          y1={FIELD_DIMENSIONS.WIDTH / 2}
          x2={x + 0.25}
          y2={FIELD_DIMENSIONS.WIDTH / 2}
          stroke="#FFFFFF"
          strokeWidth="0.05"
          opacity="0.6"
        />
      </g>

      {/* LOS label */}
      <text
        x={x}
        y={-0.8}
        fill={theme.losColor}
        fontSize="1.2"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="auto"
        opacity="0.7"
      >
        LOS
      </text>
    </g>
  );
});

export default LOSLine;








