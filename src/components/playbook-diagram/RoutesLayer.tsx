// ═══════════════════════════════════════════════════════════════════════════
// ROUTES LAYER — Pass routes for playbook diagrams
// 
// Smooth polylines with arrowheads
// Optional route labels at the end
// Slight glow effect for visibility
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { RoutesLayerProps, DiagramRoute, Point } from './types';

/**
 * RoutesLayer renders all pass routes
 */
export const RoutesLayer = memo(function RoutesLayer({
  routes,
  theme,
}: RoutesLayerProps) {
  return (
    <g className="routes-layer">
      {routes.map((route, index) => (
        <RoutePath
          key={`${route.playerId}-${index}`}
          route={route}
          color={route.color || theme.routeColor}
        />
      ))}
    </g>
  );
});

/**
 * Individual route path with arrowhead
 */
const RoutePath = memo(function RoutePath({
  route,
  color,
}: {
  route: DiagramRoute;
  color: string;
}) {
  const { points, label, style = 'solid' } = route;

  if (points.length < 2) return null;

  // Build path data
  const pathData = buildSmoothPath(points);

  // Calculate arrowhead at the end
  const lastPoint = points[points.length - 1];
  const prevPoint = points[points.length - 2];
  const arrowhead = calculateArrowhead(prevPoint, lastPoint);

  return (
    <g className="route-path">
      {/* Glow effect behind route */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.2"
        filter="url(#diagramGlow)"
      />

      {/* Main route line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="0.18"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={style === 'dashed' ? '0.6 0.3' : undefined}
        opacity="0.9"
      />

      {/* Arrowhead */}
      <polygon
        points={arrowhead}
        fill={color}
        opacity="0.9"
      />

      {/* Route label */}
      {label && (
        <g className="route-label">
          {/* Label background */}
          <rect
            x={lastPoint.x + 0.6}
            y={lastPoint.y - 0.9}
            width={label.length * 0.5 + 0.5}
            height={1.2}
            rx={0.2}
            fill="#0A0C0F"
            stroke={color}
            strokeWidth="0.06"
            opacity="0.9"
          />
          {/* Label text */}
          <text
            x={lastPoint.x + 0.9 + (label.length * 0.25)}
            y={lastPoint.y - 0.3}
            textAnchor="middle"
            fontSize={0.65}
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
            fill={color}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
});

/**
 * Build a smooth SVG path from points with quadratic curves at breaks
 */
function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) return '';

  const parts: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    if (next && i < points.length - 1) {
      // Add quadratic curve through the break point
      const cp = curr; // Control point at the break
      const endX = (curr.x + next.x) / 2;
      const endY = (curr.y + next.y) / 2;
      parts.push(`L ${(prev.x + curr.x) / 2} ${(prev.y + curr.y) / 2}`);
      parts.push(`Q ${cp.x} ${cp.y} ${endX} ${endY}`);
    } else {
      // Straight line to final point
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
  const arrowLength = 0.7;
  const arrowAngle = Math.PI / 6; // 30 degrees

  const tipX = to.x;
  const tipY = to.y;
  const leftX = tipX - arrowLength * Math.cos(angle - arrowAngle);
  const leftY = tipY - arrowLength * Math.sin(angle - arrowAngle);
  const rightX = tipX - arrowLength * Math.cos(angle + arrowAngle);
  const rightY = tipY - arrowLength * Math.sin(angle + arrowAngle);

  return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
}

export default RoutesLayer;







