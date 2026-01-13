// ═══════════════════════════════════════════════════════════════════════════
// BALL CARRIER LAYER — Path for the ball carrier on run plays
// 
// Shows the designed running lane with a distinctive style
// Solid thick line with a different color (usually purple)
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { BallCarrierLayerProps, Point } from './types';

/**
 * BallCarrierLayer renders the ball carrier's path
 */
export const BallCarrierLayer = memo(function BallCarrierLayer({
  path,
  theme,
}: BallCarrierLayerProps) {
  const { points, readPoints } = path;

  if (points.length < 2) return null;

  // Build path data
  const pathData = buildCarrierPath(points);

  // Calculate arrowhead at the end
  const lastPoint = points[points.length - 1];
  const prevPoint = points[points.length - 2];
  const arrowhead = calculateArrowhead(prevPoint, lastPoint);

  return (
    <g className="ball-carrier-layer">
      {/* Strong glow effect */}
      <path
        d={pathData}
        fill="none"
        stroke={theme.ballCarrierColor}
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.2"
        filter="url(#diagramGlowStrong)"
      />

      {/* Main carrier path */}
      <path
        d={pathData}
        fill="none"
        stroke={theme.ballCarrierColor}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />

      {/* Arrowhead */}
      <polygon
        points={arrowhead}
        fill={theme.ballCarrierColor}
        opacity="0.95"
      />

      {/* Read points (for option plays) */}
      {readPoints && readPoints.length > 0 && (
        <g className="read-points">
          {readPoints.map((point, index) => (
            <g key={`read-${index}`}>
              {/* Read indicator circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={0.4}
                fill="none"
                stroke={theme.ballCarrierColor}
                strokeWidth="0.12"
                strokeDasharray="0.2 0.15"
                opacity="0.7"
              />
              {/* "R" for Read */}
              <text
                x={point.x}
                y={point.y + 1.2}
                textAnchor="middle"
                fontSize={0.5}
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                fill={theme.ballCarrierColor}
                opacity="0.7"
              >
                READ
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Path label */}
      <text
        x={points[0].x + 0.8}
        y={points[0].y + 1.2}
        textAnchor="start"
        fontSize={0.6}
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={theme.ballCarrierColor}
        opacity="0.8"
      >
        ●
      </text>
    </g>
  );
});

/**
 * Build smooth path for ball carrier
 */
function buildCarrierPath(points: Point[]): string {
  if (points.length < 2) return '';

  const parts: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    if (next && i < points.length - 1) {
      // Smooth curve through waypoints
      const cp = curr;
      const endX = (curr.x + next.x) / 2;
      const endY = (curr.y + next.y) / 2;
      parts.push(`L ${(prev.x + curr.x) / 2} ${(prev.y + curr.y) / 2}`);
      parts.push(`Q ${cp.x} ${cp.y} ${endX} ${endY}`);
    } else {
      parts.push(`L ${curr.x} ${curr.y}`);
    }
  }

  return parts.join(' ');
}

/**
 * Calculate arrowhead points
 */
function calculateArrowhead(from: Point, to: Point): string {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const arrowLength = 0.9;
  const arrowAngle = Math.PI / 5;

  const tipX = to.x;
  const tipY = to.y;
  const leftX = tipX - arrowLength * Math.cos(angle - arrowAngle);
  const leftY = tipY - arrowLength * Math.sin(angle - arrowAngle);
  const rightX = tipX - arrowLength * Math.cos(angle + arrowAngle);
  const rightY = tipY - arrowLength * Math.sin(angle + arrowAngle);

  return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
}

export default BallCarrierLayer;







