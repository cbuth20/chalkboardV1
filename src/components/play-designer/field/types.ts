// ═══════════════════════════════════════════════════════════════════════════
// FIELD TYPES — TypeScript definitions for the FootballField component system
// ═══════════════════════════════════════════════════════════════════════════

import { ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A point in world (yard) coordinates
 */
export type Point = {
  x: number; // 0-120 yards
  y: number; // 0-53.3 yards
};

/**
 * Hash mark type for field rendering
 */
export type HashType = 'NFL' | 'YOUTH';

/**
 * View state for zoom/pan functionality
 */
export type ViewState = {
  scale: number;   // Zoom factor (1 = 100%, 2 = 200%, etc.)
  offsetX: number; // Translation in world units (yards)
  offsetY: number; // Translation in world units (yards)
};

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Player side/team
 */
export type PlayerSide = 'offense' | 'defense';

/**
 * Player data for rendering on the field
 */
export type Player = {
  id: string;
  label: string;
  side: PlayerSide;
  position: Point;
  color?: string;
  /** Optional position type (e.g., QB, WR, CB) */
  positionType?: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Point along a route with optional type annotation
 */
export type RoutePoint = Point & {
  type?: 'start' | 'break' | 'end';
};

/**
 * Complete route definition
 */
export type Route = {
  playerId: string;
  points: RoutePoint[];
  routeType: string;
  color: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// THEME/STYLING TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Theme configuration for field styling
 * Use CSS custom properties or pass explicit values
 */
export type FieldTheme = {
  /** Field background color */
  backgroundColor: string;
  /** Yard line color */
  yardLineColor: string;
  /** Major yard line color (every 10 yards) */
  majorYardLineColor: string;
  /** Hash mark color */
  hashMarkColor: string;
  /** Numbers color */
  numbersColor: string;
  /** LOS line color */
  losColor: string;
  /** End zone fill color */
  endZoneColor: string;
  /** Grid line color (if debug grid shown) */
  gridColor: string;
};

/**
 * Default Chalkboard theme
 */
export const DEFAULT_THEME: FieldTheme = {
  backgroundColor: '#0d1117',
  yardLineColor: 'rgba(0, 246, 229, 0.08)',
  majorYardLineColor: 'rgba(0, 246, 229, 0.12)',
  hashMarkColor: 'rgba(0, 246, 229, 0.1)',
  numbersColor: 'rgba(100, 116, 139, 0.4)',
  losColor: '#F5C253',
  endZoneColor: 'rgba(0, 246, 229, 0.03)',
  gridColor: 'rgba(0, 246, 229, 0.03)',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Props for the main FootballField component
 */
export type FootballFieldProps = {
  /** Hash mark type */
  hashType?: HashType;
  /** Line of scrimmage X position in yards (0-120) */
  losX?: number;
  /** Whether to show the LOS line */
  showLOS?: boolean;
  /** Whether to show depth reference lines behind LOS */
  showDepthLines?: boolean;
  /** Whether to show end zones */
  showEndZones?: boolean;
  /** Whether to show yard numbers */
  showNumbers?: boolean;
  /** Whether to show debug grid */
  showGrid?: boolean;
  /** Custom theme overrides */
  theme?: Partial<FieldTheme>;
  /** Child elements (players, routes, etc.) */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Initial view state */
  initialViewState?: Partial<ViewState>;
  /** Callback when view state changes */
  onViewStateChange?: (viewState: ViewState) => void;
  /** Disable zoom/pan controls */
  disableZoomPan?: boolean;
  /** Click handler for field (for placing elements) */
  onFieldClick?: (point: Point) => void;
  /** Enable touch/gesture support */
  enableTouchGestures?: boolean;
};

/**
 * Props for FieldBackground subcomponent
 */
export type FieldBackgroundProps = {
  theme: FieldTheme;
  showEndZones: boolean;
};

/**
 * Props for YardLines subcomponent
 */
export type YardLinesProps = {
  theme: FieldTheme;
};

/**
 * Props for HashMarks subcomponent
 */
export type HashMarksProps = {
  type: HashType;
  theme: FieldTheme;
};

/**
 * Props for Numbers subcomponent
 */
export type NumbersProps = {
  theme: FieldTheme;
};

/**
 * Props for LOSLine subcomponent
 */
export type LOSLineProps = {
  x: number; // X position in yards
  showDepthLines: boolean;
  theme: FieldTheme;
};

/**
 * Props for Grid subcomponent (debug)
 */
export type GridProps = {
  theme: FieldTheme;
};

/**
 * Props for Players subcomponent
 */
export type PlayersProps = {
  players: Player[];
  selectedPlayerId?: string | null;
  onSelectPlayer?: (id: string | null) => void;
  /** Size of player visual marker in yards */
  markerSize?: number;
  /** Size of touch hitbox in yards */
  hitboxSize?: number;
};

/**
 * Props for Routes subcomponent
 */
export type RoutesProps = {
  routes: Route[];
  /** Whether routes are interactive */
  interactive?: boolean;
};

/**
 * Props for ZoomControls subcomponent
 */
export type ZoomControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  currentScale: number;
  minScale?: number;
  maxScale?: number;
  className?: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Return type for useViewState hook
 */
export type UseViewStateReturn = {
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: (centerX?: number) => void;
  panTo: (x: number, y: number) => void;
  /** Transform string for SVG <g> element */
  transform: string;
  /** Whether zoom controls are at min/max */
  canZoomIn: boolean;
  canZoomOut: boolean;
};

/**
 * Options for useViewState hook
 */
export type UseViewStateOptions = {
  initialState?: Partial<ViewState>;
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  /** Whether to persist view state */
  persist?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
};








