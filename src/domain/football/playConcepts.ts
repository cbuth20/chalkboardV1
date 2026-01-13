// ═══════════════════════════════════════════════════════════════════════════
// PLAY CONCEPTS — Shared offensive concepts, routes, and protections
// ═══════════════════════════════════════════════════════════════════════════

import type { FormationId } from "./formations";
import type { CoverageId } from "./coverageShells";

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Individual route types
 */
export type RouteId =
  | "slant"
  | "out"
  | "in"
  | "curl"
  | "corner"
  | "post"
  | "go"
  | "hitch"
  | "comeback"
  | "flat"
  | "wheel"
  | "seam"
  | "drag"
  | "dig"
  | "over"
  | "angle"
  | "option";

/**
 * Route concept (multi-receiver combinations)
 */
export type ConceptId =
  | "mesh"
  | "mills"
  | "levels"
  | "smash"
  | "flood"
  | "snag"
  | "stick"
  | "four-verts"
  | "spacing"
  | "dagger"
  | "drive"
  | "y-cross"
  | "hank"
  | "scissors"
  | "bench";

/**
 * Route definition with details
 */
export interface Route {
  id: RouteId;
  name: string;
  shortName: string;
  description: string;
  depth: "short" | "intermediate" | "deep"; // 0-7, 8-15, 16+
  breakDirection: "inside" | "outside" | "vertical" | "back" | "option";
  
  // Visual path (simplified)
  path: {
    stemYards: number; // Vertical yards before break
    breakAngle: number; // Degrees (0 = vertical, 90 = horizontal)
  };
  
  // When to use
  bestAgainst: CoverageId[];
  keyReads: string[];
}

/**
 * Route concept definition
 */
export interface RouteConcept {
  id: ConceptId;
  name: string;
  description: string;
  
  // Routes involved
  routes: {
    receiver: "x" | "z" | "slot" | "te" | "rb";
    routeId: RouteId;
    isPrimary: boolean;
  }[];
  
  // What it attacks
  bestAgainst: CoverageId[];
  poorAgainst: CoverageId[];
  
  // Teaching
  keyReads: string[];
  coachingPoints: string[];
  
