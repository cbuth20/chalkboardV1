// Playbook metadata types for Supabase storage
import { SkillPosition } from '@/lib/supabase/types/database';
import { POSITIONS_BY_CATEGORY } from '@/lib/positions';

export type SideOfBall = 'offense' | 'defense' | 'special_teams';

export type ContentType =
  | 'full_playbook'
  | 'single_play'
  | 'formation'
  | 'concept'
  | 'install_notes';

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
  install_notes: 'Install Notes',
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
