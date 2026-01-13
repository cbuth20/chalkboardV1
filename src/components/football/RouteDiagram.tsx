// ═══════════════════════════════════════════════════════════════════════════
// ROUTE DIAGRAM — Renders routes and play concepts with realistic positions
// Uses NFL-style coordinate system for authentic playbook appearance
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { FieldCanvas } from "./FieldCanvas";
import { FIELD, OFFENSE } from "./fieldCoordinates";
import type { Route, RouteConcept, Formation, PlayerPosition } from "@/domain/football";

interface RouteDiagramProps {
  route?: Route;
  concept?: RouteConcept;
  formation?: Formation;
  className?: string;
  showLabels?: boolean;
  scalable?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════

const ROUTE_COLORS = {
  short: { stroke: "#00F6E5", glow: "rgba(0, 246, 229, 0.6)" },
  intermediate: { stroke: "#F5C253", glow: "rgba(245, 194, 83, 0.6)" },
  deep: { stroke: "#FF6A3D", glow: "rgba(255, 106, 61, 0.6)" },
  primary: { stroke: "#3DF3FF", glow: "rgba(61, 243, 255, 0.8)" },
};

const PLAYER_COLORS = {
  QB: { fill: "#F5C253", stroke: "#ffd97a", glow: "rgba(245, 194, 83, 0.5)" },
  RB: { fill: "#00F6E5", stroke: "#3DF3FF", glow: "rgba(0, 246, 229, 0.5)" },
  WR: { fill: "#3DF3FF", stroke: "#67f7ff", glow: "rgba(61, 243, 255, 0.5)" },
  TE: { fill: "#FF6A3D", stroke: "#ff8a5c", glow: "rgba(255, 106, 61, 0.5)" },
  OL: { fill: "#4a5568", stroke: "#718096", glow: "rgba(113, 128, 150, 0.4)" },
  default: { fill: "#4a5568", stroke: "#718096", glow: "rgba(113, 128, 150, 0.4)" },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getPlayerColor(label: string | undefined) {
  if (!label) return PLAYER_COLORS.default;
  const upper = label.toUpperCase();
  if (upper === "QB") return PLAYER_COLORS.QB;
  if (upper === "RB" || upper === "FB") return PLAYER_COLORS.RB;
  if (["X", "Z", "Y", "H", "WR"].includes(upper)) return PLAYER_COLORS.WR;
  if (upper === "TE") return PLAYER_COLORS.TE;
  return PLAYER_COLORS.default;
}

function toFieldCoords(pos: PlayerPosition): { x: number; y: number } {
  const x = pos.x + 50;
  const y = 40 + pos.y * 0.3;
  return { x, y: Math.min(55, y) };
}

/**
 * Generate SVG path for a route
 */
function generateRoutePath(
  startX: number,
  startY: number,
  route: Route,
  scale: number = 1
): string {
  const stemLength = route.path.stemYards * 1.5 * scale;
  const breakAngle = route.path.breakAngle;
  
  let path = `M ${startX} ${startY}`;
  
  // Vertical stem (going UP toward defense, decreasing Y)
  const stemEndY = startY - stemLength;
  path += ` L ${startX} ${stemEndY}`;
  
  // Break direction
  if (breakAngle !== 0) {
    const breakLength = 8 * scale;
    const angleRad = ((breakAngle - 90) * Math.PI) / 180;
    
    if (breakAngle === 180) {
      // Curl/comeback
      path += ` Q ${startX} ${stemEndY - 2}, ${startX + 3} ${stemEndY + 3}`;
    } else {
      const endX = startX + Math.cos(angleRad) * breakLength;
      const endY = stemEndY + Math.sin(angleRad) * breakLength;
      const controlX = startX;
      const controlY = stemEndY - 2;
      path += ` Q ${controlX} ${controlY}, ${endX} ${endY}`;
    }
  } else {
    // Go route - continue straight
    path += ` L ${startX} ${stemEndY - 10}`;
  }
  
  return path;
}

function getRouteColor(route: Route, isPrimary: boolean = false) {
  if (isPrimary) return ROUTE_COLORS.primary;
  return ROUTE_COLORS[route.depth] || ROUTE_COLORS.intermediate;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT FORMATION POSITIONS (2x2 Shotgun)
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_POSITIONS = {
  qb: { x: OFFENSE.QB.SHOTGUN.x, y: OFFENSE.QB.SHOTGUN.y, label: "QB" },
  rb: { x: OFFENSE.RB.OFFSET_RIGHT.x, y: OFFENSE.RB.OFFSET_RIGHT.y, label: "RB" },
  x: { x: OFFENSE.WR.X_WIDE.x, y: OFFENSE.WR.X_WIDE.y, label: "X" },
  z: { x: OFFENSE.WR.Z_WIDE.x, y: OFFENSE.WR.Z_WIDE.y, label: "Z" },
  slot: { x: OFFENSE.WR.SLOT_LEFT.x, y: OFFENSE.WR.SLOT_LEFT.y, label: "H" },
  te: { x: OFFENSE.TE.INLINE_RIGHT.x, y: OFFENSE.TE.INLINE_RIGHT.y, label: "TE" },
};

const RECEIVER_MAP: Record<string, keyof typeof DEFAULT_POSITIONS> = {
  x: "x",
  z: "z",
  slot: "slot",
  te: "te",
  rb: "rb",
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function RouteDiagram({
  route,
  concept,
  formation,
  className = "",
  showLabels = false,
  scalable = false,
}: RouteDiagramProps) {
  // Use default positions or formation positions
  const useFormation = formation?.positions || null;

  // O-Line positions
  const oLine = [
    { x: OFFENSE.LINE.LT.x, y: FIELD.LOS_Y, label: "LT" },
    { x: OFFENSE.LINE.LG.x, y: FIELD.LOS_Y, label: "LG" },
    { x: OFFENSE.LINE.C.x, y: FIELD.LOS_Y, label: "C" },
    { x: OFFENSE.LINE.RG.x, y: FIELD.LOS_Y, label: "RG" },
    { x: OFFENSE.LINE.RT.x, y: FIELD.LOS_Y, label: "RT" },
  ];

  // Build players array using field coordinates
  const players: { x: number; y: number; label: string; key: string }[] = [];
  
  // QB
  players.push({ ...DEFAULT_POSITIONS.qb, key: "qb" });
  // RB
  players.push({ ...DEFAULT_POSITIONS.rb, key: "rb" });
  // X
  players.push({ ...DEFAULT_POSITIONS.x, key: "x" });
  // Z
  players.push({ ...DEFAULT_POSITIONS.z, key: "z" });
  // Slot
  players.push({ ...DEFAULT_POSITIONS.slot, key: "slot" });
  // TE
  players.push({ ...DEFAULT_POSITIONS.te, key: "te" });

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
          <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <marker
            id="routeArrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="2.5"
            markerHeight="2.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3DF3FF" />
          </marker>
          
          <marker
            id="routeArrowGold"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="2.5"
            markerHeight="2.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#F5C253" />
          </marker>
          
          <marker
            id="routeArrowOrange"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="2.5"
            markerHeight="2.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF6A3D" />
          </marker>
        </defs>

        {/* Offensive Line */}
        {oLine.map((pos) => (
          <rect
            key={pos.label}
            x={pos.x - 1.5}
            y={pos.y - 1}
            width="3"
            height="2"
            rx="0.3"
            fill={PLAYER_COLORS.OL.fill}
            stroke={PLAYER_COLORS.OL.stroke}
            strokeWidth="0.2"
          />
        ))}

        {/* Routes from concept */}
        {concept &&
          concept.routes.map((routeAssign, idx) => {
            const posKey = RECEIVER_MAP[routeAssign.receiver];
            const pos = posKey ? DEFAULT_POSITIONS[posKey] : undefined;
            if (!pos) return null;

            const mockRoute: Route = {
              id: routeAssign.routeId,
              name: routeAssign.routeId,
              shortName: routeAssign.routeId,
              description: "",
              depth: ["flat", "drag", "hitch", "slant"].includes(routeAssign.routeId) 
                ? "short" 
                : ["go", "post", "corner", "seam", "wheel"].includes(routeAssign.routeId)
                ? "deep"
                : "intermediate",
              breakDirection: "inside",
              path: { 
                stemYards: routeAssign.routeId === "flat" ? 1 : routeAssign.routeId === "drag" ? 2 : 8, 
                breakAngle: routeAssign.routeId === "go" || routeAssign.routeId === "seam" ? 0 : 45 
              },
              bestAgainst: [],
              keyReads: [],
            };

            const colors = getRouteColor(mockRoute, routeAssign.isPrimary);
            const path = generateRoutePath(pos.x, pos.y, mockRoute, routeAssign.isPrimary ? 1.2 : 0.9);
            const arrowId = mockRoute.depth === "short" ? "routeArrow" : 
                           mockRoute.depth === "deep" ? "routeArrowOrange" : "routeArrowGold";

            return (
              <path
                key={`route-${idx}`}
                d={path}
                fill="none"
                stroke={colors.stroke}
                strokeWidth={routeAssign.isPrimary ? 0.8 : 0.5}
                strokeLinecap="round"
                strokeDasharray={routeAssign.isPrimary ? "none" : "1.5 0.8"}
                markerEnd={`url(#${arrowId})`}
                filter="url(#routeGlow)"
                opacity={routeAssign.isPrimary ? 1 : 0.7}
              />
            );
          })}

        {/* Single route display */}
        {route && !concept && (
          <path
            d={generateRoutePath(DEFAULT_POSITIONS.x.x, DEFAULT_POSITIONS.x.y, route, 1)}
            fill="none"
            stroke={ROUTE_COLORS[route.depth].stroke}
            strokeWidth="1"
            strokeLinecap="round"
            markerEnd="url(#routeArrow)"
            filter="url(#routeGlow)"
          />
        )}

        {/* Players */}
        {players.map((player) => {
          const colors = getPlayerColor(player.label);
          const isQB = player.label === "QB";
          const radius = isQB ? 2.2 : 1.6;

          return (
            <g key={player.key}>
              <circle
                cx={player.x}
                cy={player.y}
                r={radius + 0.4}
                fill={colors.glow}
                filter="url(#routeGlow)"
              />
              <circle
                cx={player.x}
                cy={player.y}
                r={radius}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth="0.25"
              />
              {showLabels && (
                <text
                  x={player.x}
                  y={player.y + 0.4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#0A0A0A"
                  fontSize="1.2"
                  fontWeight="bold"
                >
                  {player.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </FieldCanvas>
  );
}

export default RouteDiagram;
