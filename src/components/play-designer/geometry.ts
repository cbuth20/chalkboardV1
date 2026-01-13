// ═══════════════════════════════════════════════════════════════════════════
// ROUTE GEOMETRY — Maps route assignments to SVG polylines for the play field
// Converts routeId + depth + player position → drawable points
// ═══════════════════════════════════════════════════════════════════════════

export type Point = { x: number; y: number };

export type PlayerPosition = {
  x: number; // in yards relative to ball (sideline-to-sideline, 0 = center)
  y: number; // in yards from LOS (positive = backfield, negative = downfield)
};

export type Level = 'youth' | 'nfl';
export type RouteDirection = 'left' | 'right' | 'auto';

export type PlayerRouteAssignment = {
  playerId: string;
  routeId: string;     // must exist in ROUTE_LIBRARY: 'slant', 'curl_10', 'rb_angle', etc.
  depth: number;       // chosen depth in yards
  level: Level;
  direction: RouteDirection; // which way the route breaks (left, right, or auto based on position)
};

// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE CONVERSION
// The play field SVG uses pixel coordinates with:
// - viewBox="0 0 800 450"
// - LOS at y=260
// - Center at x=400
// - Offense below LOS (higher y values)
// - Defense above LOS (lower y values)
// ═══════════════════════════════════════════════════════════════════════════

const FIELD_CONFIG = {
  /** Pixels per yard - tweak to fit field size */
  YARDS_TO_PX: 8,
  /** Center of field in pixels */
  CENTER_X: 400,
  /** Line of scrimmage Y position in pixels */
  LOS_Y: 260,
  /** Field width in pixels */
  WIDTH: 800,
  /** Field height in pixels */
  HEIGHT: 450,
};

/**
 * Convert yards to pixels.
 * - x: yards from center (negative = left, positive = right)
 * - y: yards from LOS (negative = downfield/defense side, positive = backfield)
 */
export function yardsToPixels(xYards: number, yYards: number): Point {
  return {
    x: FIELD_CONFIG.CENTER_X + xYards * FIELD_CONFIG.YARDS_TO_PX,
    y: FIELD_CONFIG.LOS_Y + yYards * FIELD_CONFIG.YARDS_TO_PX,
  };
}

/**
 * Convert pixel position to yard position relative to center/LOS
 */
export function pixelsToYards(xPx: number, yPx: number): PlayerPosition {
  return {
    x: (xPx - FIELD_CONFIG.CENTER_X) / FIELD_CONFIG.YARDS_TO_PX,
    y: (yPx - FIELD_CONFIG.LOS_Y) / FIELD_CONFIG.YARDS_TO_PX,
  };
}

/**
 * Convert a point in yards to pixels
 */
function toPx(p: Point): Point {
  return yardsToPixels(p.x, p.y);
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE GEOMETRY BUILDERS
// All routes assume:
// - Offense is going "up" (negative y = downfield)
// - LOS at y = 0 in yards
// - Player starts below LOS (positive y) or at LOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Slant Route: 3-step inside break at ~45°
 * Quick game route, breaks diagonally toward center
 */
function buildSlantRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const stemDepth = Math.min(3, depth * 0.6); // Short vertical stem
  const breakDistance = depth * 0.8; // Horizontal distance inside
  
  const start: Point = { x: player.x, y: player.y };
  const stemEnd: Point = { x: player.x, y: player.y - stemDepth };
  // Break in chosen direction
  const breakEnd: Point = { 
    x: goLeft ? player.x - breakDistance : player.x + breakDistance, 
    y: player.y - depth 
  };
  
  return [start, stemEnd, breakEnd].map(toPx);
}

/**
 * Speed Out / Quick Out: Break flat to sideline at 90°
 */
function buildSpeedOutRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  const stemEnd: Point = { x: player.x, y: player.y - depth };
  // Break out in chosen direction
  const breakEnd: Point = { 
    x: goLeft ? player.x - depth : player.x + depth, 
    y: player.y - depth 
  };
  
  return [start, stemEnd, breakEnd].map(toPx);
}

/**
 * Hitch / Stop Route: Vertical push, stop and turn back
 */
function buildHitchRoute(player: PlayerPosition, depth: number): Point[] {
  const start: Point = { x: player.x, y: player.y };
  const top: Point = { x: player.x, y: player.y - depth };
  // Work slightly back toward QB
  const workBack: Point = { x: player.x, y: player.y - (depth - 1.5) };
  
  return [start, top, workBack].map(toPx);
}

