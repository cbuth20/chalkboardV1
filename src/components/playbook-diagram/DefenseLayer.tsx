// ═══════════════════════════════════════════════════════════════════════════
// DEFENSE LAYER — Renders defensive players on the diagram
// 
// Defense players use different shapes/colors from offense
// Typically red/orange colored with X or triangle markers
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { DefenseLayerProps, DiagramPlayer } from './types';

/**
 * DefenseLayer renders all defensive players
 */
export const DefenseLayer = memo(function DefenseLayer({
  players,
  theme,
}: DefenseLayerProps) {
  return (
    <g className="defense-layer">
      {players.map((player) => (
        <DefensePlayerMarker
          key={player.id}
          player={player}
          color={player.color || theme.defenseColor}
        />
      ))}
    </g>
  );
});

/**
 * Individual defensive player marker
 */
const DefensePlayerMarker = memo(function DefensePlayerMarker({
  player,
  color,
}: {
  player: DiagramPlayer;
  color: string;
}) {
  const { x, y, label } = player;
  const radius = 1.1;
  const fillColor = `${color}12`; // ~7% opacity

  // Determine player type for marker style
  const isDLineman = ['DE', 'DT', 'NT', 'DL'].includes(label);
  const isLinebacker = ['MLB', 'ILB', 'OLB', 'WLB', 'SLB', 'M', 'W', 'S', 'LB'].includes(label);
  const isSecondary = ['CB', 'FS', 'SS', 'S', 'DB', 'NB'].includes(label);

  // D-Line: Square/box marker
  if (isDLineman) {
    const size = radius * 2;
    return (
      <g className="defense-player dlineman">
        {/* Glow */}
        <rect
          x={x - size / 2}
          y={y - size / 2}
          width={size}
          height={size}
          rx={0.2}
          fill="none"
          stroke={color}
          strokeWidth="0.08"
          opacity="0.25"
          filter="url(#diagramGlow)"
        />

        {/* Marker */}
        <rect
          x={x - size / 2}
          y={y - size / 2}
          width={size}
          height={size}
          rx={0.2}
          fill={fillColor}
          stroke={color}
          strokeWidth="0.1"
        />

        {/* Label */}
        <text
          x={x}
          y={y}
          dy="0.35em"
          textAnchor="middle"
          fontSize={0.85}
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

  // Linebackers: Diamond/rotated square
  if (isLinebacker) {
    const size = radius * 1.5;
    return (
      <g className="defense-player linebacker">
        {/* Glow */}
        <polygon
          points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`}
          fill="none"
          stroke={color}
          strokeWidth="0.08"
          opacity="0.25"
          filter="url(#diagramGlow)"
        />

        {/* Marker */}
        <polygon
          points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`}
          fill={fillColor}
          stroke={color}
          strokeWidth="0.1"
        />

        {/* Label */}
        <text
          x={x}
          y={y}
          dy="0.35em"
          textAnchor="middle"
          fontSize={0.8}
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

  // Secondary: Triangle marker (pointing up = toward LOS)
  if (isSecondary) {
    const size = radius * 1.4;
    return (
      <g className="defense-player secondary">
        {/* Glow */}
        <polygon
          points={`${x},${y + size} ${x - size},${y - size * 0.6} ${x + size},${y - size * 0.6}`}
          fill="none"
          stroke={color}
          strokeWidth="0.08"
          opacity="0.25"
          filter="url(#diagramGlow)"
        />

        {/* Marker */}
        <polygon
          points={`${x},${y + size} ${x - size},${y - size * 0.6} ${x + size},${y - size * 0.6}`}
          fill={fillColor}
          stroke={color}
          strokeWidth="0.1"
        />

        {/* Label */}
        <text
          x={x}
          y={y}
          dy="0.1em"
          textAnchor="middle"
          fontSize={0.75}
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

  // Default: Circle with X
  return (
    <g className="defense-player">
      {/* Glow */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="0.08"
        opacity="0.25"
        filter="url(#diagramGlow)"
      />

      {/* Marker */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fillColor}
        stroke={color}
        strokeWidth="0.1"
      />

      {/* X mark inside */}
      <line
        x1={x - radius * 0.5}
        y1={y - radius * 0.5}
        x2={x + radius * 0.5}
        y2={y + radius * 0.5}
        stroke={color}
        strokeWidth="0.1"
        opacity="0.6"
      />
      <line
        x1={x + radius * 0.5}
        y1={y - radius * 0.5}
        x2={x - radius * 0.5}
        y2={y + radius * 0.5}
        stroke={color}
        strokeWidth="0.1"
        opacity="0.6"
      />

      {/* Label */}
      <text
        x={x}
        y={y + radius + 0.8}
        textAnchor="middle"
        fontSize={0.7}
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={color}
        opacity="0.8"
        className="select-none"
      >
        {label}
      </text>
    </g>
  );
});

export default DefenseLayer;







