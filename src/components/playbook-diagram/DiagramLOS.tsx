// ═══════════════════════════════════════════════════════════════════════════
// DIAGRAM LOS — Line of Scrimmage for playbook diagrams
// 
// A horizontal line at the LOS Y position
// Subtle glow effect, spans the visible width
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { DiagramLOSProps } from './types';

/**
 * DiagramLOS renders a horizontal line of scrimmage
 */
export const DiagramLOS = memo(function DiagramLOS({
  y,
  theme,
  viewBox,
}: DiagramLOSProps) {
  const [minX, , width] = viewBox;
  const maxX = minX + width;

  return (
    <g className="diagram-los">
      {/* Glow effect behind the line */}
      <line
        x1={minX}
        y1={y}
        x2={maxX}
        y2={y}
        stroke={theme.losColor}
        strokeWidth="0.4"
        strokeLinecap="round"
        opacity="0.2"
        filter="url(#diagramGlowStrong)"
      />

      {/* Main LOS line */}
      <line
        x1={minX}
        y1={y}
        x2={maxX}
        y2={y}
        stroke={theme.losColor}
        strokeWidth="0.12"
        strokeLinecap="round"
        opacity="0.7"
        strokeDasharray="0.8 0.4"
      />

      {/* LOS label (optional) */}
      <text
        x={minX + 1}
        y={y - 0.8}
        fill={theme.losColor}
        fontSize={0.8}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
        opacity="0.5"
      >
        LOS
      </text>
    </g>
  );
});

export default DiagramLOS;







