// ═══════════════════════════════════════════════════════════════════════════════════════════
// FIELD SPEC — Single Source of Truth for Football Field Geometry
//
// This module defines the CANONICAL field dimensions, hashmark positions, and coordinate
// system for all Chalkboard field renderers. NO OTHER FILE should define field constants.
//
// COORDINATE SYSTEM (LANDSCAPE VIEW):
// - X-axis: 0 → 100 yards (field length, goal line to goal line)
// - Y-axis: 0 → 53.333 yards (field width, sideline to sideline)
// - Offense attacks toward POSITIVE X (left to right)
// - Y = 0 is the TOP sideline, Y = 53.333 is the BOTTOM sideline
// - LOS is a HORIZONTAL line at a specific Y value within the play window
//
// IMPORTANT: All values are in YARDS unless explicitly noted otherwise.
// ═══════════════════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════════════════
// CORE FIELD DIMENSIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Official football field dimensions in yards.
 * These values are NFL/NCAA regulation and must not be changed.
 */
export const FIELD_DIMENSIONS = {
  /** Field length from goal line to goal line (yards) */
  LENGTH_YARDS: 100,

  /** Field width from sideline to sideline (yards) - 160 feet = 53.333 yards */
  WIDTH_YARDS: 53.333,

  /** End zone depth (yards) - 10 yards each */
  ENDZONE_DEPTH_YARDS: 10,

  /** Total length including both end zones (yards) */
  TOTAL_LENGTH_YARDS: 120,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// HASHMARK SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Hashmark standard types
 */
export type HashStandard = 'NFL' | 'NCAA' | 'HIGH_SCHOOL';

/**
 * Hashmark positions for each standard.
 * 
 * NFL: 70'9" from sideline = 23.583 yards
 * NCAA: 60' from sideline = 20 yards  
 * High School: 53'4" from sideline = 17.778 yards
 *
 * In our coordinate system (Y=0 is top sideline):
 * - left_hash_y = distance from top sideline
 * - right_hash_y = FIELD_WIDTH - distance from bottom sideline
 */
export const HASHMARKS = {
  NFL: {
    /** Distance from each sideline to the hash (yards) */
    DISTANCE_FROM_SIDELINE_YARDS: 23.583,
    /** Y position of left/top hash (yards from top sideline) */
    LEFT_HASH_Y: 23.583,
    /** Y position of right/bottom hash (yards from top sideline) */
    RIGHT_HASH_Y: 29.75, // 53.333 - 23.583
    /** Separation between hashes (yards) */
    SEPARATION_YARDS: 6.167, // 18'6" = 6.167 yards
  },
  NCAA: {
    DISTANCE_FROM_SIDELINE_YARDS: 20.0,
    LEFT_HASH_Y: 20.0,
    RIGHT_HASH_Y: 33.333, // 53.333 - 20
    SEPARATION_YARDS: 13.333, // 40 feet = 13.333 yards
  },
  HIGH_SCHOOL: {
    DISTANCE_FROM_SIDELINE_YARDS: 17.778,
    LEFT_HASH_Y: 17.778,
    RIGHT_HASH_Y: 35.556, // 53.333 - 17.778
    SEPARATION_YARDS: 17.778, // 53'4" apart
  },
} as const;

/**
 * Get hashmark Y positions for a given standard.
 * Returns [leftHashY, rightHashY] in yards.
 */
export function getHashmarkPositions(standard: HashStandard): [number, number] {
  const spec = HASHMARKS[standard];
  return [spec.LEFT_HASH_Y, spec.RIGHT_HASH_Y];
}

/**
 * Get center of field Y position (always the same regardless of hash standard)
 */
export function getCenterY(): number {
  return FIELD_DIMENSIONS.WIDTH_YARDS / 2; // 26.667 yards
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// YARD LINE SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const YARDLINES = {
  /** Interval for yard lines (yards) */
  INTERVAL_YARDS: 5,

  /** Interval for labeled yard lines / numbers (yards) */
  LABEL_INTERVAL_YARDS: 10,

  /** Goal line X positions */
  LEFT_GOAL_LINE_X: 0,
  RIGHT_GOAL_LINE_X: 100,
} as const;

/**
 * Get all yard line X positions within a range.
 * @param minX - Minimum X value (yards)
 * @param maxX - Maximum X value (yards)
 * @returns Array of X positions for yard lines
 */
export function getYardLinePositions(minX: number, maxX: number): number[] {
  const positions: number[] = [];
  const startX = Math.ceil(minX / YARDLINES.INTERVAL_YARDS) * YARDLINES.INTERVAL_YARDS;
  for (let x = startX; x <= maxX; x += YARDLINES.INTERVAL_YARDS) {
    if (x >= 0 && x <= FIELD_DIMENSIONS.LENGTH_YARDS) {
      positions.push(x);
    }
  }
  return positions;
}

/**
 * Check if a yard line should be labeled (every 10 yards)
 */
export function isLabeledYardLine(x: number): boolean {
  return x % YARDLINES.LABEL_INTERVAL_YARDS === 0 && x > 0 && x < FIELD_DIMENSIONS.LENGTH_YARDS;
}

/**
 * Convert yard line X position to display number (0-50-0 format).
 * E.g., X=20 → "20", X=60 → "40", X=50 → "50"
 */
export function yardLineToDisplayNumber(x: number): number {
  if (x <= 50) {
    return x;
  }
  return 100 - x;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// SIDELINE NUMBERS SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const NUMBERS = {
  /** Distance from sideline to yard numbers (yards) - approximately 6 yards / 18 feet */
  DISTANCE_FROM_SIDELINE_YARDS: 6,

  /** Y position of numbers near top sideline */
  TOP_Y: 6,

  /** Y position of numbers near bottom sideline */
  BOTTOM_Y: 47.333, // 53.333 - 6
} as const;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PLAY WINDOW (DEFAULT VIEWPORT)
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Default play window configuration.
 * A "play window" is the visible portion of the field in a diagram.
 */
export const DEFAULT_PLAY_WINDOW = {
  /** Width of play window in yards (X-axis, field length direction) */
  WIDTH_YARDS: 50,

  /** Height of play window in yards (Y-axis, field width direction) */
  HEIGHT_YARDS: 40,

  /** Default LOS X position (center of field length) */
  DEFAULT_LOS_X: 50,

  /** LOS Y position within the play window (offense below, defense above) */
  LOS_Y: 35,

  /** Minimum X (left edge of default view) */
  MIN_X: 25,

  /** Minimum Y (top edge of default view) */
  MIN_Y: 10,
} as const;

/**
 * Generate a viewBox array for SVG rendering.
 * @param losX - Line of scrimmage X position (yards)
 * @param windowWidth - Play window width (yards)
 * @param windowHeight - Play window height (yards)
 * @returns [minX, minY, width, height] viewBox tuple
 */
export function createViewBox(
  losX: number = DEFAULT_PLAY_WINDOW.DEFAULT_LOS_X,
  windowWidth: number = DEFAULT_PLAY_WINDOW.WIDTH_YARDS,
  windowHeight: number = DEFAULT_PLAY_WINDOW.HEIGHT_YARDS
): [number, number, number, number] {
  // Center the window horizontally on the LOS
  const minX = losX - windowWidth / 2;
  // Position vertically to show offense and defense around LOS
  const minY = DEFAULT_PLAY_WINDOW.MIN_Y;
  return [minX, minY, windowWidth, windowHeight];
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * A point in field coordinates (yards).
 * This is the canonical coordinate type for all field-related calculations.
 */
export type FieldPoint = {
  /** X position in yards (0-100, field length) */
  x: number;
  /** Y position in yards (0-53.333, field width) */
  y: number;
};

/**
 * ViewBox tuple type for SVG rendering.
 */
export type ViewBox = [minX: number, minY: number, width: number, height: number];

/**
 * Field specification summary for documentation/validation.
 */
export const FIELD_SPEC_SUMMARY = {
  version: '1.0.0',
  coordinateSystem: {
    xAxis: 'field_length (0-100 yards, goal line to goal line)',
    yAxis: 'field_width (0-53.333 yards, sideline to sideline)',
    origin: 'top-left (X=0 at left goal line, Y=0 at top sideline)',
    offenseDirection: 'positive_x (left to right)',
  },
  dimensions: FIELD_DIMENSIONS,
  defaultHashStandard: 'NFL' as HashStandard,
  yardLines: YARDLINES,
  numbers: NUMBERS,
  defaultPlayWindow: DEFAULT_PLAY_WINDOW,
} as const;
