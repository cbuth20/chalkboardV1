// ═══════════════════════════════════════════════════════════════════════════
// BLOCKING LAYER — Blocking arrows for run plays
// 
// Shows blocking assignments from OL/TE/FB to DL/LB/DB
// Different arrow styles for different block types:
// - Drive: solid arrow
// - Pull: curved arrow
// - Combo: double line
// - Kick-out: angled arrow
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { BlockingLayerProps, BlockingAssignment, DiagramPlayer } from './types';

/**
 * BlockingLayer renders all blocking assignments
 */
export const BlockingLayer = memo(function BlockingLayer({
  blocking,
  offensePlayers,
  defensePlayers,
  theme,
}: BlockingLayerProps) {
  // Create lookup maps for players
  const offenseMap = new Map(offensePlayers.map(p => [p.id, p]));
  const defenseMap = new Map(defensePlayers.map(p => [p.id, p]));

  return (
    <g className="blocking-layer">
      {blocking.map((assignment, index) => {
        const blocker = offenseMap.get(assignment.blockerId);
        const target = defenseMap.get(assignment.targetId);

        if (!blocker || !target) return null;

        return (
          <BlockingArrow
            key={`${assignment.blockerId}-${assignment.targetId}-${index}`}
            assignment={assignment}
            blocker={blocker}
            target={target}
            color={assignment.color || theme.blockingColor}
          />
        );
      })}
    </g>
  );
});

/**
 * Individual blocking arrow
 */
const BlockingArrow = memo(function BlockingArrow({
  assignment,
  blocker,
  target,
  color,
}: {
  assignment: BlockingAssignment;
  blocker: DiagramPlayer;
  target: DiagramPlayer;
  color: string;
}) {
  const { type } = assignment;
  
  // Calculate start and end points
  const startX = blocker.x;
  const startY = blocker.y;
  const endX = target.x;
  const endY = target.y;

  // Get path based on block type
  const pathData = getBlockingPath(type, startX, startY, endX, endY);
  const arrowhead = calculateBlockingArrowhead(type, startX, startY, endX, endY);

  return (
    <g className={`blocking-arrow ${type}`}>
      {/* Glow effect */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="0.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.15"
        filter="url(#diagramGlow)"
      />

      {/* Main line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="0.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={type === 'combo' ? '0.4 0.2' : undefined}
        opacity="0.85"
      />

      {/* Arrowhead */}
      <polygon
        points={arrowhead}
        fill={color}
        opacity="0.85"
      />

      {/* Block type indicator for special blocks */}
      {(type === 'pull' || type === 'trap') && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 0.8}
          textAnchor="middle"
          fontSize={0.5}
          fontWeight="600"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={color}
          opacity="0.7"
        >
          {type.toUpperCase()}
        </text>
      )}
    </g>
  );
});

/**
 * Generate path data based on block type
 */
function getBlockingPath(
  type: BlockingAssignment['type'],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  // Adjust start point to edge of blocker marker
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const normX = dx / dist;
  const normY = dy / dist;
  
  const blockerRadius = 1.0; // Approximate marker radius
  const adjustedStartX = startX + normX * blockerRadius;
  const adjustedStartY = startY + normY * blockerRadius;
  
  const targetRadius = 1.0;
  const adjustedEndX = endX - normX * targetRadius;
  const adjustedEndY = endY - normY * targetRadius;

  switch (type) {
    case 'pull':
    case 'trap': {
      // Curved path for pulls/traps
      const midX = (adjustedStartX + adjustedEndX) / 2;
      const midY = adjustedStartY + 2; // Curve below (higher Y = down toward offense backfield)
      return `M ${adjustedStartX} ${adjustedStartY} Q ${midX} ${midY} ${adjustedEndX} ${adjustedEndY}`;
    }
    
    case 'kick-out': {
      // Angled path for kick-out blocks
      const midX = adjustedStartX + (adjustedEndX - adjustedStartX) * 0.3;
      const midY = adjustedStartY + (adjustedEndY - adjustedStartY) * 0.7;
      return `M ${adjustedStartX} ${adjustedStartY} L ${midX} ${midY} L ${adjustedEndX} ${adjustedEndY}`;
    }

    case 'lead': {
      // Curved up path for lead blocks
      const midX = (adjustedStartX + adjustedEndX) / 2;
      const midY = Math.min(adjustedStartY, adjustedEndY) - 1.5;
      return `M ${adjustedStartX} ${adjustedStartY} Q ${midX} ${midY} ${adjustedEndX} ${adjustedEndY}`;
    }

    case 'combo':
    case 'drive':
    case 'reach':
    case 'down':
    default:
      // Straight line for standard blocks
      return `M ${adjustedStartX} ${adjustedStartY} L ${adjustedEndX} ${adjustedEndY}`;
  }
}

/**
 * Calculate arrowhead points for blocking arrows
 */
function calculateBlockingArrowhead(
  type: BlockingAssignment['type'],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const targetRadius = 1.0;
  
  // Calculate direction
  let angle: number;
  
  if (type === 'pull' || type === 'trap') {
    // For curved paths, calculate tangent at end
    const midX = (startX + endX) / 2;
    const midY = startY + 2;
    // Tangent to quadratic bezier at t=1
    angle = Math.atan2(endY - midY, endX - midX);
  } else if (type === 'lead') {
    const midX = (startX + endX) / 2;
    const midY = Math.min(startY, endY) - 1.5;
    angle = Math.atan2(endY - midY, endX - midX);
  } else {
    angle = Math.atan2(endY - startY, endX - startX);
  }

  // Arrowhead tip position (adjusted for target marker)
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const normX = dx / dist;
  const normY = dy / dist;
  
  const tipX = endX - normX * targetRadius;
  const tipY = endY - normY * targetRadius;

  const arrowLength = 0.6;
  const arrowAngle = Math.PI / 5;

  const leftX = tipX - arrowLength * Math.cos(angle - arrowAngle);
  const leftY = tipY - arrowLength * Math.sin(angle - arrowAngle);
  const rightX = tipX - arrowLength * Math.cos(angle + arrowAngle);
  const rightY = tipY - arrowLength * Math.sin(angle + arrowAngle);

  return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
}

export default BlockingLayer;







