// ═══════════════════════════════════════════════════════════════════════════
// FOOTBALL FIELD — Main responsive field component for the Chalkboard play designer
// 
// ORIENTATION RULES (NON-NEGOTIABLE):
// 1. The field MUST NEVER rotate
// 2. Long dimension (120 yards) MUST ALWAYS be horizontal (X-axis)
// 3. Short dimension (53.3 yards) MUST ALWAYS be vertical (Y-axis)
// 4. ZERO CSS or SVG transforms that rotate, flip, mirror, or skew
// 5. Aspect ratio 120:53.3 MUST be preserved (field appears wider than tall)
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { FootballFieldProps, DEFAULT_THEME, Point } from './types';
import { FIELD_DIMENSIONS, svgToYard, snapToYard } from './geometry';
import { useViewState, useFieldGestures } from './useViewState';
import { FieldBackground } from './FieldBackground';
import { YardLines } from './YardLines';
import { HashMarks } from './HashMarks';
import { Numbers } from './Numbers';
import { LOSLine } from './LOSLine';
import { Grid } from './Grid';
import { ZoomControls } from './ZoomControls';

/**
 * FootballField renders a landscape football field with accurate NFL/Youth geometry.
 * 
 * COORDINATE SYSTEM:
 * - X-axis: 0 → 120 yards (HORIZONTAL, left to right)
 *   - 0-10: Left end zone
 *   - 10-110: Playing field (100 yards)
 *   - 110-120: Right end zone
 * - Y-axis: 0 → 53.3 yards (VERTICAL, top to bottom)
 *   - 0: Top sideline
 *   - 53.3: Bottom sideline
 *
 * The viewBox is "0 0 120 53.3" with preserveAspectRatio="xMidYMid meet"
 * The container enforces aspect-ratio: 120 / 53.3 (≈2.25:1, wider than tall)
 */
