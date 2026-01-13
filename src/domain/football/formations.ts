// ═══════════════════════════════════════════════════════════════════════════
// FORMATIONS — Shared offensive formation definitions for all Chalkboard games
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Personnel grouping notation (e.g., "11" = 1 RB, 1 TE)
 * First digit = number of RBs, Second digit = number of TEs
 */
export type PersonnelGrouping = 
  | "00" | "01" | "02" 
  | "10" | "11" | "12" | "13" 
  | "20" | "21" | "22" | "23";

/**
 * Unique identifier for each formation
 */
export type FormationId = 
  | "shotgun-spread"
  | "i-formation"
  | "singleback"
  | "pistol"
  | "empty"
  | "trips-right"
  | "trips-left"
  | "bunch"
  | "ace"
  | "pro"
  | "wing-t"
  | "wildcat"
  | "shotgun-twins"
  | "gun-trips"
  | "jumbo"
  | "goal-line";

/**
 * Player position on the field, relative to the ball
 * x: -50 to 50 (sideline to sideline, 0 = center)
 * y: 0 to 50 (LOS to end zone, 0 = line of scrimmage)
 */
export interface PlayerPosition {
  x: number;
  y: number;
  label?: string; // Position label (e.g., "X", "Z", "RB")
}

/**
 * Complete formation definition
 */
export interface Formation {
  id: FormationId;
  name: string;
  shortName: string;
  description: string;
  personnel: PersonnelGrouping;
  personnelLabel: string; // Human-readable (e.g., "1 RB, 1 TE")
  
  // Player positions (relative to center at 0,0)
  positions: {
    qb: PlayerPosition;
    rb?: PlayerPosition;
    fb?: PlayerPosition;
    te?: PlayerPosition;
    te2?: PlayerPosition;
    x: PlayerPosition;   // Split end (usually left)
    z: PlayerPosition;   // Flanker (usually right)
    slot?: PlayerPosition;
    slot2?: PlayerPosition;
  };
  
  // Visual diagram config
  diagramSrc?: string;
  
