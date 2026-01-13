// ═══════════════════════════════════════════════════════════════════════════
// DIAGRAM BACKGROUND — Dark-mode field background with subtle depth
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { DiagramBackgroundProps } from './types';

/**
 * DiagramBackground renders the dark field background with:
 * - Subtle gradient for depth
 * - Light horizontal "bands" like traditional playbook diagrams
 * - Vignette effect for focus
 */
export const DiagramBackground = memo(function DiagramBackground({
  theme,
  viewBox,
}: DiagramBackgroundProps) {
  const [minX, minY, width, height] = viewBox;

  // Calculate band positions (horizontal stripes across the field)
  const bandSpacing = 5; // yards between bands
  const bands: number[] = [];
  for (let y = Math.ceil(minY / bandSpacing) * bandSpacing; y < minY + height; y += bandSpacing) {
    bands.push(y);
  }

  return (
    <g className="diagram-background">
      {/* SVG Definitions */}
      <defs>
        {/* Background gradient for depth */}
        <linearGradient id="diagramFieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.fieldColor} />
          <stop offset="50%" stopColor="rgba(13, 18, 24, 1)" />
          <stop offset="100%" stopColor={theme.fieldColor} />
        </linearGradient>

        {/* Radial vignette for focus */}
        <radialGradient id="diagramVignette" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.4)" />
        </radialGradient>

        {/* Neon glow filter for elements */}
        <filter id="diagramGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Stronger glow for accents */}
        <filter id="diagramGlowStrong" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Turf texture pattern */}
        <pattern
          id="diagramTurf"
          patternUnits="userSpaceOnUse"
          width="2"
          height="2"
        >
          <rect width="2" height="2" fill="transparent" />
          <circle cx="0.5" cy="0.5" r="0.02" fill="rgba(0, 100, 80, 0.05)" />
          <circle cx="1.5" cy="1.5" r="0.015" fill="rgba(0, 80, 60, 0.04)" />
        </pattern>
      </defs>

      {/* Main background */}
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill={theme.backgroundColor}
      />

      {/* Field gradient overlay */}
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill="url(#diagramFieldGradient)"
      />

      {/* Turf texture */}
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill="url(#diagramTurf)"
        opacity="0.5"
      />

      {/* Horizontal bands (like traditional playbook diagrams) */}
      {bands.map((y) => (
        <line
          key={`band-${y}`}
          x1={minX}
          y1={y}
          x2={minX + width}
          y2={y}
          stroke="rgba(255, 255, 255, 0.015)"
          strokeWidth="0.3"
        />
      ))}

      {/* Vignette overlay */}
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill="url(#diagramVignette)"
        pointerEvents="none"
      />
    </g>
  );
});

export default DiagramBackground;