export function FootballField({
  hashType = 'NFL',
  losX = 35,
  showLOS = true,
  showDepthLines = false,
  showEndZones = true,
  showNumbers = true,
  showGrid = false,
  theme: themeOverrides = {},
  children,
  className = '',
  initialViewState,
  onViewStateChange,
  disableZoomPan = false,
  onFieldClick,
  enableTouchGestures = true,
}: FootballFieldProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Merge theme with defaults
  const theme = useMemo(
    () => ({ ...DEFAULT_THEME, ...themeOverrides }),
    [themeOverrides]
  );

  // View state management (zoom/pan only - NO ROTATION)
  const {
    viewState,
    setViewState,
    zoomIn,
    zoomOut,
    resetView,
    transform,
    canZoomIn,
    canZoomOut,
  } = useViewState({
    initialState: initialViewState,
    minScale: 0.5,
    maxScale: 4,
    zoomStep: 0.25,
  });

  // Gesture support for touch devices
  useFieldGestures(svgRef, viewState, setViewState, {
    enabled: enableTouchGestures && !disableZoomPan,
  });

  // Notify parent of view state changes
  useEffect(() => {
    onViewStateChange?.(viewState);
  }, [viewState, onViewStateChange]);

  // Check if we're on mobile for default zoom behavior
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-zoom on mobile to show ~50 yards around LOS
  useEffect(() => {
    if (isMobile && !disableZoomPan) {
      const mobileScale = 1.8;
      const centerOffset = (FIELD_DIMENSIONS.LENGTH / 2 - losX) / mobileScale;
      setViewState({
        scale: mobileScale,
        offsetX: centerOffset * mobileScale,
        offsetY: 0,
      });
    }
  }, [isMobile, losX, disableZoomPan, setViewState]);

  /**
   * Convert screen coordinates to yard coordinates
   */
  const screenToYard = useCallback((clientX: number, clientY: number): Point | null => {
    if (!svgRef.current) return null;

    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return null;

    const svgPoint = point.matrixTransform(ctm.inverse());
    return svgToYard({ x: svgPoint.x, y: svgPoint.y });
  }, []);

  /**
   * Handle click on field
   */
  const handleFieldClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!onFieldClick) return;

    const point = screenToYard(e.clientX, e.clientY);
    if (point) {
      const snappedPoint = snapToYard(point);
      onFieldClick(snappedPoint);
    }
  }, [onFieldClick, screenToYard]);

  /**
   * Handle pointer events for interactive elements
   */
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as SVGSVGElement).setPointerCapture(e.pointerId);
  }, []);

  return (
    <div className={`football-field-container relative ${className}`}>
      {/*
        CRITICAL: Responsive aspect ratio container
        - Width is determined by parent/available space
        - Height is DERIVED from width using aspectRatio
        - This ensures the field is ALWAYS wider than tall
      */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-[#1B1E20] bg-[#0A0A0A]"
        style={{
          aspectRatio: '120 / 53.3',
          // Explicit fallback for older browsers
          maxHeight: '100%',
        }}
      >
        {/*
          CRITICAL: SVG with exact viewBox and preserveAspectRatio
          - viewBox="0 0 120 53.3" defines world coordinates (yards)
          - preserveAspectRatio="xMidYMid meet" centers and maintains ratio
          - NO rotate transforms anywhere
        */}
        <svg
          ref={svgRef}
          viewBox="0 0 120 53.3"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full cursor-crosshair"
          onClick={handleFieldClick}
          onPointerDown={handlePointerDown}
          style={{
            touchAction: disableZoomPan ? 'auto' : 'none',
            // Prevent any CSS transforms
            transform: 'none',
          }}
        >
          {/*
            CRITICAL: Transform group for zoom/pan ONLY
            - Uses translate + scale ONLY
            - NEVER uses rotate
          */}
          <g transform={disableZoomPan ? undefined : transform}>
            {/* Background and turf */}
            <FieldBackground theme={theme} showEndZones={showEndZones} />

            {/* Yard lines (vertical lines at X positions) */}
            <YardLines theme={theme} />

            {/* Hash marks (horizontal ticks at Y positions) */}
            <HashMarks type={hashType} theme={theme} />

            {/* Yard numbers - NO ROTATION, all readable left-to-right */}
            {showNumbers && <Numbers theme={theme} />}

            {/* Debug grid */}
            {showGrid && <Grid theme={theme} />}

            {/* Line of Scrimmage (vertical line at losX) */}
            {showLOS && (
              <LOSLine
                x={losX}
                showDepthLines={showDepthLines}
                theme={theme}
              />
            )}

            {/* Child content (players, routes, etc.) */}
            {children}
          </g>
        </svg>

        {/* Zoom Controls Overlay */}
        {!disableZoomPan && (
          <ZoomControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={() => resetView(losX)}
            currentScale={viewState.scale}
            className="absolute bottom-4 right-4 z-10"
          />
        )}

        {/* Mobile pan hint */}
        {isMobile && !disableZoomPan && <MobilePanHint />}
      </div>

      {/* Debug info */}
      {showGrid && (
        <div className="mt-2 text-xs text-slate-500 font-mono">
          viewBox: 0 0 120 53.3 | 
          scale: {viewState.scale.toFixed(2)} | 
          offset: ({viewState.offsetX.toFixed(1)}, {viewState.offsetY.toFixed(1)})
        </div>
      )}
    </div>
  );
}

/**
 * Mobile pan hint - shows a brief instruction overlay
 */
function MobilePanHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in">
      <div className="rounded-lg bg-black/70 px-4 py-2 text-xs text-slate-300 backdrop-blur-sm">
        <span className="text-[#00F6E5]">Pinch</span> to zoom • <span className="text-[#00F6E5]">Drag</span> to pan
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER MARKER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export type PlayerMarkerProps = {
  id: string;
  x: number;
  y: number;
  label: string;
  side: 'offense' | 'defense';
  isSelected?: boolean;
  onClick?: () => void;
  markerSize?: number;
  hitboxSize?: number;
};

/**
 * PlayerMarker renders a single player on the field.
 * Uses translate ONLY - no rotation transforms.
 */
export function PlayerMarker({
  id,
  x,
  y,
  label,
  side,
  isSelected = false,
  onClick,
  markerSize = 0.7,
  hitboxSize = 1.4,
}: PlayerMarkerProps) {
  const isOffense = side === 'offense';
  const baseColor = isOffense ? '#00F6E5' : '#64748b';
  const fillColor = isOffense ? 'rgba(0, 246, 229, 0.15)' : 'rgba(100, 116, 139, 0.15)';

  return (
    <g
      className="player-marker cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Selection glow */}
      {isSelected && (
        <circle
          cx={x}
          cy={y}
          r={markerSize * 1.8}
          fill="none"
          stroke={baseColor}
          strokeWidth={0.15}
          opacity={0.5}
          filter="url(#neonGlow)"
        >
          <animate
            attributeName="r"
            values={`${markerSize * 1.6};${markerSize * 2};${markerSize * 1.6}`}
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.3;0.5"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Touch hitbox (invisible, larger area for interaction) */}
      <circle
        cx={x}
        cy={y}
        r={hitboxSize}
        fill="transparent"
        style={{ cursor: 'pointer' }}
      />

      {/* Visual marker */}
      <circle
        cx={x}
        cy={y}
        r={markerSize}
        fill={fillColor}
        stroke={baseColor}
        strokeWidth={isSelected ? 0.15 : 0.1}
      />

      {/* Position label - NO ROTATION */}
      <text
        x={x}
        y={y}
        dy="0.35em"
        textAnchor="middle"
        fontSize={markerSize * 1.2}
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={baseColor}
        className="select-none pointer-events-none"
      >
        {label}
      </text>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE LINE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export type RouteLineProps = {
  points: Point[];
  color?: string;
  label?: string;
  strokeWidth?: number;
  showArrowhead?: boolean;
};

/**
 * RouteLine renders a route path with optional arrowhead.
 * Uses translate ONLY - no rotation transforms.
 */
export function RouteLine({
  points,
  color = '#00F6E5',
  label,
  strokeWidth = 0.2,
  showArrowhead = true,
}: RouteLineProps) {
  if (points.length < 2) return null;

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const lastPoint = points[points.length - 1];
  const prevPoint = points[points.length - 2];
  const angle = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);

  // Arrowhead points (calculated, not rotated)
  const arrowLength = 0.8;
  const tipX = lastPoint.x;
  const tipY = lastPoint.y;
  const leftX = tipX - arrowLength * Math.cos(angle - Math.PI / 6);
  const leftY = tipY - arrowLength * Math.sin(angle - Math.PI / 6);
  const rightX = tipX - arrowLength * Math.cos(angle + Math.PI / 6);
  const rightY = tipY - arrowLength * Math.sin(angle + Math.PI / 6);

  return (
    <g className="route-line pointer-events-none">
      {/* Route path */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#neonGlow)"
        opacity="0.9"
      />

      {/* Arrowhead */}
      {showArrowhead && (
        <polygon
          points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
          fill={color}
          opacity="0.9"
        />
      )}

      {/* Route label - positioned with translate ONLY, no rotation */}
      {label && (
        <g>
          <rect
            x={lastPoint.x + 0.7}
            y={lastPoint.y - 1.6}
            width={label.length * 0.5 + 0.6}
            height="1.2"
            rx="0.3"
            fill="#0A0A0A"
            stroke={color}
            strokeWidth="0.08"
            opacity="0.9"
          />
          <text
            x={lastPoint.x + 1 + (label.length * 0.5) / 2}
            y={lastPoint.y - 1}
            textAnchor="middle"
            fontSize="0.7"
            fontWeight="700"
            fill={color}
            fontFamily="system-ui"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

export default FootballField;
