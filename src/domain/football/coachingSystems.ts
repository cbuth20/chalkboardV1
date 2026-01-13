// ═══════════════════════════════════════════════════════════════════════════
// COACHING SYSTEMS — NFL and College offensive system terminology
// Allows Chalk Talk to translate between different team terminologies
// ═══════════════════════════════════════════════════════════════════════════

import type { ConceptId, RouteId } from "./playConcepts";

/**
 * Offensive system identifier
 */
export type SystemId =
  | "west-coast"
  | "erhardt-perkins"
  | "coryell"
  | "air-raid"
  | "shanahan"
  | "spread-option";

/**
 * A play call in a specific system
 */
export interface SystemPlayCall {
  conceptId: ConceptId | string;
  systemCall: string;
  explanation: string;
}

/**
 * A route name in a specific system
 */
export interface SystemRouteName {
  routeId: RouteId | string;
  systemName: string;
  number?: number;
}

/**
 * Complete coaching system definition
 */
export interface CoachingSystem {
  id: SystemId;
  name: string;
  shortName: string;
  origin: string;
  description: string;
  famousTeams: string[];
  famousCoaches: string[];
  
  // How plays are called
  playCallFormat: string;
  playCallExample: string;
  
  // Route naming conventions
  routeNumbers?: Record<number, string>;
  routeNames: SystemRouteName[];
  
  // Pass concept calls
  passConcepts: SystemPlayCall[];
  
  // Protection calls
  protectionCalls: string[];
  
  // Key terminology unique to this system
  uniqueTerms: { term: string; meaning: string }[];
  
