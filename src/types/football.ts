// ═══════════════════════════════════════════════════════════════════════════
// FOOTBALL TYPES — Core types for football plays and assignments
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Skill positions that can be quizzed
 */
export type SkillPosition =
  | "QB"
  | "RB"
  | "FB"
  | "X"      // Split end (usually left WR)
  | "Z"      // Flanker (usually right WR)
  | "H"      // Slot receiver
  | "Y"      // Tight end / slot
  | "TE";

/**
 * Position assignment quiz categories
 */
export type AssignmentCategory =
  | "alignment"
  | "landmark"
  | "assignment"
  | "motion"
  | "read"
  | "adjustment";

/**
 * Individual position assignment within a play
 */
export interface PositionAssignment {
  position: SkillPosition;

  // The core quiz elements
  alignment: string;        // Where do you line up?
  landmark: string;         // What's your aiming point?
  assignment: string;       // What's your route/responsibility?
  motion?: string;          // Pre-snap motion (if any)
  read: string;             // What are you reading?
  adjustments: {            // Coverage-specific adjustments
    vsMan: string;
    vsZone: string;
    vsBlitz?: string;
  };

  // Route info for visual
  routeId?: string;
  depth?: number;           // Route depth in yards
}

/**
 * Complete play definition with all position assignments
 */
export interface PlayDefinition {
  id: string;
  name: string;
  shortName: string;
  formation: string;
  playType: "pass" | "run" | "rpo" | "screen";
  concept?: string;         // e.g., "Mesh", "Flood", "Power"

  // All position assignments
  assignments: PositionAssignment[];

  // Metadata
  description: string;
  keyPoints: string[];
  bestAgainst: string[];

  // Visual diagram data
  diagramType: "pass" | "run";
}

/**
 * Quiz question for a specific position on a play
 */
export interface AssignmentQuestion {
  playId: string;
  position: SkillPosition;
  category: AssignmentCategory;
  question: string;
  correctAnswer: string;
  options: string[];
  hint?: string;
}

/**
 * Route types for route-based games
 */
export type RouteId =
  | "go"
  | "out"
  | "slant"
  | "post"
  | "corner"
  | "dig"
  | "curl"
  | "seam"
  | "drag"
  | "flat"
  | "hitch"
  | "comeback"
  | "fade"
  | "wheel";

/**
 * Formation types
 */
export type FormationId =
  | "shotgun-spread"
  | "trips-right"
  | "trips-left"
  | "shotgun-twins"
  | "singleback"
  | "i-formation"
  | "pistol"
  | "empty"
  | "bunch";

/**
 * Coverage types
 */
export type CoverageId =
  | "cover-0"
  | "cover-1"
  | "cover-2"
  | "cover-3"
  | "cover-4"
  | "cover-6"
  | "quarters";

/**
 * Protection types for blitz identification
 */
export type ProtectionId =
  | "slide"
  | "big-on-big"
  | "half-slide"
  | "max-protect"
  | "rb-check";

/**
 * Concept types for offensive schemes
 */
export type ConceptId =
  | "mesh"
  | "flood"
  | "levels"
  | "four-verticals"
  | "smash"
  | "scissors";
