// ═══════════════════════════════════════════════════════════════════════════
// BLITZ DIAGRAM — Renders defensive fronts and pressure scenarios
// Uses NFL-style coordinate system for realistic playbook appearance
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { FieldCanvas } from "./FieldCanvas";
import { FIELD } from "./fieldCoordinates";
import type { Protection } from "@/types/football";

interface BlitzDiagramProps {
  blitzType: BlitzScenario;
  protection?: Protection;
  className?: string;
  showLabels?: boolean;
  scalable?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// BLITZ SCENARIO TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BlitzScenario {
  id: string;
  name: string;
  description: string;
  defenders: DefenderPosition[];
  blitzers: string[];
  coverageType: "man" | "zone";
}

interface DefenderPosition {
  id: string;
  label: string;
  x: number;
  y: number;
  isBlitzing?: boolean;
  blitzTarget?: { x: number; y: number };
}

// ═══════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  blitzing: { fill: "#FF6A3D", stroke: "#ff8a5c", glow: "rgba(255, 106, 61, 0.6)" },
  coverage: { fill: "#00F6E5", stroke: "#3DF3FF", glow: "rgba(0, 246, 229, 0.4)" },
  dLine: { fill: "#F5C253", stroke: "#ffd97a", glow: "rgba(245, 194, 83, 0.5)" },
  qb: { fill: "#3DF3FF", stroke: "#67f7ff", glow: "rgba(61, 243, 255, 0.4)" },
  player: { fill: "#4a5568", stroke: "#718096", glow: "rgba(113, 128, 150, 0.3)" },
  oLine: { fill: "#2d3748", stroke: "#4a5568", glow: "rgba(45, 55, 72, 0.3)" },
};

// ═══════════════════════════════════════════════════════════════════════════
// BLITZ SCENARIOS — Using realistic NFL coordinates
// ═══════════════════════════════════════════════════════════════════════════

