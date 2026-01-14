// Playbook metadata types for Supabase storage

export type SideOfBall = 'offense' | 'defense' | 'special_teams';

export type ContentType =
  | 'full_playbook'
  | 'single_play'
  | 'formation'
  | 'concept'
  | 'install_notes';

export type Level = 'high_school' | 'college' | 'pro';

export type Position =
  | 'QB'
  | 'RB'
  | 'FB'
  | 'WR'
  | 'TE'
  | 'OL'
  | 'DL'
  | 'LB'
  | 'CB'
  | 'S'
  | 'K'
  | 'P'
  | 'all';

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

export const POSITION_LABELS: Record<Position, string> = {
  QB: 'Quarterback',
  RB: 'Running Back',
  FB: 'Fullback',
  WR: 'Wide Receiver',
  TE: 'Tight End',
  OL: 'Offensive Line',
  DL: 'Defensive Line',
  LB: 'Linebacker',
  CB: 'Cornerback',
  S: 'Safety',
  K: 'Kicker',
  P: 'Punter',
  all: 'All Positions',
};
