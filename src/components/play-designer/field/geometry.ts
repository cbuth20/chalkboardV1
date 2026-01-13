// ═══════════════════════════════════════════════════════════════════════════
// FIELD GEOMETRY — World coordinate system in yards for the Chalkboard field
// This is the single source of truth for all field math
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Official football field dimensions in yards
 * World coordinate system:
 * - X-axis: 0 → 120 (100-yard field + two 10-yard end zones)
 * - Y-axis: 0 → 53.3 (official field width: 160 feet = 53.33 yards)
 */
export const FIELD_DIMENSIONS = {
  /** Total field length including end zones (yards) */
  LENGTH: 120,
  /** Field width (yards) - 160 feet = 53.33 yards */
  WIDTH: 53.3,
  /** End zone depth (yards) */
  END_ZONE_DEPTH: 10,
  /** Start of playing field (after first end zone) */
  FIELD_START: 10,
  /** End of playing field (before second end zone) */
  FIELD_END: 110,
} as const;

/**
 * Hash mark positions from each sideline
 * NFL: 70' 9" from sideline = ~23.58 yards, separation = 18' 6" = ~6.17 yards
 * Youth: Single center hash (middle of field)
 */
export const HASH_MARKS = {
  NFL: {
    /** Distance from sideline to hash (yards) */
    DISTANCE_FROM_SIDELINE: 23.58,
    /** Separation between left and right hash (yards) */
    SEPARATION: 6.17,
    /** Y position of left hash (from bottom/south sideline) */
    LEFT_HASH_Y: 23.58,
    /** Y position of right hash (from bottom/south sideline) */
    RIGHT_HASH_Y: 53.3 - 23.58, // ~29.72
  },
  YOUTH: {
    /** Youth uses single center hash */
    CENTER_HASH_Y: 53.3 / 2, // 26.65
  },
} as const;

/**
 * Numbers position - 12 yards from each sideline
 */
