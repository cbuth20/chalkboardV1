// ═══════════════════════════════════════════════════════════════════════════
// PLAY CALLS — NFL-style play call structure and examples
// How real plays are called in the huddle and at the line
// ═══════════════════════════════════════════════════════════════════════════

import type { SystemId } from "./coachingSystems";

/**
 * A component of a play call
 */
export interface PlayCallComponent {
  id: string;
  name: string;
  description: string;
  examples: string[];
  position: number; // Order in the play call
}

/**
 * Complete play call structure for a system
 */
export interface PlayCallStructure {
  systemId: SystemId;
  format: string;
  components: PlayCallComponent[];
  exampleCalls: {
    call: string;
    breakdown: string;
    type: "pass" | "run" | "screen" | "rpo";
  }[];
}

/**
 * Personnel grouping definition
 */
export interface PersonnelPackage {
  id: string;
  name: string;
  notation: string;
  description: string;
  rbCount: number;
  teCount: number;
  wrCount: number;
  usage: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONNEL PACKAGES
// ═══════════════════════════════════════════════════════════════════════════

export const PERSONNEL_PACKAGES: PersonnelPackage[] = [
  {
    id: "00",
    name: "Empty",
    notation: "00",
    description: "0 RB, 0 TE, 5 WR. Maximum receivers, empty backfield.",
    rbCount: 0,
    teCount: 0,
    wrCount: 5,
    usage: [
      "Passing situations",
      "Two-minute drill",
      "Must-pass downs",
    ],
  },
  {
    id: "10",
    name: "Spread",
    notation: "10",
    description: "1 RB, 0 TE, 4 WR. Spread out the defense with receivers.",
    rbCount: 1,
    teCount: 0,
    wrCount: 4,
    usage: [
      "Spread passing offense",
      "Shotgun formations",
      "Air raid sets",
    ],
  },
  {
    id: "11",
    name: "Base",
    notation: "11",
    description: "1 RB, 1 TE, 3 WR. Most common NFL personnel grouping. Balanced run/pass.",
    rbCount: 1,
    teCount: 1,
    wrCount: 3,
    usage: [
      "Most plays",
      "Balanced offense",
      "Standard downs",
    ],
  },
  {
    id: "12",
    name: "Two Tight End",
    notation: "12",
    description: "1 RB, 2 TE, 2 WR. Run-heavy look with two tight ends.",
    rbCount: 1,
    teCount: 2,
    wrCount: 2,
    usage: [
      "Power running",
      "Play-action",
      "Short yardage",
      "Goal line",
    ],
  },
  {
    id: "13",
    name: "Heavy",
    notation: "13",
    description: "1 RB, 3 TE, 1 WR. Power formation for short-yardage and goal line.",
    rbCount: 1,
    teCount: 3,
    wrCount: 1,
    usage: [
      "Goal line",
      "Short yardage",
      "Power running",
    ],
  },
  {
    id: "20",
    name: "Two Back Spread",
    notation: "20",
    description: "2 RB, 0 TE, 3 WR. Two backs with spread receivers.",
    rbCount: 2,
    teCount: 0,
    wrCount: 3,
    usage: [
      "Misdirection",
      "Option football",
      "Dual threat",
    ],
  },
  {
    id: "21",
    name: "I-Formation",
    notation: "21",
    description: "2 RB (FB + HB), 1 TE, 2 WR. Traditional two-back set.",
    rbCount: 2,
    teCount: 1,
    wrCount: 2,
    usage: [
      "Power running",
      "Play-action",
      "Pro-style offense",
    ],
  },
  {
    id: "22",
    name: "Jumbo",
    notation: "22",
    description: "2 RB, 2 TE, 1 WR. Maximum blockers for power football.",
    rbCount: 2,
    teCount: 2,
    wrCount: 1,
    usage: [
      "Goal line",
      "Short yardage",
      "Power situations",
    ],
  },
  {
    id: "23",
    name: "Goal Line",
    notation: "23",
    description: "2 RB, 3 TE, 0 WR. Heavy set for goal line or short yardage.",
    rbCount: 2,
    teCount: 3,
    wrCount: 0,
    usage: [
      "Goal line",
      "QB sneak situations",
      "4th and short",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// FORMATION CALLS
// ═══════════════════════════════════════════════════════════════════════════

export const FORMATION_COMPONENTS = {
  backfieldAlignment: [
    { call: "I", meaning: "I-Formation (FB in front of HB)" },
    { call: "Gun", meaning: "Shotgun (QB 4-5 yards back)" },
    { call: "Pistol", meaning: "Pistol (QB 3-4 yards, RB behind)" },
    { call: "Ace", meaning: "One back, QB under center" },
    { call: "Pro", meaning: "Two backs split" },
    { call: "Empty", meaning: "No backs in backfield" },
  ],
  receiverStrength: [
    { call: "Right", meaning: "Strength/TE to the right" },
    { call: "Left", meaning: "Strength/TE to the left" },
    { call: "Doubles", meaning: "2x2 receiver split" },
    { call: "Trips", meaning: "3x1 receiver split" },
    { call: "Bunch", meaning: "3 receivers bunched together" },
    { call: "Stack", meaning: "Receivers stacked vertically" },
  ],
  tightEndAlignment: [
    { call: "Tight", meaning: "TE on the line of scrimmage" },
    { call: "Split", meaning: "TE off the line (flexed)" },
    { call: "Wing", meaning: "TE/WR in wing position" },
    { call: "Nub", meaning: "No TE to that side" },
  ],
  motionCalls: [
    { call: "Jet", meaning: "Fast motion across formation" },
    { call: "Fly", meaning: "Motion in the same direction" },
    { call: "Return", meaning: "Motion back to original spot" },
    { call: "Orbit", meaning: "RB/WR circling motion" },
    { call: "Trade", meaning: "Two players swap positions" },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// PLAY CALL STRUCTURES BY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export const PLAY_CALL_STRUCTURES: PlayCallStructure[] = [
  {
    systemId: "west-coast",
    format: "[Formation] [Motion] [Protection] [Play]",
    components: [
      {
        id: "wc-formation",
        name: "Formation",
        description: "The offensive alignment. Includes backfield, strength, and TE position.",
        examples: ["Red Right Tight", "Green Left", "Brown Right"],
        position: 1,
      },
      {
        id: "wc-motion",
        name: "Motion",
        description: "Pre-snap motion for a specific player.",
        examples: ["F Left", "Z Motion", "H Jet"],
        position: 2,
      },
      {
        id: "wc-protection",
        name: "Protection",
        description: "The protection scheme call.",
        examples: ["2 Jet", "3 Jet", "Half Slide"],
        position: 3,
      },
      {
        id: "wc-play",
        name: "Play/Concept",
        description: "The specific play or route combination.",
        examples: ["22 Z In", "Y Banana", "18 Bob"],
        position: 4,
      },
    ],
    exampleCalls: [
      {
        call: "Red Right Tight F Left 2 Jet 22 Z In",
        breakdown: "Formation: 2 backs (Red), TE right on line (Right Tight). Motion: F goes left. Protection: 7-man (2 Jet). Play: Zone run (22) with Z on in route if RPO.",
        type: "rpo",
      },
      {
        call: "Green Right 3 Jet Y Banana",
        breakdown: "Formation: 1 back (Green), strength right. Protection: 6-man (3 Jet). Play: Y (TE) runs a corner route (Banana).",
        type: "pass",
      },
      {
        call: "Brown Left F Right 2 Jet 18 Bob",
        breakdown: "Formation: 2 backs (Brown), strength left. Motion: F goes right. Protection: 7-man. Play: Power run (18 Bob) to the right.",
        type: "run",
      },
    ],
  },
  {
    systemId: "erhardt-perkins",
    format: "[Formation] [Concept]",
    components: [
      {
        id: "ep-formation",
        name: "Formation",
        description: "Single word formation call tells everyone where to line up.",
        examples: ["Gun Trips Right", "Ace Right", "Pistol Strong Left"],
        position: 1,
      },
      {
        id: "ep-concept",
        name: "Concept",
        description: "Single word that tells everyone their assignment. Same concept works from any formation.",
        examples: ["Ghost", "Hoss", "Yankee", "Mesh"],
        position: 2,
      },
    ],
    exampleCalls: [
      {
        call: "Gun Trips Right Ghost",
        breakdown: "Formation: Shotgun with 3 receivers right. Concept: Ghost (post-dig combination vs single high safety). Everyone knows their route based on their position.",
        type: "pass",
      },
      {
        call: "Ace Right Duo",
        breakdown: "Formation: Single back, TE right. Concept: Duo (double team at point of attack, RB reads backside).",
        type: "run",
      },
      {
        call: "Pistol Strong Left Mesh",
        breakdown: "Formation: Pistol with strength left. Concept: Mesh (crossing routes from opposite sides creating natural picks).",
        type: "pass",
      },
    ],
  },
  {
    systemId: "coryell",
    format: "[Formation] [Route Numbers] [Tags]",
    components: [
      {
        id: "co-formation",
        name: "Formation",
        description: "Alignment call.",
        examples: ["Doubles Right", "Trips Left", "Ace"],
        position: 1,
      },
      {
        id: "co-routes",
        name: "Route Numbers",
        description: "Numbers (0-9) for each receiver's route. Given in order: X, Y, Z or specific position tags.",
        examples: ["525", "976", "84"],
        position: 2,
      },
      {
        id: "co-tags",
        name: "Tags",
        description: "Additional instructions for specific players.",
        examples: ["F Flat", "Check Release", "Max"],
        position: 3,
      },
    ],
    exampleCalls: [
      {
        call: "Doubles Right 525 F Flat",
        breakdown: "Formation: 2x2 with strength right. Routes: X runs 5 (out), Y runs 2 (slant), Z runs 5 (out). Tag: F releases to flat.",
        type: "pass",
      },
      {
        call: "Trips Left 976",
        breakdown: "Formation: 3x1 with trips left. Routes: X runs 9 (go), Y runs 7 (corner), Z runs 6 (curl). A deep shot with intermediate option.",
        type: "pass",
      },
      {
        call: "Ace 84 Max",
        breakdown: "Formation: Single back. Routes: X runs 8 (post), Y runs 4 (dig). Tag: Max protection (keep backs in).",
        type: "pass",
      },
    ],
  },
  {
    systemId: "air-raid",
    format: "[Formation] [Concept] [Tags]",
    components: [
      {
        id: "ar-formation",
        name: "Formation",
        description: "Simple formation calls.",
        examples: ["Ace", "Trips", "Empty"],
        position: 1,
      },
      {
        id: "ar-concept",
        name: "Concept",
        description: "The pass concept being run.",
        examples: ["Mesh", "Y-Cross", "Verticals", "Stick"],
        position: 2,
      },
      {
        id: "ar-tags",
        name: "Tags",
        description: "Optional adjustments.",
        examples: ["Y-Shallow", "Go", "Check"],
        position: 3,
      },
    ],
    exampleCalls: [
      {
        call: "Ace Mesh Y-Shallow",
        breakdown: "Formation: 2x2. Concept: Mesh (crossers). Tag: Y runs the shallow cross instead of standard mesh depth.",
        type: "pass",
      },
      {
        call: "Trips Verticals",
        breakdown: "Formation: 3x1. Concept: All four receivers run vertical routes. Simple, aggressive deep shot.",
        type: "pass",
      },
      {
        call: "Empty Y-Cross",
        breakdown: "Formation: 5 wide, empty backfield. Concept: Y-Cross (TE crosses over the ball).",
        type: "pass",
      },
    ],
  },
  {
    systemId: "shanahan",
    format: "[Formation] [Motion] [Play Type] [Concept]",
    components: [
      {
        id: "sh-formation",
        name: "Formation",
        description: "Alignment including personnel look.",
        examples: ["Pistol Strong Right", "Gun Split Close", "Ace Wing Left"],
        position: 1,
      },
      {
        id: "sh-motion",
        name: "Motion",
        description: "Pre-snap motion to diagnose coverage.",
        examples: ["H Jet", "Z Orbit", "F Trade"],
        position: 2,
      },
      {
        id: "sh-type",
        name: "Play Type",
        description: "Run, pass, or play-action indicator.",
        examples: ["24 (run)", "Boot", "Naked", "Drop"],
        position: 3,
      },
      {
        id: "sh-concept",
        name: "Concept",
        description: "The specific play or pass concept.",
        examples: ["Zone", "Pin-Pull", "Flood", "Cross"],
        position: 4,
      },
    ],
    exampleCalls: [
      {
        call: "Pistol Strong Right H Jet 24 Zone",
        breakdown: "Formation: Pistol, strength right. Motion: H in jet motion. Play: 24 Inside Zone to the weak side. Jet motion helps identify defensive front.",
        type: "run",
      },
      {
        call: "Gun Split Close Z Orbit Boot Flood",
        breakdown: "Formation: Shotgun split backs. Motion: Z in orbit motion. Play: Bootleg pass with flood concept (3 routes to one side).",
        type: "pass",
      },
      {
        call: "Ace Wing Left F Trade Naked Cross",
        breakdown: "Formation: Single back, wing left. Motion: F trades position. Play: Naked bootleg (no puller) with cross concept.",
        type: "pass",
      },
    ],
  },
  {
    systemId: "spread-option",
    format: "[Formation] [Run Concept] [RPO Tag]",
    components: [
      {
        id: "so-formation",
        name: "Formation",
        description: "Spread alignment.",
        examples: ["Gun Trips", "Gun Doubles", "Pistol"],
        position: 1,
      },
      {
        id: "so-concept",
        name: "Run Concept",
        description: "The base run play with read.",
        examples: ["Inside Zone Read", "Power Read", "Counter"],
        position: 2,
      },
      {
        id: "so-rpo",
        name: "RPO Tag",
        description: "Optional pass attached to the run.",
        examples: ["Bubble", "Pop", "Glance", "Stick"],
        position: 3,
      },
    ],
    exampleCalls: [
      {
        call: "Gun Trips Inside Zone Read Bubble",
        breakdown: "Formation: Shotgun with trips. Run: Inside zone with QB reading backside end for give/keep. RPO: If OLB scrapes, throw bubble screen.",
        type: "rpo",
      },
      {
        call: "Pistol Power Read Glance",
        breakdown: "Formation: Pistol. Run: Power with QB reading for give/pull. RPO: If LB vacates, throw the glance (quick slant) to the slot.",
        type: "rpo",
      },
      {
        call: "Gun Doubles Counter Pop",
        breakdown: "Formation: Shotgun 2x2. Run: Counter with pulling linemen. RPO: Pop pass to the TE behind the LBs if they flow to the run.",
        type: "rpo",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// NUMBER SYSTEMS
// ═══════════════════════════════════════════════════════════════════════════

export const NUMBERING_SYSTEMS = {
  holeNumbering: {
    description: "Traditional run play numbering. Odd numbers go left, even numbers go right.",
    holes: [
      { number: 0, side: "center", description: "QB sneak, straight ahead" },
      { number: 1, side: "left", description: "Left A gap" },
      { number: 2, side: "right", description: "Right A gap" },
      { number: 3, side: "left", description: "Left B gap" },
      { number: 4, side: "right", description: "Right B gap" },
      { number: 5, side: "left", description: "Left C gap (off-tackle)" },
      { number: 6, side: "right", description: "Right C gap (off-tackle)" },
      { number: 7, side: "left", description: "Left outside" },
      { number: 8, side: "right", description: "Right outside" },
      { number: 9, side: "left", description: "Far left (sweep)" },
    ],
    examples: [
      { play: "24 Dive", meaning: "2-back through the 4 hole (right B gap)" },
      { play: "36 Power", meaning: "3-back through the 6 hole (right off-tackle)" },
      { play: "28 Toss", meaning: "2-back around the 8 hole (right outside)" },
    ],
  },
  routeTree: {
    description: "Coryell-style route numbering system. 0-9 represent different routes.",
    routes: [
      { number: 0, route: "Hitch/Stop", depth: "5-6 yards" },
      { number: 1, route: "Quick Out", depth: "5 yards" },
      { number: 2, route: "Slant", depth: "5-7 yards" },
      { number: 3, route: "Deep Out", depth: "12-15 yards" },
      { number: 4, route: "Deep In/Dig", depth: "12-15 yards" },
      { number: 5, route: "Speed Out/Whip", depth: "8-10 yards" },
      { number: 6, route: "Curl/Comeback", depth: "12-15 yards" },
      { number: 7, route: "Corner/Flag", depth: "12-15+ yards" },
      { number: 8, route: "Post", depth: "15-18+ yards" },
      { number: 9, route: "Go/Fly/Streak", depth: "Max depth" },
    ],
  },
  protectionNumbering: {
    description: "Protection scheme numbering often indicates number of blockers.",
    schemes: [
      { number: 50, meaning: "5-man protection (standard)" },
      { number: 60, meaning: "6-man protection (RB checks)" },
      { number: 70, meaning: "7-man protection (max)" },
      { number: 80, meaning: "8-man protection (special max)" },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE PLAY CALLS FOR TEACHING
// ═══════════════════════════════════════════════════════════════════════════

export const SAMPLE_PLAY_CALLS = {
  runPlays: [
    {
      call: "I-Right 36 Power",
      system: "Traditional",
      description: "I-Formation, strength right. 3-back (FB leads) through 6 hole (right off-tackle). Power blocking with pulling guard.",
    },
    {
      call: "Gun Split Inside Zone",
      system: "Zone",
      description: "Shotgun with split backs. Inside zone play, RB reads the blocks and cuts to daylight.",
    },
    {
      call: "Pistol Strong 24 Duo",
      system: "Gap/Zone Hybrid",
      description: "Pistol formation, strength declared. Duo concept: double team at POA, RB presses and reads backside.",
    },
  ],
  passConcepts: [
    {
      call: "Gun Trips Right Mesh",
      system: "Concept-based",
      description: "Shotgun with 3 receivers right. Mesh concept: two crossers creating natural picks against man coverage.",
    },
    {
      call: "Ace Right 525 F Flat",
      system: "Coryell",
      description: "Single back, TE right. X runs 5 (out), Y runs 2 (slant), Z runs 5 (out). FB to flat.",
    },
    {
      call: "Red Right Tight 2 Jet Y Banana",
      system: "West Coast",
      description: "Two backs, TE right on line. 7-man protection. Y (TE) runs corner route (Banana).",
    },
  ],
  rpos: [
    {
      call: "Gun Doubles Zone Read Bubble",
      system: "Spread",
      description: "Shotgun 2x2. Zone read (QB reads backside DE). If slot defender scrapes, throw bubble.",
    },
    {
      call: "Pistol Trips Power Read Pop",
      system: "Spread Option",
      description: "Pistol with trips. Power read (QB reads front-side defender). Pop pass to TE if LB vacates.",
    },
  ],
  screens: [
    {
      call: "Gun Spread 90",
      system: "Air Raid",
      description: "Shotgun spread formation. Quick screen to #1 receiver right side.",
    },
    {
      call: "I-Right 38 Slip Screen",
      system: "Traditional",
      description: "I-Formation right. 3-back slips out to flat after faking block, linemen release downfield.",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get play call structure for a system
 */
export function getPlayCallStructure(systemId: SystemId): PlayCallStructure | undefined {
  return PLAY_CALL_STRUCTURES.find((s) => s.systemId === systemId);
}

/**
 * Get personnel package by ID
 */
export function getPersonnelPackage(id: string): PersonnelPackage | undefined {
  return PERSONNEL_PACKAGES.find((p) => p.id === id);
}

/**
 * Parse a personnel grouping notation
 */
export function parsePersonnel(notation: string): { rbs: number; tes: number; wrs: number } | undefined {
  if (notation.length !== 2) return undefined;
  const rbs = parseInt(notation[0], 10);
  const tes = parseInt(notation[1], 10);
  if (isNaN(rbs) || isNaN(tes)) return undefined;
  const wrs = 5 - rbs - tes;
  return { rbs, tes, wrs };
}

/**
 * Get hole number explanation
 */
export function getHoleExplanation(holeNumber: number): { side: string; description: string } | undefined {
  const hole = NUMBERING_SYSTEMS.holeNumbering.holes.find((h) => h.number === holeNumber);
  if (!hole) return undefined;
  return { side: hole.side, description: hole.description };
}

/**
 * Get route from number
 */
export function getRouteFromNumber(routeNumber: number): { route: string; depth: string } | undefined {
  const route = NUMBERING_SYSTEMS.routeTree.routes.find((r) => r.number === routeNumber);
  if (!route) return undefined;
  return { route: route.route, depth: route.depth };
}

/**
 * Break down a route call (like "525")
 */
export function breakdownRouteCall(
  routeCall: string
): { position: string; number: number; route: string }[] | undefined {
  const positions = ["X", "Y", "Z", "H", "F"];
  const results: { position: string; number: number; route: string }[] = [];
  
  for (let i = 0; i < routeCall.length && i < positions.length; i++) {
    const num = parseInt(routeCall[i], 10);
    if (isNaN(num)) continue;
    
    const routeInfo = getRouteFromNumber(num);
    if (routeInfo) {
      results.push({
        position: positions[i],
        number: num,
        route: routeInfo.route,
      });
    }
  }
  
  return results.length > 0 ? results : undefined;
}

/**
 * Get all example play calls
 */
export function getAllExampleCalls(): {
  call: string;
  system: string;
  description: string;
  type: string;
}[] {
  return [
    ...SAMPLE_PLAY_CALLS.runPlays.map((p) => ({ ...p, type: "run" })),
    ...SAMPLE_PLAY_CALLS.passConcepts.map((p) => ({ ...p, type: "pass" })),
    ...SAMPLE_PLAY_CALLS.rpos.map((p) => ({ ...p, type: "rpo" })),
    ...SAMPLE_PLAY_CALLS.screens.map((p) => ({ ...p, type: "screen" })),
  ];
}
