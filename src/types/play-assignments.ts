/**
 * Type definitions for Structured Play Builder System
 *
 * Defines all types for player assignments, responsibilities, metadata,
 * and the complete structured play data model.
 */

// ═══════════════════════════════════════════════════════════════════
// SIDE OF BALL & PLAY TYPES
// ═══════════════════════════════════════════════════════════════════

export type SideOfBall = 'offense' | 'defense';

export type OffensivePlayType =
  | 'run'
  | 'pass'
  | 'rpo'
  | 'screen'
  | 'play_action';

export type DefensivePlayType =
  | 'coverage'
  | 'pressure'
  | 'run_fit'
  | 'stunt'
  | 'simulated_pressure';

export type PlayType = OffensivePlayType | DefensivePlayType;


// ═══════════════════════════════════════════════════════════════════
// OFFENSIVE ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Assignment for skill position players (WR, TE, RB)
 */
export interface OffensiveSkillAssignment {
  type: 'route' | 'motion' | 'block' | 'option_route';

  // Route details
  routeType?: string; // 'go', 'curl', 'slant', 'post', etc.
  routeDepth?: number;

  // Motion details
  motionDirection?: 'left' | 'right' | 'across' | 'jet';
  motionTiming?: 'pre_snap' | 'at_snap';

  // Blocking details
  blockTarget?: string; // 'edge', 'linebacker', 'safety', etc.
  blockType?: 'crack' | 'stalk' | 'cut';

  // Option route rules
  optionRule?: string; // "vs man: slant, vs zone: curl"
  vsManRoute?: string;
  vsZoneRoute?: string;
}

/**
 * Assignment for offensive linemen
 */
export interface OffensiveLineAssignment {
  type: 'zone' | 'man' | 'combo' | 'pull' | 'protection';

  // Zone/Man blocking
  direction?: 'left' | 'right' | 'playside' | 'backside';
  target?: string; // player or gap

  // Combo blocking
  comboPartner?: string; // player ID
  comboTarget?: string; // 'linebacker', 'safety', etc.

  // Pull blocking
  pullDirection?: 'left' | 'right';
  pullTarget?: string;

  // Pass protection
  protectionRule?: string; // 'BOB', 'slide left', 'slide right', 'big-on-big'
  protectionAssignment?: string;
}

/**
 * Assignment for quarterback
 */
export interface QuarterbackAssignment {
  type: 'drop' | 'read' | 'alert' | 'mesh' | 'rpo';

  // Drop back
  dropDepth?: '3-step' | '5-step' | '7-step' | 'shotgun';

  // Read progression (ordered list of receiver IDs)
  readProgression?: string[];

  // Alert conditions
  alertCondition?: string; // "hot vs blitz"
  alertRoute?: string;

  // RPO details
  rpoReadKey?: string; // "read LB", "read edge"
  rpoGiveOption?: string;
  rpoPassOption?: string;

  // Mesh point (for handoffs)
  meshPoint?: string;
  meshDirection?: 'left' | 'right';
}


// ═══════════════════════════════════════════════════════════════════
// DEFENSIVE ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Assignment for defensive linemen
 */
export interface DefensiveLineAssignment {
  type: 'gap' | 'slant' | 'stunt' | 'contain' | 'rush';

  // Gap assignment
  gap?: 'A' | 'B' | 'C' | 'D';

  // Technique
  technique?: '0' | '1' | '2i' | '3' | '4i' | '5' | '6' | '7' | '9';

  // Slant
  slantDirection?: 'left' | 'right';

  // Stunt
  stuntPartner?: string; // player ID
  stuntType?: 'T-E' | 'E-T' | 'line' | 'LB-line';

  // Rush assignment
  rushType?: 'speed' | 'power' | 'contain';
}

/**
 * Assignment for linebackers
 */
export interface LinebackerAssignment {
  type: 'run_fit' | 'coverage' | 'pressure' | 'read' | 'spy';

  // Run fit
  fitGap?: 'A' | 'B' | 'C' | 'D';
  fitKey?: string; // "guard", "tackle", "fullback"

  // Coverage
  coverageZone?: string; // 'hook', 'curl', 'flat', 'hole'
  coverageDepth?: number;

  // Pressure
  pressureType?: 'A-gap' | 'B-gap' | 'C-gap' | 'edge';

