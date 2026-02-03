// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK DIAGRAM TYPES — Type definitions for traditional playbook diagrams
// 
// COORDINATE SYSTEM (LOCKED IN — see src/lib/field/fieldSpec.ts):
// - X-axis: 0 → 100 yards (field length, goal line to goal line)
// - Y-axis: 0 → 53.333 yards (field width, sideline to sideline)
// - svgX = X (direct 1:1 mapping)
// - svgY = Y (direct 1:1 mapping)
// 
// DIAGRAM ORIENTATION:
// - Horizontal/landscape field (like TV broadcast and playbook sheets)
// - Offense attacks toward positive X (left to right)
// - Defense ABOVE offense (lower Y values)
// - LOS at approximately Y ≈ 35 (offense at/below, defense above)
//
// SINGLE SOURCE OF TRUTH: All field constants come from @/lib/field
// ═══════════════════════════════════════════════════════════════════════════

import type { FieldPoint, ViewBox, HashStandard } from '@/lib/field';
import type { PlayerAssignment, PlayerResponsibility } from '@/types/play-assignments';

// Re-export types from field spec for convenience
export type { FieldPoint, ViewBox, HashStandard };

// ═══════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A point in world (yard) coordinates.
 * @deprecated Use FieldPoint from @/lib/field instead
 */
export type Point = {
  x: number; // 0-100 yards (horizontal)
  y: number; // 0-53.333 yards (vertical)
};

/**
 * Hash mark type for field rendering.
 * NFL: 23.58 yards from sideline (professional/college default)
 * NCAA: 20 yards from sideline (alternate college width)
 * HIGH_SCHOOL: 17.78 yards from sideline
 */
export type HashType = HashStandard;

/**
 * Play mode - determines what layers to show
 */
export type PlayMode = 'run' | 'pass';

/**
 * Player side/team
 */
export type PlayerSide = 'offense' | 'defense';

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Player data for rendering on the field
 */
