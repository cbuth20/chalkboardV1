// ═══════════════════════════════════════════════════════════════════════════
// FORMATION DIAGRAM — Renders offensive formations with realistic positions
// Uses NFL-style coordinate system for authentic playbook appearance
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { FieldCanvas } from "./FieldCanvas";
import { FIELD, OFFENSE } from "./fieldCoordinates";
import type { Formation, PlayerPosition } from "@/domain/football";

interface FormationDiagramProps {
  formation: Formation;
  className?: string;
  showLabels?: boolean;
  highlightPosition?: string;
  scalable?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  // Offensive Line - Silver/Gray
  OL: { fill: "#4a5568", stroke: "#718096", glow: "rgba(113, 128, 150, 0.4)" },
  // QB - Gold
  QB: { fill: "#F5C253", stroke: "#ffd97a", glow: "rgba(245, 194, 83, 0.5)" },
  // RB/FB - Teal
  RB: { fill: "#00F6E5", stroke: "#3DF3FF", glow: "rgba(0, 246, 229, 0.5)" },
  FB: { fill: "#00d4c5", stroke: "#00F6E5", glow: "rgba(0, 246, 229, 0.4)" },
  // WR/Slot - Cyan
  WR: { fill: "#3DF3FF", stroke: "#67f7ff", glow: "rgba(61, 243, 255, 0.5)" },
  // TE - Orange
  TE: { fill: "#FF6A3D", stroke: "#ff8a5c", glow: "rgba(255, 106, 61, 0.5)" },
  // Default
  default: { fill: "#4a5568", stroke: "#718096", glow: "rgba(113, 128, 150, 0.4)" },
};

// ═══════════════════════════════════════════════════════════════════════════
// POSITION MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert formation domain coordinates to field coordinates
 * Domain: x = -50 to 50, y = 0 to 50 (LOS = 0)
 * Field: x = 0 to 100, y = 40 to 60 (LOS = 40)
 */
function toFieldCoords(pos: PlayerPosition): { x: number; y: number } {
  // X: -50..50 → 0..100
  const x = pos.x + 50;
  // Y: 0..50 → 40..55 (scale down to fit frame)
  const y = 40 + pos.y * 0.3;
  return { x, y: Math.min(55, y) };
}

/**
 * Get position color based on label
 */
function getPositionColor(label: string | undefined) {
  if (!label) return COLORS.default;
  const key = label.toUpperCase();
  
  if (key === "QB") return COLORS.QB;
  if (key === "RB" || key === "TB") return COLORS.RB;
  if (key === "FB" || key === "WB") return COLORS.FB;
  if (key === "TE") return COLORS.TE;
  if (["X", "Z", "Y", "H", "WR"].includes(key)) return COLORS.WR;
  if (["C", "LG", "RG", "LT", "RT"].includes(key)) return COLORS.OL;
  
  return COLORS.default;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FormationDiagram({
  formation,
  className = "",
  showLabels = false,
  highlightPosition,
  scalable = false,
}: FormationDiagramProps) {
  const positions = formation.positions;

  // Build array of all player positions
  const players: { pos: PlayerPosition; key: string; isHighlighted: boolean }[] = [];

  if (positions.qb) players.push({ pos: positions.qb, key: "qb", isHighlighted: highlightPosition === "qb" });
  if (positions.rb) players.push({ pos: positions.rb, key: "rb", isHighlighted: highlightPosition === "rb" });
  if (positions.fb) players.push({ pos: positions.fb, key: "fb", isHighlighted: highlightPosition === "fb" });
  if (positions.te) players.push({ pos: positions.te, key: "te", isHighlighted: highlightPosition === "te" });
  if (positions.te2) players.push({ pos: positions.te2, key: "te2", isHighlighted: highlightPosition === "te2" });
  if (positions.x) players.push({ pos: positions.x, key: "x", isHighlighted: highlightPosition === "x" });
  if (positions.z) players.push({ pos: positions.z, key: "z", isHighlighted: highlightPosition === "z" });
  if (positions.slot) players.push({ pos: positions.slot, key: "slot", isHighlighted: highlightPosition === "slot" });
  if (positions.slot2) players.push({ pos: positions.slot2, key: "slot2", isHighlighted: highlightPosition === "slot2" });

  // Offensive line - standard positions
  const oLine = [
    { x: OFFENSE.LINE.LT.x, y: FIELD.LOS_Y, label: "LT" },
    { x: OFFENSE.LINE.LG.x, y: FIELD.LOS_Y, label: "LG" },
    { x: OFFENSE.LINE.C.x, y: FIELD.LOS_Y, label: "C" },
    { x: OFFENSE.LINE.RG.x, y: FIELD.LOS_Y, label: "RG" },
    { x: OFFENSE.LINE.RT.x, y: FIELD.LOS_Y, label: "RT" },
  ];

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
          
          {/* Highlight pulse filter */}
          <filter id="highlightPulse" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Offensive Line (rectangles) */}
        {oLine.map((pos) => {
          const colors = COLORS.OL;
          return (
            <g key={pos.label}>
              {/* Glow effect */}
              <rect
                x={pos.x - 1.5}
                y={pos.y - 1}
                width="3"
                height="2"
                rx="0.3"
                fill={colors.glow}
                filter="url(#playerGlow)"
              />
              {/* Player body */}
              <rect
                x={pos.x - 1.5}
                y={pos.y - 1}
                width="3"
                height="2"
                rx="0.3"
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth="0.2"
              />
            </g>
          );
        })}

        {/* Skill Players (circles) */}
        {players.map(({ pos, key, isHighlighted }) => {
          const coords = toFieldCoords(pos);
          const colors = getPositionColor(pos.label);
          const isQB = pos.label === "QB";
          const radius = isQB ? 2.2 : 1.8;

          return (
            <g key={key}>
              {/* Glow effect */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={radius + 0.6}
                fill={colors.glow}
                filter={isHighlighted ? "url(#highlightPulse)" : "url(#playerGlow)"}
                className={isHighlighted ? "animate-pulse" : ""}
              />
              {/* Player body */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={radius}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth="0.25"
              />
              {/* Optional label */}
              {showLabels && pos.label && (
                <text
                  x={coords.x}
                  y={coords.y + 0.4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#0A0A0A"
                  fontSize="1.3"
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

export default FormationDiagram;