  // Read key
  readKey?: string; // "guard", "back", "quarterback"

  // Spy assignment
  spyTarget?: 'QB' | 'RB';
}

/**
 * Assignment for defensive backs
 */
export interface DefensiveBackAssignment {
  type: 'coverage' | 'leverage' | 'landmark' | 'match' | 'blitz';

  // Coverage type
  coverageType?: 'man' | 'zone' | 'pattern_match';

  // Man coverage
  manTarget?: string; // player or position

  // Zone coverage
  zoneArea?: string; // 'deep third', 'deep half', 'flat', 'curl'
  zoneDepth?: number;

  // Leverage
  leverage?: 'inside' | 'outside' | 'over_top';

  // Landmark
  landmarkDepth?: number;
  landmarkPosition?: string;

  // Pattern match rules
  matchRule?: string; // "#2 vertical, match #3"

  // Blitz
  blitzGap?: 'A' | 'B' | 'C' | 'edge';
}


// ═══════════════════════════════════════════════════════════════════
// UNIFIED ASSIGNMENT TYPE
// ═══════════════════════════════════════════════════════════════════

export type PlayerAssignment =
  | OffensiveSkillAssignment
  | OffensiveLineAssignment
  | QuarterbackAssignment
  | DefensiveLineAssignment
  | LinebackerAssignment
  | DefensiveBackAssignment;


// ═══════════════════════════════════════════════════════════════════
// PLAYER RESPONSIBILITY
// ═══════════════════════════════════════════════════════════════════

/**
 * Complete responsibility data for a player including structured assignment,
 * plain English description, coaching notes, and AI inclusion flag
 */
export interface PlayerResponsibility {
  // Structured assignment (used for auto-generating responsibility text)
  assignment?: PlayerAssignment;

  // Plain English responsibility (editable by coach)
  responsibility: string;

  // Optional coaching notes
  coachingNotes?: string;

  // Whether to include in AI-generated questions
  includeInAI: boolean;
}


// ═══════════════════════════════════════════════════════════════════
// SITUATIONAL & CONCEPT TAGS
// ═══════════════════════════════════════════════════════════════════

export interface SituationalTag {
  id: string;
  name: string;
  category: 'down' | 'field_position' | 'game_situation' | 'custom';
  sideOfBall: SideOfBall | 'both';
  isSystemDefined: boolean;
  orgId?: string;
}

export interface ConceptTag {
  id: string;
  name: string;
  description?: string;
  sideOfBall: SideOfBall | 'both';
  orgId: string;
}


// ═══════════════════════════════════════════════════════════════════
// FORMATION
// ═══════════════════════════════════════════════════════════════════

export interface FormationPlayerPosition {
  position: string; // 'QB', 'WR', 'LT', 'DE', etc.
  x: number; // horizontal position
  y: number; // vertical position (negative = offensive backfield)
  label: string; // display label ('X', 'Y', 'Z', 'LT', 'MLB', etc.)
  group: 'quarterback' | 'backs' | 'line' | 'receivers' | 'linebackers' | 'secondary';
}

export interface Formation {
  id: string;
  name: string;
  sideOfBall: SideOfBall;
  personnel?: string; // '11', '12', '21' for offense; '4-3', 'Nickel', etc. for defense
  isSystemDefined: boolean;
  orgId?: string;
  playerPositions: FormationPlayerPosition[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}


// ═══════════════════════════════════════════════════════════════════
// PLAY METADATA
// ═══════════════════════════════════════════════════════════════════

/**
 * Metadata for a play including classification, tags, and situational context
 */
export interface PlayMetadata {
  // Basic info
  playName: string;
  shortName?: string;

  // Classification
  sideOfBall: SideOfBall;
  playType: OffensivePlayType | DefensivePlayType;
  personnel: string; // '11', '12', '4-3', 'Nickel', etc.

  // Formation
  formationId?: string; // reference to formations table
  formationName: string;

  // Organization
  primaryFolder: string;

  // Tags
  situationalTags: string[]; // array of situational tag IDs
  conceptTags?: string[]; // array of concept tag IDs

  // Opponent look (what you're facing)
  defensiveLook?: string; // for offensive plays
  offensiveLook?: string; // for defensive plays

  // Install tracking
  installPhase?: string;

