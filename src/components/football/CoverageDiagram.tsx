// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE DIAGRAM — Renders defensive coverage shells with realistic positions
// Uses NFL-style coordinate system for authentic playbook appearance
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { FieldCanvas } from "./FieldCanvas";
import { FIELD, OFFENSE, DEFENSE } from "./fieldCoordinates";
import type { CoverageShell, Formation } from "@/types/football";

interface CoverageDiagramProps {
  shell: CoverageShell;
  formation?: Formation;
  className?: string;
  showLabels?: boolean;
  showZones?: boolean;
  scalable?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// POSITION COLORS
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  // Safeties - Gold/Yellow
  safety: { fill: "#F5C253", stroke: "#ffd97a", glow: "rgba(245, 194, 83, 0.5)" },
  // Corners - Cyan
  corner: { fill: "#3DF3FF", stroke: "#67f7ff", glow: "rgba(61, 243, 255, 0.5)" },
  // Linebackers - Teal
  linebacker: { fill: "#00F6E5", stroke: "#3DF3FF", glow: "rgba(0, 246, 229, 0.5)" },
  // D-Line - Orange
  dLine: { fill: "#FF6A3D", stroke: "#ff8a5c", glow: "rgba(255, 106, 61, 0.5)" },
  // Nickel/Dime - Light Cyan
  nickel: { fill: "#67f7ff", stroke: "#9ef9ff", glow: "rgba(103, 247, 255, 0.5)" },
  // Offense - Muted gray
  offense: { fill: "#3a4148", stroke: "#5a6570", glow: "rgba(90, 101, 112, 0.3)" },
  // Offensive line - Darker gray
  oLine: { fill: "#2d3238", stroke: "#4a5058", glow: "rgba(74, 80, 88, 0.3)" },
  // QB - Slightly brighter
  qb: { fill: "#4a5560", stroke: "#6a7580", glow: "rgba(106, 117, 128, 0.4)" },
};

// ═══════════════════════════════════════════════════════════════════════════
// POSITION MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map coverage shell data to realistic field positions
 */