/**
 * Quick In Route: Break inside at 90°
 */
function buildQuickInRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  const stemEnd: Point = { x: player.x, y: player.y - depth };
  // Break in chosen direction
  const breakEnd: Point = { 
    x: goLeft ? player.x - depth : player.x + depth, 
    y: player.y - depth 
  };
  
  return [start, stemEnd, breakEnd].map(toPx);
}

/**
 * Curl Route: Vertical push, turn back and work toward ball
 */
function buildCurlRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  const top: Point = { x: player.x, y: player.y - depth };
  // Work back and slightly in chosen direction
  const workBack: Point = { 
    x: goLeft ? player.x - 1.5 : player.x + 1.5, 
    y: player.y - (depth - 2) 
  };
  
  return [start, top, workBack].map(toPx);
}

/**
 * Go / Streak Route: Pure vertical
 */
function buildGoRoute(player: PlayerPosition, depth: number): Point[] {
  const start: Point = { x: player.x, y: player.y };
  const end: Point = { x: player.x, y: player.y - depth };
  
  return [start, end].map(toPx);
}

/**
 * Fade Outside: Vertical with slight drift to sideline
 */
function buildFadeOutsideRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const drift = 3; // Yards of sideline drift
  
  const start: Point = { x: player.x, y: player.y };
  const mid: Point = { 
    x: goLeft ? player.x - (drift / 2) : player.x + (drift / 2), 
    y: player.y - (depth * 0.5) 
  };
  const end: Point = { 
    x: goLeft ? player.x - drift : player.x + drift, 
    y: player.y - depth 
  };
  
  return [start, mid, end].map(toPx);
}

/**
 * Dig Route: Vertical stem, then hard inside cut
 */
function buildDigRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const crossDistance = 10; // How far across field
  
  const start: Point = { x: player.x, y: player.y };
  const stemEnd: Point = { x: player.x, y: player.y - depth };
  // Hard 90° in chosen direction
  const breakEnd: Point = { 
    x: goLeft ? player.x - crossDistance : player.x + crossDistance, 
    y: player.y - depth 
  };
  
  return [start, stemEnd, breakEnd].map(toPx);
}

/**
 * Corner Route: Vertical stem, then 45° break to back pylon
 */
function buildCornerRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const cornerDistance = depth * 0.6;
  
  const start: Point = { x: player.x, y: player.y };
  const stemEnd: Point = { x: player.x, y: player.y - depth };
  // 45° out in chosen direction
  const breakEnd: Point = { 
    x: goLeft ? player.x - cornerDistance : player.x + cornerDistance, 
    y: player.y - depth - cornerDistance 
  };
  
  return [start, stemEnd, breakEnd].map(toPx);
}

/**
 * Post Route: Vertical stem, then 45° break toward goalpost
 */
function buildPostRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const postDistance = depth * 0.6;
  
  const start: Point = { x: player.x, y: player.y };
  const stemEnd: Point = { x: player.x, y: player.y - depth };
  // 45° inside in chosen direction
  const breakEnd: Point = { 
    x: goLeft ? player.x - postDistance : player.x + postDistance, 
    y: player.y - depth - postDistance 
  };
  
  return [start, stemEnd, breakEnd].map(toPx);
}

/**
 * Comeback Route: Deep vertical, then sharp break back to sideline
 */
function buildComebackRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  const top: Point = { x: player.x, y: player.y - depth };
  // Break back in chosen direction
  const breakEnd: Point = { 
    x: goLeft ? player.x - 3 : player.x + 3, 
    y: player.y - (depth - 4) 
  };
  
  return [start, top, breakEnd].map(toPx);
}

/**
 * Shallow Drag: Cross field low behind LBs
 */
function buildShallowDragRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const crossDistance = 20;
  
  const start: Point = { x: player.x, y: player.y };
  // Slight release angle then flatten
  const release: Point = { 
    x: goLeft ? player.x - 2 : player.x + 2, 
    y: player.y - depth 
  };
  // Cross field in chosen direction
  const crossEnd: Point = { 
    x: goLeft ? player.x - crossDistance : player.x + crossDistance, 
    y: player.y - depth 
  };
  
  return [start, release, crossEnd].map(toPx);
}

