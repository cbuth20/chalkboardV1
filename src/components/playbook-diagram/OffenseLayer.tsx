// ═══════════════════════════════════════════════════════════════════════════
// OFFENSE LAYER — Renders offensive players on the diagram
// 
// Players are glowing circles with position labels inside
// Offense typically in cyan/teal color
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { OffenseLayerProps, DiagramPlayer } from './types';

/**
 * OffenseLayer renders all offensive players
 */
export const OffenseLayer = memo(function OffenseLayer({
  players,
  theme,
}: OffenseLayerProps) {
  return (
    <g className="offense-layer">
      {players.map((player) => (
        <OffensePlayerMarker
          key={player.id}
          player={player}
          color={player.color || theme.offenseColor}
        />
      ))}
    </g>
  );
});

/**
 * Individual offensive player marker
 */
const OffensePlayerMarker = memo(function OffensePlayerMarker({
  player,
  color,
}: {
  player: DiagramPlayer;
  color: string;
}) {
  const { x, y, label } = player;
  const radius = 1.2;
  const fillColor = `${color}15`; // 15 = ~8% opacity in hex
  const isLineman = ['LT', 'LG', 'C', 'RG', 'RT', 'TE'].includes(label);
  
  // Linemen get square-ish markers, skill players get circles
  if (isLineman) {
    const size = radius * 1.8;
    return (
      <g className="offense-player">
        {/* Glow effect */}
        <rect
          x={x - size / 2}
          y={y - size / 2}
          width={size}
          height={size}
          rx={0.3}
          fill="none"
          stroke={color}
          strokeWidth="0.08"
          opacity="0.3"
          filter="url(#diagramGlow)"
        />
        
        {/* Player marker (rounded rectangle for linemen) */}
        <rect
          x={x - size / 2}
          y={y - size / 2}
          width={size}
          height={size}
          rx={0.3}
          fill={fillColor}
          stroke={color}
          strokeWidth="0.1"
        />

        {/* Position label */}
        <text
          x={x}
          y={y}
          dy="0.35em"
          textAnchor="middle"
          fontSize={0.9}
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={color}
          className="select-none"
        >
          {label}
        </text>
      </g>
    );
  }

  // Skill players get circles
  return (
    <g className="offense-player">
      {/* Glow effect */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="0.08"
        opacity="0.3"
        filter="url(#diagramGlow)"
      />

      {/* Player marker (circle) */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fillColor}
        stroke={color}
        strokeWidth="0.1"
      />

      {/* Position label */}
      <text
        x={x}
        y={y}
        dy="0.35em"
        textAnchor="middle"
        fontSize={0.9}
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={color}
        className="select-none"
      >
        {label}
      </text>
    </g>
  );
});

export default OffenseLayer;