  // Teaching metadata
  keyFeatures: string[];
  commonPlays?: string[];
  bestAgainst?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATIONS DATA
// ═══════════════════════════════════════════════════════════════════════════

export const FORMATIONS: Formation[] = [
  {
    id: "shotgun-spread",
    name: "Shotgun Spread",
    shortName: "Spread",
    description: "QB in shotgun, 4 yards deep. 4 WRs split wide (2x2). RB aligned next to QB. Empty backfield pre-motion.",
    personnel: "10",
    personnelLabel: "1 RB, 0 TE",
    positions: {
      qb: { x: 0, y: 5, label: "QB" },
      rb: { x: 3, y: 5, label: "RB" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 0, label: "Z" },
      slot: { x: -10, y: 0, label: "H" },
      slot2: { x: 10, y: 0, label: "Y" },
    },
    keyFeatures: [
      "4 wides in 2x2 alignment",
      "QB in shotgun 4-5 yards deep",
      "Spread the defense horizontally",
    ],
    commonPlays: ["Quick Game", "RPO", "Bubble Screen"],
    bestAgainst: ["Heavy Box", "Man Coverage"],
  },
  {
    id: "i-formation",
    name: "I-Formation",
    shortName: "I-Form",
    description: "QB under center. FB at 4 yards, RB at 7 yards, both behind the QB. 2 TEs inline, 1 WR.",
    personnel: "22",
    personnelLabel: "2 RB, 2 TE",
    positions: {
      qb: { x: 0, y: 1, label: "QB" },
      fb: { x: 0, y: 4, label: "FB" },
      rb: { x: 0, y: 7, label: "RB" },
      te: { x: -6, y: 0, label: "TE" },
      te2: { x: 6, y: 0, label: "TE" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 0, label: "Z" },
    },
    keyFeatures: [
      "FB and RB stacked behind QB",
      "Power running formation",
      "Play-action potential",
    ],
    commonPlays: ["Power", "ISO", "Play-Action"],
    bestAgainst: ["Light Box", "Spread Defense"],
  },
  {
    id: "singleback",
    name: "Singleback",
    shortName: "Singleback",
    description: "QB under center or pistol. Single RB 7 yards deep. 2 WRs each side. TE attached.",
    personnel: "11",
    personnelLabel: "1 RB, 1 TE",
    positions: {
      qb: { x: 0, y: 1, label: "QB" },
      rb: { x: 0, y: 7, label: "RB" },
      te: { x: 6, y: 0, label: "TE" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 1, label: "Z" },
      slot: { x: -10, y: 0, label: "H" },
    },
    keyFeatures: [
      "Balanced formation",
      "Run/pass versatility",
      "One back set",
    ],
    commonPlays: ["Zone Run", "Passing Concepts", "Draw"],
    bestAgainst: ["Multiple Fronts"],
  },
  {
    id: "pistol",
    name: "Pistol",
    shortName: "Pistol",
    description: "QB at 4 yards, closer than traditional shotgun. RB directly behind QB at 7 yards. Creates downhill run angles.",
    personnel: "11",
    personnelLabel: "1 RB, 1 TE",
    positions: {
      qb: { x: 0, y: 4, label: "QB" },
      rb: { x: 0, y: 7, label: "RB" },
      te: { x: 6, y: 0, label: "TE" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 0, label: "Z" },
      slot: { x: -10, y: 0, label: "H" },
    },
    keyFeatures: [
      "RB directly behind QB",
      "Shorter shotgun depth",
      "Downhill running angles",
    ],
    commonPlays: ["Zone Read", "Power Read", "RPO"],
    bestAgainst: ["Over-Pursuit Defense"],
  },
  {
    id: "empty",
    name: "Empty",
    shortName: "Empty",
    description: "QB alone in backfield. 5 eligible receivers split out. Maximum pass protection challenge.",
    personnel: "10",
    personnelLabel: "1 RB split out",
    positions: {
      qb: { x: 0, y: 5, label: "QB" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 0, label: "Z" },
      slot: { x: -10, y: 0, label: "H" },
      slot2: { x: 10, y: 0, label: "Y" },
    },
    keyFeatures: [
      "No one in backfield",
      "5 receivers in pattern",
      "Maximum stress on coverage",
    ],
    commonPlays: ["Quick Game", "Hot Routes", "Screens"],
    bestAgainst: ["Zone Coverage", "Conservative Defense"],
  },
  {
    id: "trips-right",
    name: "Trips Right",
    shortName: "Trips Rt",
    description: "3 WRs aligned to the right side of the formation. 1 WR left. Creates numbers advantage to the trips side.",
    personnel: "11",
    personnelLabel: "1 RB, 1 TE",
    positions: {
      qb: { x: 0, y: 5, label: "QB" },
      rb: { x: -3, y: 5, label: "RB" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 0, label: "Z" },
      slot: { x: 15, y: 0, label: "H" },
      slot2: { x: 10, y: 0, label: "Y" },
    },
    keyFeatures: [
      "3 receivers to one side",
      "Creates formation strength",
      "Numbers advantage right",
    ],
    commonPlays: ["Flood", "Levels", "Bunch Concepts"],
    bestAgainst: ["Man Coverage", "Zone Coverage"],
  },
  {
    id: "trips-left",
    name: "Trips Left",
    shortName: "Trips Lt",
    description: "3 WRs stacked or aligned to the left sideline. Single WR or TE to the right. Boundary advantage left.",
    personnel: "11",
    personnelLabel: "1 RB, 1 TE",
    positions: {
      qb: { x: 0, y: 5, label: "QB" },
      rb: { x: 3, y: 5, label: "RB" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 0, label: "Z" },
      slot: { x: -15, y: 0, label: "H" },
      slot2: { x: -10, y: 0, label: "Y" },
    },
    keyFeatures: [
      "3 receivers to the left",
      "Creates formation strength",
      "Numbers advantage left",
    ],
    commonPlays: ["Flood", "Levels", "Bunch Concepts"],
    bestAgainst: ["Man Coverage", "Zone Coverage"],
  },
  {
    id: "bunch",
    name: "Bunch",
    shortName: "Bunch",
    description: "3 WRs aligned very tight to each other near the LOS. Creates natural picks and rub routes. Less than 3 yards apart.",
    personnel: "11",
    personnelLabel: "1 RB, 1 TE",
    positions: {
      qb: { x: 0, y: 5, label: "QB" },
      rb: { x: -3, y: 5, label: "RB" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 12, y: 0, label: "Z" },
      slot: { x: 10, y: 1, label: "H" },
      slot2: { x: 14, y: 1, label: "Y" },
    },
    keyFeatures: [
      "Tight grouping of 3 receivers",
      "Natural picks and rubs",
      "Difficult to cover in man",
    ],
    commonPlays: ["Rub Routes", "Mesh", "Spot"],
    bestAgainst: ["Man Coverage"],
  },
  {
    id: "ace",
    name: "Ace",
    shortName: "Ace",
    description: "2 TEs aligned on opposite sides of the formation inline. 2 WRs split. Balanced power/pass look.",
    personnel: "12",
    personnelLabel: "1 RB, 2 TE",
    positions: {
      qb: { x: 0, y: 1, label: "QB" },
      rb: { x: 0, y: 6, label: "RB" },
      te: { x: -6, y: 0, label: "TE" },
      te2: { x: 6, y: 0, label: "TE" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 0, label: "Z" },
    },
    keyFeatures: [
      "Balanced with 2 TEs inline",
      "Strong run/pass balance",
      "Extra blockers available",
    ],
    commonPlays: ["Gap Runs", "Play-Action", "TE Routes"],
    bestAgainst: ["Light Box"],
  },
  {
    id: "pro",
    name: "Pro",
    shortName: "Pro",
    description: "2 RBs aligned behind the QB, split to each side. TE inline. Classic pro-style formation.",
    personnel: "21",
    personnelLabel: "2 RB, 1 TE",
    positions: {
      qb: { x: 0, y: 1, label: "QB" },
      rb: { x: -3, y: 6, label: "RB" },
      fb: { x: 3, y: 4, label: "FB" },
      te: { x: 6, y: 0, label: "TE" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 0, label: "Z" },
    },
    keyFeatures: [
      "Split backs formation",
      "Classic pro-style look",
      "Misdirection potential",
    ],
    commonPlays: ["Counter", "Trap", "Sprint Out"],
    bestAgainst: ["Aggressive Defense"],
  },
  {
    id: "wing-t",
    name: "Wing T",
    shortName: "Wing T",
    description: "Unbalanced look with wing back off the TE. Pulling guards and counter action common. Misdirection base.",
    personnel: "21",
    personnelLabel: "2 RB, 1 TE",
    positions: {
      qb: { x: 0, y: 1, label: "QB" },
      rb: { x: 0, y: 5, label: "RB" },
      fb: { x: -4, y: 2, label: "WB" },
      te: { x: 6, y: 0, label: "TE" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: 25, y: 0, label: "Z" },
    },
    keyFeatures: [
      "Wing back alignment",
      "Misdirection based",
      "Pulling linemen common",
    ],
    commonPlays: ["Buck Sweep", "Counter", "Trap"],
    bestAgainst: ["Fast-Flow Defense"],
  },
  {
    id: "wildcat",
    name: "Wildcat",
    shortName: "Wildcat",
    description: "Non-QB aligned at shotgun depth to receive direct snap. Speed player taking carries. QB split out wide.",
    personnel: "11",
    personnelLabel: "RB/WR at QB",
    positions: {
      qb: { x: 25, y: 0, label: "QB" },
      rb: { x: 0, y: 5, label: "RB" },
      fb: { x: 3, y: 4, label: "FB" },
      te: { x: 6, y: 0, label: "TE" },
      x: { x: -25, y: 0, label: "X" },
      z: { x: -10, y: 0, label: "Z" },
    },
    keyFeatures: [
      "Direct snap to non-QB",
      "Exotic formation",
      "Creates numbers in box",
    ],
    commonPlays: ["Jet Sweep", "Power", "Option"],
    bestAgainst: ["Unprepared Defense"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a formation by its ID
 */
export function getFormationById(id: FormationId): Formation | undefined {
  return FORMATIONS.find((f) => f.id === id);
}

/**
 * Get formations by personnel grouping
 */
export function getFormationsByPersonnel(personnel: PersonnelGrouping): Formation[] {
  return FORMATIONS.filter((f) => f.personnel === personnel);
}

/**
 * Get all formation names for selection UI
 */
export function getFormationNames(): { id: FormationId; name: string }[] {
  return FORMATIONS.map((f) => ({ id: f.id, name: f.name }));
}

/**
 * Get a random subset of formations
 */
export function getRandomFormations(count: number): Formation[] {
  const shuffled = [...FORMATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}