/**
 * Over Route: Deeper crosser behind LBs
 */
function buildOverRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const crossDistance = 25;
  
  const start: Point = { x: player.x, y: player.y };
  const stemEnd: Point = { x: player.x, y: player.y - depth };
  // Cross field in chosen direction
  const crossEnd: Point = { 
    x: goLeft ? player.x - crossDistance : player.x + crossDistance, 
    y: player.y - depth 
  };
  
  return [start, stemEnd, crossEnd].map(toPx);
}

/**
 * Whip / Pivot Route: Inside jab, whip back out
 */
function buildWhipRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  // Jab opposite direction first
  const jab: Point = { 
    x: goLeft ? player.x + 2 : player.x - 2, 
    y: player.y - depth 
  };
  // Whip in chosen direction
  const whipEnd: Point = { 
    x: goLeft ? player.x - 3 : player.x + 3, 
    y: player.y - depth 
  };
  
  return [start, jab, whipEnd].map(toPx);
}

/**
 * Double Move: Sluggo (Slant & Go)
 */
function buildSluggoRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  // Fake slant in chosen direction
  const fakeSlant: Point = { 
    x: goLeft ? player.x - 2 : player.x + 2, 
    y: player.y - 5 
  };
  // Turn upfield
  const goEnd: Point = { 
    x: goLeft ? player.x - 2 : player.x + 2, 
    y: player.y - depth 
  };
  
  return [start, fakeSlant, goEnd].map(toPx);
}

/**
 * Double Move: Hitch & Go
 */
function buildHitchGoRoute(player: PlayerPosition, depth: number): Point[] {
  const start: Point = { x: player.x, y: player.y };
  // Sell hitch
  const hitchTop: Point = { x: player.x, y: player.y - 6 };
  const hitchSettle: Point = { x: player.x, y: player.y - 5 };
  // Go vertical
  const goEnd: Point = { x: player.x, y: player.y - depth };
  
  return [start, hitchTop, hitchSettle, goEnd].map(toPx);
}

/**
 * Double Move: Post-Corner
 * A proper post-corner is a double move:
 * 1. Vertical stem (10-12 yards)
 * 2. Sharp break inside at ~45° (selling the post) for 3-4 yards
 * 3. Plant and break back outside toward corner of endzone
 */
function buildPostCornerRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const stemDepth = 10; // Initial vertical stem
  const postFakeDepth = 4; // How far they sell the post
  const postFakeWidth = 4; // How far inside they cut
  
  const start: Point = { x: player.x, y: player.y };
  
  // Vertical stem straight up
  const stemEnd: Point = { 
    x: player.x, 
    y: player.y - stemDepth 
  };
  
  // Break inside to sell the post (toward middle of field)
  // If goLeft, player is breaking left eventually, so fake right first (inside toward center)
  // If goRight, player is breaking right eventually, so fake left first (inside toward center)
  const fakePost: Point = { 
    x: goLeft ? player.x + postFakeWidth : player.x - postFakeWidth, 
    y: player.y - stemDepth - postFakeDepth 
  };
  
  // Sharp plant and break to corner (at about 45° angle toward sideline)
  const cornerBreakWidth = 8; // How far outside from start position
  const cornerEnd: Point = { 
    x: goLeft ? player.x - cornerBreakWidth : player.x + cornerBreakWidth, 
    y: player.y - depth 
  };
  
  return [start, stemEnd, fakePost, cornerEnd].map(toPx);
}

// ═══════════════════════════════════════════════════════════════════════════
// RB ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RB Flat: Quick release to flat
 */
function buildRbFlatRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const flatDistance = 8;
  
  const start: Point = { x: player.x, y: player.y };
  const flatEnd: Point = { 
    x: goLeft ? player.x - flatDistance : player.x + flatDistance, 
    y: player.y - depth 
  };
  
  return [start, flatEnd].map(toPx);
}

/**
 * RB Swing: Arc to sideline
 */
function buildRbSwingRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const swingWidth = 12;
  
  const start: Point = { x: player.x, y: player.y };
  // Arc behind QB first
  const arc: Point = { 
    x: goLeft ? player.x - 3 : player.x + 3, 
    y: player.y + 1 
  };
  // Out to numbers in chosen direction
  const swingEnd: Point = { 
    x: goLeft ? player.x - swingWidth : player.x + swingWidth, 
    y: player.y - depth 
  };
  
  return [start, arc, swingEnd].map(toPx);
}