  // Additional notes
  notes?: string;

  // Legacy fields (for backward compatibility)
  concept?: string;
}


// ═══════════════════════════════════════════════════════════════════
// VISUAL DATA (CANVAS ELEMENTS)
// ═══════════════════════════════════════════════════════════════════

/**
 * Visual route data (what's drawn on canvas)
 */
export interface DiagramRoute {
  id: string;
  playerId: string; // links to DiagramPlayer
  points: { x: number; y: number }[];
  routeType?: string;
  color?: string;
}

/**
 * Blocking assignment visual
 */
export interface BlockingAssignment {
  id: string;
  playerId: string;
  targetId?: string; // target player or zone
  blockType: 'zone' | 'man' | 'combo' | 'pull';
  direction?: 'left' | 'right';
}

/**
 * Ball carrier path
 */
export interface BallCarrierPath {
  playerId: string;
  points: { x: number; y: number }[];
  color?: string;
}

/**
 * Complete visual data for canvas
 */
export interface VisualData {
  routes?: DiagramRoute[];
  blocking?: BlockingAssignment[];
  ballCarrierPath?: BallCarrierPath;
  zones?: any[]; // defensive zones, coverage areas, etc.
}


// ═══════════════════════════════════════════════════════════════════
// DIAGRAM PLAYER (CANVAS REPRESENTATION)
// ═══════════════════════════════════════════════════════════════════

/**
 * Player representation on the field diagram
 */
export interface DiagramPlayer {
  id: string;
  label: string; // 'X', 'Y', 'Z', 'QB', 'LT', 'MLB', etc.
  position: string; // 'WR', 'QB', 'LB', etc.
  side: 'offense' | 'defense';
  x: number;
  y: number;
  group: string; // 'quarterback', 'receivers', 'line', 'backs', 'linebackers', 'secondary'

  // NEW: Structured assignment and responsibility
  assignment?: PlayerAssignment;
  responsibility?: PlayerResponsibility;
}


// ═══════════════════════════════════════════════════════════════════
// VALIDATION RESULT
// ═══════════════════════════════════════════════════════════════════

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
}


// ═══════════════════════════════════════════════════════════════════
// COMPLETE PLAY DATA
// ═══════════════════════════════════════════════════════════════════

/**
 * Complete play data structure combining metadata, players, assignments,
 * responsibilities, and visual elements
 */
export interface BuiltPlayData {
  // Play metadata
  metadata: PlayMetadata;

  // Players on field
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];

  // Visual elements (what's drawn)
  visualData: VisualData;

  // Finalization status
  isFinalized: boolean;
  completionWarnings: string[];

  // Legacy field for backward compatibility
  mode?: 'offensive' | 'defensive';
}


// ═══════════════════════════════════════════════════════════════════
// DATABASE ENTITIES (API RESPONSES)
// ═══════════════════════════════════════════════════════════════════

/**
 * Player play as stored in database
 */
export interface PlayerPlay {
  id: string;
  userId: string;
  orgId: string;

  // Basic info
  name: string;
  shortName?: string;

  // Classification
  sideOfBall?: SideOfBall;
  structuredPlayType?: PlayType;
  personnel?: string;

  // Formation
  formationId?: string;
  formationName?: string;

  // Organization
  primaryFolder?: string;

  // Opponent look
  defensiveLook?: string;
  offensiveLook?: string;

  // Install tracking
  installPhase?: string;

  // Structured data (JSONB fields)
  playerAssignments: Record<string, PlayerAssignment>;
  playerResponsibilities: Record<string, PlayerResponsibility>;
  visualData: VisualData;

  // Diagram data (legacy, for plays created with old builder)
  diagramType?: string;
  diagramData?: any;

  // Finalization
  isFinalized: boolean;
  completionWarnings: string[];

  // Content processing
  contentStatus: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'generating';

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Legacy fields
  playType?: string;
  concept?: string;
}


// ═══════════════════════════════════════════════════════════════════
// HELPER TYPES FOR UI STATE
// ═══════════════════════════════════════════════════════════════════

export type BuilderMode = 'draw' | 'assign';

export interface BuilderState {
  mode: BuilderMode;
  selectedPlayerId?: string;
  playData: BuiltPlayData;
  isDirty: boolean;
}
