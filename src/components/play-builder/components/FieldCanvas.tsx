import React, { useMemo, useEffect } from 'react';
import type { DiagramPlayer, DiagramRoute, PlayMode } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// FIELD CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface FieldCanvasProps {
  // Players and routes
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
  routes: DiagramRoute[];
  routeByPlayerId: Record<string, DiagramRoute>;

  // Field configuration
  lineOfScrimmage: number;
  losY: number;
  zoom: number;
  panOffset: { x: number; y: number };
  playMode: PlayMode;
  viewOnly: boolean;

  // Drawing state
  isDrawingRoute: boolean;
  currentRoutePoints: { x: number; y: number }[];
  selectedPlayer: string | null;
  isDraggingPlayer: boolean;
  draggedPlayerId: string | null;

  // Touch state
  isTouchDevice?: boolean;
  touchMode?: 'draw' | 'move';

  // Event handlers
  onPlayerMouseDown: (e: React.MouseEvent<SVGGElement>, playerId: string, side: 'offense' | 'defense') => void;
  onPlayerDoubleClick: (e: React.MouseEvent<SVGGElement>, playerId: string, side: 'offense' | 'defense') => void;
  onFieldMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  onFieldMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onFieldMouseUp: () => void;
  onFieldDoubleClick: (e: React.MouseEvent<SVGSVGElement>) => void;

  // Refs
  fieldRef: React.RefObject<SVGSVGElement>;
}