/**
 * RB Angle / Texas: Flat fake, cut inside
 */
function buildRbAngleRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  // Fake flat in chosen direction first
  const fakeFlat: Point = { 
    x: goLeft ? player.x - 4 : player.x + 4, 
    y: player.y - 1 
  };
  // Cut back opposite direction over ball
  const angleEnd: Point = { 
    x: goLeft ? player.x + 6 : player.x - 6, 
    y: player.y - depth 
  };
  
  return [start, fakeFlat, angleEnd].map(toPx);
}

/**
 * RB Wheel: Flat to vertical up sideline
 */
function buildRbWheelRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const wheelWidth = 15;
  
  const start: Point = { x: player.x, y: player.y };
  // Flat portion in chosen direction
  const flatPortion: Point = { 
    x: goLeft ? player.x - wheelWidth : player.x + wheelWidth, 
    y: player.y - 2 
  };
  // Vertical up sideline
  const wheelEnd: Point = { 
    x: goLeft ? player.x - wheelWidth : player.x + wheelWidth, 
    y: player.y - depth 
  };
  
  return [start, flatPortion, wheelEnd].map(toPx);
}

/**
 * RB Check-Release: Scan protection, then leak
 */
function buildRbCheckReleaseRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x < 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  // Stay in protection
  const protect: Point = { x: player.x, y: player.y };
  // Leak to flat in chosen direction
  const leakEnd: Point = { 
    x: goLeft ? player.x - 6 : player.x + 6, 
    y: player.y - depth 
  };
  
  return [start, protect, leakEnd].map(toPx);
}

/**
 * RB Middle Screen: Delay inside
 */
function buildRbMiddleScreenRoute(player: PlayerPosition, depth: number): Point[] {
  const start: Point = { x: player.x, y: player.y };
  // Stay back initially
  const delay: Point = { x: player.x, y: player.y + 1 };
  // Slide inside with OL
  const screenEnd: Point = { x: 0, y: player.y - depth };
  
  return [start, delay, screenEnd].map(toPx);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * WR Bubble Screen: Bubble back behind LOS
 */
function buildBubbleScreenRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  // Bubble back in chosen direction (toward QB)
  const bubbleEnd: Point = { 
    x: goLeft ? player.x - 3 : player.x + 3, 
    y: player.y - depth 
  };
  
  return [start, bubbleEnd].map(toPx);
}

/**
 * WR Now Screen: Immediate catch
 */
function buildNowScreenRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  // One step in chosen direction
  const nowEnd: Point = { 
    x: goLeft ? player.x - 1 : player.x + 1, 
    y: player.y - depth 
  };
  
  return [start, nowEnd].map(toPx);
}

/**
 * Option / Choice Route: Read coverage, sit or cross
 * Shows a basic sit route - the actual route depends on coverage read
 */
