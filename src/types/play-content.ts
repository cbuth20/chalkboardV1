// Shared types for play content generation and review

export interface PositionAssignment {
  id: string;
  position: string;
  alignment: string;
  landmark: string;
  assignment: string;
  key_read: string;
  route_id?: string | null;
  route_depth?: number | null;
  coverage_adjustments?: {
    vs_man?: string;
    vs_zone?: string;
    vs_blitz?: string;
  };
}

export interface KnowledgeCard {
  id: string;
  play_id: string;
  position: string;
  category: string;
  question_prompt: string;
  correct_answer: string;
  difficulty: string;
  card_type: string;
  is_active: boolean;
}

export interface PlayAnalysisPosition {
  alignment: string;
  landmark: string;
  assignment: string;
  read: string;
  adjustments: {
    vsMan: string;
    vsZone: string;
    vsBlitz?: string;
  };
  routeId?: string;
  depth?: number;
}

export interface PlayAnalysis {
  name: string;
  shortName: string;
  formation: string;
  playType: string;
  concept: string;
  description: string;
  keyPoints: string[];
  bestAgainst: string[];
  positions: Record<string, PlayAnalysisPosition>;
}

export interface GeneratedContent {
  playId: string;
  insights: string;
  assignments: PositionAssignment[];
  knowledgeCards: KnowledgeCard[];
  playAnalysis: PlayAnalysis;
  status: string;
}

export interface EditedContent {
  insights: string;
  assignments: Array<{
    id: string;
    alignment: string;
    assignment: string;
    key_read: string;
  }>;
  knowledgeCards: Array<{
    id: string;
    question_prompt: string;
    correct_answer: string;
  }>;
}
