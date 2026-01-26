/**
 * Global constants for the application
 */

// Default team ID - single-team setup
// All users are automatically assigned to this team
export const DEFAULT_TEAM_ID = '00000000-0000-0000-0000-000000000000';

// Alias for backwards compatibility
export const DEV_TEAM_ID = DEFAULT_TEAM_ID;

// Position groupings
export const OFFENSE_POSITIONS = ['QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE'] as const;
export const OLINE_POSITIONS = ['LT', 'LG', 'C', 'RG', 'RT'] as const;
export const ALL_POSITIONS = [...OFFENSE_POSITIONS, ...OLINE_POSITIONS] as const;

// Position display names
export const POSITION_NAMES: Record<string, string> = {
  QB: 'Quarterback',
  RB: 'Running Back',
  FB: 'Fullback',
  X: 'X Receiver',
  Z: 'Z Receiver',
  H: 'H-Back/Slot',
  Y: 'Y Receiver',
  TE: 'Tight End',
  LT: 'Left Tackle',
  LG: 'Left Guard',
  C: 'Center',
  RG: 'Right Guard',
  RT: 'Right Tackle',
};

// Flashcard categories
export const FLASHCARD_CATEGORIES = {
  ALIGNMENT: 'alignment',
  ASSIGNMENT: 'assignment',
  COVERAGE: 'coverage',
  READ: 'read',
  TERMINOLOGY: 'terminology',
  PLAY_CONCEPT: 'play_concept',
  FORMATION_KEY: 'formation_key',
  COVERAGE_READ: 'coverage_read',
  EXECUTION_KEY: 'execution_key',
} as const;

// API endpoints
// NOTE: Most play-related endpoints have been migrated to Netlify functions
// See /netlify/functions/ for new API architecture
export const API_ENDPOINTS = {
  // Legacy endpoints - still in use, will be migrated
  PLAYBOOK_METADATA: '/api/playbook-metadata',
  GET_APPROVED_PLAYS: '/api/get-approved-plays', // TODO: Migrate to plays-list + flashcards-list
} as const;