function buildOptionRoute(player: PlayerPosition, depth: number, goLeft: boolean = player.x > 0): Point[] {
  const start: Point = { x: player.x, y: player.y };
  const stemEnd: Point = { x: player.x, y: player.y - depth };
  // Show sit in chosen direction
  const sitEnd: Point = { 
    x: goLeft ? player.x - 1 : player.x + 1, 
    y: player.y - depth 
  };
  
  return [start, stemEnd, sitEnd].map(toPx);
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER SWITCH: routeId → geometry
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the SVG polyline points for a route assignment.
 * Pass in the assignment and the player's position in PIXELS (from your SVG).
 * The function will convert to yards internally and return pixel points for drawing.
 */
/**
 * Determine if route should go left based on direction setting and player position.
 * - 'left': always go left
 * - 'right': always go right  
 * - 'auto': go left if player is on right side of field (breaks toward center for slants/digs)
 *           or go toward sideline for outs/corners based on which side player is on
 */
function resolveDirection(direction: RouteDirection, playerPos: PlayerPosition, routeType: 'inside' | 'outside'): boolean {
  if (direction === 'left') return true;
  if (direction === 'right') return false;
  
  // Auto mode: determine based on player position and route type
  if (routeType === 'inside') {
    // Inside-breaking routes (slant, dig, post) - break toward center
    return playerPos.x > 0; // If on right side, go left (toward center)
  } else {
    // Outside-breaking routes (out, corner, fade, wheel) - break toward sideline
    return playerPos.x < 0; // If on left side, go left (toward sideline)
  }
}

export function getRoutePoints(
  assignment: PlayerRouteAssignment,
  playerPosPixels: { x: number; y: number }
): Point[] {
  // Convert player's pixel position to yards
  const playerPos = pixelsToYards(playerPosPixels.x, playerPosPixels.y);
  const { routeId, depth, direction = 'auto' } = assignment;
  
  // Helper to get goLeft for different route types
  const goLeftInside = resolveDirection(direction, playerPos, 'inside');
  const goLeftOutside = resolveDirection(direction, playerPos, 'outside');
  
  // For explicit direction routes (RB, etc), use the direction directly
  const goLeft = direction === 'left' ? true : direction === 'right' ? false : playerPos.x < 0;
  
  switch (routeId) {
    // Quick game
    case 'slant':
      return buildSlantRoute(playerPos, depth, goLeftInside);
    case 'speed_out':
      return buildSpeedOutRoute(playerPos, depth, goLeftOutside);
    case 'hitch':
      return buildHitchRoute(playerPos, depth);
    case 'quick_in':
      return buildQuickInRoute(playerPos, depth, goLeftInside);
    
    // Curl family
    case 'curl_10':
    case 'curl_14':
      return buildCurlRoute(playerPos, depth, goLeftInside);
    
    // Verticals
    case 'go':
      return buildGoRoute(playerPos, depth);
    case 'fade_outside':
      return buildFadeOutsideRoute(playerPos, depth, goLeftOutside);
    
    // Intermediate breaks
    case 'dig_12':
      return buildDigRoute(playerPos, depth, goLeftInside);
    case 'corner_12':
      return buildCornerRoute(playerPos, depth, goLeftOutside);
    case 'post_12':
      return buildPostRoute(playerPos, depth, goLeftInside);
    case 'comeback_15':
    case 'comeback_18_20':
      return buildComebackRoute(playerPos, depth, goLeftOutside);
    
    // Cross routes
    case 'shallow_drag':
      return buildShallowDragRoute(playerPos, depth, goLeftInside);
    case 'intermediate_over':
      return buildOverRoute(playerPos, depth, goLeftInside);
    
    // Specialty
    case 'whip':
      return buildWhipRoute(playerPos, depth, goLeftOutside);
    case 'option_choice':
      return buildOptionRoute(playerPos, depth, goLeftInside);
    
    // Double moves
    case 'sluggo':
      return buildSluggoRoute(playerPos, depth, goLeftInside);
    case 'hitch_go':
      return buildHitchGoRoute(playerPos, depth);
    case 'post_corner':
      return buildPostCornerRoute(playerPos, depth, goLeft);
    
    // RB routes - use explicit direction (left/right) since they're from backfield
    case 'rb_flat':
      return buildRbFlatRoute(playerPos, depth, goLeft);
    case 'rb_swing':
      return buildRbSwingRoute(playerPos, depth, goLeft);
    case 'rb_angle':
      return buildRbAngleRoute(playerPos, depth, goLeft);
    case 'rb_wheel':
      return buildRbWheelRoute(playerPos, depth, goLeft);
    case 'rb_check_release':
      return buildRbCheckReleaseRoute(playerPos, depth, goLeft);
    case 'rb_middle_screen':
      return buildRbMiddleScreenRoute(playerPos, depth);
    
    // Screens
    case 'wr_bubble':
      return buildBubbleScreenRoute(playerPos, depth, goLeftInside);
    case 'wr_now':
      return buildNowScreenRoute(playerPos, depth, goLeftInside);
    
    // Fallback: simple vertical stem
    default:
      return buildGoRoute(playerPos, depth);
  }
}

/**
 * Convert route points to an SVG polyline points string
 */
export function routePointsToSvgString(points: Point[]): string {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

/**
 * Get the endpoint of a route (for arrow/marker placement)
 */
export function getRouteEndpoint(points: Point[]): Point {
  return points[points.length - 1];
}

/**
 * Get a label position for the route (slightly offset from endpoint)
 */
export function getRouteLabelPosition(points: Point[]): Point {
  const endpoint = points[points.length - 1];
  return {
    x: endpoint.x + 10,
    y: endpoint.y - 10,
  };
}

