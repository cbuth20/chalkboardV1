"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { DemoPlay, DemoPlayer, DemoRoute, Point, generateId } from "@/lib/playbook/demo-types";
import { RoutePicker } from "@/components/play-designer/RoutePicker";
import { ROUTE_LIBRARY, RouteDef } from "@/domain/football/routes";
import { generateRoutePoints, getRouteColor } from "@/lib/playbook/routeGenerator";

// ═══════════════════════════════════════════════════════════════════════════
// END-ZONE VIEW FIELD EDITOR
// ═══════════════════════════════════════════════════════════════════════════
//
// RULE 1: END-ZONE VIEW (DEFAULT)
//   • Offense at BOTTOM of screen
//   • Defense at TOP of screen
//   • Vertical axis = yardage (going upfield)
//
// RULE 2: CROPPED TEACHING WINDOW
//   • Width: sideline-to-sideline (53.333 yards)
//   • Depth: LOS to ~35 yards upfield
//   • No empty space, no tiny field floating
//
// RULE 3: YARD LINES ARE HORIZONTAL
//   • LOS is a bold HORIZONTAL line at bottom
//   • 5-yard increments are HORIZONTAL lines
//   • Hashes are VERTICAL references
//
// COORDINATE SYSTEM:
//   • X-axis: 0 → 53.333 (field width, left sideline to right sideline)
//   • Y-axis: 0 at LOS, positive = upfield, negative = backfield
//   • SVG Y is inverted, so we flip: svgY = DOWNFIELD_DEPTH - fieldY
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK DIAGRAM CONSTANTS
// Optimized for printed playbook readability, not dev canvas
// ═══════════════════════════════════════════════════════════════════════════

// Field dimensions (yards) - TIGHT CROP around formation
const FIELD_WIDTH = 53.333;           // Full field width (sideline to sideline)
const BACKFIELD_DEPTH = 8;            // Behind LOS (for QB/RB in gun)
const DOWNFIELD_DEPTH = 30;           // LOS to 30 yards downfield
const TOTAL_DEPTH = BACKFIELD_DEPTH + DOWNFIELD_DEPTH; // Total viewable depth

// NFL hash marks (actual NFL positions from left sideline)
const LEFT_HASH_X = 23.583;           // 70 feet 9 inches from sideline
const RIGHT_HASH_X = 29.75;           // 70 feet 9 inches from other sideline
const CENTER_X = FIELD_WIDTH / 2;     // 26.67 yards (center of field)

// Scale: pixels per yard
const YARDS_TO_PX = 12;

// SVG dimensions
const SVG_WIDTH = FIELD_WIDTH * YARDS_TO_PX;
const SVG_HEIGHT = TOTAL_DEPTH * YARDS_TO_PX;

// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════

// Field coords: x = 0-53.333 (width), y = 0 at LOS, positive = upfield, negative = backfield
// SVG coords: x = 0-53.333, y = 0 at TOP of view (furthest downfield), y increases down (toward backfield)
// LOS is at svgY = DOWNFIELD_DEPTH (30 yards from top)

function fieldToSvg(fieldX: number, fieldY: number): { x: number; y: number } {
  return {
    x: fieldX,
    y: DOWNFIELD_DEPTH - fieldY, // LOS (fieldY=0) maps to svgY=DOWNFIELD_DEPTH, backfield (fieldY<0) maps to svgY>DOWNFIELD_DEPTH
  };
}

