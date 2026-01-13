// ═══════════════════════════════════════════════════════════════════════════
// FIELD COORDINATES — Football field coordinate system for realistic diagrams
// Creates NFL playbook / All-22 style visualizations
//
// ⚠️ DEPRECATED: This file uses a non-regulation coordinate system.
// 
// FOR NEW CODE: Use @/lib/field instead, which provides:
// - FIELD_DIMENSIONS: Regulation field dimensions in yards
// - HASHMARKS: NFL/NCAA/High School hashmark positions
// - yardToPixel/pixelToYard: Coordinate transforms
// - See src/lib/field/fieldSpec.ts for the single source of truth
//
// This file is maintained for backward compatibility with existing components
// in src/components/football/. New playbook diagrams should use
// src/components/playbook-diagram/ with @/lib/field.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use @/lib/field instead for regulation-accurate coordinates.
 * 
 * Legacy Field Coordinate System:
 * - X axis: 0-100 (sideline to sideline, 50 = center) - NOTE: This is non-standard
 * - Y axis: 0-60 (top of frame to bottom, 40 = LOS) - NOTE: This is arbitrary, not yards
 * - Defense is ABOVE the LOS (y < 40)
 * - Offense is BELOW the LOS (y > 40)
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use FIELD_DIMENSIONS, HASHMARKS, NUMBERS from @/lib/field instead.
 * 
 * This constant uses an arbitrary coordinate system (100x60) that does not
 * represent actual yards. For regulation-accurate field rendering, use
 * the constants in src/lib/field/fieldSpec.ts.
 */
