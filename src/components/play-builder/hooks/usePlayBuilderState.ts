import { useState } from 'react';
import type {
  DiagramPlayer,
  DiagramRoute,
  BlockingAssignment,
  BallCarrierPath,
  PlayMode,
  SideOfBall,
  FloatingPanelType,
  BuiltPlayData
} from '../types';
import { INITIAL_OFFENSE, INITIAL_DEFENSE } from '../utils';

// ═══════════════════════════════════════════════════════════════════════════
// PLAY BUILDER STATE HOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface UsePlayBuilderStateReturn {
  // Play data
  playMode: PlayMode;
  setPlayMode: (mode: PlayMode) => void;
  offensePlayers: DiagramPlayer[];
  setOffensePlayers: (players: DiagramPlayer[] | ((prev: DiagramPlayer[]) => DiagramPlayer[])) => void;
  defensePlayers: DiagramPlayer[];
  setDefensePlayers: (players: DiagramPlayer[] | ((prev: DiagramPlayer[]) => DiagramPlayer[])) => void;
  routes: DiagramRoute[];
  setRoutes: (routes: DiagramRoute[] | ((prev: DiagramRoute[]) => DiagramRoute[])) => void;
  blocking: BlockingAssignment[];
  setBlocking: (blocking: BlockingAssignment[]) => void;
  ballCarrierPath?: BallCarrierPath;
  setBallCarrierPath: (path: BallCarrierPath | undefined) => void;

  // Metadata
  playName: string;
  setPlayName: (name: string) => void;
  formation: string;
  setFormation: (formation: string) => void;
  concept: string;
  setConcept: (concept: string) => void;
  playType: 'PASS' | 'RUN' | 'RPO';
  setPlayType: (type: 'PASS' | 'RUN' | 'RPO') => void;
  strength: 'Right' | 'Left';
  setStrength: (strength: 'Right' | 'Left') => void;
  personnel: string;
  setPersonnel: (personnel: string) => void;

  // Structured metadata (optional)
  sideOfBall: SideOfBall;
  setSideOfBall: (side: SideOfBall) => void;
  structuredPlayType: string;
  setStructuredPlayType: (type: string) => void;
  selectedSituationalTags: string[];
  setSelectedSituationalTags: (tags: string[] | ((prev: string[]) => string[])) => void;
  selectedConceptTags: string[];
  setSelectedConceptTags: (tags: string[] | ((prev: string[]) => string[])) => void;
  selectedFormationId: string;
  setSelectedFormationId: (id: string) => void;
  installPhase: string;
  setInstallPhase: (phase: string) => void;
  defensiveLook: string;
  setDefensiveLook: (look: string) => void;
  offensiveLook: string;
  setOffensiveLook: (look: string) => void;

  // Field configuration
  lineOfScrimmage: number;
  setLineOfScrimmage: (y: number) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  offensiveFormation: string;
  setOffensiveFormation: (formation: string) => void;
  defensiveFormation: string;
  setDefensiveFormation: (formation: string) => void;

  // UI state
  activePanel: FloatingPanelType;
  setActivePanel: (panel: FloatingPanelType) => void;
  selectedPlayer: string | null;
  setSelectedPlayer: (playerId: string | null) => void;
  selectedTemplatePlayer: string | null;
  setSelectedTemplatePlayer: (playerId: string | null) => void;
  playerNotes: Record<string, string>;
  setPlayerNotes: (notes: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export function usePlayBuilderState(
  initialPlayData?: BuiltPlayData
): UsePlayBuilderStateReturn {
  // Play state
  const [playMode, setPlayMode] = useState<PlayMode>(initialPlayData?.mode || 'pass');
  const [offensePlayers, setOffensePlayers] = useState<DiagramPlayer[]>(
    initialPlayData?.offensePlayers || INITIAL_OFFENSE
  );
  const [defensePlayers, setDefensePlayers] = useState<DiagramPlayer[]>(
    initialPlayData?.defensePlayers || INITIAL_DEFENSE
  );
  const [routes, setRoutes] = useState<DiagramRoute[]>(initialPlayData?.routes || []);
  const [blocking, setBlocking] = useState<BlockingAssignment[]>(initialPlayData?.blocking || []);
  const [ballCarrierPath, setBallCarrierPath] = useState<BallCarrierPath | undefined>(
    initialPlayData?.ballCarrierPath
  );

  // Player notes state (keyed by player ID)
  const [playerNotes, setPlayerNotes] = useState<Record<string, string>>({});

  // Metadata state
  const [playName, setPlayName] = useState(initialPlayData?.metadata?.name || '');
  const [formation, setFormation] = useState(initialPlayData?.metadata?.formation || '');
  const [concept, setConcept] = useState(initialPlayData?.metadata?.concept || '');
  const [playType, setPlayType] = useState<'PASS' | 'RUN' | 'RPO'>(
    initialPlayData?.metadata?.playType || 'PASS'
  );
  const [strength, setStrength] = useState<'Right' | 'Left'>(
    initialPlayData?.metadata?.strength || 'Right'
  );
  const [personnel, setPersonnel] = useState(initialPlayData?.metadata?.personnel || '11');

  // Structured metadata state (optional, only if structured props provided)
  const [sideOfBall, setSideOfBall] = useState<SideOfBall>('offense');
  const [structuredPlayType, setStructuredPlayType] = useState<string>('');
  const [selectedSituationalTags, setSelectedSituationalTags] = useState<string[]>([]);
  const [selectedConceptTags, setSelectedConceptTags] = useState<string[]>([]);
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [installPhase, setInstallPhase] = useState<string>('');
  const [defensiveLook, setDefensiveLook] = useState<string>('');
  const [offensiveLook, setOffensiveLook] = useState<string>('');

  // Formation state
  const [offensiveFormation, setOffensiveFormation] = useState('Pro Set');
  const [defensiveFormation, setDefensiveFormation] = useState('4-3');

  // Field state
  const [lineOfScrimmage, setLineOfScrimmage] = useState(50);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // UI state
  const [activePanel, setActivePanel] = useState<FloatingPanelType>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTemplatePlayer, setSelectedTemplatePlayer] = useState<string | null>(null);

  return {
    // Play data
    playMode,
    setPlayMode,
    offensePlayers,
    setOffensePlayers,
    defensePlayers,
    setDefensePlayers,
    routes,
    setRoutes,
    blocking,
    setBlocking,
    ballCarrierPath,
    setBallCarrierPath,

    // Metadata
    playName,
    setPlayName,
    formation,
    setFormation,
    concept,
    setConcept,
    playType,
    setPlayType,
    strength,
    setStrength,
    personnel,
    setPersonnel,

    // Structured metadata
    sideOfBall,
    setSideOfBall,
    structuredPlayType,
    setStructuredPlayType,
    selectedSituationalTags,
    setSelectedSituationalTags,
    selectedConceptTags,
    setSelectedConceptTags,
    selectedFormationId,
    setSelectedFormationId,
    installPhase,
    setInstallPhase,
    defensiveLook,
    setDefensiveLook,
    offensiveLook,
    setOffensiveLook,

    // Field configuration
    lineOfScrimmage,
    setLineOfScrimmage,
    snapToGrid,
    setSnapToGrid,
    offensiveFormation,
    setOffensiveFormation,
    defensiveFormation,
    setDefensiveFormation,

    // UI state
    activePanel,
    setActivePanel,
    selectedPlayer,
    setSelectedPlayer,
    selectedTemplatePlayer,
    setSelectedTemplatePlayer,
    playerNotes,
    setPlayerNotes,
  };
}