function svgToField(svgX: number, svgY: number): { x: number; y: number } {
  return {
    x: svgX,
    y: DOWNFIELD_DEPTH - svgY, // Flip back
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FieldEditorProps {
  play: DemoPlay | null;
  onUpdatePlayers: (players: DemoPlayer[]) => void;
  onUpdateRoutes: (routes: DemoRoute[]) => void;
}

type EditorMode = "select" | "draw-route";

export function FieldEditor({ play, onUpdatePlayers, onUpdateRoutes }: FieldEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Editor state
  const [mode, setMode] = useState<EditorMode>("select");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);

  // Route drawing state
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [drawingPlayerId, setDrawingPlayerId] = useState<string | null>(null);

  // Route picker state
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [routePickerPlayer, setRoutePickerPlayer] = useState<DemoPlayer | null>(null);

  // Convert screen coords to field coords
  const screenToField = useCallback((clientX: number, clientY: number): Point | null => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    
    // Convert SVG coords to field coords
    const field = svgToField(svgPt.x, svgPt.y);
    
    // Snap to 0.5 yard grid
    return {
      x: Math.round(field.x * 2) / 2,
      y: Math.round(field.y * 2) / 2,
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYER DRAGGING
  // ═══════════════════════════════════════════════════════════════════════════

  const handlePlayerMouseDown = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    if (mode === "select") {
      setDraggingPlayerId(playerId);
      setSelectedPlayerId(playerId);
      setSelectedRouteId(null);
    } else if (mode === "draw-route") {
      const player = play?.players.find((p) => p.id === playerId);
      if (player) {
        // Show route picker instead of manual drawing
        setRoutePickerPlayer(player);
        setShowRoutePicker(true);
        setSelectedPlayerId(playerId);
      }
    }
  };

  // Handle route selection from RoutePicker
  const handleRouteSelect = useCallback((routeId: string, customDepth?: number) => {
    if (!routePickerPlayer || !play) return;
    
    const routeDef = ROUTE_LIBRARY.find(r => r.id === routeId);
    if (!routeDef) return;
    
    // Generate route points based on route definition
    const points = generateRoutePoints(routePickerPlayer, routeDef, customDepth);
    const color = getRouteColor(routeDef, false);
    
    const newRoute: DemoRoute = {
      id: generateId(),
      playerId: routePickerPlayer.id,
      points,
      color,
    };
    
    onUpdateRoutes([...play.routes, newRoute]);
    setShowRoutePicker(false);
    setRoutePickerPlayer(null);
    setMode("select");
  }, [routePickerPlayer, play, onUpdateRoutes]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingPlayerId && play) {
        const pt = screenToField(e.clientX, e.clientY);
        if (pt) {
          // Clamp to field bounds
          const x = Math.max(0, Math.min(FIELD_WIDTH, pt.x));
          const y = Math.max(-BACKFIELD_DEPTH, Math.min(DOWNFIELD_DEPTH, pt.y)); // Clamp to viewable area
          const newPlayers = play.players.map((p) =>
            p.id === draggingPlayerId ? { ...p, x, y } : p
          );
          onUpdatePlayers(newPlayers);
        }
      }
    },
    [draggingPlayerId, play, screenToField, onUpdatePlayers]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingPlayerId(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE DRAWING
  // ═══════════════════════════════════════════════════════════════════════════

  const handleFieldClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode === "draw-route" && drawingPlayerId && play) {
        const pt = screenToField(e.clientX, e.clientY);
        if (pt) {
          const x = Math.max(0, Math.min(FIELD_WIDTH, pt.x));
          const y = Math.max(-BACKFIELD_DEPTH, Math.min(DOWNFIELD_DEPTH, pt.y));
          setDrawingPoints((prev) => [...prev, { x, y }]);
        }
      } else if (mode === "select") {
        setSelectedPlayerId(null);
        setSelectedRouteId(null);
      }
    },
    [mode, drawingPlayerId, play, screenToField]
  );

  const finishRoute = useCallback(() => {
    if (drawingPlayerId && drawingPoints.length >= 2 && play) {
      const newRoute: DemoRoute = {
        id: generateId(),
        playerId: drawingPlayerId,
        points: drawingPoints,
        color: "#00F6E5",
      };
      onUpdateRoutes([...play.routes, newRoute]);
    }
    setDrawingPoints([]);
    setDrawingPlayerId(null);
    setMode("select");
  }, [drawingPlayerId, drawingPoints, play, onUpdateRoutes]);

  const cancelRoute = useCallback(() => {
    setDrawingPoints([]);
    setDrawingPlayerId(null);
    setMode("select");
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE SELECTION & DELETION
  // ═══════════════════════════════════════════════════════════════════════════

  const handleRouteClick = (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    setSelectedRouteId(routeId);
    setSelectedPlayerId(null);
  };

  const deleteSelectedRoute = useCallback(() => {
    if (selectedRouteId && play) {
      onUpdateRoutes(play.routes.filter((r) => r.id !== selectedRouteId));
      setSelectedRouteId(null);
    }
  }, [selectedRouteId, play, onUpdateRoutes]);

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Enter" && mode === "draw-route") {
        e.preventDefault();
        finishRoute();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (showRoutePicker) {
          setShowRoutePicker(false);
          setRoutePickerPlayer(null);
        } else if (mode === "draw-route") {
          cancelRoute();
        } else {
          setSelectedPlayerId(null);
          setSelectedRouteId(null);
        }
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedRouteId) {
        e.preventDefault();
        deleteSelectedRoute();
      }
      // Mode switching shortcuts
      else if (e.key === "s" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setMode("select");
      } else if (e.key === "d" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setMode("draw-route");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, finishRoute, cancelRoute, selectedRouteId, deleteSelectedRoute, showRoutePicker]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (!play) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-[#0d1117]">
        <p className="text-sm text-slate-500">No play selected</p>
      </div>
    );
  }

  // LOS position in SVG coords (at bottom of view)
  const losY = fieldToSvg(0, 0).y; // y=0 in field = LOS

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0d1117]">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#1B1E20] bg-[#0A0A0A] px-4 py-2">
        <button
          onClick={() => setMode("select")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-all ${
            mode === "select"
              ? "bg-[#00F6E5]/10 text-[#00F6E5]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CursorIcon className="h-4 w-4" />
          Select
        </button>
        <button
          onClick={() => setMode("draw-route")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-all ${
            mode === "draw-route"
              ? "bg-[#00F6E5]/10 text-[#00F6E5]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <RouteIcon className="h-4 w-4" />
          Draw Route
        </button>

        <div className="mx-2 h-4 w-px bg-[#1B1E20]" />

        {selectedRouteId && (
          <button
            onClick={deleteSelectedRoute}
            className="flex items-center gap-1.5 rounded-lg bg-red-900/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-900/30"
          >
            <TrashIcon className="h-4 w-4" />
            Delete Route
          </button>
        )}

        {mode === "draw-route" && drawingPoints.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {drawingPoints.length} points
            </span>
            <button
              onClick={finishRoute}
              disabled={drawingPoints.length < 2}
              className="rounded-lg bg-[#00F6E5] px-3 py-1 text-xs font-bold text-[#0A0A0A] disabled:opacity-50"
            >
              Finish (Enter)
            </button>
            <button
              onClick={cancelRoute}
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400"
            >
              Cancel (Esc)
            </button>
          </div>
        )}

        {/* View indicator */}
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded bg-[#00F6E5]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00F6E5]">
            END-ZONE VIEW
          </span>
          <span className="text-xs text-slate-600">
            {mode === "select" && "Drag players • Click route to select"}
            {mode === "draw-route" && "Click player → Click field → Enter"}
          </span>
        </div>
      </div>

      {/* Field - END-ZONE VIEW (fills screen) */}
      <div className="playbook-stage relative flex-1 overflow-hidden flex items-center justify-center p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${FIELD_WIDTH} ${TOTAL_DEPTH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            cursor: mode === "draw-route" ? "crosshair" : "default",
            width: "100%",
            height: "100%",
            maxHeight: "100%",
          }}
          onClick={handleFieldClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="rounded-lg"
        >
          {/* Definitions */}
          <defs>
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.15" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Clean Field Background - minimal, like printed playbook */}
          <rect x="0" y="0" width={FIELD_WIDTH} height={TOTAL_DEPTH} fill="#0a0f0a" />

          {/* Subtle yard lines - ONLY at 10-yard intervals, very faint */}
          {[10, 20].map((yards) => {
            const svgY = fieldToSvg(0, yards).y;
            return (
              <g key={`yard-${yards}`}>
                <line
                  x1={0}
                  y1={svgY}
                  x2={FIELD_WIDTH}
                  y2={svgY}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={0.1}
                />
                {/* Minimal yard markers */}
                <text
                  x={1.5}
                  y={svgY + 0.5}
                  fontSize="1.4"
                  fill="rgba(255, 255, 255, 0.15)"
                  fontWeight="600"
                  fontFamily="system-ui"
                >
                  {yards}
                </text>
              </g>
            );
          })}

          {/* Hash marks - subtle vertical reference */}
          <line
            x1={LEFT_HASH_X}
            y1={0}
            x2={LEFT_HASH_X}
            y2={TOTAL_DEPTH}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={0.08}
            strokeDasharray="0.3,0.7"
          />
          <line
            x1={RIGHT_HASH_X}
            y1={0}
            x2={RIGHT_HASH_X}
            y2={TOTAL_DEPTH}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={0.08}
            strokeDasharray="0.3,0.7"
          />

          {/* LINE OF SCRIMMAGE - Clean, prominent */}
          <line
            x1={0}
            y1={losY}
            x2={FIELD_WIDTH}
            y2={losY}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={0.25}
          />

          {/* Existing Routes (converted to SVG coords) */}
          {play.routes.map((route) => (
            <RouteDisplay
              key={route.id}
              route={route}
              isSelected={route.id === selectedRouteId}
              onClick={(e) => handleRouteClick(e, route.id)}
            />
          ))}

          {/* Drawing Preview */}
          {drawingPoints.length > 0 && (
            <RouteDisplay
              route={{
                id: "preview",
                playerId: drawingPlayerId || "",
                points: drawingPoints,
                color: "#00F6E5",
              }}
              isSelected={false}
              isPreview
            />
          )}

          {/* Players (converted to SVG coords) */}
          {play.players.map((player) => (
            <PlayerMarker
              key={player.id}
              player={player}
              isSelected={player.id === selectedPlayerId}
              isDragging={player.id === draggingPlayerId}
              onMouseDown={(e) => handlePlayerMouseDown(e, player.id)}
            />
          ))}
        </svg>
      </div>

      {/* Route Picker Modal */}
      <RoutePicker
        isOpen={showRoutePicker}
        onClose={() => {
          setShowRoutePicker(false);
          setRoutePickerPlayer(null);
        }}
        playerLabel={routePickerPlayer?.label}
        onSelect={handleRouteSelect}
        level="nfl"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER MARKER COMPONENT (PLAYBOOK STYLE)
// Clean, readable player symbols like a printed install sheet
// ═══════════════════════════════════════════════════════════════════════════

const OL_LABELS = ["C", "LG", "RG", "LT", "RT"];

function PlayerMarker({
  player,
  isSelected,
  isDragging,
  onMouseDown,
}: {
  player: DemoPlayer;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const svg = fieldToSvg(player.x, player.y);
  const isOL = OL_LABELS.includes(player.label);
  const isQB = player.label === "QB";
  
  // Sizing for readability - larger for better visibility
  const size = isOL ? 1.4 : 2.0;

  return (
    <g
      className="cursor-grab active:cursor-grabbing"
      onMouseDown={onMouseDown}
      style={{ pointerEvents: "all" }}
    >
      {/* Selection indicator */}
      {isSelected && !isOL && (
        <circle
          cx={svg.x}
          cy={svg.y}
          r={size * 1.6}
          fill="none"
          stroke="#fff"
          strokeWidth={0.2}
          opacity={0.6}
        />
      )}

      {/* Hitbox */}
      <circle cx={svg.x} cy={svg.y} r={2.5} fill="transparent" />

      {isOL ? (
        // Offensive Line: solid filled squares (tight cluster)
        <rect
          x={svg.x - size * 0.7}
          y={svg.y - size * 0.7}
          width={size * 1.4}
          height={size * 1.4}
          fill="rgba(255, 255, 255, 0.9)"
          rx={0.1}
        />
      ) : (
        // Skill Position: circle with bold label
        <>
          <circle
            cx={svg.x}
            cy={svg.y}
            r={size}
            fill={isQB ? "#F5C253" : "#fff"}
            stroke={isSelected ? "#00F6E5" : "none"}
            strokeWidth={0.2}
          />
          <text
            x={svg.x}
            y={svg.y}
            dy="0.38em"
            textAnchor="middle"
            fontSize={size * 0.7}
            fontWeight="800"
            fill="#0a0f0a"
            fontFamily="system-ui, -apple-system, sans-serif"
            className="pointer-events-none select-none"
          >
            {player.label}
          </text>
        </>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE DISPLAY COMPONENT (PLAYBOOK STYLE)
// Routes are the PRIMARY visual element - bold, clear, readable
// ═══════════════════════════════════════════════════════════════════════════

function RouteDisplay({
  route,
  isSelected,
  isPreview,
  onClick,
}: {
  route: DemoRoute;
  isSelected: boolean;
  isPreview?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  if (route.points.length < 2) return null;

  // Convert all points to SVG coords
  const svgPoints = route.points.map((p) => fieldToSvg(p.x, p.y));
  const pathData = svgPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const color = route.color || "#00F6E5";
  const lastPoint = svgPoints[svgPoints.length - 1];
  const prevPoint = svgPoints[svgPoints.length - 2];

  // Determine if this is a primary route (gold color)
  const isPrimary = color === "#F5C253";

  // Calculate arrowhead - MUCH larger for visibility
  const angle = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);
  const arrowLen = isPrimary ? 2.5 : 2.0;
  const arrowWidth = isPrimary ? 0.6 : 0.5;
  const leftX = lastPoint.x - arrowLen * Math.cos(angle - arrowWidth);
  const leftY = lastPoint.y - arrowLen * Math.sin(angle - arrowWidth);
  const rightX = lastPoint.x - arrowLen * Math.cos(angle + arrowWidth);
  const rightY = lastPoint.y - arrowLen * Math.sin(angle + arrowWidth);

  return (
    <g
      className={onClick ? "cursor-pointer" : "pointer-events-none"}
      onClick={onClick}
      style={{ pointerEvents: onClick ? "stroke" : "none" }}
    >
      {/* Selection highlight */}
      {isSelected && (
        <path
          d={pathData}
          fill="none"
          stroke="#fff"
          strokeWidth={2.0}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
        />
      )}

      {/* Route path - BOLD and prominent */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={isPreview ? 0.5 : isPrimary ? 1.2 : 0.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={isPreview ? "1,0.5" : "none"}
        filter={isPrimary ? "url(#routeGlow)" : undefined}
      />

      {/* Arrowhead - solid, visible */}
      {!isPreview && (
        <polygon
          points={`${lastPoint.x},${lastPoint.y} ${leftX},${leftY} ${rightX},${rightY}`}
          fill={color}
        />
      )}

      {/* Preview points */}
      {isPreview &&
        svgPoints.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={0.5} fill={color} opacity={0.8} />
        ))}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-4 4m4-4l4 4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default FieldEditor;
