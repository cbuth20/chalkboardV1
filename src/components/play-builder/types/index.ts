import type { DiagramPlayer, DiagramRoute, BlockingAssignment, BallCarrierPath, PlayMode } from '@/components/playbook-diagram/types';
import type { SideOfBall, OffensivePlayType, DefensivePlayType } from '@/types/play-assignments';
import type { PlaybookMetadataInput } from '@/types/playbook-metadata';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type FloatingPanelType = 'info' | 'routes' | 'guide' | 'templates' | 'controls' | 'export' | 'assignments' | 'responsibilities' | 'player-actions' | null;

export interface RouteTemplate {
  id: string;
  name: string;
  description: string;
  points: { x: number; y: number }[];
  icon: string;
}

export interface HistoryState {
  routes: DiagramRoute[];
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
}

export interface BuiltPlayData {
  mode: PlayMode;
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
  routes?: DiagramRoute[];
  blocking?: BlockingAssignment[];
  ballCarrierPath?: BallCarrierPath;
  metadata: {
    name: string;
    formation: string;
    concept: string;
    playType: 'PASS' | 'RUN' | 'RPO';
    strength: 'Right' | 'Left';
    personnel: string;
  };
}

export interface PlayBuilderProps {
  onSave: (playData: BuiltPlayData, metadata?: PlaybookMetadataInput) => void;
  onBack: () => void;
  orgId?: string;
  mode?: 'coach' | 'player';
  initialPlayData?: BuiltPlayData;
  viewOnly?: boolean;
  // Optional structured data props
  situationalTags?: Array<{ id: string; name: string; category: string }>;
  conceptTags?: Array<{ id: string; name: string }>;
  formations?: Array<{ id: string; name: string; sideOfBall: SideOfBall }>;
}

// Re-export commonly used types
export type { DiagramPlayer, DiagramRoute, BlockingAssignment, BallCarrierPath, PlayMode };
export type { SideOfBall, OffensivePlayType, DefensivePlayType };
export type { PlaybookMetadataInput };
