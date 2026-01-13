// ═══════════════════════════════════════════════════════════════════════════
// FIELD CANVAS — Base top-down football field background
// Uses proper NFL-style coordinate system for realistic playbook diagrams
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { ReactNode } from "react";
import { FIELD } from "./fieldCoordinates";

interface FieldCanvasProps {
  children: ReactNode;
  className?: string;
  // Show elements
  showYardLines?: boolean;
  showHashMarks?: boolean;
  showEndZone?: boolean;
  showLineOfScrimmage?: boolean;
  /** 
   * When true, uses fixed dimensions optimized for game diagrams.
   * This ensures the diagram is properly sized for the scaling wrapper.
   * Default: false (uses responsive height classes)
   */
  scalable?: boolean;
}

/**
 * FieldCanvas provides a top-down football field with a dark chalkboard aesthetic.
 * 
 * Coordinate System (for child elements):
 * - X axis: 0-100 (sideline to sideline, 50 = center)
 * - Y axis: 0-60 (top to bottom, 40 = LOS)
 * - Defense is above LOS (y < 40)
 * - Offense is below LOS (y >= 40)
 * 
 * Use viewBox="0 0 100 60" in child SVGs to match this coordinate system.
 */
export function FieldCanvas({
  children,
  className = "",
  showYardLines = true,
  showHashMarks = true,
  showEndZone = false,
  showLineOfScrimmage = true,
  scalable = false,
}: FieldCanvasProps) {
  // When scalable, use fixed dimensions that scale well
  const sizeClasses = scalable
    ? "" 
    : "h-48 sm:h-56 md:h-64 w-full";

  const sizeStyles = scalable
    ? {
        width: "500px",
        height: "300px", // 5:3 aspect ratio to match 100x60 viewBox
      }
    : {};

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-700/50 ${sizeClasses} ${className}`}
      style={{
        ...sizeStyles,
        background: `
          linear-gradient(180deg, 
            rgba(12, 22, 18, 0.98) 0%, 
            rgba(10, 18, 14, 1) 50%,
            rgba(8, 15, 12, 1) 100%
          )
        `,
      }}
    >
      {/* Field SVG background with proper coordinate system */}
      <svg
        viewBox={`0 0 ${FIELD.WIDTH} ${FIELD.HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.7 }}
      >
        <defs>
          {/* Subtle grass texture */}
          <pattern
            id="grassTexture"
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
          >
            <rect width="4" height="4" fill="transparent" />
            <circle cx="1" cy="1" r="0.15" fill="rgba(0, 100, 50, 0.12)" />
            <circle cx="3" cy="3" r="0.1" fill="rgba(0, 80, 40, 0.1)" />
          </pattern>

          {/* Neon glow filter for LOS */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Field background with texture */}
        <rect width="100" height="60" fill="url(#grassTexture)" />

        {/* Sidelines - left and right edges */}
        <line
          x1="2"
          y1="0"
          x2="2"
          y2="60"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="0.3"
        />
        <line
          x1="98"
          y1="0"
          x2="98"
          y2="60"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="0.3"
        />

        {/* Yard lines - every 5 yards (10 units on our scale) */}
        {showYardLines && (
          <g>
            {[10, 20, 30, 40, 50].map((y) => (
              <line
                key={`yard-${y}`}
                x1="5"
                x2="95"
                y1={y}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="0.15"
                strokeDasharray="1.5 1"
              />
            ))}
          </g>
        )}

        {/* Hash marks - NFL style at 35 and 65 */}
        {showHashMarks && (
          <g>
            {/* Vertical hash lines at NFL hash positions */}
            {[20, 25, 30, 35, 40, 45, 50].map((y) => (
              <g key={`hash-${y}`}>
                {/* Left hash */}
                <line
                  x1={FIELD.LEFT_HASH_X}
                  y1={y - 0.5}
                  x2={FIELD.LEFT_HASH_X}
                  y2={y + 0.5}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="0.2"
                />
                {/* Right hash */}
                <line
                  x1={FIELD.RIGHT_HASH_X}
                  y1={y - 0.5}
                  x2={FIELD.RIGHT_HASH_X}
                  y2={y + 0.5}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="0.2"
                />
                {/* Center tick */}
                <line
                  x1={FIELD.CENTER_X - 0.3}
                  y1={y}
                  x2={FIELD.CENTER_X + 0.3}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="0.15"
                />
              </g>
            ))}
          </g>
        )}

        {/* Numbers position markers (very subtle) */}
        <g opacity="0.05">
          {/* Left numbers area marker */}
          <line
            x1={FIELD.LEFT_NUMBERS_X}
            y1="15"
            x2={FIELD.LEFT_NUMBERS_X}
            y2="55"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="0.3"
            strokeDasharray="2 4"
          />
          {/* Right numbers area marker */}
          <line
            x1={FIELD.RIGHT_NUMBERS_X}
            y1="15"
            x2={FIELD.RIGHT_NUMBERS_X}
            y2="55"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="0.3"
            strokeDasharray="2 4"
          />
        </g>

        {/* End zone indicator */}
        {showEndZone && (
          <rect
            x="2"
            y="0"
            width="96"
            height="8"
            fill="rgba(0, 246, 229, 0.03)"
            stroke="rgba(0, 246, 229, 0.12)"
            strokeWidth="0.2"
          />
        )}

        {/* Line of Scrimmage - prominent at y=40 */}
        {showLineOfScrimmage && (
          <g>
            {/* Main LOS line */}
            <line
              x1="5"
              y1={FIELD.LOS_Y}
              x2="95"
              y2={FIELD.LOS_Y}
              stroke="rgba(0, 246, 229, 0.5)"
              strokeWidth="0.4"
              filter="url(#neonGlow)"
            />
            {/* Ball marker at center */}
            <ellipse
              cx={FIELD.CENTER_X}
              cy={FIELD.LOS_Y}
              rx="1.2"
              ry="0.7"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="0.15"
            />
          </g>
        )}
      </svg>

      {/* Grid overlay for modern HUD effect */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 246, 229, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 246, 229, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: "5% 8.33%", // 20 columns, 12 rows to match grid
        }}
      />

      {/* Child content (players, routes, etc.) */}
      <div className="relative h-full w-full">{children}</div>

      {/* Subtle vignette effect */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              transparent 50%,
              rgba(0, 0, 0, 0.25) 100%
            )
          `,
        }}
      />
    </div>
  );
}

export default FieldCanvas;
