// ═══════════════════════════════════════════════════════════════════════════
// PLAYFIELD — Main play diagram component for Chalkboard playbooks
// 
// COORDINATE SYSTEM (from @/lib/field/fieldSpec.ts — SINGLE SOURCE OF TRUTH):
// - X-axis: 0 → 100 yards (field length, goal line to goal line)
// - Y-axis: 0 → 53.333 yards (field width, sideline to sideline)
// - svgX = X (direct 1:1 mapping in viewBox)
// - svgY = Y (direct 1:1 mapping in viewBox)
// - NEVER swap axes, NEVER rotate
// 
// DIAGRAM LAYOUT:
// - Horizontal/landscape field (like TV broadcast and playbook sheets)
// - Yard lines are VERTICAL stripes (at X positions)
// - LOS is a HORIZONTAL line at Y ≈ 35 (default)
// - Defense above LOS (lower Y values)
// - Offense at/below LOS (higher Y values)
// 
// MODES:
// - 'run': Shows offense + defense + blocking arrows + ball carrier path
// - 'pass': Shows offense (+ optional defense) + routes
//
// FIELD SPEC: All constants from @/lib/field for regulation accuracy.
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo, useRef } from 'react';
import {
  PlayFieldProps,
  DEFAULT_DIAGRAM_THEME,
  DiagramTheme,
} from './types';
import { DiagramBackground } from './DiagramBackground';
import { DiagramYardLines } from './DiagramYardLines';
import { DiagramHashMarks } from './DiagramHashMarks';
import { DiagramNumbers } from './DiagramNumbers';
import { DiagramLOS } from './DiagramLOS';
import { OffenseLayer } from './OffenseLayer';
import { DefenseLayer } from './DefenseLayer';
import { RoutesLayer } from './RoutesLayer';
import { BlockingLayer } from './BlockingLayer';
import { BallCarrierLayer } from './BallCarrierLayer';
import { DebugOverlay } from './DebugOverlay';
import { DEFAULT_PLAY_WINDOW, createViewBox, type ViewBox } from '@/lib/field';

/**
 * Extended PlayFieldProps with debug option.
 * Extends the base PlayFieldProps from types.ts.
 */
type ExtendedPlayFieldProps = PlayFieldProps & {
  /** Show debug overlay with coordinate info (for regulation validation) */
  showDebug?: boolean;
};

/**
 * PlayField renders a complete playbook-style diagram.
 * 
 * All field geometry is derived from FIELD_SPEC (@/lib/field) for regulation accuracy.
 * 
 * @example Run Play
 * ```tsx
 * <PlayField
 *   mode="run"
 *   offensePlayers={offense}
 *   defensePlayers={defense}
 *   blocking={blockingAssignments}
 *   ballCarrierPath={carrierPath}
 * />
 * ```
 * 
 * @example Pass Play
 * ```tsx
 * <PlayField
 *   mode="pass"
 *   offensePlayers={offense}
 *   routes={passRoutes}
 *   showDefense={false}
 * />
 * ```
 * 
 * @example With Debug Overlay
 * ```tsx
 * <PlayField
 *   mode="pass"
 *   offensePlayers={offense}
 *   routes={passRoutes}
 *   showDebug={true}
 * />
 * ```
 */
export function PlayField({
  mode,
  showDefense,
  hashType = 'NFL', // Default to NFL per requirements
  offensePlayers,
  defensePlayers = [],
  routes = [],
  blocking = [],
  ballCarrierPath,
  viewBox: customViewBox,
  theme: themeOverrides = {},
  className = '',
  showLOS = true,
  losY = DEFAULT_PLAY_WINDOW.LOS_Y, // Use FIELD_SPEC default
  showDebug = false,
}: ExtendedPlayFieldProps) {
  // Ref for debug overlay mouse tracking
  const containerRef = useRef<HTMLDivElement>(null);

  // Merge theme with defaults
  const theme: DiagramTheme = useMemo(
    () => ({ ...DEFAULT_DIAGRAM_THEME, ...themeOverrides }),
    [themeOverrides]
  );

  // Determine if defense should be shown
  // Run plays: always show defense
  // Pass plays: show defense if explicitly requested
  const shouldShowDefense = mode === 'run' || showDefense === true;

  // Default viewBox from FIELD_SPEC - shows the "play window" around the formation
  // Uses createViewBox from FIELD_SPEC for regulation-accurate defaults
  const viewBox: ViewBox = customViewBox || [
    DEFAULT_PLAY_WINDOW.MIN_X,
    DEFAULT_PLAY_WINDOW.MIN_Y,
    DEFAULT_PLAY_WINDOW.WIDTH_YARDS,
    DEFAULT_PLAY_WINDOW.HEIGHT_YARDS,
  ];
  const [minX, minY, width, height] = viewBox;

  // Build viewBox string
  const viewBoxStr = `${minX} ${minY} ${width} ${height}`;

  return (
    <div className={`playfield-container ${className}`}>
      {/*
        CRITICAL: Responsive aspect ratio container
        - Width determined by parent
        - Height derived from viewBox aspect ratio
        - ALWAYS landscape orientation
        - Ref for debug overlay mouse tracking
      */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-[#1A1D21] bg-[#0A0C0F]"
        style={{
          aspectRatio: `${width} / ${height}`,
        }}
      >
        {/*
          CRITICAL: SVG with exact viewBox
          - viewBox matches world coordinates (yards)
          - preserveAspectRatio centers and maintains ratio
          - NO rotate/flip/mirror transforms anywhere
        */}
        <svg
          viewBox={viewBoxStr}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          style={{
            // Prevent any CSS transforms
            transform: 'none',
          }}
        >
          {/* Field background and effects */}
          <DiagramBackground theme={theme} viewBox={viewBox} />

          {/* Yard lines (vertical) */}
          <DiagramYardLines theme={theme} viewBox={viewBox} />

          {/* Hash marks (horizontal ticks) */}
          <DiagramHashMarks theme={theme} viewBox={viewBox} hashType={hashType} />

          {/* Sideline numbers */}
          <DiagramNumbers theme={theme} viewBox={viewBox} />

          {/* Line of Scrimmage */}
          {showLOS && <DiagramLOS y={losY} theme={theme} viewBox={viewBox} />}

          {/* Defense layer (rendered first so offense overlays) */}
          {shouldShowDefense && defensePlayers.length > 0 && (
            <DefenseLayer players={defensePlayers} theme={theme} />
          )}

          {/* Blocking assignments (run plays only) */}
          {mode === 'run' && blocking.length > 0 && shouldShowDefense && (
            <BlockingLayer
              blocking={blocking}
              offensePlayers={offensePlayers}
              defensePlayers={defensePlayers}
              theme={theme}
            />
          )}

          {/* Ball carrier path (run plays only) */}
          {mode === 'run' && ballCarrierPath && (
            <BallCarrierLayer path={ballCarrierPath} theme={theme} />
          )}

          {/* Offense layer */}
          <OffenseLayer players={offensePlayers} theme={theme} />

          {/* Routes (pass plays only) */}
          {mode === 'pass' && routes.length > 0 && (
            <RoutesLayer routes={routes} players={offensePlayers} theme={theme} />
          )}

          {/* Debug overlay for regulation validation */}
          {showDebug && (
            <DebugOverlay
              viewBox={viewBox}
              theme={theme}
              hashType={hashType}
              losY={losY}
              containerRef={containerRef}
            />
          )}
        </svg>

        {/* Mode indicator badge */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              mode === 'run'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-cyan-500/20 text-cyan-400'
            }`}
          >
            {mode === 'run' ? '🏈 Run' : '📡 Pass'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PlayField;







