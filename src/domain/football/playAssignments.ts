// ═══════════════════════════════════════════════════════════════════════════
// PLAY ASSIGNMENTS — Position-specific assignment data for Assignment Tracker
// Each play includes detailed assignments for every skill position
// ═══════════════════════════════════════════════════════════════════════════

import type { FormationId } from "./formations";
import type { RouteId } from "./playConcepts";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
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
  routeId?: RouteId;
  depth?: number;           // Route depth in yards
}

/**
 * Complete play definition with all position assignments
 */
export interface PlayDefinition {
  id: string;
  name: string;
  shortName: string;
  formation: FormationId;
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

// ═══════════════════════════════════════════════════════════════════════════
// PLAY DATA — Comprehensive playbook with position assignments
// ═══════════════════════════════════════════════════════════════════════════

export const PLAYS: PlayDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // MESH CONCEPT
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "mesh-trips",
    name: "Mesh Trips Right",
    shortName: "Mesh",
    formation: "trips-right",
    playType: "pass",
    concept: "Mesh",
    description: "Two shallow crossing routes create natural picks against man coverage. Trips formation creates numbers advantage to the right.",
    keyPoints: [
      "Shallow crosses at 5-6 yards",
      "Crossers must mesh tight",
      "Outside receivers clear out",
    ],
    bestAgainst: ["Cover 1", "Cover 0", "Man Coverage"],
    diagramType: "pass",
    assignments: [
      {
        position: "QB",
        alignment: "Shotgun, 5 yards deep",
        landmark: "Eyes on Mike LB",
        assignment: "Quick game progression: Mesh → Corner → Check down",
        read: "Mike LB - if he drops, throw mesh; if he jumps mesh, go corner",
        adjustments: {
          vsMan: "Look for rub on mesh, throw to separation",
          vsZone: "Find window between zones on mesh",
          vsBlitz: "Hot to first crosser",
        },
      },
      {
        position: "X",
        alignment: "Split left, 1 yard off ball",
        landmark: "Corner of end zone",
        assignment: "Corner route at 12-15 yards",
        routeId: "corner",
        depth: 15,
        read: "Safety leverage - inside release if safety is over top",
        adjustments: {
          vsMan: "Stack and separate at break",
          vsZone: "Sit in hole of Cover 2",
        },
      },
      {
        position: "Z",
        alignment: "#1 receiver to trips, on numbers",
        landmark: "Far hash",
        assignment: "Clear out - Go route",
        routeId: "go",
        depth: 40,
        motion: "None",
        read: "Take top off - run corner off",
        adjustments: {
          vsMan: "Win at line, stack defender",
          vsZone: "Get vertical, clear safety",
        },
      },
      {
        position: "H",
        alignment: "#2 receiver trips, 1 yard inside Z",
        landmark: "Opposite numbers",
        assignment: "Shallow cross at 6 yards",
        routeId: "drag",
        depth: 6,
        read: "Find window in zone, settle vs man",
        adjustments: {
          vsMan: "Rub off Y's cross, accelerate to window",
          vsZone: "Find soft spot, throttle down",
        },
      },
      {
        position: "Y",
        alignment: "#3 receiver trips, inside slot",
        landmark: "Opposite numbers",
        assignment: "Shallow cross at 5 yards - mesh with H",
        routeId: "drag",
        depth: 5,
        read: "Cross tight with H, get to opposite flat",
        adjustments: {
          vsMan: "Use H as pick, burst out of mesh",
          vsZone: "Work to void behind LBs",
        },
      },
      {
        position: "RB",
        alignment: "Offset left, 1 yard behind QB",
        landmark: "Left flat",
        assignment: "Check release to flat",
        read: "If free, release to flat as checkdown",
        adjustments: {
          vsMan: "Win matchup vs LB",
          vsZone: "Drift to soft spot",
          vsBlitz: "Block first threat, then release",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // FOUR VERTICALS
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "four-verts",
    name: "Four Verticals",
    shortName: "4 Verts",
    formation: "shotgun-spread",
    playType: "pass",
    concept: "Four Verticals",
    description: "All four receivers run vertical routes to stretch coverage horizontally. 4 vs 3 deep creates a numbers advantage.",
    keyPoints: [
      "4 verticals vs 3 deep = someone is open",
      "Inside seams usually come open first",
      "Read safety movement",
    ],
    bestAgainst: ["Cover 3", "Single High Safety"],
    diagramType: "pass",
    assignments: [
      {
        position: "QB",
        alignment: "Shotgun, 5 yards deep",
        landmark: "Deep middle safety",
        assignment: "Read safety - if he stays middle, throw seam; if he leans, throw opposite",
        read: "Single high = seams open; two high = outside verticals",
        adjustments: {
          vsMan: "Take shot to best matchup",
          vsZone: "Find the void between safeties",
        },
      },
      {
        position: "X",
        alignment: "Split left, on numbers",
        landmark: "Back pylon",
        assignment: "Go route - win outside",
        routeId: "go",
        depth: 40,
        read: "Corner technique - inside release if pressed",
        adjustments: {
          vsMan: "Speed release, stack corner",
          vsZone: "Push vertical, be ready for back shoulder",
        },
      },
      {
        position: "H",
        alignment: "Left slot, 1 yard off ball",
        landmark: "Goalpost",
        assignment: "Seam route between numbers and hash",
        routeId: "seam",
        depth: 25,
        read: "Find void between safeties",
        adjustments: {
          vsMan: "Vertical push, find soft spot",
          vsZone: "Split safeties, settle if needed",
        },
      },
      {
        position: "Y",
        alignment: "Right slot, 1 yard off ball",
        landmark: "Goalpost",
        assignment: "Seam route between numbers and hash",
        routeId: "seam",
        depth: 25,
        read: "Read safety leverage, adjust path",
        adjustments: {
          vsMan: "Win inside, get vertical",
          vsZone: "Work to void, be ready to settle",
        },
      },
      {
        position: "Z",
        alignment: "Split right, on numbers",
        landmark: "Back pylon",
        assignment: "Go route - win outside",
        routeId: "go",
        depth: 40,
        read: "Corner technique - take best release",
        adjustments: {
          vsMan: "Win at line, stack and go",
          vsZone: "Push corner deep, create separation",
        },
      },
      {
        position: "RB",
        alignment: "Next to QB, offset",
        landmark: "Opposite A-gap",
        assignment: "Check release - scan for blitz, release opposite",
        read: "Blitz pickup, then outlet",
        adjustments: {
          vsMan: "Block then release to space",
          vsZone: "Find void underneath",
          vsBlitz: "Chip, protect, release late",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SLANT-FLAT (QUICK GAME)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "slant-flat",
    name: "Slant-Flat",
    shortName: "Slant-Flat",
    formation: "shotgun-twins",
    playType: "pass",
    concept: "Quick Game",
    description: "Quick two-man concept with slant and flat. High-low read on the flat defender.",
    keyPoints: [
      "Quick 3-step drop",
      "Read flat defender",
      "If flat drops, throw slant; if flat sits, throw flat",
    ],
    bestAgainst: ["Cover 2", "Cover 4", "Soft Zone"],
    diagramType: "pass",
    assignments: [
      {
        position: "QB",
        alignment: "Shotgun, 4 yards deep",
        landmark: "Flat defender (Sam LB or Nickel)",
        assignment: "3-step, read flat defender",
        read: "Flat drops = slant; Flat jumps slant = flat",
        adjustments: {
          vsMan: "Throw slant with timing",
          vsZone: "High-low the flat defender",
        },
      },
      {
        position: "X",
        alignment: "Split left, on numbers",
        landmark: "Inside hip of Mike",
        assignment: "Slant at 5-6 yards",
        routeId: "slant",
        depth: 6,
        read: "Inside release, throttle in zone",
        adjustments: {
          vsMan: "Beat jam inside, burst to ball",
          vsZone: "Sit in window behind flat defender",
        },
      },
      {
        position: "H",
        alignment: "Left slot, 1 yard off",
        landmark: "Sideline at LOS",
        assignment: "Arrow/Flat route",
        routeId: "flat",
        depth: 2,
        read: "Get width immediately",
        adjustments: {
          vsMan: "Win to flat, expect ball quick",
          vsZone: "Stretch flat defender horizontally",
        },
      },
      {
        position: "Z",
        alignment: "Split right, on numbers",
        landmark: "Back of end zone",
        assignment: "Fade - clear out",
        routeId: "go",
        depth: 30,
        read: "Win at line, take top off",
        adjustments: {
          vsMan: "Speed release, run off corner",
          vsZone: "Clear the corner, be ready for back shoulder",
        },
      },
      {
        position: "Y",
        alignment: "Right slot or inline",
        landmark: "Opposite hash",
        assignment: "Drag across at 6 yards",
        routeId: "drag",
        depth: 6,
        read: "Crosser - find void",
        adjustments: {
          vsMan: "Burst across, expect ball in motion",
          vsZone: "Settle in window",
        },
      },
      {
        position: "RB",
        alignment: "Beside QB",
        landmark: "Playside C-gap",
        assignment: "Block, check release to flat",
        read: "Pass pro first, release if clean",
        adjustments: {
          vsMan: "Stay in for protection",
          vsZone: "Release after blocking assignment",
          vsBlitz: "Pick up free rusher",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // FLOOD CONCEPT
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "flood-right",
    name: "Flood Right",
    shortName: "Flood",
    formation: "trips-right",
    playType: "pass",
    concept: "Flood",
    description: "Three-level flood concept to one side. Flat, out, and corner stretch the defense vertically and horizontally.",
    keyPoints: [
      "3 routes to one side",
      "Creates 3 vs 2 advantage",
      "Read from corner to flat",
    ],
    bestAgainst: ["Cover 3", "Cover 2", "Any Zone"],
    diagramType: "pass",
    assignments: [
      {
        position: "QB",
        alignment: "Shotgun, 5 yards",
        landmark: "Flat defender to trips",
        assignment: "5-step, progression: Corner → Out → Flat",
        read: "Top to bottom on the flood side",
        adjustments: {
          vsMan: "Look for best matchup on isolations",
          vsZone: "Read corner - if he drops, out; if he jumps out, corner",
        },
      },
      {
        position: "X",
        alignment: "Backside split",
        landmark: "Opposite post",
        assignment: "Dig route at 12 yards",
        routeId: "dig",
        depth: 12,
        read: "Work away from safety",
        adjustments: {
          vsMan: "Stack defender, break hard",
          vsZone: "Find hole in zone, settle",
        },
      },
      {
        position: "Z",
        alignment: "#1 trips, on numbers",
        landmark: "Back pylon",
        assignment: "Corner route at 15 yards",
        routeId: "corner",
        depth: 15,
        read: "Safety leverage - adjust angle",
        adjustments: {
          vsMan: "Win vertical, break to corner",
          vsZone: "Find hole behind corner, in front of safety",
        },
      },
      {
        position: "H",
        alignment: "#2 trips, inside slot",
        landmark: "Sideline at 10 yards",
        assignment: "Out route at 10-12 yards",
        routeId: "out",
        depth: 12,
        read: "Speed out - quick break",
        adjustments: {
          vsMan: "Create separation with head fake",
          vsZone: "Sit in front of corner",
        },
      },
      {
        position: "Y",
        alignment: "#3 trips / wing",
        landmark: "Numbers at LOS",
        assignment: "Flat route - shoot outside",
        routeId: "flat",
        depth: 3,
        read: "Get width fast, turn up if room",
        adjustments: {
          vsMan: "Quick to flat, expect ball",
          vsZone: "Stretch flat defender",
        },
      },
      {
        position: "RB",
        alignment: "Weak side of QB",
        landmark: "Weak side flat",
        assignment: "Block, then release weak flat",
        read: "Protect, release as outlet",
        adjustments: {
          vsMan: "Stay in or release weak",
          vsZone: "Drift to weak flat",
          vsBlitz: "Block any free rusher",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // INSIDE ZONE (RUN PLAY)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "inside-zone",
    name: "Inside Zone",
    shortName: "IZ",
    formation: "singleback",
    playType: "run",
    concept: "Zone Run",
    description: "Inside zone run with RB reading the frontside A-gap. Linemen zone step playside, RB reads the first down lineman to the call.",
    keyPoints: [
      "RB aims at playside A-gap",
      "Press the hole, read first DL",
      "Cut back if flow takes you there",
    ],
    bestAgainst: ["Over Front", "Odd Front", "Slanting Defense"],
    diagramType: "run",
    assignments: [
      {
        position: "QB",
        alignment: "Under center or shotgun",
        landmark: "Mesh point with RB",
        assignment: "Handoff to RB, carry out fake",
        read: "Execute mesh, sell play action",
        adjustments: {
          vsMan: "Quick handoff, get out of way",
          vsZone: "Mesh, potentially pull on RPO",
        },
      },
      {
        position: "RB",
        alignment: "7 yards deep, behind QB",
        landmark: "Playside A-gap",
        assignment: "Zone track - read first DL to playside",
        read: "If DL flows playside, cut back; if he stays, press hole",
        adjustments: {
          vsMan: "Press hole, one cut, go",
          vsZone: "Read and react, find crease",
        },
      },
      {
        position: "X",
        alignment: "Split left",
        landmark: "Stalk block on corner",
        assignment: "Block perimeter - stalk corner",
        read: "Mirror corner's movement",
        adjustments: {
          vsMan: "Stalk block, cut off pursuit",
          vsZone: "Run off corner, seal inside",
        },
      },
      {
        position: "Z",
        alignment: "Split right",
        landmark: "Stalk block on corner",
        assignment: "Block perimeter - stalk corner",
        read: "Mirror corner's movement",
        adjustments: {
          vsMan: "Stalk block, cut off pursuit",
          vsZone: "Run off or crack safety",
        },
      },
      {
        position: "TE",
        alignment: "Inline, tight",
        landmark: "Playside LB",
        assignment: "Zone combo - double team to LB",
        read: "Help on DL, work up to LB",
        adjustments: {
          vsMan: "Drive block DE, climb to LB",
          vsZone: "Combo to second level",
        },
      },
      {
        position: "H",
        alignment: "Slot or tight alignment",
        landmark: "Safety or LB",
        assignment: "Arc block or crack",
        read: "Block most dangerous defender",
        adjustments: {
          vsMan: "Arc release to safety",
          vsZone: "Crack on LB or run off",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // POWER RUN
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "power",
    name: "Power",
    shortName: "Power",
    formation: "i-formation",
    playType: "run",
    concept: "Gap Run",
    description: "Gap scheme run with pulling guard and lead FB. RB follows the FB through the B-gap.",
    keyPoints: [
      "FB kicks out DE/EMOL",
      "Guard pulls for playside LB",
      "RB follows blockers through B-gap",
    ],
    bestAgainst: ["Under Front", "Aggressive Defense"],
    diagramType: "run",
    assignments: [
      {
        position: "QB",
        alignment: "Under center",
        landmark: "Mesh point behind FB",
        assignment: "Reverse pivot, hand to RB",
        read: "Execute mesh, carry out fake",
        adjustments: {
          vsMan: "Quick mesh, sell boot",
          vsZone: "Mesh and fake boot",
        },
      },
      {
        position: "FB",
        alignment: "4 yards deep, behind QB",
        landmark: "Playside DE/EMOL",
        assignment: "Kick out the end man on LOS",
        read: "Find EMOL, kick him out",
        adjustments: {
          vsMan: "Collision DE, create lane",
          vsZone: "Log or kick based on DE path",
        },
      },
      {
        position: "RB",
        alignment: "7 yards deep, behind FB",
        landmark: "Playside B-gap",
        assignment: "Follow FB's block through B-gap",
        read: "Press FB's hip, cut off pulling guard",
        adjustments: {
          vsMan: "Follow blocks, one cut upfield",
          vsZone: "Be patient, find the crease",
        },
      },
      {
        position: "X",
        alignment: "Split left",
        landmark: "Near safety",
        assignment: "Block safety or crack on LB",
        read: "Identify crack/arc assignment",
        adjustments: {
          vsMan: "Stalk block corner",
          vsZone: "Crack on LB or run off",
        },
      },
      {
        position: "Z",
        alignment: "Split right",
        landmark: "Playside safety",
        assignment: "Block safety - cut off pursuit",
        read: "Run off corner, find safety",
        adjustments: {
          vsMan: "Stalk nearest defender",
          vsZone: "Block most dangerous defender",
        },
      },
      {
        position: "TE",
        alignment: "Inline, playside",
        landmark: "Down block on DE",
        assignment: "Down block, seal inside",
        read: "Seal DL inside, create edge",
        adjustments: {
          vsMan: "Lock DE inside",
          vsZone: "Down block, help create lane",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // RPO - READ OPTION WITH BUBBLE
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "rpo-bubble",
    name: "RPO Bubble",
    shortName: "RPO",
    formation: "shotgun-spread",
    playType: "rpo",
    concept: "RPO",
    description: "Run-pass option with inside zone and bubble screen. QB reads the box defender to determine give or throw.",
    keyPoints: [
      "QB reads box count or specific defender",
      "If box light, hand off run",
      "If box heavy, throw bubble",
    ],
    bestAgainst: ["Light Box", "Aggressive LBs"],
    diagramType: "pass",
    assignments: [
      {
        position: "QB",
        alignment: "Shotgun, 5 yards",
        landmark: "Box defender (usually Will LB)",
        assignment: "Zone read mesh, option to bubble",
        read: "If LB steps up, throw bubble; if LB widens, hand off",
        adjustments: {
          vsMan: "Give to RB, LBs are covering",
          vsZone: "Read defender, execute option",
        },
      },
      {
        position: "RB",
        alignment: "Beside QB",
        landmark: "Playside A-gap",
        assignment: "Inside zone track - expect mesh",
        read: "Run zone path, accept mesh point",
        adjustments: {
          vsMan: "Run ball, blocks are set",
          vsZone: "Press hole, find crease",
        },
      },
      {
        position: "X",
        alignment: "Split left, on numbers",
        landmark: "Inside shoulder of corner",
        assignment: "Bubble route - catch and get upfield",
        read: "Catch, read blocker, turn up",
        adjustments: {
          vsMan: "Expect ball, get yards",
          vsZone: "Be ready for quick throw",
        },
      },
      {
        position: "H",
        alignment: "Left slot",
        landmark: "Corner",
        assignment: "Stalk block for bubble",
        read: "Block nearest defender",
        adjustments: {
          vsMan: "Stalk the corner",
          vsZone: "Block most dangerous defender",
        },
      },
      {
        position: "Y",
        alignment: "Right slot",
        landmark: "Stalk block",
        assignment: "Block for run or be ready for late RPO look",
        read: "Sell run block, be ready",
        adjustments: {
          vsMan: "Block corner",
          vsZone: "Clear out or block",
        },
      },
      {
        position: "Z",
        alignment: "Split right",
        landmark: "Safety",
        assignment: "Run off - clear out",
        read: "Push vertical, take safety deep",
        adjustments: {
          vsMan: "Run off defender",
          vsZone: "Clear safety from box",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN PASS
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "rb-screen",
    name: "RB Screen",
    shortName: "Screen",
    formation: "shotgun-spread",
    playType: "screen",
    concept: "Screen",
    description: "Running back screen with linemen releasing to block. Use pressure against the defense.",
    keyPoints: [
      "Let rushers come",
      "RB catches behind releasing OL",
      "OL releases to block at second level",
    ],
    bestAgainst: ["Heavy Pressure", "Aggressive Rush"],
    diagramType: "pass",
    assignments: [
      {
        position: "QB",
        alignment: "Shotgun, 5 yards",
        landmark: "RB in flat",
        assignment: "Sell deep pass, dump to RB",
        read: "Look off safety, throw to RB in flat",
        adjustments: {
          vsMan: "Quick release to RB",
          vsZone: "Sell deep, throw screen",
          vsBlitz: "Quick throw as designed",
        },
      },
      {
        position: "RB",
        alignment: "Beside QB",
        landmark: "Behind releasing OL",
        assignment: "Fake block, release to flat behind OL",
        read: "Catch, get behind linemen, run",
        adjustments: {
          vsMan: "Follow blocks, be patient",
          vsZone: "Get behind OL wall",
        },
      },
      {
        position: "X",
        alignment: "Split left",
        landmark: "Deep post",
        assignment: "Run off - deep route to sell pass",
        routeId: "post",
        depth: 20,
        read: "Run off defenders, sell deep ball",
        adjustments: {
          vsMan: "Push corner deep",
          vsZone: "Take safety attention",
        },
      },
      {
        position: "H",
        alignment: "Slot left",
        landmark: "Deep cross",
        assignment: "Cross field deep - clear out",
        routeId: "dig",
        depth: 15,
        read: "Clear middle of field",
        adjustments: {
          vsMan: "Run defender away from screen",
          vsZone: "Clear out middle zone",
        },
      },
      {
        position: "Z",
        alignment: "Split right",
        landmark: "Deep route",
        assignment: "Go route - sell deep ball",
        routeId: "go",
        depth: 30,
        read: "Run off coverage",
        adjustments: {
          vsMan: "Beat corner deep",
          vsZone: "Clear out",
        },
      },
      {
        position: "Y",
        alignment: "Slot or inline",
        landmark: "Block downfield",
        assignment: "Release and block at second level",
        read: "Find LB to block",
        adjustments: {
          vsMan: "Block nearest LB",
          vsZone: "Find unblocked defender",
        },
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ QUESTION GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate all quiz questions for a specific position on a play
 */
export function generateQuestionsForPosition(
  play: PlayDefinition,
  position: SkillPosition
): AssignmentQuestion[] {
  const assignment = play.assignments.find(a => a.position === position);
  if (!assignment) return [];

  const questions: AssignmentQuestion[] = [];

  // Alignment question
  questions.push({
    playId: play.id,
    position,
    category: "alignment",
    question: `Where do you align on ${play.name}?`,
    correctAnswer: assignment.alignment,
    options: generateAlignmentOptions(assignment.alignment),
    hint: `Think about your position relative to the formation`,
  });

  // Landmark question
  questions.push({
    playId: play.id,
    position,
    category: "landmark",
    question: `What's your landmark/aiming point on ${play.name}?`,
    correctAnswer: assignment.landmark,
    options: generateLandmarkOptions(assignment.landmark),
  });

  // Assignment question
  questions.push({
    playId: play.id,
    position,
    category: "assignment",
    question: `What's your assignment on ${play.name}?`,
    correctAnswer: assignment.assignment,
    options: generateAssignmentOptions(assignment.assignment, play.playType),
  });

  // Read question
  questions.push({
    playId: play.id,
    position,
    category: "read",
    question: `What's your key read on ${play.name}?`,
    correctAnswer: assignment.read,
    options: generateReadOptions(assignment.read),
  });

  // Adjustment question (vs Man)
  questions.push({
    playId: play.id,
    position,
    category: "adjustment",
    question: `How do you adjust vs Man coverage on ${play.name}?`,
    correctAnswer: assignment.adjustments.vsMan,
    options: generateAdjustmentOptions(assignment.adjustments.vsMan),
  });

  return questions;
}

/**
 * Generate wrong answer options for alignment
 */
function generateAlignmentOptions(correct: string): string[] {
  const allAlignments = [
    "Shotgun, 5 yards deep",
    "Shotgun, 4 yards deep",
    "Split left, on numbers",
    "Split right, on numbers",
    "Left slot, 1 yard off ball",
    "Right slot, 1 yard off ball",
    "#1 receiver to trips, on numbers",
    "#2 receiver trips, inside slot",
    "#3 receiver trips, inside slot",
    "Offset left, 1 yard behind QB",
    "Offset right, 1 yard behind QB",
    "Inline, tight",
    "Under center",
    "7 yards deep, behind QB",
    "4 yards deep, behind QB",
    "Beside QB, offset",
    "Wing position",
    "Backside split",
  ];
  return shuffleAndPick(allAlignments, correct, 4);
}

/**
 * Generate wrong answer options for landmarks
 */
function generateLandmarkOptions(correct: string): string[] {
  const allLandmarks = [
    "Back pylon",
    "Corner of end zone",
    "Goalpost",
    "Opposite hash",
    "Far hash",
    "Inside hip of Mike",
    "Eyes on Mike LB",
    "Sideline at LOS",
    "Opposite numbers",
    "Numbers at LOS",
    "Near safety",
    "Playside LB",
    "Deep middle safety",
    "Flat defender",
    "Playside A-gap",
    "Mesh point with RB",
    "Inside shoulder of corner",
    "Stalk block on corner",
  ];
  return shuffleAndPick(allLandmarks, correct, 4);
}

/**
 * Generate wrong answer options for assignments
 */
function generateAssignmentOptions(correct: string, playType: string): string[] {
  const passAssignments = [
    "Corner route at 12-15 yards",
    "Go route - win outside",
    "Shallow cross at 6 yards",
    "Shallow cross at 5 yards - mesh with H",
    "Check release to flat",
    "Seam route between numbers and hash",
    "Slant at 5-6 yards",
    "Arrow/Flat route",
    "Dig route at 12 yards",
    "Out route at 10-12 yards",
    "Flat route - shoot outside",
    "Block, then release weak flat",
    "Clear out - Go route",
    "Post route at 15 yards",
    "Curl at 12 yards",
    "Quick game progression",
  ];

  const runAssignments = [
    "Zone track - read first DL to playside",
    "Block perimeter - stalk corner",
    "Zone combo - double team to LB",
    "Arc block or crack",
    "Kick out the end man on LOS",
    "Follow FB's block through B-gap",
    "Down block, seal inside",
    "Block safety or crack on LB",
    "Reverse pivot, hand to RB",
    "Lead through hole",
    "Stalk block",
    "Pull and trap",
    "Inside zone track - expect mesh",
  ];

  const options = playType === "run" ? runAssignments : passAssignments;
  return shuffleAndPick(options, correct, 4);
}

/**
 * Generate wrong answer options for reads
 */
function generateReadOptions(correct: string): string[] {
  const allReads = [
    "Mike LB - if he drops, throw mesh",
    "Safety leverage - inside release if safety is over top",
    "Take top off - run corner off",
    "Find window in zone, settle vs man",
    "Cross tight with H, get to opposite flat",
    "If free, release to flat as checkdown",
    "Single high = seams open; two high = outside verticals",
    "Corner technique - inside release if pressed",
    "Find void between safeties",
    "Read safety leverage, adjust path",
    "Blitz pickup, then outlet",
    "If DL flows playside, cut back",
    "Mirror corner's movement",
    "Help on DL, work up to LB",
    "Block most dangerous defender",
    "Flat drops = slant; Flat jumps = flat",
    "Top to bottom on the flood side",
    "If LB steps up, throw bubble",
  ];
  return shuffleAndPick(allReads, correct, 4);
}

/**
 * Generate wrong answer options for adjustments
 */
function generateAdjustmentOptions(correct: string): string[] {
  const allAdjustments = [
    "Stack and separate at break",
    "Win at line, stack defender",
    "Rub off Y's cross, accelerate to window",
    "Use H as pick, burst out of mesh",
    "Win matchup vs LB",
    "Look for rub on mesh, throw to separation",
    "Speed release, stack corner",
    "Vertical push, find soft spot",
    "Win inside, get vertical",
    "Block then release to space",
    "Press hole, one cut, go",
    "Stalk block, cut off pursuit",
    "Drive block DE, climb to LB",
    "Arc release to safety",
    "Collision DE, create lane",
    "Follow blocks, one cut upfield",
    "Give to RB, LBs are covering",
    "Follow blocks, be patient",
  ];
  return shuffleAndPick(allAdjustments, correct, 4);
}

/**
 * Utility: shuffle array and pick N options including the correct one
 */
function shuffleAndPick(options: string[], correct: string, count: number): string[] {
  const filtered = options.filter(o => o !== correct);
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count - 1);
  const result = [...selected, correct];
  return result.sort(() => Math.random() - 0.5);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a play by ID
 */
export function getPlayById(id: string): PlayDefinition | undefined {
  return PLAYS.find(p => p.id === id);
}

/**
 * Get all plays for a specific formation
 */
export function getPlaysByFormation(formationId: FormationId): PlayDefinition[] {
  return PLAYS.filter(p => p.formation === formationId);
}

/**
 * Get all available positions for a play
 */
export function getPositionsForPlay(playId: string): SkillPosition[] {
  const play = getPlayById(playId);
  if (!play) return [];
  return play.assignments.map(a => a.position);
}

/**
 * Get assignment for a specific position on a play
 */
export function getPositionAssignment(
  playId: string, 
  position: SkillPosition
): PositionAssignment | undefined {
  const play = getPlayById(playId);
  if (!play) return undefined;
  return play.assignments.find(a => a.position === position);
}

/**
 * Get all play names for UI selection
 */
export function getPlayNames(): { id: string; name: string; shortName: string }[] {
  return PLAYS.map(p => ({ 
    id: p.id, 
    name: p.name, 
    shortName: p.shortName 
  }));
}








