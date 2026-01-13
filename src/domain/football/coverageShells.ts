// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE SHELLS — Shared defensive coverage definitions for all Chalkboard games
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Unique identifier for each coverage type
 */
export type CoverageId = 
  | "cover-0"
  | "cover-1"
  | "cover-2"
  | "cover-3"
  | "cover-4"
  | "cover-6"
  | "quarters"
  | "match";

/**
 * Legacy coverage IDs (for backward compatibility with existing question data)
 */
export type LegacyCoverageId = "C0" | "C1" | "C2" | "C3" | "C4" | "C6" | "QUARTERS" | "MATCH";

/**
 * Defensive player position on the field
 * x: -50 to 50 (sideline to sideline, 0 = center)
 * y: -50 to 0 (defensive backfield to LOS, 0 = line of scrimmage)
 */
export interface DefensivePosition {
  x: number;
  y: number;
  label: string; // Position label (e.g., "FS", "CB", "LB")
  zone?: string; // Zone responsibility description
}

/**
 * Coverage shell variation (e.g., Cover 3 Sky vs Cover 3 Cloud)
 */
export interface CoverageVariation {
  id: string;
  name: string;
  description: string;
  positions?: Partial<Record<string, DefensivePosition>>;
}

/**
 * Complete coverage shell definition
 */
export interface CoverageShell {
  id: CoverageId;
  legacyId: LegacyCoverageId;
  name: string;
  shortName: string;
  description: string;
  
  // Safety alignment
  safetyCount: 0 | 1 | 2;
  safetyAlignment: "single-high" | "two-high" | "zero-high" | "split-field";
  
  // Base positions (pre-snap look)
  positions: {
    fs?: DefensivePosition;
    ss?: DefensivePosition;
    lcb: DefensivePosition;
    rcb: DefensivePosition;
    nickel?: DefensivePosition;
    dime?: DefensivePosition;
    mike: DefensivePosition;
    will?: DefensivePosition;
    sam?: DefensivePosition;
  };
  
  // Visual diagram
  diagramSrc?: string;
  
  // Teaching metadata
  keyIndicators: string[]; // Pre-snap tells
  vulnerabilities: string[]; // What offenses exploit
  commonVariations: CoverageVariation[];
  
