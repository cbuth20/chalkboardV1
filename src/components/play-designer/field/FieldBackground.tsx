// ═══════════════════════════════════════════════════════════════════════════
// FIELD BACKGROUND — Dark-mode turf background with subtle texture
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { FieldBackgroundProps } from './types';
import { FIELD_DIMENSIONS } from './geometry';

/**
 * FieldBackground renders the dark turf background and end zones
 * Uses SVG patterns for subtle texture effects
 */
export const FieldBackground = memo(function FieldBackground({
  theme,
  showEndZones,
}: FieldBackgroundProps) {
  return (
    <g className="field-background">
      {/* SVG Definitions */}
      <defs>
        {/* Subtle turf texture pattern */}
        <pattern
          id="turfTexture"
          patternUnits="userSpaceOnUse"
          width="2"
          height="2"
        >
          <rect width="2" height="2" fill="transparent" />
          <circle cx="0.5" cy="0.5" r="0.03" fill="rgba(0, 100, 50, 0.08)" />
          <circle cx="1.5" cy="1.5" r="0.02" fill="rgba(0, 80, 40, 0.06)" />
        </pattern>

        {/* Background gradient for depth */}
        <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.backgroundColor} />
          <stop offset="10%" stopColor="rgba(13, 18, 24, 1)" />
          <stop offset="50%" stopColor="rgba(15, 20, 26, 1)" />
          <stop offset="90%" stopColor="rgba(13, 18, 24, 1)" />
          <stop offset="100%" stopColor={theme.backgroundColor} />
        </linearGradient>

        {/* Radial vignette overlay */}
        <radialGradient id="vignetteGradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.3)" />
        </radialGradient>

        {/* Neon glow filter for elements */}
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft glow for LOS */}
        <filter id="losGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main field background */}
      <rect
        x="0"
        y="0"
        width={FIELD_DIMENSIONS.LENGTH}
        height={FIELD_DIMENSIONS.WIDTH}
        fill="url(#fieldGradient)"
      />

      {/* Turf texture overlay */}
      <rect
        x="0"
        y="0"
        width={FIELD_DIMENSIONS.LENGTH}
        height={FIELD_DIMENSIONS.WIDTH}
        fill="url(#turfTexture)"
        opacity="0.6"
      />

      {/* End zones */}
      {showEndZones && (
        <>
          {/* Left end zone (0-10) */}
          <rect
            x="0"
            y="0"
            width={FIELD_DIMENSIONS.END_ZONE_DEPTH}
            height={FIELD_DIMENSIONS.WIDTH}
            fill={theme.endZoneColor}
            stroke="rgba(0, 246, 229, 0.08)"
            strokeWidth="0.1"
          />
          {/* Right end zone (110-120) */}
          <rect
            x={FIELD_DIMENSIONS.FIELD_END}
            y="0"
            width={FIELD_DIMENSIONS.END_ZONE_DEPTH}
            height={FIELD_DIMENSIONS.WIDTH}
            fill={theme.endZoneColor}
            stroke="rgba(0, 246, 229, 0.08)"
            strokeWidth="0.1"
          />
        </>
      )}

      {/* Sidelines */}
      <line
        x1="0"
        y1="0"
        x2={FIELD_DIMENSIONS.LENGTH}
        y2="0"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="0.15"
      />
      <line
        x1="0"
        y1={FIELD_DIMENSIONS.WIDTH}
        x2={FIELD_DIMENSIONS.LENGTH}
        y2={FIELD_DIMENSIONS.WIDTH}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="0.15"
      />

      {/* End lines */}
      <line
        x1="0"
        y1="0"
        x2="0"
        y2={FIELD_DIMENSIONS.WIDTH}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="0.15"
      />
      <line
        x1={FIELD_DIMENSIONS.LENGTH}
        y1="0"
        x2={FIELD_DIMENSIONS.LENGTH}
        y2={FIELD_DIMENSIONS.WIDTH}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="0.15"
      />

      {/* Vignette overlay */}
      <rect
        x="0"
        y="0"
        width={FIELD_DIMENSIONS.LENGTH}
        height={FIELD_DIMENSIONS.WIDTH}
        fill="url(#vignetteGradient)"
        pointerEvents="none"
      />
    </g>
  );
});

export default FieldBackground;








