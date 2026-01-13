// ═══════════════════════════════════════════════════════════════════════════
// ROUTE POINT GENERATOR
// Converts route definitions into drawable points for the playbook editor
// ═══════════════════════════════════════════════════════════════════════════

import { Point, DemoPlayer } from "./demo-types";
import { RouteDef, getDepthForLevel } from "@/domain/football/routes";

// Field center for reference
const CENTER_X = 26.67;

/**
 * Generate route points based on route definition and player position
 */
export function generateRoutePoints(
  player: DemoPlayer,
  routeDef: RouteDef,
  customDepth?: number,
  level: "youth" | "nfl" = "nfl"
): Point[] {
  const depthRange = getDepthForLevel(routeDef, level);
  const depth = customDepth ?? depthRange.min;
  
  // Determine break direction based on player position relative to center
  const isLeftSide = player.x < CENTER_X;
  const breakDirection = isLeftSide ? 1 : -1; // 1 = right (inside), -1 = left (inside)
  
  // Start point is always the player's position
  const start: Point = { x: player.x, y: player.y };
  
  switch (routeDef.id) {
    // ═══════════════════════════════════════════════════════════════════════════
    // VERTICAL ROUTES
    // ═══════════════════════════════════════════════════════════════════════════
    case "go":
      return [
        start,
        { x: player.x, y: player.y + depth }
      ];
    
    case "fade_outside":
      // Fade to sideline
      const fadeDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (fadeDir * 4), y: player.y + depth }
      ];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // QUICK GAME
    // ═══════════════════════════════════════════════════════════════════════════
    case "slant":
      // 3 steps vertical, then 45° inside
      return [
        start,
        { x: player.x, y: player.y + 2 },
        { x: player.x + (breakDirection * 6), y: player.y + depth + 3 }
      ];
    
    case "speed_out":
    case "quick_out":
      // 5 yards vertical, then flat to sideline
      const outDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x, y: player.y + depth },
        { x: player.x + (outDir * 8), y: player.y + depth }
      ];
    
    case "hitch":
      // Vertical push, stop and turn back
      return [
        start,
        { x: player.x, y: player.y + depth },
        { x: player.x, y: player.y + depth - 1 }
      ];
    
    case "quick_in":
      // 5 yards vertical, then 90° inside
      return [
        start,
        { x: player.x, y: player.y + depth },
        { x: player.x + (breakDirection * 6), y: player.y + depth }
      ];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INTERMEDIATE ROUTES
    // ═══════════════════════════════════════════════════════════════════════════
    case "curl_10":
    case "curl_14":
      // Vertical to depth, curl back
      return [
        start,
        { x: player.x, y: player.y + depth },
        { x: player.x - breakDirection, y: player.y + depth - 2 }
      ];
    
    case "dig_12":
      // Vertical to 12-15, hard 90° inside (crossing route)
      return [
        start,
        { x: player.x, y: player.y + depth },
        { x: player.x + (breakDirection * 12), y: player.y + depth }
      ];
    
    case "corner_12":
      // Vertical to depth, then 45° to corner
      const cornerDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x, y: player.y + depth },
        { x: player.x + (cornerDir * 8), y: player.y + depth + 6 }
      ];
    
    case "post_12":
      // Vertical to depth, then 45° inside toward goalpost
      return [
        start,
        { x: player.x, y: player.y + depth },
        { x: player.x + (breakDirection * 8), y: player.y + depth + 6 }
      ];
    
    case "comeback_15":
    case "comeback_18_20":
      // Vertical deep, then comeback to sideline
      const comebackDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x, y: player.y + depth },
        { x: player.x + (comebackDir * 3), y: player.y + depth - 3 }
      ];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DRAG / CROSS ROUTES
    // ═══════════════════════════════════════════════════════════════════════════
    case "shallow_drag":
      // Cross field at shallow depth
      return [
        start,
        { x: player.x, y: player.y + 2 },
        { x: player.x + (breakDirection * 20), y: player.y + depth }
      ];
    
    case "intermediate_over":
      // Deeper cross behind LBs
      return [
        start,
        { x: player.x, y: player.y + 6 },
        { x: player.x + (breakDirection * 20), y: player.y + depth }
      ];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DOUBLE MOVES
    // ═══════════════════════════════════════════════════════════════════════════
    case "sluggo":
      // Fake slant, then go vertical
      return [
        start,
        { x: player.x, y: player.y + 2 },
        { x: player.x + (breakDirection * 2), y: player.y + 4 },
        { x: player.x + (breakDirection * 1), y: player.y + depth }
      ];
    
    case "hitch_go":
      // Fake hitch, then go vertical
      return [
        start,
        { x: player.x, y: player.y + 5 },
        { x: player.x, y: player.y + 4 },
        { x: player.x, y: player.y + depth }
      ];
    
    case "post_corner":
      // Fake post, then corner
      const pcDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x, y: player.y + 8 },
        { x: player.x + (breakDirection * 3), y: player.y + 12 },
        { x: player.x + (pcDir * 6), y: player.y + depth }
      ];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SLOT / WHIP / CHOICE
    // ═══════════════════════════════════════════════════════════════════════════
    case "whip":
      // Inside jab, pivot back out
      const whipDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (breakDirection * 2), y: player.y + 2 },
        { x: player.x + (whipDir * 4), y: player.y + depth }
      ];
    
    case "option_choice":
      // Stem up, then sit (vs zone) or break in (vs man)
      return [
        start,
        { x: player.x, y: player.y + depth },
        { x: player.x + (breakDirection * 2), y: player.y + depth }
      ];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SCREENS
    // ═══════════════════════════════════════════════════════════════════════════
    case "wr_bubble":
      // Bubble behind LOS
      const bubbleDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (bubbleDir * 2), y: player.y - 1 },
        { x: player.x + (bubbleDir * 5), y: player.y }
      ];
    
    case "wr_now":
      // Step and catch immediately
      const nowDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (nowDir * 2), y: player.y }
      ];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RB ROUTES
    // ═══════════════════════════════════════════════════════════════════════════
    case "rb_flat":
      // Release to flat
      const flatDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (flatDir * 8), y: player.y + depth }
      ];
    
    case "rb_swing":
      // Arc behind QB to flat
      const swingDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (swingDir * 4), y: player.y - 1 },
        { x: player.x + (swingDir * 12), y: player.y + depth }
      ];
    
    case "rb_angle":
      // Fake flat, cut back inside
      const angleDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (angleDir * 4), y: player.y + 2 },
        { x: player.x + (breakDirection * 6), y: player.y + depth }
      ];
    
    case "rb_wheel":
      // Flat then vertical up sideline
      const wheelDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (wheelDir * 8), y: player.y + 2 },
        { x: player.x + (wheelDir * 10), y: player.y + depth }
      ];
    
    case "rb_check_release":
      // Delay then leak to flat
      const checkDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x, y: player.y + 1 },
        { x: player.x + (checkDir * 6), y: player.y + depth }
      ];
    
    case "rb_middle_screen":
      // Slide inside with OL
      return [
        start,
        { x: player.x, y: player.y - 2 },
        { x: CENTER_X, y: player.y + depth }
      ];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EAGLES RB ROUTE TREE
    // ═══════════════════════════════════════════════════════════════════════════
    case "rb_wide":
      // Check wide outside numbers - quick access at/behind LOS
      const wideDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (wideDir * 12), y: player.y - 1 }
      ];
    
    case "rb_flat_eagles":
      // Speed flat - go NOW, gain width with depth
      const flatEaglesDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (flatEaglesDir * 6), y: player.y + 1 },
        { x: player.x + (flatEaglesDir * 12), y: player.y + depth }
      ];
    
    case "rb_spat":
      // Curl up 4-5 yards, 1 yard outside TE - sit vs zone
      const spatDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (spatDir * 3), y: player.y + 2 },
        { x: player.x + (spatDir * 5), y: player.y + depth }
      ];
    
    case "rb_middle_option":
      // 4 yard inside option - sit vs zone, run vs man
      return [
        start,
        { x: player.x, y: player.y + 2 },
        { x: player.x + (breakDirection * 3), y: player.y + depth }
      ];
    
    case "rb_rail":
      // No read wheel - straight up sideline, stay on move
      const railDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (railDir * 4), y: player.y + 2 },
        { x: player.x + (railDir * 8), y: player.y + depth }
      ];
    
    case "rb_spin":
      // Push 4 yards then burst toward ball - tackle area
      return [
        start,
        { x: player.x, y: player.y + 4 },
        { x: CENTER_X, y: player.y + depth }
      ];
    
    case "rb_blow":
      // Outside release, push to 5, sit vs zone or hot to flat
      const blowDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (blowDir * 2), y: player.y + 1 },
        { x: player.x + (blowDir * 4), y: player.y + depth }
      ];
    
    case "rb_wheel_landmark":
      // Get to red line landmark at 8-10 yards - read LB
      const wheelLandmarkDir = isLeftSide ? -1 : 1;
      return [
        start,
        { x: player.x + (wheelLandmarkDir * 6), y: player.y + 2 },
        { x: player.x + (wheelLandmarkDir * 10), y: player.y + 5 },
        { x: player.x + (wheelLandmarkDir * 12), y: player.y + depth }
      ];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DEFAULT - Vertical route
    // ═══════════════════════════════════════════════════════════════════════════
    default:
      return [
        start,
        { x: player.x, y: player.y + depth }
      ];
  }
}

/**
 * Get suggested route color based on route type
 */
export function getRouteColor(routeDef: RouteDef, isPrimary: boolean = false): string {
  if (isPrimary) return "#F5C253"; // Gold for primary reads
  
  switch (routeDef.family) {
    case "quick":
      return "#22d3ee"; // Cyan for quick game
    case "screen":
    case "backfield":
      return "#22d3ee"; // Cyan for checkdowns/screens
    case "deep":
      return "#94a3b8"; // Slate for deep/clear routes
    case "double-move":
      return "#f472b6"; // Pink for double moves
    default:
      return "#94a3b8"; // Slate default
  }
}
