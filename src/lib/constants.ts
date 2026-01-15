/**
 * Global constants for the application
 */

// Development team ID - use this for testing without authentication
// In production, replace with actual team ID from auth context
export const DEV_TEAM_ID = '00000000-0000-0000-0000-000000000000';

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
export const API_ENDPOINTS = {
  PLAYBOOKS: '/api/playbooks',
  PLAYBOOK_METADATA: '/api/playbook-metadata',
  GENERATE_PLAY_CONTENT: '/api/generate-play-content',
  REVIEW_PLAY_CONTENT: '/api/review-play-content',
  GET_APPROVED_PLAYS: '/api/get-approved-plays',
} as const;
