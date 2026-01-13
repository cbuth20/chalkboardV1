// ═══════════════════════════════════════════════════════════════════════════
// DEMO TYPES — Simplified types for the Playbook Builder demo
// Optimized for localStorage persistence and live demo reliability
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A point on the field (SVG coordinates: x=0-120, y=0-53.3)
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * A player on the field
 */
export interface DemoPlayer {
  id: string;
  label: string; // QB, RB, X, Y, Z, H, etc.
  x: number;
  y: number;
}

/**
 * A route drawn for a player
 */
export interface DemoRoute {
  id: string;
  playerId: string;
  points: Point[];
  color?: string;
}

/**
 * A complete play definition for the demo
 */
export interface DemoPlay {
  id: string;
  name: string;
  formation: string;
  personnel: string;
  concept: string;
  notes: string;
  players: DemoPlayer[];
  routes: DemoRoute[];
  createdAt: string;
  updatedAt: string;
}

// Field constants for coordinate system
const CENTER_X = 26.67; // Center of 53.333 yard field

/**
 * Default players for a new play (Shotgun Spread formation)
 * Coordinates: X = 0-53.333 (field width), Y = 0 at LOS, negative = backfield
 */
export const DEFAULT_PLAYERS: DemoPlayer[] = [
  // Offensive Line
  { id: "c", label: "C", x: CENTER_X, y: 0 },
  { id: "lg", label: "LG", x: CENTER_X - 2.2, y: 0 },
  { id: "rg", label: "RG", x: CENTER_X + 2.2, y: 0 },
  { id: "lt", label: "LT", x: CENTER_X - 4.4, y: 0 },
  { id: "rt", label: "RT", x: CENTER_X + 4.4, y: 0 },
  // Backfield
  { id: "qb", label: "QB", x: CENTER_X, y: -5 },         // Shotgun depth
  { id: "rb", label: "F", x: CENTER_X - 3, y: -4 },      // RB offset left
  // Receivers
  { id: "x", label: "X", x: 5, y: 0.5 },                  // Left outside WR
  { id: "h", label: "H", x: CENTER_X - 8, y: 0.5 },       // Left slot
  { id: "y", label: "Y", x: CENTER_X + 8, y: 0.5 },       // Right slot  
  { id: "z", label: "Z", x: 48, y: 0.5 },                 // Right outside WR
];

/**
 * Utility: Generate a stable unique ID (no external deps)
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Formation templates with proper coordinates
 * Coordinates: X = 0-53.333 (field width), Y = 0 at LOS, negative = backfield
 */
export type FormationTemplate = {
  id: string;
  name: string;
  personnel: string;
  players: Omit<DemoPlayer, 'id'>[];
};