  // Compatible formations
  compatibleFormations?: FormationId[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PROTECTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Protection call types
 */
export type ProtectionId =
  | "slide-left"
  | "slide-right"
  | "full-slide"
  | "bob"
  | "max-protect"
  | "screen"
  | "rb-scan"
  | "half-slide";

/**
 * Protection scheme definition
 */
export interface Protection {
  id: ProtectionId;
  name: string;
  shortName: string;
  description: string;
  
  // Protection details
  blockerCount: number;
  direction: "left" | "right" | "center" | "both" | "none";
  rbRole: "block" | "check" | "release" | "screen";
  
  // When to use
  usedAgainst: string[];
  keyIndicators: string[];
  coachingPoints: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES DATA
// ═══════════════════════════════════════════════════════════════════════════

export const ROUTES: Route[] = [
  {
    id: "slant",
    name: "Slant",
    shortName: "Slant",
    description: "Quick inside break at 45 degrees, 5-7 yards. Timing throw against off coverage.",
    depth: "short",
    breakDirection: "inside",
    path: { stemYards: 3, breakAngle: 45 },
    bestAgainst: ["cover-2", "cover-3", "cover-4"],
    keyReads: ["Off coverage", "Soft corners", "Zone coverage"],
  },
  {
    id: "out",
    name: "Out",
    shortName: "Out",
    description: "Vertical stem for 10-12 yards, sharp break to sideline at 90 degrees.",
    depth: "intermediate",
    breakDirection: "outside",
    path: { stemYards: 12, breakAngle: 90 },
    bestAgainst: ["cover-1", "cover-3"],
    keyReads: ["Flat defender", "Corner depth", "Timing window"],
  },
  {
    id: "in",
    name: "In/Dig",
    shortName: "In",
    description: "Vertical stem 12-15 yards, sharp break inside at 90 degrees across field.",
    depth: "intermediate",
    breakDirection: "inside",
    path: { stemYards: 14, breakAngle: 90 },
    bestAgainst: ["cover-2", "cover-4", "quarters"],
    keyReads: ["Hook/curl defenders", "Safety depth", "Throwing lane"],
  },
  {
    id: "curl",
    name: "Curl/Hook",
    shortName: "Curl",
    description: "Push vertical 12-15 yards, plant and turn back toward QB. Find soft spot.",
    depth: "intermediate",
    breakDirection: "back",
    path: { stemYards: 14, breakAngle: 180 },
    bestAgainst: ["cover-3", "cover-4"],
    keyReads: ["LB depth", "Soft zone", "Safety help"],
  },
  {
    id: "corner",
    name: "Corner",
    shortName: "Corner",
    description: "Stem outside or vertical, break at 45 degrees toward back pylon. Deep sideline shot.",
    depth: "deep",
    breakDirection: "outside",
    path: { stemYards: 12, breakAngle: 45 },
    bestAgainst: ["cover-2", "cover-6"],
    keyReads: ["Safety leverage", "Corner depth", "Hole shot"],
  },
  {
    id: "post",
    name: "Post",
    shortName: "Post",
    description: "Outside release, break at 45 degrees toward goalpost. Deep middle attack.",
    depth: "deep",
    breakDirection: "inside",
    path: { stemYards: 12, breakAngle: 45 },
    bestAgainst: ["cover-3", "cover-1"],
    keyReads: ["Single high safety", "Corner leverage", "Post-safety window"],
  },
  {
    id: "go",
    name: "Go/Fly",
    shortName: "Go",
    description: "Full speed vertical route, no break. Beat defender deep with speed.",
    depth: "deep",
    breakDirection: "vertical",
    path: { stemYards: 40, breakAngle: 0 },
    bestAgainst: ["cover-1", "cover-0"],
    keyReads: ["1-on-1 coverage", "Safety help", "Inside leverage"],
  },
  {
    id: "hitch",
    name: "Hitch",
    shortName: "Hitch",
    description: "Quick 5-6 yard stem, turn back to QB. Quick timing route.",
    depth: "short",
    breakDirection: "back",
    path: { stemYards: 6, breakAngle: 180 },
    bestAgainst: ["cover-2", "cover-4"],
    keyReads: ["Off coverage", "Cushion", "Quick throw"],
  },
  {
    id: "flat",
    name: "Flat",
    shortName: "Flat",
    description: "Quick out to flat area, 2-4 yards. RB or slot release to sideline.",
    depth: "short",
    breakDirection: "outside",
    path: { stemYards: 1, breakAngle: 90 },
    bestAgainst: ["cover-3", "cover-4"],
    keyReads: ["Flat defender", "Corner reaction", "Numbers"],
  },
  {
    id: "wheel",
    name: "Wheel",
    shortName: "Wheel",
    description: "Start flat, curve upfield along sideline. RB or slot attack on LB.",
    depth: "deep",
    breakDirection: "vertical",
    path: { stemYards: 3, breakAngle: 0 },
    bestAgainst: ["cover-1", "cover-3"],
    keyReads: ["LB matchup", "Safety reaction", "Separation deep"],
  },
  {
    id: "seam",
    name: "Seam",
    shortName: "Seam",
    description: "Vertical route between numbers and hash. Attack zone seams.",
    depth: "deep",
    breakDirection: "vertical",
    path: { stemYards: 30, breakAngle: 0 },
    bestAgainst: ["cover-2", "cover-4"],
    keyReads: ["Seam window", "Safety split", "Tampa 2 Mike"],
  },
  {
    id: "drag",
    name: "Drag/Shallow",
    shortName: "Drag",
    description: "Shallow cross at 3-5 yards across the formation. RB/TE/slot.",
    depth: "short",
    breakDirection: "inside",
    path: { stemYards: 2, breakAngle: 90 },
    bestAgainst: ["cover-1", "cover-3"],
    keyReads: ["Underneath coverage", "Zone holes", "Rub potential"],
  },
  {
    id: "dig",
    name: "Dig",
    shortName: "Dig",
    description: "Stem vertical 12-15 yards, break inside at 90 degrees. Same as In route.",
    depth: "intermediate",
    breakDirection: "inside",
    path: { stemYards: 14, breakAngle: 90 },
    bestAgainst: ["cover-2", "cover-4"],
    keyReads: ["Hook defenders", "Safety depth", "Throwing lane"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE CONCEPTS DATA
// ═══════════════════════════════════════════════════════════════════════════

export const ROUTE_CONCEPTS: RouteConcept[] = [
  {
    id: "mesh",
    name: "Mesh",
    description: "Two receivers running shallow crosses in opposite directions at 5-6 yards. Creates natural picks.",
    routes: [
      { receiver: "slot", routeId: "drag", isPrimary: true },
      { receiver: "te", routeId: "drag", isPrimary: true },
      { receiver: "x", routeId: "go", isPrimary: false },
      { receiver: "z", routeId: "out", isPrimary: false },
    ],
    bestAgainst: ["cover-1", "cover-0"],
    poorAgainst: ["cover-3"],
    keyReads: ["Crossing window", "Rub on DB", "Who's open first"],
    coachingPoints: [
      "Shallow crosses from opposite sides create rubs",
      "Great against man coverage",
      "Receivers must cross close together",
    ],
  },
  {
    id: "mills",
    name: "Mills",
    description: "One WR runs deep post, another runs intermediate dig underneath. Attacks two levels.",
    routes: [
      { receiver: "x", routeId: "post", isPrimary: true },
      { receiver: "slot", routeId: "dig", isPrimary: true },
      { receiver: "z", routeId: "go", isPrimary: false },
    ],
    bestAgainst: ["cover-3", "cover-1"],
    poorAgainst: ["cover-2"],
    keyReads: ["Safety movement", "Post window", "Dig underneath"],
    coachingPoints: [
      "Post over dig creates high-low on safety",
      "Read safety first",
      "If safety stays, throw dig",
    ],
  },
  {
    id: "levels",
    name: "Levels",
    description: "WRs run routes at 5, 12, and 20+ yards on the same side. Vertical stretch of zone.",
    routes: [
      { receiver: "te", routeId: "flat", isPrimary: false },
      { receiver: "slot", routeId: "dig", isPrimary: true },
      { receiver: "x", routeId: "go", isPrimary: false },
    ],
    bestAgainst: ["cover-3", "cover-4"],
    poorAgainst: ["cover-1"],
    keyReads: ["Zone depth", "Hook defender", "Window between levels"],
    coachingPoints: [
      "Stretch the defense vertically",
      "Find the void between zone defenders",
      "Three levels = short, intermediate, deep",
    ],
  },
  {
    id: "smash",
    name: "Smash",
    description: "Outside WR runs corner route, inside WR runs 6-yard hitch. High-low on corner.",
    routes: [
      { receiver: "z", routeId: "corner", isPrimary: true },
      { receiver: "slot", routeId: "hitch", isPrimary: true },
    ],
    bestAgainst: ["cover-2", "cover-6"],
    poorAgainst: ["cover-1", "cover-0"],
    keyReads: ["Corner depth", "Hole shot", "If corner sits, throw hitch"],
    coachingPoints: [
      "Classic Cover 2 beater",
      "High-low read on corner",
      "Corner over hitch creates conflict",
    ],
  },
  {
    id: "flood",
    name: "Flood",
    description: "Three routes to one side at different depths. Flat, out, and corner. Overloads zone.",
    routes: [
      { receiver: "rb", routeId: "flat", isPrimary: false },
      { receiver: "slot", routeId: "out", isPrimary: true },
      { receiver: "x", routeId: "corner", isPrimary: true },
    ],
    bestAgainst: ["cover-3", "cover-2"],
    poorAgainst: ["cover-1"],
    keyReads: ["Flat defender", "Numbers advantage", "Work high to low"],
    coachingPoints: [
      "Three routes to one side",
      "Creates horizontal and vertical stretch",
      "3 vs 2 numbers advantage",
    ],
  },
  {
    id: "four-verts",
    name: "Four Verticals",
    description: "All four receivers run vertical routes, stretching the deep coverage horizontally.",
    routes: [
      { receiver: "x", routeId: "go", isPrimary: true },
      { receiver: "slot", routeId: "seam", isPrimary: true },
      { receiver: "te", routeId: "seam", isPrimary: true },
      { receiver: "z", routeId: "go", isPrimary: true },
    ],
    bestAgainst: ["cover-3"],
    poorAgainst: ["cover-4", "quarters"],
    keyReads: ["Safety movement", "Seam windows", "4 vs 3 deep"],
    coachingPoints: [
      "Stress the deep coverage",
      "4 verticals vs 3 deep = someone is open",
      "Inside seams often come open first",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PROTECTIONS DATA
// ═══════════════════════════════════════════════════════════════════════════

export const PROTECTIONS: Protection[] = [
  {
    id: "slide-left",
    name: "Slide Left",
    shortName: "Slide Lt",
    description: "Offensive line slides left, RB picks up right side pressure. Protect against overload left.",
    blockerCount: 5,
    direction: "left",
    rbRole: "block",
    usedAgainst: ["Overload left", "Edge pressure left", "A-gap threat left"],
    keyIndicators: ["LB walked up left", "DE in wide-9 left", "Safety creeping left A-gap"],
    coachingPoints: [
      "Slide protection goes toward the overload",
      "RB is responsible for backside pressure",
      "Center sets the slide direction",
    ],
  },
  {
    id: "slide-right",
    name: "Slide Right",
    shortName: "Slide Rt",
    description: "Offensive line slides right, RB picks up left side pressure. Protect against overload right.",
    blockerCount: 5,
    direction: "right",
    rbRole: "block",
    usedAgainst: ["Overload right", "Edge pressure right", "A-gap threat right"],
    keyIndicators: ["LB walked up right", "DE in wide-9 right", "Safety creeping right A-gap"],
    coachingPoints: [
      "Slide protection goes toward the overload",
      "RB is responsible for backside pressure",
      "Identify the pressure side pre-snap",
    ],
  },
  {
    id: "full-slide",
    name: "Full Slide",
    shortName: "Full Slide",
    description: "Entire line slides one direction. Used against heavy fronts or dual A-gap threats.",
    blockerCount: 5,
    direction: "both",
    rbRole: "check",
    usedAgainst: ["Bear front", "Dual A-gap threat", "Overloaded front"],
    keyIndicators: ["0-tech NT", "Both A-gaps threatened", "6+ in box", "Heavy run-stop look"],
    coachingPoints: [
      "When both A-gaps are threatened, slide everyone",
      "Protect the middle of the pocket",
      "RB checks for late add-ons",
    ],
  },
  {
    id: "bob",
    name: "BOB (Big on Big)",
    shortName: "BOB",
    description: "Linemen block defensive linemen, RB blocks LB. Traditional pass protection.",
    blockerCount: 6,
    direction: "both",
    rbRole: "block",
    usedAgainst: ["Twist/stunts", "Cross dog", "Zone blitz"],
    keyIndicators: ["LB movement", "Twist look", "Cross dog action", "DL games"],
    coachingPoints: [
      "Big on Big keeps RB clean for late blitzers",
      "OL handles DL, RB handles LB",
      "Good vs twist and stunt games",
    ],
  },
  {
    id: "max-protect",
    name: "Max Protect",
    shortName: "Max",
    description: "Keep extra blockers (RB, TE) in for protection. 7+ blockers vs heavy pressure.",
    blockerCount: 7,
    direction: "both",
    rbRole: "block",
    usedAgainst: ["Zero blitz", "Cover 0", "All-out pressure", "Edge speed"],
    keyIndicators: ["All DBs in press", "Both safeties walked up", "No deep help showing", "7+ near LOS"],
    coachingPoints: [
      "Keep extra blockers against heavy pressure",
      "Fewer receivers in pattern",
      "Quick reads required",
    ],
  },
  {
    id: "screen",
    name: "Screen",
    shortName: "Screen",
    description: "Let pressure through, throw quick to RB behind blockers. Use pressure against itself.",
    blockerCount: 3,
    direction: "none",
    rbRole: "screen",
    usedAgainst: ["Corner blitz", "Aggressive edge", "Predictable pressure"],
    keyIndicators: ["Corner creeping", "Edge pressure", "Aggressive blitz tendencies"],
    coachingPoints: [
      "Use the pressure against itself",
      "Quick release to RB",
      "Linemen release to block downfield",
    ],
  },
  {
    id: "rb-scan",
    name: "RB Scan",
    shortName: "RB Scan",
    description: "RB reads defense and blocks anyone who comes free. Picks up late blitzers.",
    blockerCount: 6,
    direction: "both",
    rbRole: "check",
    usedAgainst: ["Delayed blitz", "Zone blitz", "LB games"],
    keyIndicators: ["4-man rush look", "LBs at depth", "Potential late add", "Zone blitz tendency"],
    coachingPoints: [
      "RB should check for late add-ons",
      "Scan from playside to backside",
      "Pick up the most dangerous threat",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a route by its ID
 */
export function getRouteById(id: RouteId): Route | undefined {
  return ROUTES.find((r) => r.id === id);
}

/**
 * Get all route names for selection UI
 */
export function getRouteNames(): { id: RouteId; name: string }[] {
  return ROUTES.map((r) => ({ id: r.id, name: r.name }));
}

/**
 * Get routes by depth
 */
export function getRoutesByDepth(depth: Route["depth"]): Route[] {
  return ROUTES.filter((r) => r.depth === depth);
}

/**
 * Get a route concept by its ID
 */
export function getConceptById(id: ConceptId): RouteConcept | undefined {
  return ROUTE_CONCEPTS.find((c) => c.id === id);
}

/**
 * Get all concept names for selection UI
 */
export function getConceptNames(): { id: ConceptId; name: string }[] {
  return ROUTE_CONCEPTS.map((c) => ({ id: c.id, name: c.name }));
}

/**
 * Get concepts that work well against a coverage
 */
export function getConceptsAgainstCoverage(coverageId: CoverageId): RouteConcept[] {
  return ROUTE_CONCEPTS.filter((c) => c.bestAgainst.includes(coverageId));
}

/**
 * Get a protection by its ID
 */
export function getProtectionById(id: ProtectionId): Protection | undefined {
  return PROTECTIONS.find((p) => p.id === id);
}

/**
 * Get all protection names for selection UI
 */
export function getProtectionNames(): { id: ProtectionId; name: string }[] {
  return PROTECTIONS.map((p) => ({ id: p.id, name: p.name }));
}

/**
 * Get a random subset of routes
 */
export function getRandomRoutes(count: number): Route[] {
  const shuffled = [...ROUTES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get a random subset of concepts
 */
export function getRandomConcepts(count: number): RouteConcept[] {
  const shuffled = [...ROUTE_CONCEPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get a random subset of protections
 */
export function getRandomProtections(count: number): Protection[] {
  const shuffled = [...PROTECTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}