export const NUMBERS = {
  /** Distance from sideline to numbers (yards) */
  DISTANCE_FROM_SIDELINE: 12,
  /** Y position of numbers near bottom/south sideline */
  BOTTOM_Y: 12,
  /** Y position of numbers near top/north sideline */
  TOP_Y: 53.3 - 12, // 41.3
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE CONVERSION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export type Point = { x: number; y: number };

/**
 * Convert yard coordinates to SVG coordinates
 * Since we use viewBox="0 0 120 53.3", this is a 1:1 mapping
 * but kept for semantic clarity and potential future transformations
 */
export function yardToSvgX(xYards: number): number {
  return xYards;
}

export function yardToSvgY(yYards: number): number {
  return yYards;
}

export function yardToSvg(point: Point): Point {
  return {
    x: yardToSvgX(point.x),
    y: yardToSvgY(point.y),
  };
}

/**
 * Convert SVG coordinates back to yards
 */
export function svgToYardX(svgX: number): number {
  return svgX;
}

export function svgToYardY(svgY: number): number {
  return svgY;
}

export function svgToYard(point: Point): Point {
  return {
    x: svgToYardX(point.x),
    y: svgToYardY(point.y),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GRID SNAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Snap a point to the nearest yard grid intersection
 * @param point - Point in yard coordinates
 * @param gridSize - Grid size in yards (default 1 yard)
 * @returns Snapped point
 */
export function snapToYard(point: Point, gridSize: number = 1): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Snap to half-yard grid for more precise placement
 */
export function snapToHalfYard(point: Point): Point {
  return snapToYard(point, 0.5);
}

/**
 * Clamp a point to stay within field bounds
 */
export function clampToField(point: Point): Point {
  return {
    x: Math.max(0, Math.min(FIELD_DIMENSIONS.LENGTH, point.x)),
    y: Math.max(0, Math.min(FIELD_DIMENSIONS.WIDTH, point.y)),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HASH MARK HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export type HashType = 'NFL' | 'YOUTH';

/**
 * Get hash Y positions for a given hash type
 */
export function getHashY(hashType: HashType, side: 'left' | 'right' | 'center'): number {
  if (hashType === 'YOUTH') {
    return HASH_MARKS.YOUTH.CENTER_HASH_Y;
  }

  switch (side) {
    case 'left':
      return HASH_MARKS.NFL.LEFT_HASH_Y;
    case 'right':
      return HASH_MARKS.NFL.RIGHT_HASH_Y;
    case 'center':
      return FIELD_DIMENSIONS.WIDTH / 2;
  }
}

/**
 * Get all hash Y positions for a hash type
 */
export function getAllHashY(hashType: HashType): number[] {
  if (hashType === 'YOUTH') {
    return [HASH_MARKS.YOUTH.CENTER_HASH_Y];
  }
  return [HASH_MARKS.NFL.LEFT_HASH_Y, HASH_MARKS.NFL.RIGHT_HASH_Y];
}

// ═══════════════════════════════════════════════════════════════════════════
// YARD LINE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get X positions for all yard lines (every 5 yards)
 * Returns positions from the 5-yard line to the 115-yard line
 */
export function getYardLinePositions(): number[] {
  const positions: number[] = [];
  // Every 5 yards from end zone to end zone
  for (let x = 5; x <= 115; x += 5) {
    positions.push(x);
  }
  return positions;
}

/**
 * Get X positions for major yard lines (every 10 yards)
 */
export function getMajorYardLinePositions(): number[] {
  const positions: number[] = [];
  for (let x = 10; x <= 110; x += 10) {
    positions.push(x);
  }
  return positions;
}

/**
 * Convert yard line X position to yard number (0-50-0)
 * E.g., x=20 → "10", x=60 → "50", x=80 → "30"
 */
export function yardLineToNumber(x: number): number {
  // Remove end zones (10 yards each)
  const fieldX = x - 10;
  
  if (fieldX <= 50) {
    return fieldX;
  } else {
    return 100 - fieldX;
  }
}

/**
 * Check if a yard line is a major line (every 10 yards, numbers shown)
 */
export function isMajorYardLine(x: number): boolean {
  return x % 10 === 0 && x >= 10 && x <= 110;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALIGNMENT PRESETS
// These are reference positions for common player alignments
// ═══════════════════════════════════════════════════════════════════════════

export const ALIGNMENT_PRESETS = {
  WR: {
    /** Outside numbers (near sideline) */
    OUTSIDE_NUMBERS_BOTTOM: { x: 0, y: NUMBERS.BOTTOM_Y - 5 },
    OUTSIDE_NUMBERS_TOP: { x: 0, y: NUMBERS.TOP_Y + 5 },
    /** Top of numbers */
    TOP_OF_NUMBERS_BOTTOM: { x: 0, y: NUMBERS.BOTTOM_Y },
    TOP_OF_NUMBERS_TOP: { x: 0, y: NUMBERS.TOP_Y },
    /** Bottom of numbers */
    BOTTOM_OF_NUMBERS_BOTTOM: { x: 0, y: NUMBERS.BOTTOM_Y + 4 },
    BOTTOM_OF_NUMBERS_TOP: { x: 0, y: NUMBERS.TOP_Y - 4 },
  },
  SLOT: {
    /** Apex between defenders (relative position, needs LOS X) */
    APEX_WIDTH_FROM_CENTER: 8,
  },
  TE: {
    /** Attached to tackle */
    ATTACHED_OFFSET: 1.5,
    /** Wing alignment */
    WING_OFFSET: 3,
    /** Off-ball/detached */
    OFF_BALL_OFFSET: 5,
  },
  RB: {
    /** Dot position (7-7.5 yards deep) */
    DOT_DEPTH: 7.25,
    /** Offset position (4.5-5 yards deep) */
    OFFSET_DEPTH: 4.75,
    /** Offset lateral distance from center */
    OFFSET_WIDTH: 3,
  },
  QB: {
    /** Under center */
    UNDER_CENTER_DEPTH: 0.5,
    /** Pistol */
    PISTOL_DEPTH: 4,
    /** Shotgun */
    SHOTGUN_DEPTH: 5,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// VIEW/ZOOM HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export type ViewState = {
  scale: number;   // Zoom factor (1 = 100%)
  offsetX: number; // World-space translation in yards
  offsetY: number; // World-space translation in yards
};

/**
 * Default view state (full field, no zoom)
 */
export const DEFAULT_VIEW_STATE: ViewState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

/**
 * Calculate view state to center on a specific yard line
 * Useful for centering on the LOS
 * @param losX - Line of scrimmage X position in yards
 * @param visibleWidth - How many yards to show horizontally
 */
export function centerOnLOS(losX: number, visibleWidth: number = 50): ViewState {
  const scale = FIELD_DIMENSIONS.LENGTH / visibleWidth;
  const offsetX = losX - visibleWidth / 2;
  return {
    scale,
    offsetX: -offsetX * scale,
    offsetY: 0,
  };
}

/**
 * Calculate the SVG transform string for a view state
 */
export function viewStateToTransform(view: ViewState): string {
  return `translate(${view.offsetX} ${view.offsetY}) scale(${view.scale})`;
}

/**
 * Clamp scale to reasonable bounds
 */
export function clampScale(scale: number, min: number = 0.5, max: number = 4): number {
  return Math.max(min, Math.min(max, scale));
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTANCE/MEASUREMENT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate distance between two points in yards
 */
export function distanceYards(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points in degrees
 */
export function angleDegrees(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
}

export default {
  FIELD_DIMENSIONS,
  HASH_MARKS,
  NUMBERS,
  ALIGNMENT_PRESETS,
  DEFAULT_VIEW_STATE,
  yardToSvgX,
  yardToSvgY,
  yardToSvg,
  svgToYardX,
  svgToYardY,
  svgToYard,
  snapToYard,
  snapToHalfYard,
  clampToField,
  getHashY,
  getAllHashY,
  getYardLinePositions,
  getMajorYardLinePositions,
  yardLineToNumber,
  isMajorYardLine,
  centerOnLOS,
  viewStateToTransform,
  clampScale,
  distanceYards,
  angleDegrees,
};