export type DiagramPlayer = {
  id: string;
  /** Position label (QB, RB, WR, CB, etc.) */
  label: string;
  /** Team side */
  side: PlayerSide;
  /** Position in yard coordinates */
  x: number;
  y: number;
  /** Optional custom color override */
  color?: string;
  /** Optional position group (for styling) */
  group?: 'line' | 'skill' | 'backfield' | 'secondary' | 'linebacker';

  // NEW: Structured Play Builder fields
  /** Structured assignment (route, block, coverage, etc.) */
  assignment?: PlayerAssignment;
  /** Full responsibility with coaching notes and AI inclusion */
  responsibility?: PlayerResponsibility;
  /** Position name (WR, QB, LB, etc.) */
  position?: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Route definition for pass plays
 */
export type DiagramRoute = {
  /** ID of the player running this route */
  playerId: string;
  /** Path points in yard coordinates */
  points: Point[];
  /** Route name/label (optional) */
  label?: string;
  /** Custom color override */
  color?: string;
  /** Line style */
  style?: 'solid' | 'dashed';
};

// ═══════════════════════════════════════════════════════════════════════════
// BLOCKING TYPES (FOR RUN PLAYS)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Blocking assignment for run plays
 */
export type BlockingAssignment = {
  /** ID of the blocking player (usually OL/TE/FB) */
  blockerId: string;
  /** ID of the player being blocked (usually DL/LB) */
  targetId: string;
  /** Type of block */
  type: 'drive' | 'reach' | 'down' | 'pull' | 'trap' | 'lead' | 'kick-out' | 'combo';
  /** Custom color override */
  color?: string;
};

/**
 * Ball carrier path for run plays
 */
export type BallCarrierPath = {
  /** ID of the ball carrier */
  playerId: string;
  /** Path points */
  points: Point[];
  /** Optional read points (for option plays) */
  readPoints?: Point[];
};

// ═══════════════════════════════════════════════════════════════════════════
// THEME/STYLING TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Theme configuration for diagram styling
 */
export type DiagramTheme = {
  /** Dark background color */
  backgroundColor: string;
  /** Field area color */
  fieldColor: string;
  /** Yard line color */
  yardLineColor: string;
  /** Major yard line color (every 10 yards) */
  majorYardLineColor: string;
  /** Hash mark color */
  hashMarkColor: string;
  /** Sideline numbers color */
  numbersColor: string;
  /** Number box background color */
  numberBoxColor: string;
  /** Offense player color */
  offenseColor: string;
  /** Defense player color */
  defenseColor: string;
  /** Route color */
  routeColor: string;
  /** Blocking arrow color */
  blockingColor: string;
  /** Ball carrier path color */
  ballCarrierColor: string;
  /** LOS line color */
  losColor: string;
  /** Glow/accent color */
  glowColor: string;
};

/**
 * Default Chalkboard dark theme
 */
export const DEFAULT_DIAGRAM_THEME: DiagramTheme = {
  backgroundColor: '#0A0C0F',
  fieldColor: '#0D1117',
  yardLineColor: 'rgba(0, 246, 229, 0.06)',
  majorYardLineColor: 'rgba(0, 246, 229, 0.12)',
  hashMarkColor: 'rgba(0, 246, 229, 0.08)',
  numbersColor: 'rgba(100, 116, 139, 0.25)',
  numberBoxColor: 'rgba(30, 40, 50, 0.3)',
  offenseColor: '#00F6E5',
  defenseColor: '#EF4444',
  routeColor: '#00F6E5',
  blockingColor: '#F5C253',
  ballCarrierColor: '#A855F7',
  losColor: '#F5C253',
  glowColor: '#00F6E5',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Props for the main PlayField component
 */
export type PlayFieldProps = {
  /** Play mode - 'run' shows blocking, 'pass' shows routes */
  mode: PlayMode;
  /** Whether to show defense (always true for run, optional for pass) */
  showDefense?: boolean;
  /** Hash mark type */
  hashType?: HashType;
  /** Offensive players */
  offensePlayers: DiagramPlayer[];
  /** Defensive players */
  defensePlayers?: DiagramPlayer[];
  /** Routes for pass plays */
  routes?: DiagramRoute[];
  /** Blocking assignments for run plays */
  blocking?: BlockingAssignment[];
  /** Ball carrier path for run plays */
  ballCarrierPath?: BallCarrierPath;
  /** Custom viewBox bounds [minX, minY, width, height] */
  viewBox?: [number, number, number, number];
  /** Theme overrides */
  theme?: Partial<DiagramTheme>;
  /** Additional CSS class */
  className?: string;
  /** Show LOS line */
  showLOS?: boolean;
  /** LOS Y position in yards */
  losY?: number;
};

/**
 * Props for DiagramBackground
 */
export type DiagramBackgroundProps = {
  theme: DiagramTheme;
  viewBox: [number, number, number, number];
};

/**
 * Props for DiagramYardLines
 */
export type DiagramYardLinesProps = {
  theme: DiagramTheme;
  viewBox: [number, number, number, number];
};

/**
 * Props for DiagramHashMarks
 */
export type DiagramHashMarksProps = {
  theme: DiagramTheme;
  viewBox: [number, number, number, number];
  hashType: HashType;
};

/**
 * Props for DiagramNumbers
 */
export type DiagramNumbersProps = {
  theme: DiagramTheme;
  viewBox: [number, number, number, number];
};

/**
 * Props for OffenseLayer
 */
export type OffenseLayerProps = {
  players: DiagramPlayer[];
  theme: DiagramTheme;
};

/**
 * Props for DefenseLayer
 */
export type DefenseLayerProps = {
  players: DiagramPlayer[];
  theme: DiagramTheme;
};

/**
 * Props for RoutesLayer
 */
export type RoutesLayerProps = {
  routes: DiagramRoute[];
  players: DiagramPlayer[];
  theme: DiagramTheme;
};

/**
 * Props for BlockingLayer
 */
export type BlockingLayerProps = {
  blocking: BlockingAssignment[];
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
  theme: DiagramTheme;
};

/**
 * Props for BallCarrierLayer
 */
export type BallCarrierLayerProps = {
  path: BallCarrierPath;
  theme: DiagramTheme;
};

/**
 * Props for LOSLine
 */
export type DiagramLOSProps = {
  y: number;
  theme: DiagramTheme;
  viewBox: [number, number, number, number];
};