export const FIELD = {
  /** @deprecated Field width in arbitrary units (not yards) */
  WIDTH: 100,
  /** @deprecated Field height in arbitrary units (not yards) */
  HEIGHT: 60,
  /** @deprecated Center of field (X) */
  CENTER_X: 50,
  /** @deprecated Line of Scrimmage (Y position) */
  LOS_Y: 40,
  /** @deprecated Left hash mark X position - NOT regulation accurate */
  LEFT_HASH_X: 35,
  /** @deprecated Right hash mark X position - NOT regulation accurate */
  RIGHT_HASH_X: 65,
  /** @deprecated Left numbers X position */
  LEFT_NUMBERS_X: 15,
  /** @deprecated Right numbers X position */
  RIGHT_NUMBERS_X: 85,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// OFFENSIVE POSITION TEMPLATES
// All positions relative to LOS at y=40, center at x=50
// ═══════════════════════════════════════════════════════════════════════════

export const OFFENSE = {
  /** Center position - on the ball */
  CENTER: { x: 50, y: 40 },
  
  /** Offensive line positions (guard/tackle splits) */
  LINE: {
    LT: { x: 44, y: 40 },
    LG: { x: 47, y: 40 },
    C: { x: 50, y: 40 },
    RG: { x: 53, y: 40 },
    RT: { x: 56, y: 40 },
  },
  
  /** QB depths */
  QB: {
    UNDER_CENTER: { x: 50, y: 42 },
    PISTOL: { x: 50, y: 45 },
    SHOTGUN: { x: 50, y: 48 },
  },
  
  /** RB positions */
  RB: {
    I_FORM_FB: { x: 50, y: 46 },
    I_FORM_TB: { x: 50, y: 52 },
    OFFSET_LEFT: { x: 46, y: 48 },
    OFFSET_RIGHT: { x: 54, y: 48 },
    SINGLE_BACK: { x: 50, y: 52 },
  },
  
  /** Wide receiver positions */
  WR: {
    /** X receiver - split end, wide left near numbers */
    X_WIDE: { x: 15, y: 40 },
    /** Z receiver - flanker, wide right near numbers */
    Z_WIDE: { x: 85, y: 40 },
    /** Slot receivers - between hash and numbers */
    SLOT_LEFT: { x: 30, y: 40 },
    SLOT_RIGHT: { x: 70, y: 40 },
    /** Tight slot positions */
    SLOT_TIGHT_LEFT: { x: 35, y: 40 },
    SLOT_TIGHT_RIGHT: { x: 65, y: 40 },
  },
  
  /** Tight end positions */
  TE: {
    /** Attached TE - just outside RT */
    INLINE_RIGHT: { x: 59, y: 40 },
    INLINE_LEFT: { x: 41, y: 40 },
    /** Flexed/Detached TE */
    FLEXED_RIGHT: { x: 65, y: 40 },
    FLEXED_LEFT: { x: 35, y: 40 },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// DEFENSIVE POSITION TEMPLATES
// All positions relative to LOS at y=40 (defenders above LOS, y < 40)
// ═══════════════════════════════════════════════════════════════════════════

export const DEFENSE = {
  /** Cornerback depths */
  CB: {
    /** Press alignment - 1-2 yards off */
    PRESS_LEFT: { x: 12, y: 38 },
    PRESS_RIGHT: { x: 88, y: 38 },
    /** Off alignment - 7-8 yards off */
    OFF_LEFT: { x: 12, y: 32 },
    OFF_RIGHT: { x: 88, y: 32 },
    /** Bail/Cloud - deeper at 10+ yards */
    BAIL_LEFT: { x: 12, y: 28 },
    BAIL_RIGHT: { x: 88, y: 28 },
  },
  
  /** Safety depths and alignments */
  SAFETY: {
    /** Single high - centered 15 yards deep */
    SINGLE_HIGH: { x: 50, y: 25 },
    /** Two high - split at 12-15 yards */
    TWO_HIGH_LEFT: { x: 32, y: 25 },
    TWO_HIGH_RIGHT: { x: 68, y: 25 },
    /** Quarters safeties - split at 10-12 yards */
    QUARTERS_LEFT: { x: 35, y: 28 },
    QUARTERS_RIGHT: { x: 65, y: 28 },
    /** Strong safety rolled down */
    SS_IN_BOX: { x: 58, y: 36 },
    SS_APEX: { x: 62, y: 34 },
    /** Lurking/Robber */
    ROBBER: { x: 50, y: 32 },
  },
  
  /** Linebacker depths - 4-6 yards off LOS */
  LB: {
    MIKE: { x: 50, y: 35 },
    WILL: { x: 44, y: 36 },
    SAM: { x: 56, y: 36 },
    /** Apex/Nickel - between slot and box */
    APEX_LEFT: { x: 35, y: 34 },
    APEX_RIGHT: { x: 65, y: 34 },
  },
  
  /** Defensive line positions - at or just off LOS */
  DLINE: {
    /** 4-3 front */
    DE_LEFT: { x: 42, y: 39 },
    DT_LEFT: { x: 47, y: 39 },
    DT_RIGHT: { x: 53, y: 39 },
    DE_RIGHT: { x: 58, y: 39 },
    /** 3-4 front */
    NT: { x: 50, y: 39 },
    DE_3_4_LEFT: { x: 44, y: 39 },
    DE_3_4_RIGHT: { x: 56, y: 39 },
    OLB_LEFT: { x: 38, y: 37 },
    OLB_RIGHT: { x: 62, y: 37 },
  },
  
  /** Nickel/Dime positions */
  NICKEL: {
    SLOT_LEFT: { x: 32, y: 34 },
    SLOT_RIGHT: { x: 68, y: 34 },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE CONVERSION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert old domain defensive coordinates to new field coordinates
 * Old: x = -50 to 50, y = -50 to 0 (LOS = 0)
 * New: x = 0 to 100, y = 0 to 60 (LOS = 40)
 */
export function convertDefensiveCoords(oldX: number, oldY: number): { x: number; y: number } {
  // X: -50..50 → 0..100 (add 50)
  const newX = oldX + 50;
  // Y: -50..0 → 0..40 (map -50 to ~0, 0 to 40)
  // oldY is negative (e.g., -18 for deep safety)
  // We want deeper (more negative) to be smaller Y (closer to top)
  // LOS is at y=40, so 0 → 40, -20 → 40 + (-20 * scale)
  const newY = 40 + oldY * 0.75; // Scale factor to fit frame
  return { x: newX, y: Math.max(5, Math.min(39, newY)) };
}

/**
 * Convert old domain offensive coordinates to new field coordinates
 * Old: x = -50 to 50, y = 0 to 50 (LOS = 0)
 * New: x = 0 to 100, y = 0 to 60 (LOS = 40)
 */
export function convertOffensiveCoords(oldX: number, oldY: number): { x: number; y: number } {
  // X: -50..50 → 0..100 (add 50)
  const newX = oldX + 50;
  // Y: 0..50 → 40..60 (LOS at y=40, backfield increases)
  const newY = 40 + oldY * 0.4; // Scale to fit frame
  return { x: newX, y: Math.max(40, Math.min(58, newY)) };
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATION POSITION BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

export interface PositionedPlayer {
  x: number;
  y: number;
  label: string;
  type: 'offense' | 'defense';
  position: string; // e.g., "QB", "FS", "CB", etc.
}

/**
 * Get standard 2x2 offensive formation positions
 */
export function get2x2Formation(qbDepth: 'shotgun' | 'pistol' | 'under' = 'shotgun'): PositionedPlayer[] {
  const qbPos = qbDepth === 'shotgun' ? OFFENSE.QB.SHOTGUN : 
                qbDepth === 'pistol' ? OFFENSE.QB.PISTOL : 
                OFFENSE.QB.UNDER_CENTER;
  
  return [
    // Offensive Line
    { ...OFFENSE.LINE.LT, label: 'LT', type: 'offense', position: 'OL' },
    { ...OFFENSE.LINE.LG, label: 'LG', type: 'offense', position: 'OL' },
    { ...OFFENSE.LINE.C, label: 'C', type: 'offense', position: 'OL' },
    { ...OFFENSE.LINE.RG, label: 'RG', type: 'offense', position: 'OL' },
    { ...OFFENSE.LINE.RT, label: 'RT', type: 'offense', position: 'OL' },
    // QB
    { ...qbPos, label: 'QB', type: 'offense', position: 'QB' },
    // RB
    { ...OFFENSE.RB.OFFSET_RIGHT, label: 'RB', type: 'offense', position: 'RB' },
    // WRs - 2x2
    { ...OFFENSE.WR.X_WIDE, label: 'X', type: 'offense', position: 'WR' },
    { ...OFFENSE.WR.SLOT_LEFT, label: 'H', type: 'offense', position: 'WR' },
    { ...OFFENSE.WR.SLOT_RIGHT, label: 'Y', type: 'offense', position: 'WR' },
    { ...OFFENSE.WR.Z_WIDE, label: 'Z', type: 'offense', position: 'WR' },
  ];
}

/**
 * Get standard 3x1 trips formation positions
 */
export function getTripsFormation(side: 'left' | 'right' = 'right'): PositionedPlayer[] {
  const players: PositionedPlayer[] = [
    // Offensive Line
    { ...OFFENSE.LINE.LT, label: 'LT', type: 'offense', position: 'OL' },
    { ...OFFENSE.LINE.LG, label: 'LG', type: 'offense', position: 'OL' },
    { ...OFFENSE.LINE.C, label: 'C', type: 'offense', position: 'OL' },
    { ...OFFENSE.LINE.RG, label: 'RG', type: 'offense', position: 'OL' },
    { ...OFFENSE.LINE.RT, label: 'RT', type: 'offense', position: 'OL' },
    // QB
    { ...OFFENSE.QB.SHOTGUN, label: 'QB', type: 'offense', position: 'QB' },
    // RB
    { ...OFFENSE.RB.OFFSET_LEFT, label: 'RB', type: 'offense', position: 'RB' },
  ];
  
  if (side === 'right') {
    players.push(
      { ...OFFENSE.WR.X_WIDE, label: 'X', type: 'offense', position: 'WR' },
      { x: 68, y: 40, label: 'H', type: 'offense', position: 'WR' },
      { x: 75, y: 40, label: 'Y', type: 'offense', position: 'WR' },
      { ...OFFENSE.WR.Z_WIDE, label: 'Z', type: 'offense', position: 'WR' },
    );
  } else {
    players.push(
      { ...OFFENSE.WR.X_WIDE, label: 'X', type: 'offense', position: 'WR' },
      { x: 22, y: 40, label: 'H', type: 'offense', position: 'WR' },
      { x: 28, y: 40, label: 'Y', type: 'offense', position: 'WR' },
      { ...OFFENSE.WR.Z_WIDE, label: 'Z', type: 'offense', position: 'WR' },
    );
  }
  
  return players;
}

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE POSITION BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get single-high (Cover 1/3) defensive positions
 */
export function getSingleHighDefense(cornerTechnique: 'press' | 'off' = 'off'): PositionedPlayer[] {
  const cbLeft = cornerTechnique === 'press' ? DEFENSE.CB.PRESS_LEFT : DEFENSE.CB.OFF_LEFT;
  const cbRight = cornerTechnique === 'press' ? DEFENSE.CB.PRESS_RIGHT : DEFENSE.CB.OFF_RIGHT;
  
  return [
    // D-Line (4-3)
    { ...DEFENSE.DLINE.DE_LEFT, label: 'DE', type: 'defense', position: 'DL' },
    { ...DEFENSE.DLINE.DT_LEFT, label: 'DT', type: 'defense', position: 'DL' },
    { ...DEFENSE.DLINE.DT_RIGHT, label: 'DT', type: 'defense', position: 'DL' },
    { ...DEFENSE.DLINE.DE_RIGHT, label: 'DE', type: 'defense', position: 'DL' },
    // Linebackers
    { ...DEFENSE.LB.WILL, label: 'W', type: 'defense', position: 'LB' },
    { ...DEFENSE.LB.MIKE, label: 'M', type: 'defense', position: 'LB' },
    { ...DEFENSE.LB.SAM, label: 'S', type: 'defense', position: 'LB' },
    // Corners
    { ...cbLeft, label: 'CB', type: 'defense', position: 'CB' },
    { ...cbRight, label: 'CB', type: 'defense', position: 'CB' },
    // Single high safety
    { ...DEFENSE.SAFETY.SINGLE_HIGH, label: 'FS', type: 'defense', position: 'S' },
    // Strong safety in box
    { ...DEFENSE.SAFETY.SS_IN_BOX, label: 'SS', type: 'defense', position: 'S' },
  ];
}

/**
 * Get two-high (Cover 2/4) defensive positions
 */
export function getTwoHighDefense(cornerTechnique: 'press' | 'off' = 'off'): PositionedPlayer[] {
  const cbLeft = cornerTechnique === 'press' ? DEFENSE.CB.PRESS_LEFT : DEFENSE.CB.OFF_LEFT;
  const cbRight = cornerTechnique === 'press' ? DEFENSE.CB.PRESS_RIGHT : DEFENSE.CB.OFF_RIGHT;
  
  return [
    // D-Line (4-3)
    { ...DEFENSE.DLINE.DE_LEFT, label: 'DE', type: 'defense', position: 'DL' },
    { ...DEFENSE.DLINE.DT_LEFT, label: 'DT', type: 'defense', position: 'DL' },
    { ...DEFENSE.DLINE.DT_RIGHT, label: 'DT', type: 'defense', position: 'DL' },
    { ...DEFENSE.DLINE.DE_RIGHT, label: 'DE', type: 'defense', position: 'DL' },
    // Linebackers
    { ...DEFENSE.LB.WILL, label: 'W', type: 'defense', position: 'LB' },
    { ...DEFENSE.LB.MIKE, label: 'M', type: 'defense', position: 'LB' },
    { ...DEFENSE.LB.SAM, label: 'S', type: 'defense', position: 'LB' },
    // Corners
    { ...cbLeft, label: 'CB', type: 'defense', position: 'CB' },
    { ...cbRight, label: 'CB', type: 'defense', position: 'CB' },
    // Two high safeties
    { ...DEFENSE.SAFETY.TWO_HIGH_LEFT, label: 'FS', type: 'defense', position: 'S' },
    { ...DEFENSE.SAFETY.TWO_HIGH_RIGHT, label: 'SS', type: 'defense', position: 'S' },
  ];
}

/**
 * Get Cover 0 (zero-high, all blitz) defensive positions
 */
export function getCover0Defense(): PositionedPlayer[] {
  return [
    // D-Line
    { ...DEFENSE.DLINE.DE_LEFT, label: 'DE', type: 'defense', position: 'DL' },
    { ...DEFENSE.DLINE.DT_LEFT, label: 'DT', type: 'defense', position: 'DL' },
    { ...DEFENSE.DLINE.DT_RIGHT, label: 'DT', type: 'defense', position: 'DL' },
    { ...DEFENSE.DLINE.DE_RIGHT, label: 'DE', type: 'defense', position: 'DL' },
    // Linebackers - mugged up
    { x: 48, y: 38, label: 'W', type: 'defense', position: 'LB' },
    { x: 50, y: 37, label: 'M', type: 'defense', position: 'LB' },
    { x: 52, y: 38, label: 'S', type: 'defense', position: 'LB' },
    // Corners - press
    { ...DEFENSE.CB.PRESS_LEFT, label: 'CB', type: 'defense', position: 'CB' },
    { ...DEFENSE.CB.PRESS_RIGHT, label: 'CB', type: 'defense', position: 'CB' },
    // Safeties walked up
    { x: 45, y: 36, label: 'FS', type: 'defense', position: 'S' },
    { x: 55, y: 36, label: 'SS', type: 'defense', position: 'S' },
  ];
}

export default {
  FIELD,
  OFFENSE,
  DEFENSE,
  convertDefensiveCoords,
  convertOffensiveCoords,
  get2x2Formation,
  getTripsFormation,
  getSingleHighDefense,
  getTwoHighDefense,
  getCover0Defense,
};








