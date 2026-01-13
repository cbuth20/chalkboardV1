// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK STORE — localStorage persistence layer for demo
// Provides safe load/save with recovery from invalid data
// ═══════════════════════════════════════════════════════════════════════════

import {
  DemoPlay,
  DemoPlayer,
  DemoRoute,
  generateId,
  isDemoPlayArray,
} from "./demo-types";

// Data versioning constants
const CURRENT_VERSION = 2;
const STORAGE_KEY = `chalkboard_playbook_v${CURRENT_VERSION}`;
const LEGACY_KEYS = ["chalkboard_playbook_v1"];

// Field constants for migration
const CENTER_X_V2 = 26.67;
const FIELD_WIDTH_V2 = 53.333;
const OLD_CENTER_X = 20; // Old cropped view center
const OLD_FIELD_WIDTH = 40; // Old cropped view width

/**
 * Migrate play data from old coordinate system to new
 * Old: 40-yard cropped view centered on hashes (x: 0-40, y: 0 = LOS)
 * New: Full field width (x: 0-53.333, y: 0 = LOS, negative = backfield)
 */
function migratePlayFromV1(play: DemoPlay): DemoPlay {
  // Calculate the offset to center the old coordinates on the new field
  const xOffset = CENTER_X_V2 - OLD_CENTER_X;
  
  const migratedPlayers = play.players.map(player => ({
    ...player,
    x: player.x + xOffset,
    // Y coordinates stay the same since both use y=0 at LOS
    y: player.y,
  }));
  
  const migratedRoutes = play.routes.map(route => ({
    ...route,
    points: route.points.map(point => ({
      x: point.x + xOffset,
      y: point.y,
    })),
  }));
  
  return {
    ...play,
    players: migratedPlayers,
    routes: migratedRoutes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Load and migrate data from legacy storage keys
 */
function loadAndMigrateLegacyData(): DemoPlay[] | null {
  for (const legacyKey of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(legacyKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isDemoPlayArray(parsed)) {
          console.log(`[PlaybookStore] Migrating data from ${legacyKey}`);
          const migrated = parsed.map(migratePlayFromV1);
          // Clean up legacy key after migration
          localStorage.removeItem(legacyKey);
          return migrated;
        }
      }
    } catch (err) {
      console.warn(`[PlaybookStore] Failed to migrate from ${legacyKey}:`, err);
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE PLAYS — Loaded on first run or data corruption
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE PLAYS — PLAYBOOK DIAGRAM COORDINATES
// 
// Coordinate System (Full-Width End-Zone View):
//   X: 0-53.333 (field width, sideline to sideline)
//   Y: 0 = LOS, positive = upfield toward defense, negative = backfield
//   
// Center of field: X = 26.67
// NFL Hash marks: Left = 23.58, Right = 29.75
// ═══════════════════════════════════════════════════════════════════════════

const SAMPLE_PLAYS: DemoPlay[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FLOOD RIGHT — Trips Right, 11 Personnel
  // 3-Level Stretch: Go (clear) → Sail (primary) → Flat (checkdown)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "flood-right",
    name: "Flood Right",
    formation: "Shotgun Trips Right",
    personnel: "11",
    concept: "Flood (3-Level Stretch)",
    notes: `PRIMARY: Sail (H) at 12-15 yards
ALERT: Go (Z) vs single-high
CHECKDOWN: RB Flat

QB READ: High → Low
1. Go (clear safety)
2. Sail (primary read)
3. Flat (checkdown)
4. X backside (alert)

COACHING POINTS:
• Z clears corner/safety vertically
• H stems to 12, breaks out to numbers
• F releases immediately to flat
• Y occupies hook defender
• Read corner leverage on Sail`,
    players: [
      // Offensive Line (tight cluster at LOS) - centered at X=26.67
      { id: "flood-c", label: "C", x: 26.67, y: 0 },
      { id: "flood-lg", label: "LG", x: 24.47, y: 0 },
      { id: "flood-rg", label: "RG", x: 28.87, y: 0 },
      { id: "flood-lt", label: "LT", x: 22.27, y: 0 },
      { id: "flood-rt", label: "RT", x: 31.07, y: 0 },
      // Backfield
      { id: "flood-qb", label: "QB", x: 26.67, y: -4.5 },    // Gun depth
      { id: "flood-f", label: "F", x: 23.67, y: -3.5 },      // RB offset left
      // Trips Right (stacked toward right side)
      { id: "flood-z", label: "Z", x: 43.67, y: 0.5 },       // Outside trips
      { id: "flood-h", label: "H", x: 36.67, y: 0.5 },       // Slot
      { id: "flood-y", label: "Y", x: 32.67, y: 0 },         // TE inline
      // Backside (isolated left)
      { id: "flood-x", label: "X", x: 9.67, y: 0.5 },        // Split end
    ],
    routes: [
      // Z: Go / Clear — vertical, clears corner & safety
      {
        id: "flood-r-z",
        playerId: "flood-z",
        points: [
          { x: 43.67, y: 0.5 },
          { x: 43.67, y: 24 },
        ],
        color: "#94a3b8", // Slate (clear route)
      },
      // H: Sail / Deep Out — PRIMARY READ (stem 12, break out)
      {
        id: "flood-r-h",
        playerId: "flood-h",
        points: [
          { x: 36.67, y: 0.5 },
          { x: 36.67, y: 11 },
          { x: 44.67, y: 14 },
        ],
        color: "#F5C253", // Gold (PRIMARY)
      },
      // F: Flat — immediate release to right flat
      {
        id: "flood-r-f",
        playerId: "flood-f",
        points: [
          { x: 23.67, y: -3.5 },
          { x: 28.67, y: -1 },
          { x: 41.67, y: 3.5 },
        ],
        color: "#22d3ee", // Cyan (checkdown)
      },
      // Y: Seam / Check — settle at 8-10 yards
      {
        id: "flood-r-y",
        playerId: "flood-y",
        points: [
          { x: 32.67, y: 0 },
          { x: 32.67, y: 8 },
        ],
        color: "#94a3b8", // Slate (occupy hook)
      },
      // X: Backside Slant — isolation alert
      {
        id: "flood-r-x",
        playerId: "flood-x",
        points: [
          { x: 9.67, y: 0.5 },
          { x: 9.67, y: 2 },
          { x: 15.67, y: 7 },
        ],
        color: "#94a3b8", // Slate (backside)
      },
    ],
    createdAt: "2024-01-01T12:00:00.000Z",
    updatedAt: "2024-01-01T12:00:00.000Z",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK STORE
// ═══════════════════════════════════════════════════════════════════════════

export const PlaybookStore = {
  /**
   * Load plays from localStorage.
   * Automatically migrates data from older versions.
   * Returns sample plays if no data exists or data is corrupted.
   */
  load(): DemoPlay[] {
    try {
      if (typeof window === "undefined") {
        return [...SAMPLE_PLAYS];
      }
      
      const raw = localStorage.getItem(STORAGE_KEY);
      
      if (!raw) {
        // Check for legacy data to migrate
        const migratedData = loadAndMigrateLegacyData();
        if (migratedData) {
          PlaybookStore.save(migratedData);
          return migratedData;
        }
        
        // First run: initialize with sample data
        PlaybookStore.save(SAMPLE_PLAYS);
        return [...SAMPLE_PLAYS];
      }

      const parsed = JSON.parse(raw);
      if (!isDemoPlayArray(parsed)) {
        console.warn("[PlaybookStore] Invalid data, restoring samples");
        PlaybookStore.save(SAMPLE_PLAYS);
        return [...SAMPLE_PLAYS];
      }

      return parsed;
    } catch (err) {
      console.error("[PlaybookStore] Load failed, restoring samples:", err);
      PlaybookStore.save(SAMPLE_PLAYS);
      return [...SAMPLE_PLAYS];
    }
  },

  /**
   * Save plays to localStorage.
   */
  save(plays: DemoPlay[]): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plays));
    } catch (err) {
      console.error("[PlaybookStore] Save failed:", err);
    }
  },

  /**
   * Upsert (insert or update) a play.
   * Returns the updated plays array.
   */
  upsert(play: DemoPlay): DemoPlay[] {
    const plays = PlaybookStore.load();
    const idx = plays.findIndex((p) => p.id === play.id);
    const updatedPlay = { ...play, updatedAt: new Date().toISOString() };

    if (idx >= 0) {
      plays[idx] = updatedPlay;
    } else {
      plays.push(updatedPlay);
    }

    PlaybookStore.save(plays);
    return plays;
  },

  /**
   * Remove a play by ID.
   * Returns the updated plays array.
   */
  remove(id: string): DemoPlay[] {
    const plays = PlaybookStore.load().filter((p) => p.id !== id);
    PlaybookStore.save(plays);
    return plays;
  },

  /**
   * Reset to sample data (for demo reset button).
   */
  reset(): DemoPlay[] {
    PlaybookStore.save(SAMPLE_PLAYS);
    return [...SAMPLE_PLAYS];
  },

  /**
   * Export all plays as JSON string.
   */
  exportJSON(): string {
    const plays = PlaybookStore.load();
    return JSON.stringify(plays, null, 2);
  },

  /**
   * Export a single play as JSON string.
   */
  exportPlayJSON(id: string): string | null {
    const plays = PlaybookStore.load();
    const play = plays.find((p) => p.id === id);
    if (!play) return null;
    return JSON.stringify(play, null, 2);
  },
};

export default PlaybookStore;