const FieldCanvasComponent: React.FC<FieldCanvasProps> = ({
  offensePlayers,
  defensePlayers,
  routes,
  routeByPlayerId,
  lineOfScrimmage,
  losY,
  zoom,
  panOffset,
  playMode,
  viewOnly,
  isDrawingRoute,
  currentRoutePoints,
  selectedPlayer,
  isDraggingPlayer,
  draggedPlayerId,
  isTouchDevice = false,
  touchMode = 'draw',
  onPlayerMouseDown,
  onPlayerDoubleClick,
  onFieldMouseDown,
  onFieldMouseMove,
  onFieldMouseUp,
  onFieldDoubleClick,
  fieldRef
}) => {
  console.log('🎨 FieldCanvas RENDERING', {
    offenseCount: offensePlayers.length,
    defenseCount: defensePlayers.length,
    losY,
    isTouchDevice,
    touchMode
  });

  // Touch event handlers that convert to mouse events
  const handlePlayerTouchStart = useCallback((e: React.TouchEvent<SVGGElement>, playerId: string, side: 'offense' | 'defense') => {
    if (e.touches.length !== 1) return; // Only handle single touch
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    // Create a synthetic mouse event
    const syntheticEvent = {
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      shiftKey: touchMode === 'move', // Treat move mode as shift-dragging
      stopPropagation: () => e.stopPropagation(),
      preventDefault: () => e.preventDefault()
    } as unknown as React.MouseEvent<SVGGElement>;

    onPlayerMouseDown(syntheticEvent, playerId, side);
  }, [touchMode, onPlayerMouseDown]);

  const handleFieldTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    // Let container handle multi-touch gestures (pinch zoom, pan)
    if (e.touches.length > 1) return;

    // For single touch on field (not on player), let it pass through
    // This is handled by the container's touch handlers for panning
  }, []);

  const handleFieldTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length !== 1) return;
    if (!isDrawingRoute && !isDraggingPlayer) return;

    e.preventDefault(); // Prevent scrolling while drawing/dragging
    const touch = e.touches[0];

    const syntheticEvent = {
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      stopPropagation: () => e.stopPropagation(),
      preventDefault: () => e.preventDefault()
    } as unknown as React.MouseEvent<SVGSVGElement>;

    onFieldMouseMove(syntheticEvent);
  }, [isDrawingRoute, isDraggingPlayer, onFieldMouseMove]);

  const handleFieldTouchEnd = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (isDrawingRoute || isDraggingPlayer) {
      e.preventDefault();
      onFieldMouseUp();
    }
  }, [isDrawingRoute, isDraggingPlayer, onFieldMouseUp]);

  // Debug: Log when players change
  useEffect(() => {
    const positions = offensePlayers.map(p => `${p.id}:(${p.x},${p.y})`).join(', ');
    const qb = offensePlayers.find(p => p.id === 'qb');
    console.log('🎨 FieldCanvas: offensePlayers changed');
    console.log('   QB position:', qb ? `(${qb.x}, ${qb.y})` : 'not found');
    console.log('   All positions:', positions);
  }, [offensePlayers]);

  useEffect(() => {
    const positions = defensePlayers.map(p => `${p.id}:(${p.x},${p.y})`).join(', ');
    const mlb = defensePlayers.find(p => p.id === 'mlb');
    console.log('🎨 FieldCanvas: defensePlayers changed');
    console.log('   MLB position:', mlb ? `(${mlb.x}, ${mlb.y})` : 'not found');
    console.log('   All positions:', positions);
  }, [defensePlayers]);

  useEffect(() => {
    console.log('🎨 FieldCanvas: losY changed to', losY);
  }, [losY]);

  // Memoize yard line calculations
  const yardLines = useMemo(() => {
    return Array.from({ length: 11 }).map((_, i) => {
      const y = 10 + i * 10;
      const yardNumber = i <= 5 ? i * 10 : (10 - i) * 10;
      return { y, yardNumber };
    });
  }, []);

  return (
    <svg
      ref={fieldRef}
      viewBox={`${panOffset.x} ${panOffset.y} ${100 / zoom} ${120 / zoom}`}
      className="w-full h-full bg-[#2D5016] rounded-lg border border-[#1B1E20] shadow-2xl select-none"
      onMouseDown={onFieldMouseDown}
      onMouseMove={onFieldMouseMove}
      onMouseUp={onFieldMouseUp}
      onMouseLeave={onFieldMouseUp}
      onDoubleClick={onFieldDoubleClick}
      onTouchStart={handleFieldTouchStart}
      onTouchMove={handleFieldTouchMove}
      onTouchEnd={handleFieldTouchEnd}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
    >
      {/* Definitions */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="2.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,5 L7,2.5 z" fill="#FFFFFF" />
        </marker>
        <marker
          id="arrowhead-drawing"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="2.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,5 L7,2.5 z" fill="#FFFFFF" />
        </marker>
        <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="#2D5016" />
          <rect width="2" height="4" fill="#2D5016" opacity="0.9" />
        </pattern>
      </defs>

      {/* Field background */}
      <rect x="0" y="0" width="100" height="120" fill="url(#grass)" />
      <rect x="0" y="0" width="100" height="10" fill="#0D1117" opacity="0.3" />
      <rect x="0" y="110" width="100" height="10" fill="#0D1117" opacity="0.3" />

      {/* Yard lines */}
      {yardLines.map(({ y, yardNumber }) => (
        <g key={y}>
          <line
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="0.2"
          />
          <text
            x="5"
            y={y - 1}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.3)"
            fontSize="3"
            fontWeight="bold"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {yardNumber}
          </text>
          <text
            x="95"
            y={y - 1}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.3)"
            fontSize="3"
            fontWeight="bold"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {yardNumber}
          </text>
        </g>
      ))}

      {/* Line of Scrimmage */}
      <line
        x1="0"
        y1={losY}
        x2="100"
        y2={losY}
        stroke="#F5C253"
        strokeWidth="0.4"
        strokeDasharray="2,1"
      />
      <text
        x="50"
        y={losY - 1.5}
        textAnchor="middle"
        fill="#F5C253"
        fontSize="2.5"
        fontWeight="bold"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        LOS
      </text>

      {/* Hash marks */}
      {yardLines.map(({ y }) => (
        <g key={`hash-${y}`}>
          <line
            x1="30"
            y1={y}
            x2="30"
            y2={y + 0.5}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.1"
          />
          <line
            x1="70"
            y1={y}
            x2="70"
            y2={y + 0.5}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.1"
          />
        </g>
      ))}

      {/* Defense players */}
      {defensePlayers.map((player) => {
        // Debug: Log first player being rendered
        if (player.id === 'mlb') {
          console.log('🎨 RENDERING MLB at:', player.x, player.y);
        }
        const isSelected = selectedPlayer === player.id;

        return (
          <g
            key={player.id}
            onMouseDown={(e) => onPlayerMouseDown(e, player.id, 'defense')}
            onDoubleClick={(e) => onPlayerDoubleClick(e, player.id, 'defense')}
            onTouchStart={(e) => handlePlayerTouchStart(e, player.id, 'defense')}
            style={{ cursor: !viewOnly ? 'move' : 'default', touchAction: 'none' }}
          >
            {/* Selection indicator - outer glow ring */}
            {isSelected && (
              <>
                <circle
                  cx={player.x}
                  cy={player.y}
                  r="2.8"
                  fill="none"
                  stroke="#00F6E5"
                  strokeWidth="0.4"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="2.8;3.2;2.8"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={player.x}
                  cy={player.y}
                  r="2.2"
                  fill="none"
                  stroke="#00F6E5"
                  strokeWidth="0.2"
                  opacity="0.8"
                />
              </>
            )}
            <circle
              cx={player.x}
              cy={player.y}
              r="1.5"
              fill={isSelected ? "#00F6E5" : "#EF4444"}
              stroke={isSelected ? "#00F6E5" : "#EF4444"}
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
        );
      })}

      {/* Selected player label */}
      {selectedPlayer && (
        (() => {
          const player = [...offensePlayers, ...defensePlayers].find(p => p.id === selectedPlayer);
          if (!player) return null;
          return (
            <g>
              <rect
                x={player.x - 6}
                y={player.y - 6}
                width="12"
                height="3"
                rx="0.5"
                fill="#00F6E5"
                opacity="0.9"
              />
              <text
                x={player.x}
                y={player.y - 4.2}
                textAnchor="middle"
                fill="#0A0A0A"
                fontSize="1.8"
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {player.label}
              </text>
            </g>
          );
        })()
      )}

      {/* Offense players */}
      {offensePlayers.map((player) => {
        // Debug: Log QB being rendered
        if (player.id === 'qb') {
          console.log('🎨 RENDERING QB at:', player.x, player.y);
        }

        const isDrawing = isDrawingRoute && selectedPlayer === player.id;
        const isSelected = selectedPlayer === player.id && !isDrawingRoute;
        // 🔥 PERFORMANCE OPTIMIZATION: O(1) route lookup instead of O(n)
        const hasRoute = routeByPlayerId[player.id] !== undefined;
        const isDragging = isDraggingPlayer && draggedPlayerId === player.id;

        return (
          <g
            key={player.id}
            onMouseDown={(e) => onPlayerMouseDown(e, player.id, 'offense')}
            onDoubleClick={(e) => onPlayerDoubleClick(e, player.id, 'offense')}
            onTouchStart={(e) => handlePlayerTouchStart(e, player.id, 'offense')}
            style={{
              cursor: playMode === 'pass' && !viewOnly ? 'crosshair' : !viewOnly ? 'move' : 'default',
              touchAction: 'none'
            }}
          >
            {/* Selection indicator - outer glow ring */}
            {isSelected && (
              <>
                <circle
                  cx={player.x}
                  cy={player.y}
                  r="2.8"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="0.4"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="2.8;3.2;2.8"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={player.x}
                  cy={player.y}
                  r="2.2"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="0.2"
                  opacity="0.8"
                />
              </>
            )}
            {(isDrawing || isDragging) && (
              <circle cx={player.x} cy={player.y} r="2.5" fill="#FFFFFF" opacity="0.3" />
            )}
            <circle
              cx={player.x}
              cy={player.y}
              r="1.5"
              fill={isDrawing || isDragging ? '#FFFFFF' : isSelected ? '#FFFFFF' : hasRoute ? '#3DF3FF' : '#00F6E5'}
              stroke={isDrawing || isDragging ? '#FFFFFF' : isSelected ? '#FFFFFF' : hasRoute ? '#3DF3FF' : '#00F6E5'}
              strokeWidth="0.3"
            />
            <text
              x={player.x}
              y={player.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#0A0A0A"
              fontSize="1.5"
              fontWeight="bold"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {player.label}
            </text>
          </g>
        );
      })}

      {/* Routes */}
      {routes.map((route) => {
        if (route.points.length < 2) return null;
        const pathData = route.points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
        return (
          <path
            key={route.playerId}
            d={pathData}
            stroke="#FFFFFF"
            strokeWidth="0.4"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
        );
      })}

      {/* Current drawing route */}
      {isDrawingRoute && currentRoutePoints.length > 1 && (
        <path
          d={currentRoutePoints.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')}
          stroke="#FFFFFF"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="1,0.5"
          markerEnd="url(#arrowhead-drawing)"
        />
      )}
    </svg>
  );
};

// Export without React.memo to ensure DOM updates correctly
// TODO: Re-add memo after fixing update issues
export const FieldCanvas = FieldCanvasComponent;
FieldCanvas.displayName = 'FieldCanvas';