  // Coaching philosophy
  philosophy: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// WEST COAST OFFENSE
// ═══════════════════════════════════════════════════════════════════════════

const WEST_COAST: CoachingSystem = {
  id: "west-coast",
  name: "West Coast Offense",
  shortName: "West Coast",
  origin: "Developed by Bill Walsh with the San Francisco 49ers in the 1980s",
  description: "A timing-based passing offense that uses short, horizontal passes to replace the running game. Emphasizes ball control, precision timing, and yards after catch. Features a complex play-calling system with specific formations, motions, and protections.",
  famousTeams: ["San Francisco 49ers", "Green Bay Packers", "Philadelphia Eagles"],
  famousCoaches: ["Bill Walsh", "Mike Holmgren", "Andy Reid", "Jon Gruden"],
  
  playCallFormat: "[Formation] [Motion] [Protection] [Play/Concept]",
  playCallExample: "Red Right Tight F Left 2 Jet Z In",
  
  routeNames: [
    { routeId: "hitch", systemName: "Stop" },
    { routeId: "slant", systemName: "Slant" },
    { routeId: "out", systemName: "Out" },
    { routeId: "in", systemName: "In" },
    { routeId: "curl", systemName: "Curl" },
    { routeId: "dig", systemName: "Square In" },
    { routeId: "corner", systemName: "Corner" },
    { routeId: "post", systemName: "Post" },
    { routeId: "go", systemName: "Go" },
    { routeId: "flat", systemName: "Flat" },
    { routeId: "wheel", systemName: "Wheel" },
    { routeId: "seam", systemName: "Seam" },
    { routeId: "drag", systemName: "Drag" },
  ],
  
  passConcepts: [
    { conceptId: "mesh", systemCall: "Mesh", explanation: "Two receivers crossing at 5-6 yards" },
    { conceptId: "smash", systemCall: "Smash", explanation: "Corner/hitch combination" },
    { conceptId: "flood", systemCall: "Flood", explanation: "Three routes to one side" },
    { conceptId: "levels", systemCall: "Levels", explanation: "Vertical stretch with three depths" },
    { conceptId: "mills", systemCall: "Double Square", explanation: "Post over dig concept" },
    { conceptId: "four-verts", systemCall: "All Go", explanation: "Four vertical routes" },
    { conceptId: "stick", systemCall: "Stick", explanation: "Quick game triangle read" },
    { conceptId: "snag", systemCall: "Snag", explanation: "Spot, corner, flat triangle" },
    { conceptId: "spacing", systemCall: "Spacing", explanation: "Five receivers across field" },
  ],
  
  protectionCalls: [
    "Jet (max protect)",
    "2 Jet (7-man protection)",
    "3 Jet (6-man protection)",
    "Half Slide",
    "Full Slide",
    "BOB (Big on Big)",
  ],
  
  uniqueTerms: [
    { term: "Red/Brown", meaning: "Formation with 2 backs (I-Formation look)" },
    { term: "Green", meaning: "One back formation" },
    { term: "Right/Left", meaning: "Strength call (TE side)" },
    { term: "Tight/Split", meaning: "TE alignment (on line vs off)" },
    { term: "F Motion", meaning: "Fullback/wing motion" },
    { term: "Z In", meaning: "Z receiver runs in-breaking route" },
    { term: "Y Banana", meaning: "TE runs corner route" },
    { term: "22/23", meaning: "Zone running plays" },
    { term: "16/17", meaning: "Power running plays" },
  ],
  
  philosophy: [
    "The pass sets up the run, not vice versa",
    "Short passing game replaces the running game",
    "Timing and precision over raw talent",
    "Move the chains and control clock with passes",
    "Every player must know every position's assignment",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// ERHARDT-PERKINS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const ERHARDT_PERKINS: CoachingSystem = {
  id: "erhardt-perkins",
  name: "Erhardt-Perkins System",
  shortName: "E-P System",
  origin: "Developed by Ron Erhardt and Ray Perkins with the New England Patriots in the 1970s-80s",
  description: "A concept-based system where one word calls an entire play concept. Instead of calling individual routes for each receiver, one word tells everyone their assignment. This allows flexibility in formations while keeping the concept the same.",
  famousTeams: ["New England Patriots", "Alabama Crimson Tide", "Las Vegas Raiders"],
  famousCoaches: ["Bill Belichick", "Nick Saban", "Josh McDaniels", "Charlie Weis"],
  
  playCallFormat: "[Formation] [Concept Word]",
  playCallExample: "Gun Trips Right Ghost",
  
  routeNames: [
    { routeId: "hitch", systemName: "Hitch" },
    { routeId: "slant", systemName: "Slant" },
    { routeId: "out", systemName: "Out" },
    { routeId: "in", systemName: "Dig" },
    { routeId: "curl", systemName: "Curl" },
    { routeId: "corner", systemName: "7" },
    { routeId: "post", systemName: "8" },
    { routeId: "go", systemName: "9" },
    { routeId: "flat", systemName: "Flat" },
    { routeId: "wheel", systemName: "Wheel" },
    { routeId: "seam", systemName: "Seam" },
    { routeId: "drag", systemName: "Drag" },
  ],
  
  passConcepts: [
    { conceptId: "mesh", systemCall: "Mesh", explanation: "Crossers from opposite sides" },
    { conceptId: "smash", systemCall: "Smash", explanation: "Corner over hitch" },
    { conceptId: "flood", systemCall: "Flood", explanation: "Three levels to one side" },
    { conceptId: "levels", systemCall: "Levels", explanation: "Vertical stretch" },
    { conceptId: "mills", systemCall: "Ghost", explanation: "Post-dig combination" },
    { conceptId: "four-verts", systemCall: "Hoss/Juke", explanation: "Four verticals with option" },
    { conceptId: "y-cross", systemCall: "Yankee", explanation: "TE crossing concept" },
    { conceptId: "dagger", systemCall: "Dagger", explanation: "Post-dig-flat triangle" },
  ],
  
  protectionCalls: [
    "60 (max protect)",
    "50 (standard drop back)",
    "Scan",
    "Solid",
    "Slide",
  ],
  
  uniqueTerms: [
    { term: "Ghost", meaning: "Post-dig concept vs single high" },
    { term: "Hoss", meaning: "Four verticals with hot option vs blitz" },
    { term: "Juke", meaning: "Four verticals with sit option" },
    { term: "Yankee", meaning: "TE over the ball" },
    { term: "Tosser", meaning: "Screen concept" },
    { term: "Divide", meaning: "Split field passing concept" },
    { term: "Ace", meaning: "2 TE formation" },
    { term: "Gun", meaning: "Shotgun formation" },
    { term: "Pistol", meaning: "Pistol formation" },
  ],
  
  philosophy: [
    "One word = one concept, regardless of formation",
    "Simplify to amplify – less verbiage, more execution",
    "Concepts translate across any formation",
    "Players learn concepts, not just plays",
    "Adaptable in-game with minimal communication",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CORYELL SYSTEM (VERTICAL/AIR CORYELL)
// ═══════════════════════════════════════════════════════════════════════════

const CORYELL: CoachingSystem = {
  id: "coryell",
  name: "Coryell System",
  shortName: "Air Coryell",
  origin: "Developed by Don Coryell with the San Diego Chargers in the late 1970s-80s",
  description: "A vertical passing attack that uses a numbered route tree and timing patterns. Routes are called by numbers (0-9), with each position having specific assignments. Emphasizes stretching the field vertically.",
  famousTeams: ["San Diego Chargers", "St. Louis Rams", "Arizona Cardinals"],
  famousCoaches: ["Don Coryell", "Norv Turner", "Al Saunders", "Bruce Arians"],
  
  playCallFormat: "[Formation] [Route Numbers by Position]",
  playCallExample: "Doubles Right 525 F Flat",
  
  routeNumbers: {
    0: "Hitch",
    1: "Quick Out (5 yards)",
    2: "Slant",
    3: "Deep Out (12-15)",
    4: "Deep In/Dig (12-15)",
    5: "Speed Out/Whip",
    6: "Curl (12-15)",
    7: "Corner",
    8: "Post",
    9: "Go/Fly",
  },
  
  routeNames: [
    { routeId: "hitch", systemName: "0", number: 0 },
    { routeId: "out", systemName: "1 (quick) / 3 (deep)", number: 1 },
    { routeId: "slant", systemName: "2", number: 2 },
    { routeId: "in", systemName: "4", number: 4 },
    { routeId: "curl", systemName: "6", number: 6 },
    { routeId: "corner", systemName: "7", number: 7 },
    { routeId: "post", systemName: "8", number: 8 },
    { routeId: "go", systemName: "9", number: 9 },
  ],
  
  passConcepts: [
    { conceptId: "smash", systemCall: "70", explanation: "Corner (7) + Hitch (0)" },
    { conceptId: "mills", systemCall: "84", explanation: "Post (8) + Dig (4)" },
    { conceptId: "four-verts", systemCall: "999", explanation: "Everyone on 9 routes" },
    { conceptId: "levels", systemCall: "96", explanation: "Go (9) + Curl (6) combination" },
    { conceptId: "flood", systemCall: "973", explanation: "Go (9) + Corner (7) + Out (3)" },
    { conceptId: "mesh", systemCall: "Mesh (special call)", explanation: "Crossing routes" },
  ],
  
  protectionCalls: [
    "500 (5-step drop)",
    "600 (7-step drop)",
    "700 (max protect)",
    "Slide Right/Left",
    "Fan",
  ],
  
  uniqueTerms: [
    { term: "525", meaning: "X runs 5, Y runs 2, Z runs 5" },
    { term: "976", meaning: "X runs 9, Y runs 7, Z runs 6" },
    { term: "F Flat", meaning: "Fullback to the flat" },
    { term: "Doubles", meaning: "2x2 receiver formation" },
    { term: "Trips", meaning: "3x1 receiver formation" },
    { term: "Zoom", meaning: "Motion across formation" },
    { term: "Flip", meaning: "Opposite side of call" },
  ],
  
  philosophy: [
    "Attack vertically first, horizontally second",
    "Numbers system provides universal route language",
    "Deep passing opens up the run",
    "Explosive plays change games",
    "Make the defense defend the entire field",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// AIR RAID SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const AIR_RAID: CoachingSystem = {
  id: "air-raid",
  name: "Air Raid Offense",
  shortName: "Air Raid",
  origin: "Developed by Hal Mumme and Mike Leach at Valdosta State and Kentucky in the 1990s",
  description: "A spread offense that uses four and five receiver sets to create mismatches. Simple route combinations run from multiple formations. Emphasizes tempo, simplicity, and spacing.",
  famousTeams: ["Texas Tech", "Washington State", "Oklahoma", "USC"],
  famousCoaches: ["Mike Leach", "Lincoln Riley", "Kliff Kingsbury", "Dana Holgorsen"],
  
  playCallFormat: "[Formation] [Concept Word]",
  playCallExample: "Ace Mesh Y-Shallow",
  
  routeNames: [
    { routeId: "hitch", systemName: "Hitch" },
    { routeId: "slant", systemName: "Slant" },
    { routeId: "out", systemName: "Out" },
    { routeId: "in", systemName: "Dig" },
    { routeId: "curl", systemName: "Curl" },
    { routeId: "corner", systemName: "Corner" },
    { routeId: "post", systemName: "Post" },
    { routeId: "go", systemName: "Go" },
    { routeId: "flat", systemName: "Arrow" },
    { routeId: "drag", systemName: "Shallow" },
    { routeId: "seam", systemName: "Seam/Verticals" },
  ],
  
  passConcepts: [
    { conceptId: "mesh", systemCall: "Mesh", explanation: "Two shallow crosses" },
    { conceptId: "y-cross", systemCall: "Y-Cross", explanation: "TE over the ball" },
    { conceptId: "four-verts", systemCall: "Verticals", explanation: "Four go routes" },
    { conceptId: "smash", systemCall: "Smash", explanation: "Corner-hitch combo" },
    { conceptId: "flood", systemCall: "Flood", explanation: "Three to a side" },
    { conceptId: "levels", systemCall: "All Curl", explanation: "Everyone curling at depths" },
    { conceptId: "spacing", systemCall: "Drive", explanation: "Shallow cross + hitch combo" },
    { conceptId: "stick", systemCall: "Stick", explanation: "Quick game triangle" },
  ],
  
  protectionCalls: [
    "60 Protection",
    "70 Protection",
    "Slide",
    "Scan",
  ],
  
  uniqueTerms: [
    { term: "Ace", meaning: "2x2 formation" },
    { term: "Trips", meaning: "3x1 formation" },
    { term: "Empty", meaning: "5 wide, no back" },
    { term: "Y-Shallow", meaning: "Y receiver runs shallow cross" },
    { term: "Mesh Point", meaning: "Where crossers meet" },
    { term: "Stick-Draw", meaning: "Stick concept with draw fake" },
    { term: "90/91", meaning: "Quick screen right/left" },
    { term: "Choice", meaning: "Option route based on coverage" },
  ],
  
  philosophy: [
    "Spread people out, throw it to them",
    "Simple concepts, multiple formations",
    "Let athletes make plays in space",
    "Tempo is a weapon",
    "The pass is just a long handoff",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// SHANAHAN/MCVAY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const SHANAHAN: CoachingSystem = {
  id: "shanahan",
  name: "Shanahan System",
  shortName: "Shanahan/McVay",
  origin: "Developed by Mike Shanahan with the Denver Broncos, evolved by Kyle Shanahan and Sean McVay",
  description: "A zone-running based offense that uses bootleg passes, play-action, and motion to create explosive plays. Heavy use of pre-snap motion to identify coverage and create favorable run/pass looks.",
  famousTeams: ["Denver Broncos", "San Francisco 49ers", "Los Angeles Rams", "Atlanta Falcons"],
  famousCoaches: ["Mike Shanahan", "Kyle Shanahan", "Sean McVay", "Matt LaFleur"],
  
  playCallFormat: "[Formation] [Motion] [Play Type] [Concept]",
  playCallExample: "Pistol Strong Right H Jet 24 Zone",
  
  routeNames: [
    { routeId: "hitch", systemName: "Hitch" },
    { routeId: "slant", systemName: "Slant" },
    { routeId: "out", systemName: "Out" },
    { routeId: "in", systemName: "In" },
    { routeId: "curl", systemName: "Comeback" },
    { routeId: "dig", systemName: "Dig" },
    { routeId: "corner", systemName: "Post-Corner" },
    { routeId: "post", systemName: "Post" },
    { routeId: "go", systemName: "9" },
    { routeId: "flat", systemName: "Flat" },
    { routeId: "drag", systemName: "Drag/Drive" },
  ],
  
  passConcepts: [
    { conceptId: "flood", systemCall: "Flood", explanation: "Three levels to one side off boot" },
    { conceptId: "y-cross", systemCall: "Cross", explanation: "TE crossing concept" },
    { conceptId: "levels", systemCall: "Levels", explanation: "Vertical stretch" },
    { conceptId: "mesh", systemCall: "Mesh/Drive", explanation: "Crossing routes" },
    { conceptId: "smash", systemCall: "Smash", explanation: "Corner-hitch" },
    { conceptId: "mills", systemCall: "Saints", explanation: "Post-dig" },
  ],
  
  protectionCalls: [
    "Slide",
    "Pin-Pull (run)",
    "Boot (action pass)",
    "Half Slide",
    "Scan",
  ],
  
  uniqueTerms: [
    { term: "Jet Motion", meaning: "Receiver in fast motion across formation" },
    { term: "Orbit Motion", meaning: "Back or receiver coming around" },
    { term: "Crack-Toss", meaning: "WR cracks, run outside" },
    { term: "Outside Zone", meaning: "Zone run to the edge" },
    { term: "Inside Zone", meaning: "Zone run between tackles" },
    { term: "Pin-Pull", meaning: "Linemen pull for outside zone" },
    { term: "Boot", meaning: "Bootleg pass action" },
    { term: "Naked", meaning: "Boot without puller" },
    { term: "YAC", meaning: "Yards after catch emphasis" },
    { term: "RPO", meaning: "Run-pass option based on read" },
  ],
  
  philosophy: [
    "Zone running creates the play-action game",
    "Motion reveals coverage before the snap",
    "Make the defense defend the entire field",
    "Get playmakers the ball in space",
    "Run and pass are connected, not separate",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// SPREAD OPTION
// ═══════════════════════════════════════════════════════════════════════════

const SPREAD_OPTION: CoachingSystem = {
  id: "spread-option",
  name: "Spread Option",
  shortName: "Spread RPO",
  origin: "Evolved from Rich Rodriguez's spread at West Virginia, perfected at Oregon and Ohio State",
  description: "An up-tempo spread offense that combines zone running with read options and RPOs. The quarterback reads a defender to determine handoff, keep, or throw. Emphasizes athlete-friendly concepts.",
  famousTeams: ["Oregon Ducks", "Ohio State Buckeyes", "Oklahoma Sooners", "Baylor Bears"],
  famousCoaches: ["Chip Kelly", "Urban Meyer", "Rich Rodriguez", "Art Briles"],
  
  playCallFormat: "[Formation] [Run/RPO] [Read Key]",
  playCallExample: "Gun Trips Inside Zone Read Bubble",
  
  routeNames: [
    { routeId: "hitch", systemName: "Hitch" },
    { routeId: "slant", systemName: "Slant" },
    { routeId: "out", systemName: "Out" },
    { routeId: "go", systemName: "Go" },
    { routeId: "flat", systemName: "Bubble" },
    { routeId: "drag", systemName: "Drag" },
    { routeId: "seam", systemName: "Seam" },
  ],
  
  passConcepts: [
    { conceptId: "mesh", systemCall: "Mesh", explanation: "Two crossers" },
    { conceptId: "four-verts", systemCall: "4 Verts", explanation: "All vertical" },
    { conceptId: "stick", systemCall: "Stick", explanation: "Quick game RPO" },
    { conceptId: "smash", systemCall: "Smash", explanation: "Corner-hitch" },
    { conceptId: "spacing", systemCall: "Levels", explanation: "Horizontal stretch" },
  ],
  
  protectionCalls: [
    "Zone (blocking scheme)",
    "Slide",
    "RPO (linemen block run)",
    "Read",
  ],
  
  uniqueTerms: [
    { term: "Zone Read", meaning: "QB reads end man for give/keep" },
    { term: "Power Read", meaning: "QB reads for power give/pull" },
    { term: "Inverted Veer", meaning: "Back outside, QB inside" },
    { term: "Bubble", meaning: "Bubble screen to slot" },
    { term: "Pop Pass", meaning: "Quick throw off run action" },
    { term: "Glance", meaning: "Quick slant RPO" },
    { term: "Stick-Draw", meaning: "Stick concept or draw" },
    { term: "EMOL", meaning: "End man on line of scrimmage (read key)" },
    { term: "Give/Pull/Throw", meaning: "The three options on RPO" },
    { term: "Tempo", meaning: "Fast pace between plays" },
  ],
  
  philosophy: [
    "Create numbers advantages with reads",
    "Make the defense wrong without blocking everyone",
    "Tempo prevents defensive substitution",
    "Simple reads, fast execution",
    "Athletes in space win games",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// COMBINE ALL SYSTEMS
// ═══════════════════════════════════════════════════════════════════════════

export const COACHING_SYSTEMS: CoachingSystem[] = [
  WEST_COAST,
  ERHARDT_PERKINS,
  CORYELL,
  AIR_RAID,
  SHANAHAN,
  SPREAD_OPTION,
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a coaching system by ID
 */
export function getSystemById(id: SystemId): CoachingSystem | undefined {
  return COACHING_SYSTEMS.find((s) => s.id === id);
}

/**
 * Get all system names for selection UI
 */
export function getSystemNames(): { id: SystemId; name: string; shortName: string }[] {
  return COACHING_SYSTEMS.map((s) => ({ id: s.id, name: s.name, shortName: s.shortName }));
}

/**
 * Translate a concept between systems
 */
export function translateConcept(
  conceptId: ConceptId | string,
  fromSystem: SystemId,
  toSystem: SystemId
): { from: string; to: string } | undefined {
  const sourceSystem = getSystemById(fromSystem);
  const targetSystem = getSystemById(toSystem);
  
  if (!sourceSystem || !targetSystem) return undefined;
  
  const sourceConcept = sourceSystem.passConcepts.find((c) => c.conceptId === conceptId);
  const targetConcept = targetSystem.passConcepts.find((c) => c.conceptId === conceptId);
  
  if (!sourceConcept || !targetConcept) return undefined;
  
  return {
    from: sourceConcept.systemCall,
    to: targetConcept.systemCall,
  };
}

/**
 * Get the route name in a specific system
 */
export function getRouteNameInSystem(
  routeId: RouteId | string,
  systemId: SystemId
): string | undefined {
  const system = getSystemById(systemId);
  if (!system) return undefined;
  
  const route = system.routeNames.find((r) => r.routeId === routeId);
  return route?.systemName;
}

/**
 * Find which systems use a specific term
 */
export function findSystemsWithTerm(term: string): CoachingSystem[] {
  const lowerTerm = term.toLowerCase();
  return COACHING_SYSTEMS.filter((system) =>
    system.uniqueTerms.some((t) => t.term.toLowerCase().includes(lowerTerm)) ||
    system.passConcepts.some((c) => c.systemCall.toLowerCase().includes(lowerTerm))
  );
}

/**
 * Get all concepts across all systems for a given concept ID
 */
export function getConceptAcrossSystems(
  conceptId: ConceptId | string
): { system: string; call: string; explanation: string }[] {
  return COACHING_SYSTEMS.map((system) => {
    const concept = system.passConcepts.find((c) => c.conceptId === conceptId);
    if (!concept) return null;
    return {
      system: system.shortName,
      call: concept.systemCall,
      explanation: concept.explanation,
    };
  }).filter((c): c is { system: string; call: string; explanation: string } => c !== null);
}
