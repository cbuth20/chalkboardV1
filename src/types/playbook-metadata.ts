// Playbook metadata types for Supabase storage
import { SkillPosition } from '@/lib/supabase/types/database';
import { POSITIONS_BY_CATEGORY } from '@/lib/positions';

export type SideOfBall = 'offense' | 'defense' | 'special_teams';

/**
 * Frontend content type values
 *
 * NOTE: These values are mapped to database enum values in netlify/functions/playbook-metadata.ts:
 * - 'single_play' -> 'play'
 * - 'notes' -> 'legend'
 * - 'install_notes' -> 'legend'
 * - 'full_playbook' -> 'index'
 * - 'concept' -> 'reference'
 * - Other values pass through if they match database enum: play, coverage, formation, legend, index, coaching_points, technique, terminology, reference, other
 */
export type ContentType =
  | 'full_playbook'
  | 'single_play'
  | 'formation'
  | 'concept'
  | 'coverage'
  | 'install_notes'
  | 'notes';

export type Level = 'high_school' | 'college' | 'pro';

// Position can be a SkillPosition or 'all'
export type Position = SkillPosition | 'all';

export type PlaybookTag =
  | 'Formation'
  | 'Coverage'
  | 'Route'
  | 'Protection'
  | 'Blocking'
  | 'Run Fits'
  | 'Adjustments'
  | 'Hot Routes'
  | 'Checks';

// Note types for My Notes feature
export type NoteType =
  | 'playbook_pdf'
  | 'defensive_scheme'
  | 'route_tree'
  | 'study_guide'
  | 'reference'
  | 'other';

export type FileCategory = 'notes' | 'reference' | 'playbook_pdf';

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  playbook_pdf: 'Playbook PDF',
  defensive_scheme: 'Defensive Scheme',
  route_tree: 'Route Tree',
  study_guide: 'Study Guide',
  reference: 'Reference Material',
  other: 'Other',
};

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  notes: 'Notes',
  reference: 'Reference',
  playbook_pdf: 'Playbook PDF',
};

export interface PlaybookMetadata {
  id: string;
  created_at: string;
  updated_at: string;

  // File references
  file_paths: string[];

  // Metadata fields
  side_of_ball?: SideOfBall;
  content_type?: ContentType;
  position_relevance: Position[];
  level?: Level;

  // Known naming info
  formation_name?: string;
  concept_name?: string;
  custom_notes?: string;

  // Tags for multi-file organization
  tags?: PlaybookTag[];

  // User info
  user_id?: string;
}

export type Unit = 'O' | 'D' | 'ST';

export interface PlaybookMetadataInput {
  file_paths?: string[]; // Optional - API will set this after upload
  side_of_ball?: SideOfBall;
  content_type?: ContentType;
  position_relevance?: Position[];
  level?: Level;
  formation_name?: string;
  concept_name?: string;
  custom_notes?: string;
  tags?: PlaybookTag[];
  // v1 Classification fields
  unit?: Unit;
  playbook_section?: string;
  primary_classification?: string;
  situation?: string;
  play_type?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  // My Notes fields
  note_type?: NoteType;
  file_category?: FileCategory;
  page_count?: number;
}

// UI labels for display
export const SIDE_OF_BALL_LABELS: Record<SideOfBall, string> = {
  offense: 'Offense',
  defense: 'Defense',
  special_teams: 'Special Teams',
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  full_playbook: 'Full Playbook',
  single_play: 'Single Play',
  formation: 'Formation',
  concept: 'Concept',
  coverage: 'Coverage',
  install_notes: "Install Notes",
  notes: 'Notes',
};

export const LEVEL_LABELS: Record<Level, string> = {
  high_school: 'High School',
  college: 'College',
  pro: 'Professional',
};

export const PLAYBOOK_TAGS: PlaybookTag[] = [
  'Formation',
  'Coverage',
  'Route',
  'Protection',
  'Blocking',
  'Run Fits',
  'Adjustments',
  'Hot Routes',
  'Checks',
];

// v1 Classification labels
export const UNIT_LABELS: Record<Unit, string> = {
  O: 'Offense',
  D: 'Defense',
  ST: 'Special Teams',
};

export const PLAY_TYPE_LABELS: Record<'PASS' | 'RUN' | 'RPO' | 'SCREEN', string> = {
  PASS: 'Pass',
  RUN: 'Run',
  RPO: 'RPO',
  SCREEN: 'Screen',
};

// Primary classifications by unit
export const OFFENSE_CLASSIFICATIONS = ['PASS', 'RUN'];
export const DEFENSE_CLASSIFICATIONS = ['COVERAGE', 'PRESSURE', 'FRONT'];
export const SPECIAL_TEAMS_CLASSIFICATIONS = ['Kickoff', 'Punt', 'Field Goal', 'PAT', 'Kickoff Return', 'Punt Return'];

// Suggested playbook sections
export const SUGGESTED_SECTIONS = [
  'General',
  'Formations',
  'Pass Game',
  'Run Game',
  'Third Down',
  'Red Zone',
  'Goal Line',
  'Two Minute',
  'Screen Game',
  'Play Action',
];

// Suggested situations
export const SUGGESTED_SITUATIONS = [
  '1st-2nd Down',
  '3rd Down',
  '3rd & Short',
  '3rd & Long',
  'Red Zone',
  'Goal Line',
  'Two Minute',
];

// Helper to get primary classifications based on unit
export function getPrimaryClassificationsForUnit(unit: Unit | undefined): string[] {
  if (!unit) return [];

  switch (unit) {
    case 'O':
      return OFFENSE_CLASSIFICATIONS;
    case 'D':
      return DEFENSE_CLASSIFICATIONS;
    case 'ST':
      return SPECIAL_TEAMS_CLASSIFICATIONS;
    default:
      return [];
  }
}

// Helper function to get positions based on side of ball
export function getPositionsForSideOfBall(sideOfBall: SideOfBall | undefined): SkillPosition[] {
  if (!sideOfBall) return [];

  switch (sideOfBall) {
    case 'offense':
      return POSITIONS_BY_CATEGORY.offense;
    case 'defense':
      return POSITIONS_BY_CATEGORY.defense;
    case 'special_teams':
      return POSITIONS_BY_CATEGORY['special-teams'];
    default:
      return [];
  }
}

// Helper to get all available positions (for 'all' selection)
export function getAllPositions(): SkillPosition[] {
  return [
    ...POSITIONS_BY_CATEGORY.offense,
    ...POSITIONS_BY_CATEGORY.defense,
    ...POSITIONS_BY_CATEGORY['special-teams'],
  ];
}