export const FORMATION_TEMPLATES: FormationTemplate[] = [
  {
    id: "shotgun-spread",
    name: "Shotgun Spread",
    personnel: "10",
    players: [
      // OL
      { label: "C", x: CENTER_X, y: 0 },
      { label: "LG", x: CENTER_X - 2.2, y: 0 },
      { label: "RG", x: CENTER_X + 2.2, y: 0 },
      { label: "LT", x: CENTER_X - 4.4, y: 0 },
      { label: "RT", x: CENTER_X + 4.4, y: 0 },
      // Backfield
      { label: "QB", x: CENTER_X, y: -5 },
      { label: "F", x: CENTER_X + 3, y: -4 },
      // 4 WRs (2x2)
      { label: "X", x: 5, y: 0.5 },
      { label: "H", x: CENTER_X - 8, y: 0.5 },
      { label: "Y", x: CENTER_X + 8, y: 0.5 },
      { label: "Z", x: 48, y: 0.5 },
    ],
  },
  {
    id: "shotgun-trips-right",
    name: "Shotgun Trips Right",
    personnel: "11",
    players: [
      // OL
      { label: "C", x: CENTER_X, y: 0 },
      { label: "LG", x: CENTER_X - 2.2, y: 0 },
      { label: "RG", x: CENTER_X + 2.2, y: 0 },
      { label: "LT", x: CENTER_X - 4.4, y: 0 },
      { label: "RT", x: CENTER_X + 4.4, y: 0 },
      // Backfield
      { label: "QB", x: CENTER_X, y: -5 },
      { label: "F", x: CENTER_X - 3, y: -4 },
      // Trips Right
      { label: "X", x: 5, y: 0.5 },
      { label: "Y", x: CENTER_X + 6, y: 0 },
      { label: "H", x: CENTER_X + 12, y: 0.5 },
      { label: "Z", x: 48, y: 0.5 },
    ],
  },
  {
    id: "i-formation",
    name: "I-Formation",
    personnel: "21",
    players: [
      // OL
      { label: "C", x: CENTER_X, y: 0 },
      { label: "LG", x: CENTER_X - 2.2, y: 0 },
      { label: "RG", x: CENTER_X + 2.2, y: 0 },
      { label: "LT", x: CENTER_X - 4.4, y: 0 },
      { label: "RT", x: CENTER_X + 4.4, y: 0 },
      // Backfield stacked
      { label: "QB", x: CENTER_X, y: -1.5 },
      { label: "FB", x: CENTER_X, y: -4 },
      { label: "RB", x: CENTER_X, y: -7 },
      // TE and WRs
      { label: "Y", x: CENTER_X + 6, y: 0 },
      { label: "X", x: 5, y: 0.5 },
      { label: "Z", x: 48, y: 0.5 },
    ],
  },
  {
    id: "pistol",
    name: "Pistol",
    personnel: "11",
    players: [
      // OL
      { label: "C", x: CENTER_X, y: 0 },
      { label: "LG", x: CENTER_X - 2.2, y: 0 },
      { label: "RG", x: CENTER_X + 2.2, y: 0 },
      { label: "LT", x: CENTER_X - 4.4, y: 0 },
      { label: "RT", x: CENTER_X + 4.4, y: 0 },
      // Pistol backfield (RB behind QB)
      { label: "QB", x: CENTER_X, y: -4 },
      { label: "F", x: CENTER_X, y: -7 },
      // TE and 3 WRs
      { label: "Y", x: CENTER_X + 6, y: 0 },
      { label: "X", x: 5, y: 0.5 },
      { label: "H", x: CENTER_X - 8, y: 0.5 },
      { label: "Z", x: 48, y: 0.5 },
    ],
  },
  {
    id: "empty",
    name: "Empty",
    personnel: "10",
    players: [
      // OL
      { label: "C", x: CENTER_X, y: 0 },
      { label: "LG", x: CENTER_X - 2.2, y: 0 },
      { label: "RG", x: CENTER_X + 2.2, y: 0 },
      { label: "LT", x: CENTER_X - 4.4, y: 0 },
      { label: "RT", x: CENTER_X + 4.4, y: 0 },
      // Empty - QB only in backfield
      { label: "QB", x: CENTER_X, y: -5 },
      // 5 receivers
      { label: "X", x: 5, y: 0.5 },
      { label: "H", x: CENTER_X - 10, y: 0.5 },
      { label: "F", x: CENTER_X, y: 0.5 },
      { label: "Y", x: CENTER_X + 10, y: 0.5 },
      { label: "Z", x: 48, y: 0.5 },
    ],
  },
];

/**
 * Get a formation template by ID
 */
export function getFormationTemplate(id: string): FormationTemplate | undefined {
  return FORMATION_TEMPLATES.find(f => f.id === id);
}

/**
 * Utility: Create a new blank play with optional formation
 */
export function createBlankPlay(formationId?: string): DemoPlay {
  const now = new Date().toISOString();
  const formation = formationId 
    ? getFormationTemplate(formationId) 
    : FORMATION_TEMPLATES[0];
  
  const players = formation 
    ? formation.players.map(p => ({ ...p, id: generateId() }))
    : DEFAULT_PLAYERS.map(p => ({ ...p, id: generateId() }));
  
  return {
    id: generateId(),
    name: "New Play",
    formation: formation?.name || "Shotgun Spread",
    personnel: formation?.personnel || "11",
    concept: "",
    notes: "",
    players,
    routes: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Utility: Duplicate a play with new IDs
 * Properly maps route playerIds to new player IDs
 */
export function duplicatePlay(play: DemoPlay): DemoPlay {
  const now = new Date().toISOString();
  const newId = generateId();
  
  // Create new players with ID mapping
  const playerIdMap = new Map<string, string>();
  const newPlayers = play.players.map((p) => {
    const newPlayerId = generateId();
    playerIdMap.set(p.id, newPlayerId);
    return { ...p, id: newPlayerId };
  });
  
  // Map route playerIds to new player IDs
  const newRoutes = play.routes.map((r) => ({
    ...r,
    id: generateId(),
    playerId: playerIdMap.get(r.playerId) || r.playerId,
  }));
  
  return {
    ...play,
    id: newId,
    name: `${play.name} (Copy)`,
    players: newPlayers,
    routes: newRoutes,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Type guard: Check if object is a valid DemoPlay
 */
export function isDemoPlay(obj: unknown): obj is DemoPlay {
  if (!obj || typeof obj !== "object") return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.formation === "string" &&
    Array.isArray(p.players) &&
    Array.isArray(p.routes)
  );
}

/**
 * Type guard: Check if array is valid DemoPlay[]
 */
export function isDemoPlayArray(arr: unknown): arr is DemoPlay[] {
  return Array.isArray(arr) && arr.every(isDemoPlay);
}

