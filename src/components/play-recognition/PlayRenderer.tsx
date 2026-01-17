/**
 * PlayRenderer - Read-only visual display of built plays
 * Used in Play Library and other places to show structured play data
 */

import React from 'react';
import type { BuiltPlayData } from './PlayBuilder';
import type { DiagramPlayer, DiagramRoute } from '../playbook-diagram/types';

interface PlayRendererProps {
  playData: BuiltPlayData;
  className?: string;
}

export const PlayRenderer: React.FC<PlayRendererProps> = ({ playData, className = '' }) => {
  const { offensePlayers, defensePlayers, routes } = playData;

  return (
    <div className={`w-full ${className}`}>
      <svg
        viewBox="0 0 100 53.333"
        className="w-full h-full bg-[#0D1117] rounded-lg border border-[#1B1E20]"
      >
        {/* Arrow marker definition for routes */}
        <defs>
          <marker
            id="arrowhead-renderer"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="2.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,5 L7,2.5 z" fill="#FFFFFF" />
          </marker>
        </defs>

        {/* Field background */}
        <rect x="0" y="0" width="100" height="53.333" fill="#0D1117" />

        {/* Yard lines */}
        {Array.from({ length: 11 }).map((_, i) => {
          const x = i * 10;
          return (
            <line
              key={i}
              x1={x}
              y1="0"
              x2={x}
              y2="53.333"
              stroke="rgba(0, 246, 229, 0.1)"
              strokeWidth="0.1"
            />
          );
        })}

        {/* Line of Scrimmage (LOS) */}
        <line
          x1="0"
          y1="32"
          x2="100"
          y2="32"
          stroke="#F5C253"
          strokeWidth="0.2"
          strokeDasharray="1,0.5"
        />

        {/* Defense players (red) */}
        {defensePlayers.map((player) => (
          <g key={player.id}>
            <circle
              cx={player.x}
              cy={player.y}
              r="1.5"
              fill="#EF4444"
              stroke="#EF4444"
              strokeWidth="0.3"
            />
            <text
              x={player.x}
              y={player.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="1.5"
              fontWeight="bold"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {player.label}
            </text>
          </g>
        ))}

        {/* Offense players (cyan) */}
        {offensePlayers.map((player) => {
          const hasRoute = routes?.some(r => r.playerId === player.id);

          return (
            <g key={player.id}>
              <circle
                cx={player.x}
                cy={player.y}
                r="1.5"
                fill={hasRoute ? "#3DF3FF" : "#00F6E5"}
                stroke={hasRoute ? "#3DF3FF" : "#00F6E5"}
                strokeWidth="0.3"
              />
              <text
                x={player.x}
                y={player.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="black"
                fontSize="1.5"
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {player.label}
              </text>
            </g>
          );
        })}

        {/* Routes (white arrows) */}
        {routes && routes.map((route, idx) => {
          if (!route.points || route.points.length < 2) return null;
          const pathData = `M ${route.points.map(p => `${p.x},${p.y}`).join(' L ')}`;
          return (
            <path
              key={idx}
              d={pathData}
              stroke={route.color || '#FFFFFF'}
              strokeWidth="0.35"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd="url(#arrowhead-renderer)"
            />
          );
        })}
      </svg>
    </div>
  );
};