export const BLITZ_SCENARIOS: Record<string, BlitzScenario> = {
  "overload-left": {
    id: "overload-left",
    name: "Overload Left",
    description: "Multiple defenders stacked on left side with A-gap threat",
    defenders: [
      // D-Line
      { id: "de1", label: "DE", x: 38, y: 39, isBlitzing: true, blitzTarget: { x: 44, y: 48 } },
      { id: "dt1", label: "DT", x: 47, y: 39 },
      { id: "dt2", label: "DT", x: 53, y: 39 },
      { id: "de2", label: "DE", x: 58, y: 39 },
      // Blitzing OLB/SS from left
      { id: "olb1", label: "OLB", x: 35, y: 36, isBlitzing: true, blitzTarget: { x: 42, y: 48 } },
      { id: "ss", label: "SS", x: 48, y: 35, isBlitzing: true, blitzTarget: { x: 50, y: 48 } },
      // Coverage
      { id: "mike", label: "M", x: 54, y: 35 },
      { id: "fs", label: "FS", x: 50, y: 22 },
      { id: "cb1", label: "CB", x: 12, y: 32 },
      { id: "cb2", label: "CB", x: 88, y: 32 },
    ],
    blitzers: ["de1", "olb1", "ss"],
    coverageType: "man",
  },
  "a-gap-mugged": {
    id: "a-gap-mugged",
    name: "A-Gap Mugged",
    description: "Both A-gaps threatened with double LB blitz",
    defenders: [
      // D-Line
      { id: "de1", label: "DE", x: 42, y: 39 },
      { id: "dt1", label: "DT", x: 47, y: 39 },
      { id: "dt2", label: "DT", x: 53, y: 39 },
      { id: "de2", label: "DE", x: 58, y: 39 },
      // LBs mugged in A-gaps
      { id: "mike", label: "M", x: 48, y: 37, isBlitzing: true, blitzTarget: { x: 48, y: 48 } },
      { id: "will", label: "W", x: 52, y: 37, isBlitzing: true, blitzTarget: { x: 52, y: 48 } },
      { id: "sam", label: "S", x: 62, y: 35 },
      // Coverage
      { id: "fs", label: "FS", x: 50, y: 22 },
      { id: "ss", label: "SS", x: 65, y: 28 },
      { id: "cb1", label: "CB", x: 12, y: 32 },
      { id: "cb2", label: "CB", x: 88, y: 32 },
    ],
    blitzers: ["mike", "will"],
    coverageType: "man",
  },
  "zero-blitz": {
    id: "zero-blitz",
    name: "Zero Blitz",
    description: "All-out pressure with no deep safety help",
    defenders: [
      // D-Line - all blitzing
      { id: "de1", label: "DE", x: 42, y: 39, isBlitzing: true, blitzTarget: { x: 44, y: 48 } },
      { id: "dt1", label: "DT", x: 47, y: 39, isBlitzing: true, blitzTarget: { x: 48, y: 48 } },
      { id: "dt2", label: "DT", x: 53, y: 39, isBlitzing: true, blitzTarget: { x: 52, y: 48 } },
      { id: "de2", label: "DE", x: 58, y: 39, isBlitzing: true, blitzTarget: { x: 56, y: 48 } },
      // LB blitzing
      { id: "mike", label: "M", x: 50, y: 36, isBlitzing: true, blitzTarget: { x: 50, y: 48 } },
      // Safeties blitzing
      { id: "ss", label: "SS", x: 45, y: 35, isBlitzing: true, blitzTarget: { x: 46, y: 48 } },
      { id: "fs", label: "FS", x: 55, y: 35, isBlitzing: true, blitzTarget: { x: 54, y: 48 } },
      // Corners in press man
      { id: "cb1", label: "CB", x: 12, y: 38 },
      { id: "cb2", label: "CB", x: 88, y: 38 },
    ],
    blitzers: ["de1", "dt1", "dt2", "de2", "mike", "ss", "fs"],
    coverageType: "man",
  },
  "edge-pressure": {
    id: "edge-pressure",
    name: "Edge Pressure",
    description: "Speed rush from both edges with OLBs",
    defenders: [
      // D-Line
      { id: "olb1", label: "OLB", x: 36, y: 37, isBlitzing: true, blitzTarget: { x: 42, y: 48 } },
      { id: "de1", label: "DE", x: 44, y: 39 },
      { id: "nt", label: "NT", x: 50, y: 39 },
      { id: "de2", label: "DE", x: 56, y: 39 },
      { id: "olb2", label: "OLB", x: 64, y: 37, isBlitzing: true, blitzTarget: { x: 58, y: 48 } },
      // Coverage LBs
      { id: "mike", label: "M", x: 47, y: 35 },
      { id: "will", label: "W", x: 53, y: 35 },
      // Safeties
      { id: "fs", label: "FS", x: 35, y: 24 },
      { id: "ss", label: "SS", x: 65, y: 24 },
      // Corners
      { id: "cb1", label: "CB", x: 12, y: 32 },
      { id: "cb2", label: "CB", x: 88, y: 32 },
    ],
    blitzers: ["olb1", "olb2"],
    coverageType: "zone",
  },
  "cross-dog": {
    id: "cross-dog",
    name: "Cross Dog",
    description: "Linebackers crossing with twist action",
    defenders: [
      // D-Line
      { id: "de1", label: "DE", x: 42, y: 39 },
      { id: "dt1", label: "DT", x: 47, y: 39 },
      { id: "dt2", label: "DT", x: 53, y: 39 },
      { id: "de2", label: "DE", x: 58, y: 39 },
      // LBs crossing
      { id: "mike", label: "M", x: 48, y: 36, isBlitzing: true, blitzTarget: { x: 54, y: 48 } },
      { id: "will", label: "W", x: 52, y: 36, isBlitzing: true, blitzTarget: { x: 46, y: 48 } },
      { id: "sam", label: "S", x: 62, y: 35 },
      // Coverage
      { id: "fs", label: "FS", x: 50, y: 22 },
      { id: "ss", label: "SS", x: 65, y: 28 },
      { id: "cb1", label: "CB", x: 12, y: 32 },
      { id: "cb2", label: "CB", x: 88, y: 32 },
    ],
    blitzers: ["mike", "will"],
    coverageType: "man",
  },
  "corner-blitz": {
    id: "corner-blitz",
    name: "Corner Blitz",
    description: "Corner coming off the edge with safety rolling over",
    defenders: [
      // D-Line
      { id: "de1", label: "DE", x: 42, y: 39 },
      { id: "dt1", label: "DT", x: 47, y: 39 },
      { id: "dt2", label: "DT", x: 53, y: 39 },
      { id: "de2", label: "DE", x: 58, y: 39 },
      // LBs
      { id: "mike", label: "M", x: 50, y: 35 },
      { id: "will", label: "W", x: 44, y: 35 },
      // Blitzing corner
      { id: "cb1", label: "CB", x: 10, y: 36, isBlitzing: true, blitzTarget: { x: 38, y: 48 } },
      { id: "cb2", label: "CB", x: 88, y: 32 },
      // Safety rotating
      { id: "fs", label: "FS", x: 55, y: 22 },
      { id: "ss", label: "SS", x: 30, y: 26 },
      // Nickel covering vacated zone
      { id: "n", label: "N", x: 68, y: 34 },
    ],
    blitzers: ["cb1"],
    coverageType: "zone",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getBlitzScenarioForPrompt(promptLabel: string): BlitzScenario {
  const label = promptLabel.toLowerCase();
  
  if (label.includes("overload") && label.includes("left")) {
    return BLITZ_SCENARIOS["overload-left"];
  }
  if (label.includes("a-gap") || label.includes("mugged")) {
    return BLITZ_SCENARIOS["a-gap-mugged"];
  }
  if (label.includes("zero") || label.includes("no deep")) {
    return BLITZ_SCENARIOS["zero-blitz"];
  }
  if (label.includes("edge") || label.includes("speed rush")) {
    return BLITZ_SCENARIOS["edge-pressure"];
  }
  if (label.includes("cross") || label.includes("dog") || label.includes("twist")) {
    return BLITZ_SCENARIOS["cross-dog"];
  }
  if (label.includes("corner")) {
    return BLITZ_SCENARIOS["corner-blitz"];
  }
  
  return BLITZ_SCENARIOS["edge-pressure"];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function BlitzDiagram({
  blitzType,
  className = "",
  showLabels = false,
  scalable = false,
}: BlitzDiagramProps) {
  // Offensive positions - shotgun 2x2
  const offense = {
    line: [
      { x: 44, y: 40, label: "LT" },
      { x: 47, y: 40, label: "LG" },
      { x: 50, y: 40, label: "C" },
      { x: 53, y: 40, label: "RG" },
      { x: 56, y: 40, label: "RT" },
    ],
    qb: { x: 50, y: 48, label: "QB" },
    rb: { x: 54, y: 48, label: "RB" },
  };

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
          {/* Glow filter */}
          <filter id="blitzGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Blitz arrow marker */}
          <marker
            id="blitzArrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="2"
            markerHeight="2"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF6A3D" />
          </marker>
        </defs>

        {/* Offensive Line */}
        {offense.line.map((pos) => (
          <rect
            key={pos.label}
            x={pos.x - 1.5}
            y={pos.y - 1}
            width="3"
            height="2"
            rx="0.3"
            fill={COLORS.oLine.fill}
            stroke={COLORS.oLine.stroke}
            strokeWidth="0.2"
          />
        ))}

        {/* QB */}
        <g>
          <circle
            cx={offense.qb.x}
            cy={offense.qb.y}
            r="2.5"
            fill={COLORS.qb.glow}
            filter="url(#blitzGlow)"
          />
          <circle
            cx={offense.qb.x}
            cy={offense.qb.y}
            r="2"
            fill={COLORS.qb.fill}
            stroke={COLORS.qb.stroke}
            strokeWidth="0.25"
          />
        </g>

        {/* RB */}
        <circle
          cx={offense.rb.x}
          cy={offense.rb.y}
          r="1.5"
          fill={COLORS.player.fill}
          stroke={COLORS.player.stroke}
          strokeWidth="0.2"
        />

        {/* Blitz paths (arrows showing rush direction) */}
        {blitzType.defenders
          .filter((d) => d.isBlitzing && d.blitzTarget)
          .map((defender) => {
            // Create curved path toward target
            const midY = (defender.y + defender.blitzTarget!.y) / 2;
            const path = `M ${defender.x} ${defender.y} Q ${defender.x} ${midY + 2}, ${defender.blitzTarget!.x} ${defender.blitzTarget!.y}`;

            return (
              <path
                key={`blitz-${defender.id}`}
                d={path}
                fill="none"
                stroke="#FF6A3D"
                strokeWidth="0.8"
                strokeDasharray="1.5 1"
                markerEnd="url(#blitzArrow)"
                opacity="0.8"
                filter="url(#blitzGlow)"
              />
            );
          })}

        {/* Defensive Players */}
        {blitzType.defenders.map((defender) => {
          const isDLine = ["DE", "DT", "NT"].includes(defender.label);
          const colors = defender.isBlitzing
            ? COLORS.blitzing
            : isDLine
            ? COLORS.dLine
            : COLORS.coverage;

          const size = isDLine ? 1.6 : 2;

          return (
            <g key={defender.id}>
              {/* Glow */}
              {isDLine ? (
                <rect
                  x={defender.x - size * 0.8}
                  y={defender.y - size * 0.6}
                  width={size * 1.6}
                  height={size * 1.2}
                  rx="0.3"
                  fill={colors.glow}
                  filter="url(#blitzGlow)"
                />
              ) : (
                <circle
                  cx={defender.x}
                  cy={defender.y}
                  r={size + 0.4}
                  fill={colors.glow}
                  filter="url(#blitzGlow)"
                />
              )}

              {/* Player body */}
              {isDLine ? (
                <rect
                  x={defender.x - size * 0.8}
                  y={defender.y - size * 0.6}
                  width={size * 1.6}
                  height={size * 1.2}
                  rx="0.3"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.25"
                />
              ) : (
                <circle
                  cx={defender.x}
                  cy={defender.y}
                  r={size}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.25"
                />
              )}

              {/* Label */}
              {showLabels && (
                <text
                  x={defender.x}
                  y={defender.y + 0.3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#0A0A0A"
                  fontSize="1.2"
                  fontWeight="bold"
                >
                  {defender.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </FieldCanvas>
  );
}

export default BlitzDiagram;