function getDefensivePositions(shell: CoverageShell) {
  const positions: Array<{
    x: number;
    y: number;
    label: string;
    colorKey: keyof typeof COLORS;
    size: number;
  }> = [];

  // Determine corner technique based on coverage
  const isPress = shell.safetyAlignment === "zero-high";
  const isOff = shell.safetyAlignment === "single-high" || shell.safetyAlignment === "two-high";
  
  // ─────────────────────────────────────────────────────────────────────────
  // Corners - aligned outside the WRs
  // ─────────────────────────────────────────────────────────────────────────
  if (isPress) {
    // Press corners for Cover 0
    positions.push(
      { x: 12, y: 38, label: "CB", colorKey: "corner", size: 2.2 },
      { x: 88, y: 38, label: "CB", colorKey: "corner", size: 2.2 }
    );
  } else if (shell.id === "cover-3") {
    // Cover 3 corners at deep third depth
    positions.push(
      { x: 12, y: 28, label: "CB", colorKey: "corner", size: 2.2 },
      { x: 88, y: 28, label: "CB", colorKey: "corner", size: 2.2 }
    );
  } else {
    // Off corners (7-8 yards)
    positions.push(
      { x: 12, y: 32, label: "CB", colorKey: "corner", size: 2.2 },
      { x: 88, y: 32, label: "CB", colorKey: "corner", size: 2.2 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Safeties - based on coverage shell
  // ─────────────────────────────────────────────────────────────────────────
  switch (shell.safetyAlignment) {
    case "single-high":
      // Single high safety centered at 15 yards
      positions.push(
        { x: 50, y: 22, label: "FS", colorKey: "safety", size: 2.4 }
      );
      // SS either in box or robbing
      if (shell.id === "cover-1") {
        positions.push(
          { x: 58, y: 32, label: "SS", colorKey: "safety", size: 2.2 }
        );
      } else {
        // Cover 3 - SS rolls down to flat/force
        positions.push(
          { x: 62, y: 35, label: "SS", colorKey: "safety", size: 2.2 }
        );
      }
      break;
      
    case "two-high":
      // Two safeties split at 12-15 yards
      if (shell.id === "cover-4" || shell.id === "quarters") {
        // Quarters - safeties at 10-12 yards
        positions.push(
          { x: 35, y: 26, label: "FS", colorKey: "safety", size: 2.4 },
          { x: 65, y: 26, label: "SS", colorKey: "safety", size: 2.4 }
        );
      } else {
        // Cover 2 - safeties at deep halves
        positions.push(
          { x: 30, y: 22, label: "FS", colorKey: "safety", size: 2.4 },
          { x: 70, y: 22, label: "SS", colorKey: "safety", size: 2.4 }
        );
      }
      break;
      
    case "split-field":
      // Cover 6 - asymmetric
      positions.push(
        { x: 30, y: 22, label: "FS", colorKey: "safety", size: 2.4 },
        { x: 62, y: 28, label: "SS", colorKey: "safety", size: 2.2 }
      );
      break;
      
    case "zero-high":
      // Cover 0 - safeties walked up to blitz
      positions.push(
        { x: 45, y: 36, label: "FS", colorKey: "safety", size: 2.2 },
        { x: 55, y: 36, label: "SS", colorKey: "safety", size: 2.2 }
      );
      break;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Linebackers - 4-5 yards off LOS
  // ─────────────────────────────────────────────────────────────────────────
  if (shell.safetyAlignment === "zero-high") {
    // Cover 0 - LBs mugged up
    positions.push(
      { x: 46, y: 37, label: "W", colorKey: "linebacker", size: 2 },
      { x: 50, y: 36, label: "M", colorKey: "linebacker", size: 2 },
      { x: 54, y: 37, label: "S", colorKey: "linebacker", size: 2 }
    );
  } else {
    // Standard LB depths
    positions.push(
      { x: 44, y: 35, label: "W", colorKey: "linebacker", size: 2 },
      { x: 50, y: 34, label: "M", colorKey: "linebacker", size: 2 },
      { x: 56, y: 35, label: "S", colorKey: "linebacker", size: 2 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // D-Line - 4-3 front at LOS
  // ─────────────────────────────────────────────────────────────────────────
  positions.push(
    { x: 42, y: 39, label: "DE", colorKey: "dLine", size: 1.8 },
    { x: 47, y: 39, label: "DT", colorKey: "dLine", size: 1.8 },
    { x: 53, y: 39, label: "DT", colorKey: "dLine", size: 1.8 },
    { x: 58, y: 39, label: "DE", colorKey: "dLine", size: 1.8 }
  );

  return positions;
}

/**
 * Get standard 2x2 offensive formation for context
 */
function getOffensivePositions() {
  return [
    // Offensive Line
    { x: 44, y: 40, label: "LT", colorKey: "oLine" as const, isOL: true },
    { x: 47, y: 40, label: "LG", colorKey: "oLine" as const, isOL: true },
    { x: 50, y: 40, label: "C", colorKey: "oLine" as const, isOL: true },
    { x: 53, y: 40, label: "RG", colorKey: "oLine" as const, isOL: true },
    { x: 56, y: 40, label: "RT", colorKey: "oLine" as const, isOL: true },
    // QB
    { x: 50, y: 48, label: "QB", colorKey: "qb" as const, isOL: false },
    // RB
    { x: 54, y: 48, label: "RB", colorKey: "offense" as const, isOL: false },
    // WRs - 2x2 alignment
    { x: 15, y: 40, label: "X", colorKey: "offense" as const, isOL: false },
    { x: 30, y: 40, label: "H", colorKey: "offense" as const, isOL: false },
    { x: 70, y: 40, label: "Y", colorKey: "offense" as const, isOL: false },
    { x: 85, y: 40, label: "Z", colorKey: "offense" as const, isOL: false },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CoverageDiagram({
  shell,
  className = "",
  showLabels = false,
  showZones = false,
  scalable = false,
}: CoverageDiagramProps) {
  const defensivePositions = getDefensivePositions(shell);
  const offensivePositions = getOffensivePositions();

  return (
    <FieldCanvas
      className={scalable ? className : `h-48 sm:h-56 md:h-64 w-full ${className}`}
      showYardLines={true}
      showHashMarks={true}
      scalable={scalable}
    >
      <svg
        viewBox={`0 0 ${FIELD.WIDTH} ${FIELD.HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          {/* Glow filter for players */}
          <filter id="playerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Zone coverage indicator gradient */}
          <radialGradient id="zoneGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0, 246, 229, 0.12)" />
            <stop offset="100%" stopColor="rgba(0, 246, 229, 0)" />
          </radialGradient>
        </defs>

        {/* Zone indicators (optional) */}
        {showZones && defensivePositions.map((pos, idx) => (
          <circle
            key={`zone-${idx}`}
            cx={pos.x}
            cy={pos.y}
            r="6"
            fill="url(#zoneGradient)"
          />
        ))}

        {/* Offensive Line (rectangles) */}
        {offensivePositions
          .filter((p) => p.isOL)
          .map((pos, idx) => {
            const colors = COLORS[pos.colorKey];
            return (
              <g key={`ol-${idx}`}>
                <rect
                  x={pos.x - 1.5}
                  y={pos.y - 1}
                  width="3"
                  height="2"
                  rx="0.3"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.15"
                  opacity="0.6"
                />
              </g>
            );
          })}

        {/* Offensive Skill Players (circles) */}
        {offensivePositions
          .filter((p) => !p.isOL)
          .map((pos, idx) => {
            const colors = COLORS[pos.colorKey];
            const size = pos.label === "QB" ? 1.8 : 1.4;
            return (
              <g key={`off-${idx}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.2"
                  opacity="0.6"
                />
              </g>
            );
          })}

        {/* Defensive Players */}
        {defensivePositions.map((pos, idx) => {
          const colors = COLORS[pos.colorKey];
          const isDLine = pos.colorKey === "dLine";

          return (
            <g key={`def-${idx}`}>
              {/* Glow effect */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={pos.size + 0.5}
                fill={colors.glow}
                filter="url(#playerGlow)"
              />
              
              {/* Player body */}
              {isDLine ? (
                <rect
                  x={pos.x - pos.size * 0.8}
                  y={pos.y - pos.size * 0.6}
                  width={pos.size * 1.6}
                  height={pos.size * 1.2}
                  rx="0.3"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.25"
                />
              ) : (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={pos.size}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.25"
                />
              )}

              {/* Optional label */}
              {showLabels && (
                <text
                  x={pos.x}
                  y={pos.y + 0.4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#0A0A0A"
                  fontSize="1.4"
                  fontWeight="bold"
                  fontFamily="system-ui"
                >
                  {pos.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </FieldCanvas>
  );
}

export default CoverageDiagram;
