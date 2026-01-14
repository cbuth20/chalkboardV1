// Types for playbook metadata-based plays

import { SideOfBall, ContentType, Level, Position } from './playbook-metadata';

export interface MetadataPlay {
  id: string;
  name: string;
  formation: string;
  concept: string;
  side_of_ball?: SideOfBall;
  content_type?: ContentType;
  position_relevance: Position[];
  level?: Level;
  custom_notes?: string;
  file_paths: string[];
  created_at: string;
  updated_at: string;
}

export interface MetadataPlayUpdate {
  id: string;
  formation_name?: string;
  concept_name?: string;
  side_of_ball?: SideOfBall;
  content_type?: ContentType;
  position_relevance?: Position[];
  level?: Level;
  custom_notes?: string;
}