  // Coaching notes
  coachingPoints: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE SHELLS DATA
// ═══════════════════════════════════════════════════════════════════════════

export const COVERAGE_SHELLS: CoverageShell[] = [
  {
    id: "cover-0",
    legacyId: "C0",
    name: "Cover 0",
    shortName: "C0",
    description: "Pure man coverage with no deep safety help. All-out pressure scheme.",
    safetyCount: 0,
    safetyAlignment: "zero-high",
    positions: {
      lcb: { x: -20, y: -2, label: "CB", zone: "Man #1" },
      rcb: { x: 20, y: -2, label: "CB", zone: "Man #1" },
      ss: { x: 5, y: -3, label: "SS", zone: "Blitz" },
      fs: { x: -5, y: -3, label: "FS", zone: "Blitz" },
      mike: { x: 0, y: -5, label: "M", zone: "Man RB/TE" },
      will: { x: -8, y: -5, label: "W", zone: "Man RB/TE" },
      sam: { x: 8, y: -5, label: "S", zone: "Man RB/TE" },
    },
    keyIndicators: [
      "No deep safeties",
      "All DBs in press alignment",
      "Safeties walked up near LOS",
      "7+ defenders near the box",
    ],
    vulnerabilities: [
      "Hot routes",
      "Quick game",
      "1-on-1 matchups",
      "Timing routes",
    ],
    commonVariations: [
      { id: "c0-blitz", name: "Cover 0 Blitz", description: "All-out blitz with no safety help" },
      { id: "c0-pressure", name: "Cover 0 Pressure", description: "7-man pressure look" },
    ],
    coachingPoints: [
      "When you see zero deep help, expect pressure",
      "Win with timing routes and protection adjustments",
      "Hot routes are essential against Cover 0",
    ],
  },
  {
    id: "cover-1",
    legacyId: "C1",
    name: "Cover 1",
    shortName: "C1",
    description: "Man coverage with single high safety providing deep help. Most common man coverage.",
    safetyCount: 1,
    safetyAlignment: "single-high",
    positions: {
      fs: { x: 0, y: -18, label: "FS", zone: "Deep Middle" },
      ss: { x: 8, y: -8, label: "SS", zone: "Robber/Man" },
      lcb: { x: -18, y: -2, label: "CB", zone: "Man #1" },
      rcb: { x: 18, y: -2, label: "CB", zone: "Man #1" },
      mike: { x: 0, y: -5, label: "M", zone: "Man RB" },
      will: { x: -6, y: -5, label: "W", zone: "Man TE" },
      sam: { x: 6, y: -5, label: "S", zone: "Hook/Curl" },
    },
    keyIndicators: [
      "Single high safety at 12-15 yards",
      "Corners in press with inside leverage",
      "DBs tracking receivers pre-snap",
    ],
    vulnerabilities: [
      "Rubs and picks",
      "Crossing routes",
      "Stack/bunch formations",
      "Deep shots with rub",
    ],
    commonVariations: [
      { id: "c1-robber", name: "Cover 1 Robber", description: "SS lurking in middle reading QB eyes" },
      { id: "c1-hole", name: "Cover 1 Hole", description: "LBs in man on backs, hole player in middle" },
      { id: "c1-rat", name: "Cover 1 Rat", description: "Defender reading QB and jumping routes" },
    ],
    coachingPoints: [
      "Attack with rubs, picks, and crossing routes",
      "The robber can take away middle of field",
      "Wheel routes can exploit LB matchups",
    ],
  },
  {
    id: "cover-2",
    legacyId: "C2",
    name: "Cover 2",
    shortName: "C2",
    description: "Two deep safeties splitting the field in half. Corners play flat zones.",
    safetyCount: 2,
    safetyAlignment: "two-high",
    positions: {
      fs: { x: -12, y: -15, label: "FS", zone: "Deep Half" },
      ss: { x: 12, y: -15, label: "SS", zone: "Deep Half" },
      lcb: { x: -15, y: -5, label: "CB", zone: "Flat" },
      rcb: { x: 15, y: -5, label: "CB", zone: "Flat" },
      mike: { x: 0, y: -8, label: "M", zone: "Hook/Curl" },
      will: { x: -5, y: -6, label: "W", zone: "Hook" },
      sam: { x: 5, y: -6, label: "S", zone: "Curl" },
    },
    keyIndicators: [
      "Two safeties splitting field at 12-14 yards",
      "Corners squatting at 5 yards",
      "Corners show outside leverage",
    ],
    vulnerabilities: [
      "Corner routes (hole shot)",
      "Smash concept",
      "Deep middle (Tampa 2)",
      "4 verticals",
    ],
    commonVariations: [
      { id: "c2-tampa", name: "Tampa 2", description: "Mike LB drops deep middle" },
      { id: "c2-man", name: "2-Man Under", description: "Man coverage underneath with 2 deep" },
      { id: "c2-trap", name: "Cover 2 Trap", description: "Corner jumps flat, safety rolls down" },
    ],
    coachingPoints: [
      "Attack the hole between corner and safety",
      "Smash concept is a Cover 2 beater",
      "Hit seams before Mike gets depth in Tampa 2",
    ],
  },
  {
    id: "cover-3",
    legacyId: "C3",
    name: "Cover 3",
    shortName: "C3",
    description: "Three deep defenders (2 corners, 1 safety) each covering a deep third. 4 underneath.",
    safetyCount: 1,
    safetyAlignment: "single-high",
    positions: {
      fs: { x: 0, y: -18, label: "FS", zone: "Deep Middle Third" },
      ss: { x: 10, y: -7, label: "SS", zone: "Flat/Force" },
      lcb: { x: -18, y: -12, label: "CB", zone: "Deep Third" },
      rcb: { x: 18, y: -12, label: "CB", zone: "Deep Third" },
      mike: { x: 0, y: -6, label: "M", zone: "Hook" },
      will: { x: -6, y: -5, label: "W", zone: "Curl/Flat" },
      sam: { x: 6, y: -5, label: "S", zone: "Curl" },
    },
    keyIndicators: [
      "Single high safety centered",
      "Corners at 7-8 yards with outside leverage",
      "One safety rotating down (Sky/Cloud)",
    ],
    vulnerabilities: [
      "Flood concepts",
      "Four verticals",
      "Curl-flat combos",
      "Seam routes",
    ],
    commonVariations: [
      { id: "c3-sky", name: "Cover 3 Sky", description: "Safety comes down to play force" },
      { id: "c3-cloud", name: "Cover 3 Cloud", description: "Corner drops to flat, safety deep third" },
      { id: "c3-buzz", name: "Cover 3 Buzz", description: "OLB drops to flat zone" },
    ],
    coachingPoints: [
      "Flood concepts attack the flat-to-corner window",
      "Speed outs work against Cloud",
      "Four verts stress the deep thirds",
    ],
  },
  {
    id: "cover-4",
    legacyId: "C4",
    name: "Cover 4",
    shortName: "C4",
    description: "Four deep defenders each covering a quarter of the deep field. Strong against the pass.",
    safetyCount: 2,
    safetyAlignment: "two-high",
    positions: {
      fs: { x: -10, y: -12, label: "FS", zone: "Deep Quarter" },
      ss: { x: 10, y: -12, label: "SS", zone: "Deep Quarter" },
      lcb: { x: -18, y: -8, label: "CB", zone: "Deep Quarter" },
      rcb: { x: 18, y: -8, label: "CB", zone: "Deep Quarter" },
      mike: { x: 0, y: -6, label: "M", zone: "Hook" },
      will: { x: -5, y: -5, label: "W", zone: "Curl" },
      sam: { x: 5, y: -5, label: "S", zone: "Curl" },
    },
    keyIndicators: [
      "Two high safeties at 10-12 yards",
      "Corners at 7 yards with inside leverage",
      "DBs keying on #2 receivers",
    ],
    vulnerabilities: [
      "Underneath crossers",
      "Dig routes",
      "Double moves",
      "Run game",
    ],
    commonVariations: [
      { id: "c4-palms", name: "Quarters Palms", description: "Pattern match based on #2's route" },
      { id: "c4-solo", name: "Quarters Solo", description: "Each DB has quarter regardless of routes" },
      { id: "c4-poach", name: "Quarters Poach", description: "Safety helps on #1, corner handles" },
    ],
    coachingPoints: [
      "Quarters is strong vs vertical passing",
      "Attack with underneath crossers and digs",
      "Post-dig combos stress the coverage",
    ],
  },
  {
    id: "cover-6",
    legacyId: "C6",
    name: "Cover 6",
    shortName: "C6",
    description: "Split-field coverage: Quarters to one side, Cover 2 to the other. Asymmetrical look.",
    safetyCount: 2,
    safetyAlignment: "split-field",
    positions: {
      fs: { x: -10, y: -16, label: "FS", zone: "Deep Half" },
      ss: { x: 10, y: -10, label: "SS", zone: "Quarter" },
      lcb: { x: -18, y: -6, label: "CB", zone: "Flat" },
      rcb: { x: 18, y: -8, label: "CB", zone: "Quarter" },
      mike: { x: 0, y: -6, label: "M", zone: "Hook" },
      will: { x: -5, y: -5, label: "W", zone: "Curl" },
      sam: { x: 5, y: -5, label: "S", zone: "Curl" },
    },
    keyIndicators: [
      "Asymmetric safety alignment",
      "One safety deep, one at intermediate depth",
      "Different corner techniques per side",
    ],
    vulnerabilities: [
      "Identify coverage sides and attack weak side",
      "Boundary corner route",
      "Expose the seam on quarters side",
    ],
    commonVariations: [
      { id: "c6-field", name: "Cover 6 Field", description: "Quarters to field, C2 to boundary" },
      { id: "c6-boundary", name: "Cover 6 Boundary", description: "Quarters to boundary, C2 to field" },
    ],
    coachingPoints: [
      "Identify which side has quarters vs halves",
      "Attack the Cover 2 side with corner routes",
      "Work the seams against quarters",
    ],
  },
  {
    id: "quarters",
    legacyId: "QUARTERS",
    name: "Quarters",
    shortName: "Quarters",
    description: "Four-across deep zone with each defender responsible for a quarter of the field.",
    safetyCount: 2,
    safetyAlignment: "two-high",
    positions: {
      fs: { x: -10, y: -12, label: "FS", zone: "Deep Quarter" },
      ss: { x: 10, y: -12, label: "SS", zone: "Deep Quarter" },
      lcb: { x: -18, y: -8, label: "CB", zone: "Deep Quarter" },
      rcb: { x: 18, y: -8, label: "CB", zone: "Deep Quarter" },
      mike: { x: 0, y: -6, label: "M", zone: "Hook" },
      will: { x: -5, y: -5, label: "W", zone: "Curl" },
      sam: { x: 5, y: -5, label: "S", zone: "Curl" },
    },
    keyIndicators: [
      "Two high safeties splitting field",
      "Corners reading #2 receivers",
      "Safety reading through #2 to #1",
    ],
    vulnerabilities: [
      "Underneath crossers",
      "Dig routes",
      "Levels concept",
      "Post-dig combos",
    ],
    commonVariations: [
      { id: "q-match", name: "Quarters Match", description: "Pattern match based on releases" },
      { id: "q-solo", name: "Quarters Solo", description: "Spot drop regardless of routes" },
    ],
    coachingPoints: [
      "Keys on #2 determine coverage",
      "If #2 goes vertical, safety carries",
      "If #2 goes out, safety reads to #1",
    ],
  },
  {
    id: "match",
    legacyId: "MATCH",
    name: "Match",
    shortName: "Match",
    description: "Pattern-matching coverage that combines zone and man principles based on offensive releases.",
    safetyCount: 2,
    safetyAlignment: "two-high",
    positions: {
      fs: { x: -10, y: -12, label: "FS", zone: "Pattern Match" },
      ss: { x: 10, y: -12, label: "SS", zone: "Pattern Match" },
      lcb: { x: -18, y: -7, label: "CB", zone: "Match #1/#2" },
      rcb: { x: 18, y: -7, label: "CB", zone: "Match #1/#2" },
      mike: { x: 0, y: -6, label: "M", zone: "Match TE/RB" },
      will: { x: -5, y: -5, label: "W", zone: "Match" },
      sam: { x: 5, y: -5, label: "S", zone: "Match" },
    },
    keyIndicators: [
      "Two high shell pre-snap",
      "Post-snap passing off based on routes",
      "DBs reading route stems",
    ],
    vulnerabilities: [
      "Levels concepts",
      "Option routes",
      "Double moves",
      "Confusion with complex route combos",
    ],
    commonVariations: [
      { id: "match-mable", name: "MABLE", description: "Man-Bracket-Lock-Expand pattern match" },
      { id: "match-solo", name: "Solo Match", description: "Defenders match routes in their zone" },
      { id: "match-special", name: "Special Match", description: "Carry verticals, pass off horizontals" },
    ],
    coachingPoints: [
      "Match coverage adapts to route combinations",
      "Levels and option routes create confusion",
      "Use double moves to beat the matching rules",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a coverage shell by its ID
 */
export function getCoverageById(id: CoverageId): CoverageShell | undefined {
  return COVERAGE_SHELLS.find((c) => c.id === id);
}

/**
 * Get a coverage shell by its legacy ID (for backward compatibility)
 */
export function getCoverageByLegacyId(legacyId: LegacyCoverageId): CoverageShell | undefined {
  return COVERAGE_SHELLS.find((c) => c.legacyId === legacyId);
}

/**
 * Get all coverage IDs for selection UI
 */
export function getCoverageIds(): { id: CoverageId; name: string; shortName: string }[] {
  return COVERAGE_SHELLS.map((c) => ({ id: c.id, name: c.name, shortName: c.shortName }));
}

/**
 * Get all legacy coverage IDs for selection UI (backward compatibility)
 */
export function getLegacyCoverageIds(): LegacyCoverageId[] {
  return COVERAGE_SHELLS.map((c) => c.legacyId);
}

/**
 * Get coverage label from legacy ID
 */
export function getCoverageLabelFromLegacyId(legacyId: LegacyCoverageId): string {
  const coverage = getCoverageByLegacyId(legacyId);
  return coverage?.name ?? legacyId;
}

/**
 * Get coverages by safety alignment
 */
export function getCoveragesBySafetyAlignment(
  alignment: CoverageShell["safetyAlignment"]
): CoverageShell[] {
  return COVERAGE_SHELLS.filter((c) => c.safetyAlignment === alignment);
}

/**
 * Get a random subset of coverages
 */
export function getRandomCoverages(count: number): CoverageShell[] {
  const shuffled = [...COVERAGE_SHELLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Map between CoverageId and LegacyCoverageId
 */
export const COVERAGE_ID_MAP: Record<CoverageId, LegacyCoverageId> = {
  "cover-0": "C0",
  "cover-1": "C1",
  "cover-2": "C2",
  "cover-3": "C3",
  "cover-4": "C4",
  "cover-6": "C6",
  "quarters": "QUARTERS",
  "match": "MATCH",
};

export const LEGACY_COVERAGE_ID_MAP: Record<LegacyCoverageId, CoverageId> = {
  "C0": "cover-0",
  "C1": "cover-1",
  "C2": "cover-2",
  "C3": "cover-3",
  "C4": "cover-4",
  "C6": "cover-6",
  "QUARTERS": "quarters",
  "MATCH": "match",
};








