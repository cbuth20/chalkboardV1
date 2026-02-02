"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PlaybookMetadataInput } from '@/types/playbook-metadata';
import type { DiagramPlayer, DiagramRoute, BlockingAssignment, BallCarrierPath, PlayMode } from '@/components/playbook-diagram/types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

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
}

type FloatingPanelType = 'info' | 'routes' | 'guide' | 'templates' | 'controls' | 'export' | null;

interface RouteTemplate {
  id: string;
  name: string;
  description: string;
  points: { x: number; y: number }[];
  icon: string;
}

interface HistoryState {
  routes: DiagramRoute[];
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const ROUTE_TEMPLATES: RouteTemplate[] = [
  {
    id: 'go',
    name: 'Go/Streak',
    description: 'Straight vertical route',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -25 }
    ],
    icon: '↑'
  },
  {
    id: 'slant',
    name: 'Slant',
    description: '45° angle inside',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -5 },
      { x: 8, y: -15 }
    ],
    icon: '↗'
  },
  {
    id: 'out',
    name: 'Out',
    description: 'Break outside at 90°',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: 10, y: -12 }
    ],
    icon: '→'
  },
  {
    id: 'in',
    name: 'In/Dig',
    description: 'Break inside at 90°',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: -10, y: -12 }
    ],
    icon: '←'
  },
  {
    id: 'curl',
    name: 'Curl',
    description: 'Run and comeback',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: 0, y: -8 }
    ],
    icon: '↩'
  },
  {
    id: 'post',
    name: 'Post',
    description: 'Break to middle',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: -8, y: -22 }
    ],
    icon: '↖'
  },
  {
    id: 'corner',
    name: 'Corner',
    description: 'Break to corner',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: 8, y: -22 }
    ],
    icon: '↗'
  },
  {
    id: 'comeback',
    name: 'Comeback',
    description: 'Deep return route',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -18 },
      { x: 0, y: -14 }
    ],
    icon: '⤴'
  },
  {
    id: 'flat',
    name: 'Flat',
    description: 'Quick outside route',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -3 },
      { x: 8, y: -3 }
    ],
    icon: '⇨'
  },
  {
    id: 'wheel',
    name: 'Wheel',
    description: 'Outside then vertical',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -3 },
      { x: 6, y: -5 },
      { x: 8, y: -18 }
    ],
    icon: '↻'
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// FORMATION PRESETS
// ═══════════════════════════════════════════════════════════════════════════

type FormationPreset = {
  [key: string]: { x: number; y: number };
};

const OFFENSIVE_FORMATIONS: Record<string, FormationPreset> = {
  'Pro Set': {
    qb: { x: 50, y: 65 },
    rb: { x: 45, y: 70 },
    fb: { x: 50, y: 68 },
    x: { x: 30, y: 55 },
    z: { x: 70, y: 55 },
    y: { x: 59, y: 60 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
  'Shotgun': {
    qb: { x: 50, y: 70 },
    rb: { x: 45, y: 70 },
    fb: { x: 55, y: 70 },
    x: { x: 30, y: 55 },
    z: { x: 70, y: 55 },
    y: { x: 59, y: 60 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
  'I-Formation': {
    qb: { x: 50, y: 65 },
    rb: { x: 50, y: 73 },
    fb: { x: 50, y: 68 },
    x: { x: 30, y: 55 },
    z: { x: 70, y: 55 },
    y: { x: 59, y: 60 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
  'Singleback': {
    qb: { x: 50, y: 65 },
    rb: { x: 50, y: 70 },
    fb: { x: 45, y: 65 },
    x: { x: 30, y: 55 },
    z: { x: 70, y: 55 },
    y: { x: 59, y: 60 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
  'Pistol': {
    qb: { x: 50, y: 67 },
    rb: { x: 50, y: 72 },
    fb: { x: 45, y: 67 },
    x: { x: 30, y: 55 },
    z: { x: 70, y: 55 },
    y: { x: 59, y: 60 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
  'Spread': {
    qb: { x: 50, y: 70 },
    rb: { x: 50, y: 75 },
    fb: { x: 45, y: 70 },
    x: { x: 25, y: 55 },
    z: { x: 75, y: 55 },
    y: { x: 63, y: 58 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
  'Trips Right': {
    qb: { x: 50, y: 70 },
    rb: { x: 45, y: 70 },
    fb: { x: 55, y: 70 },
    x: { x: 30, y: 55 },
    z: { x: 73, y: 55 },
    y: { x: 65, y: 58 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
  'Trips Left': {
    qb: { x: 50, y: 70 },
    rb: { x: 55, y: 70 },
    fb: { x: 45, y: 70 },
    x: { x: 27, y: 55 },
    z: { x: 70, y: 55 },
    y: { x: 35, y: 58 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
  'Empty': {
    qb: { x: 50, y: 70 },
    rb: { x: 38, y: 58 },
    fb: { x: 62, y: 58 },
    x: { x: 25, y: 55 },
    z: { x: 75, y: 55 },
    y: { x: 50, y: 55 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
  'Wing-T': {
    qb: { x: 50, y: 65 },
    rb: { x: 50, y: 70 },
    fb: { x: 50, y: 68 },
    x: { x: 30, y: 55 },
    z: { x: 59, y: 60 },
    y: { x: 41, y: 60 },
    lt: { x: 42, y: 60 },
    lg: { x: 46, y: 60 },
    c: { x: 50, y: 60 },
    rg: { x: 54, y: 60 },
    rt: { x: 58, y: 60 },
  },
};

const DEFENSIVE_FORMATIONS: Record<string, FormationPreset> = {
  '4-3': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 40, y: 58 },
    de2: { x: 60, y: 58 },
    dt1: { x: 46, y: 58 },
    dt2: { x: 54, y: 58 },
  },
  '3-4': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 44, y: 58 },
    de2: { x: 56, y: 58 },
    dt1: { x: 50, y: 58 },
    dt2: { x: 62, y: 52 },
  },
  'Nickel (4-2-5)': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 46, y: 54 },
    wlb: { x: 54, y: 54 },
    slb: { x: 38, y: 52 },
    de1: { x: 40, y: 58 },
    de2: { x: 60, y: 58 },
    dt1: { x: 46, y: 58 },
    dt2: { x: 54, y: 58 },
  },
  'Dime (4-1-6)': {
    cb1: { x: 28, y: 48 },
    cb2: { x: 72, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 38, y: 48 },
    slb: { x: 62, y: 48 },
    de1: { x: 40, y: 58 },
    de2: { x: 60, y: 58 },
    dt1: { x: 46, y: 58 },
    dt2: { x: 54, y: 58 },
  },
  '3-3-5': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 44, y: 58 },
    de2: { x: 56, y: 58 },
    dt1: { x: 50, y: 58 },
    dt2: { x: 42, y: 45 },
  },
  '5-2': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 46, y: 54 },
    wlb: { x: 54, y: 54 },
    slb: { x: 50, y: 52 },
    de1: { x: 38, y: 58 },
    de2: { x: 62, y: 58 },
    dt1: { x: 44, y: 58 },
    dt2: { x: 56, y: 58 },
  },
  'Cover 2': {
    cb1: { x: 34, y: 52 },
    cb2: { x: 66, y: 52 },
    fs: { x: 42, y: 35 },
    ss: { x: 58, y: 35 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 40, y: 58 },
    de2: { x: 60, y: 58 },
    dt1: { x: 46, y: 58 },
    dt2: { x: 54, y: 58 },
  },
  'Cover 3': {
    cb1: { x: 30, y: 40 },
    cb2: { x: 70, y: 40 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 48 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 40, y: 58 },
    de2: { x: 60, y: 58 },
    dt1: { x: 46, y: 58 },
    dt2: { x: 54, y: 58 },
  },
};

const INITIAL_OFFENSE: DiagramPlayer[] = [
  { id: "qb", label: "QB", side: "offense", x: 50, y: 65, group: "backfield" },
  { id: "rb", label: "RB", side: "offense", x: 45, y: 70, group: "backfield" },
  { id: "fb", label: "FB", side: "offense", x: 50, y: 68, group: "backfield" },
  { id: "x", label: "X", side: "offense", x: 30, y: 55, group: "skill" },
  { id: "z", label: "Z", side: "offense", x: 70, y: 55, group: "skill" },
  { id: "y", label: "Y", side: "offense", x: 59, y: 60, group: "skill" },
  { id: "lt", label: "LT", side: "offense", x: 42, y: 60, group: "line" },
  { id: "lg", label: "LG", side: "offense", x: 46, y: 60, group: "line" },
  { id: "c", label: "C", side: "offense", x: 50, y: 60, group: "line" },
  { id: "rg", label: "RG", side: "offense", x: 54, y: 60, group: "line" },
  { id: "rt", label: "RT", side: "offense", x: 58, y: 60, group: "line" },
];

const INITIAL_DEFENSE: DiagramPlayer[] = [
  { id: "cb1", label: "CB", side: "defense", x: 30, y: 48, group: "secondary" },
  { id: "cb2", label: "CB", side: "defense", x: 70, y: 48, group: "secondary" },
  { id: "fs", label: "FS", side: "defense", x: 50, y: 35, group: "secondary" },
  { id: "ss", label: "SS", side: "defense", x: 58, y: 42, group: "secondary" },
  { id: "mlb", label: "MLB", side: "defense", x: 50, y: 54, group: "linebacker" },
  { id: "wlb", label: "WLB", side: "defense", x: 42, y: 54, group: "linebacker" },
  { id: "slb", label: "SLB", side: "defense", x: 58, y: 54, group: "linebacker" },
  { id: "de1", label: "DE", side: "defense", x: 40, y: 58, group: "line" },
  { id: "de2", label: "DE", side: "defense", x: 60, y: 58, group: "line" },
  { id: "dt1", label: "DT", side: "defense", x: 46, y: 58, group: "line" },
  { id: "dt2", label: "DT", side: "defense", x: 54, y: 58, group: "line" },
];

// Line of scrimmage options
const LOS_OPTIONS = [
  { label: 'Own 20', value: 20, y: 80 },
  { label: 'Own 40', value: 40, y: 70 },
  { label: '50 Yard Line', value: 50, y: 60 },
  { label: 'Opp 40', value: 60, y: 50 },
  { label: 'Opp 20 (Red Zone)', value: 80, y: 30 },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PlayBuilder({ onSave, onBack, orgId, mode = 'coach', initialPlayData, viewOnly = false }: PlayBuilderProps) {
  // Play state
  const [playMode, setPlayMode] = useState<PlayMode>(initialPlayData?.mode || 'pass');
  const [offensePlayers, setOffensePlayers] = useState<DiagramPlayer[]>(initialPlayData?.offensePlayers || INITIAL_OFFENSE);
  const [defensePlayers, setDefensePlayers] = useState<DiagramPlayer[]>(initialPlayData?.defensePlayers || INITIAL_DEFENSE);
  const [routes, setRoutes] = useState<DiagramRoute[]>(initialPlayData?.routes || []);
  const [blocking, setBlocking] = useState<BlockingAssignment[]>(initialPlayData?.blocking || []);
  const [ballCarrierPath, setBallCarrierPath] = useState<BallCarrierPath | undefined>(initialPlayData?.ballCarrierPath);

  // Metadata state
  const [playName, setPlayName] = useState(initialPlayData?.metadata?.name || '');
  const [formation, setFormation] = useState(initialPlayData?.metadata?.formation || '');
  const [concept, setConcept] = useState(initialPlayData?.metadata?.concept || '');
  const [playType, setPlayType] = useState<'PASS' | 'RUN' | 'RPO'>(initialPlayData?.metadata?.playType || 'PASS');
  const [strength, setStrength] = useState<'Right' | 'Left'>(initialPlayData?.metadata?.strength || 'Right');
  const [personnel, setPersonnel] = useState(initialPlayData?.metadata?.personnel || '11');

  // Drawing state
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoutePoints, setCurrentRoutePoints] = useState<{x: number, y: number}[]>([]);

  // Dragging state
  const [isDraggingPlayer, setIsDraggingPlayer] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [draggedPlayerSide, setDraggedPlayerSide] = useState<'offense' | 'defense' | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Formation state
  const [offensiveFormation, setOffensiveFormation] = useState('Pro Set');
  const [defensiveFormation, setDefensiveFormation] = useState('4-3');

  // Field state
  const [lineOfScrimmage, setLineOfScrimmage] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });

  // Touch state for iPad
  const [touchState, setTouchState] = useState<{
    initialDistance: number | null;
    initialZoom: number;
    lastTapTime: number;
  }>({
    initialDistance: null,
    initialZoom: 1,
    lastTapTime: 0,
  });

  // UI state
  const [activePanel, setActivePanel] = useState<FloatingPanelType>(null);
  const [selectedTemplatePlayer, setSelectedTemplatePlayer] = useState<string | null>(null);
  const [copiedRoute, setCopiedRoute] = useState<DiagramRoute | null>(null);
  const [touchMode, setTouchMode] = useState<'draw' | 'move'>('draw'); // For iPad: draw routes or move players
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Field reference
  const fieldRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      routes: [...routes],
      offensePlayers: [...offensePlayers],
      defensePlayers: [...defensePlayers],
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newState];
    });
    setHistoryIndex(prev => prev + 1);
  }, [routes, offensePlayers, defensePlayers, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setRoutes(prevState.routes);
      setOffensePlayers(prevState.offensePlayers);
      setDefensePlayers(prevState.defensePlayers);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setRoutes(nextState.routes);
      setOffensePlayers(nextState.offensePlayers);
      setDefensePlayers(nextState.defensePlayers);
      setHistoryIndex(prev => prev + 1);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Initialize history with initial state
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        routes: initialPlayData?.routes || [],
        offensePlayers: initialPlayData?.offensePlayers || INITIAL_OFFENSE,
        defensePlayers: initialPlayData?.defensePlayers || INITIAL_DEFENSE,
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []); // Only run once on mount

  // Detect if touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
  }, []);

  // Auto-switch to move mode in Run mode for touch devices
  useEffect(() => {
    if (isTouchDevice && playMode === 'run') {
      setTouchMode('move');
    } else if (isTouchDevice && playMode === 'pass') {
      setTouchMode('draw');
    }
  }, [playMode, isTouchDevice]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activePanel &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        // Don't close if clicking on the widget buttons
        !(event.target as HTMLElement).closest('button[data-widget-button]')
      ) {
        setActivePanel(null);
      }
    };

    if (activePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePanel]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getFieldCoordinates = (event: React.MouseEvent<SVGSVGElement> | React.MouseEvent<SVGCircleElement> | React.MouseEvent<SVGGElement> | MouseEvent) => {
    const svg = fieldRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    // Convert screen coordinates to SVG coordinates using viewBox
    const x = panOffset.x + ((event.clientX - rect.left) / rect.width) * (100 / zoom);
    const y = panOffset.y + ((event.clientY - rect.top) / rect.height) * (120 / zoom);

    if (snapToGrid) {
      return {
        x: Math.round(x / 2) * 2,
        y: Math.round(y / 2) * 2
      };
    }

    return { x, y };
  };

  const handleDeleteRoute = (playerId: string) => {
    saveToHistory();
    setRoutes(prev => prev.filter(r => r.playerId !== playerId));
  };

  const handleCopyRoute = (playerId: string) => {
    const route = routes.find(r => r.playerId === playerId);
    if (route) {
      setCopiedRoute(route);
    }
  };

  const handlePasteRoute = (playerId: string) => {
    if (!copiedRoute) return;

    const player = offensePlayers.find(p => p.id === playerId);
    if (!player) return;

    saveToHistory();

    // Adjust route points relative to new player position
    const originalPlayer = offensePlayers.find(p => p.id === copiedRoute.playerId);
    if (!originalPlayer) return;

    const offsetX = player.x - originalPlayer.x;
    const offsetY = player.y - originalPlayer.y;

    const adjustedPoints = copiedRoute.points.map(point => ({
      x: point.x + offsetX,
      y: point.y + offsetY
    }));

    const newRoute: DiagramRoute = {
      playerId: playerId,
      points: adjustedPoints,
    };

    setRoutes(prev => {
      const filtered = prev.filter(r => r.playerId !== playerId);
      return [...filtered, newRoute];
    });
  };

  const handlePlayerMouseDown = (event: React.MouseEvent<SVGGElement>, playerId: string, side: 'offense' | 'defense') => {
    event.stopPropagation();
    if (viewOnly) return;

    // Defense always moves (never draws routes)
    if (side === 'defense') {
      setIsDraggingPlayer(true);
      setDraggedPlayerId(playerId);
      setDraggedPlayerSide(side);
      return;
    }

    // On touch devices, use touchMode to determine behavior for offense
    const shouldDrawRoute = isTouchDevice
      ? (playMode === 'pass' && touchMode === 'draw')
      : (playMode === 'pass' && !event.shiftKey);

    const shouldMovePlayer = isTouchDevice
      ? (touchMode === 'move' || playMode === 'run')
      : (event.shiftKey || playMode === 'run');

    if (shouldDrawRoute) {
      // Route drawing mode
      const player = offensePlayers.find(p => p.id === playerId);
      if (!player) return;

      setSelectedPlayer(playerId);
      setIsDrawingRoute(true);
      setCurrentRoutePoints([{ x: player.x, y: player.y }]);
    } else if (shouldMovePlayer) {
      // Drag mode
      setIsDraggingPlayer(true);
      setDraggedPlayerId(playerId);
      setDraggedPlayerSide(side);
    }
  };

  const handleFieldMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    // Only start panning if clicking on field background (not on players)
    if (event.target === event.currentTarget) {
      setIsPanning(true);
      setPanStartPos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleFieldMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const coords = getFieldCoordinates(event);

    if (isPanning) {
      // Panning the field
      const deltaX = (event.clientX - panStartPos.x) * 0.1;
      const deltaY = (event.clientY - panStartPos.y) * 0.1;
      setPanOffset(prev => ({
        x: Math.max(-20, Math.min(20, prev.x - deltaX)),
        y: Math.max(-20, Math.min(20, prev.y - deltaY))
      }));
      setPanStartPos({ x: event.clientX, y: event.clientY });
      return;
    }

    if (!coords) return;

    if (isDrawingRoute && selectedPlayer) {
      // Route drawing
      setCurrentRoutePoints(prev => {
        if (prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          const distance = Math.sqrt(
            Math.pow(coords.x - lastPoint.x, 2) + Math.pow(coords.y - lastPoint.y, 2)
          );

          if (distance < 2) return prev;
        }

        return [...prev, coords];
      });
    } else if (isDraggingPlayer && draggedPlayerId && draggedPlayerSide) {
      // Player dragging
      if (draggedPlayerSide === 'offense') {
        setOffensePlayers(prev =>
          prev.map(p => p.id === draggedPlayerId ? { ...p, x: coords.x, y: coords.y } : p)
        );
      } else {
        setDefensePlayers(prev =>
          prev.map(p => p.id === draggedPlayerId ? { ...p, x: coords.x, y: coords.y } : p)
        );
      }
    }
  };

  const handleFieldMouseUp = () => {
    if (isDrawingRoute && selectedPlayer && currentRoutePoints.length > 1) {
      saveToHistory();

      const newRoute: DiagramRoute = {
        playerId: selectedPlayer,
        points: currentRoutePoints,
      };

      setRoutes(prev => {
        const filtered = prev.filter(r => r.playerId !== selectedPlayer);
        return [...filtered, newRoute];
      });
    }

    if (isDraggingPlayer) {
      saveToHistory();
    }

    setIsDrawingRoute(false);
    setSelectedPlayer(null);
    setCurrentRoutePoints([]);
    setIsDraggingPlayer(false);
    setDraggedPlayerId(null);
    setDraggedPlayerSide(null);
    setIsPanning(false);
  };

  const handleOffensiveFormationChange = (formationName: string) => {
    saveToHistory();
    setOffensiveFormation(formationName);
    const preset = OFFENSIVE_FORMATIONS[formationName];
    if (!preset) return;

    setOffensePlayers(prev =>
      prev.map(player => {
        const newPos = preset[player.id];
        return newPos ? { ...player, x: newPos.x, y: newPos.y } : player;
      })
    );
  };

  const handleDefensiveFormationChange = (formationName: string) => {
    saveToHistory();
    setDefensiveFormation(formationName);
    const preset = DEFENSIVE_FORMATIONS[formationName];
    if (!preset) return;

    setDefensePlayers(prev =>
      prev.map(player => {
        const newPos = preset[player.id];
        return newPos ? { ...player, x: newPos.x, y: newPos.y } : player;
      })
    );
  };

  const handleApplyTemplate = (template: RouteTemplate, playerId: string) => {
    const player = offensePlayers.find(p => p.id === playerId);
    if (!player) return;

    saveToHistory();

    // Convert template relative points to absolute field coordinates
    const absolutePoints = template.points.map(point => ({
      x: player.x + point.x,
      y: player.y + point.y
    }));

    const newRoute: DiagramRoute = {
      playerId: playerId,
      points: absolutePoints,
    };

    setRoutes(prev => {
      const filtered = prev.filter(r => r.playerId !== playerId);
      return [...filtered, newRoute];
    });

    setSelectedTemplatePlayer(null);
  };

  const handleExportPNG = async () => {
    if (!containerRef.current) return;

    try {
      // Dynamically import html-to-image
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(containerRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });

      // Download
      const link = document.createElement('a');
      link.download = `${playName || 'play'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  const handleExportSVG = () => {
    if (!fieldRef.current) return;

    const svgData = new XMLSerializer().serializeToString(fieldRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${playName || 'play'}.svg`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    if (!containerRef.current) return;

    try {
      const htmlToImage = await import('html-to-image');
      const blob = await htmlToImage.toBlob(containerRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        alert('Play diagram copied to clipboard!');
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  const handleSave = () => {
    if (!playName || !formation) {
      alert('Please fill in required fields (Play Name and Formation)');
      return;
    }

    const playData: BuiltPlayData = {
      mode: playMode,
      offensePlayers,
      defensePlayers,
      routes,
      blocking,
      ballCarrierPath,
      metadata: {
        name: playName,
        formation,
        concept,
        playType,
        strength,
        personnel,
      },
    };

    const metadata: PlaybookMetadataInput = {
      team_id: mode === 'coach' ? (orgId || '00000000-0000-0000-0000-000000000000') : undefined,
      file_paths: [],
      formation_name: formation,
      concept_name: concept || '',
      side_of_ball: 'offense',
      content_type: 'single_play',
      level: 'high_school',
      position_relevance: ['all'],
      custom_notes: `Built play: ${playName}. Formation: ${formation}. Concept: ${concept || 'N/A'}`,
      play_type: playType,
      unit: 'O',
    };

    onSave(playData, metadata);
  };

  const togglePanel = (panel: FloatingPanelType) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.shiftKey) {
      // Shift + scroll = zoom centered on cursor
      const svg = fieldRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const mouseRelX = (event.clientX - rect.left) / rect.width;
      const mouseRelY = (event.clientY - rect.top) / rect.height;

      // Point in SVG coordinates that should stay fixed under the cursor
      const svgX = panOffset.x + mouseRelX * (100 / zoom);
      const svgY = panOffset.y + mouseRelY * (120 / zoom);

      // Calculate new zoom
      const zoomDelta = event.deltaY > 0 ? -0.03 : 0.03;
      const newZoom = Math.max(0.5, Math.min(2, zoom + zoomDelta));

      // Calculate new pan offset to keep svgX, svgY at the same screen position
      const newPanX = svgX - mouseRelX * (100 / newZoom);
      const newPanY = svgY - mouseRelY * (120 / newZoom);

      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    } else {
      // Regular scroll = pan vertically
      const panDelta = event.deltaY * 0.05;
      setPanOffset(prev => ({
        ...prev,
        y: Math.max(-20, Math.min(20, prev.y + panDelta))
      }));
    }
  };

  const handleFieldDoubleClick = () => {
    // Reset zoom to 100%
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Touch handlers for iPad support
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touches = event.touches;

    if (touches.length === 2) {
      // Two-finger pinch: initialize pinch zoom
      event.preventDefault();
      const distance = getTouchDistance(touches[0], touches[1]);
      setTouchState(prev => ({
        ...prev,
        initialDistance: distance,
        initialZoom: zoom,
      }));
    } else if (touches.length === 1) {
      // Single finger: check for double-tap or start pan
      const now = Date.now();
      const timeSinceLastTap = now - touchState.lastTapTime;

      if (timeSinceLastTap < 300) {
        // Double-tap detected - reset zoom
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setTouchState(prev => ({ ...prev, lastTapTime: 0 }));
      } else {
        // Start panning
        setIsPanning(true);
        setPanStartPos({ x: touches[0].clientX, y: touches[0].clientY });
        setTouchState(prev => ({ ...prev, lastTapTime: now }));
      }
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touches = event.touches;

    if (touches.length === 2 && touchState.initialDistance) {
      // Pinch zoom
      event.preventDefault();
      const currentDistance = getTouchDistance(touches[0], touches[1]);
      const scale = currentDistance / touchState.initialDistance;
      const newZoom = Math.max(0.5, Math.min(2, touchState.initialZoom * scale));

      // Get center point for zoom
      const svg = fieldRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const center = getTouchCenter(touches[0], touches[1]);
      const mouseRelX = (center.x - rect.left) / rect.width;
      const mouseRelY = (center.y - rect.top) / rect.height;

      // Point in SVG coordinates that should stay fixed
      const svgX = panOffset.x + mouseRelX * (100 / zoom);
      const svgY = panOffset.y + mouseRelY * (120 / zoom);

      // Calculate new pan offset
      const newPanX = svgX - mouseRelX * (100 / newZoom);
      const newPanY = svgY - mouseRelY * (120 / newZoom);

      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    } else if (touches.length === 1 && isPanning) {
      // Single-finger pan
      event.preventDefault();
      const deltaX = (touches[0].clientX - panStartPos.x) * 0.1;
      const deltaY = (touches[0].clientY - panStartPos.y) * 0.1;
      setPanOffset(prev => ({
        x: Math.max(-20, Math.min(20, prev.x - deltaX)),
        y: Math.max(-20, Math.min(20, prev.y - deltaY))
      }));
      setPanStartPos({ x: touches[0].clientX, y: touches[0].clientY });
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 0) {
      // All touches ended
      setIsPanning(false);
      setTouchState(prev => ({
        ...prev,
        initialDistance: null,
      }));
    }
  };

  const handleLineOfScrimmageChange = (newLosValue: number) => {
    // Get the current and new LOS Y positions
    const currentLosY = LOS_OPTIONS.find(opt => opt.value === lineOfScrimmage)?.y || 60;
    const newLosY = LOS_OPTIONS.find(opt => opt.value === newLosValue)?.y || 60;

    // Calculate the delta
    const deltaY = newLosY - currentLosY;

    if (deltaY !== 0) {
      saveToHistory();

      // Update all offensive players
      setOffensePlayers(prev =>
        prev.map(player => ({
          ...player,
          y: player.y + deltaY
        }))
      );

      // Update all defensive players
      setDefensePlayers(prev =>
        prev.map(player => ({
          ...player,
          y: player.y + deltaY
        }))
      );
    }

    // Update the LOS
    setLineOfScrimmage(newLosValue);
  };

  const losY = LOS_OPTIONS.find(opt => opt.value === lineOfScrimmage)?.y || 60;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5m7 7l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <div className="h-6 w-px bg-[#1B1E20]" />
            <h1 className="text-2xl font-bold text-white">{viewOnly ? 'View Play' : 'Play Builder'}</h1>
          </div>
          <div className="flex items-center gap-3">
            {!viewOnly && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  LOS:
                </label>
                <select
                  value={lineOfScrimmage}
                  onChange={(e) => handleLineOfScrimmageChange(Number(e.target.value))}
                  className="rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none"
                >
                  {LOS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {!viewOnly && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-[#00F6E5] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[#3DF3FF] shadow-[0_0_15px_rgba(0,246,229,0.3)]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                </svg>
                Save Play
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Formation Bar */}
      <div className="border-b border-[#1B1E20] bg-[#0A0A0A] px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Offensive Formation
            </label>
            <select
              value={offensiveFormation}
              onChange={(e) => handleOffensiveFormationChange(e.target.value)}
              disabled={viewOnly}
              className="w-full max-w-xs rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
            >
              {Object.keys(OFFENSIVE_FORMATIONS).map(formation => (
                <option key={formation} value={formation}>{formation}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Defensive Formation
            </label>
            <select
              value={defensiveFormation}
              onChange={(e) => handleDefensiveFormationChange(e.target.value)}
              disabled={viewOnly}
              className="w-full max-w-xs rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
            >
              {Object.keys(DEFENSIVE_FORMATIONS).map(formation => (
                <option key={formation} value={formation}>{formation}</option>
              ))}
            </select>
          </div>

          {!viewOnly && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlayMode('pass')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    playMode === 'pass'
                      ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                >
                  Pass
                </button>
                <button
                  onClick={() => setPlayMode('run')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    playMode === 'run'
                      ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                >
                  Run
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Field Area */}
      <main className="flex-1 flex items-center justify-center bg-[#0D1117] p-8 relative overflow-hidden">
        {/* Floating Widget Controls - Right side */}
        <div className="absolute top-8 right-8 z-20 flex flex-col gap-2">
          <button
            onClick={() => togglePanel('info')}
            data-widget-button
            className={`p-3 rounded-lg backdrop-blur-xl border shadow-lg transition ${
              activePanel === 'info'
                ? 'bg-[#00F6E5]/20 border-[#00F6E5] text-[#00F6E5]'
                : 'bg-[#0A0A0A]/95 border-[#00F6E5]/20 text-slate-400 hover:text-[#00F6E5]'
            }`}
            title="Play Information"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </button>

          {playMode === 'pass' && !viewOnly && (
            <>
              <button
                onClick={() => togglePanel('routes')}
                data-widget-button
                className={`p-3 rounded-lg backdrop-blur-xl border shadow-lg transition ${
                  activePanel === 'routes'
                    ? 'bg-[#00F6E5]/20 border-[#00F6E5] text-[#00F6E5]'
                    : 'bg-[#0A0A0A]/95 border-[#00F6E5]/20 text-slate-400 hover:text-[#00F6E5]'
                }`}
                title="Routes"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </button>

              <button
                onClick={() => togglePanel('templates')}
                data-widget-button
                className={`p-3 rounded-lg backdrop-blur-xl border shadow-lg transition ${
                  activePanel === 'templates'
                    ? 'bg-[#00F6E5]/20 border-[#00F6E5] text-[#00F6E5]'
                    : 'bg-[#0A0A0A]/95 border-[#00F6E5]/20 text-slate-400 hover:text-[#00F6E5]'
                }`}
                title="Route Templates"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
            </>
          )}

          {!viewOnly && (
            <button
              onClick={() => togglePanel('controls')}
              data-widget-button
              className={`p-3 rounded-lg backdrop-blur-xl border shadow-lg transition ${
                activePanel === 'controls'
                  ? 'bg-[#00F6E5]/20 border-[#00F6E5] text-[#00F6E5]'
                  : 'bg-[#0A0A0A]/95 border-[#00F6E5]/20 text-slate-400 hover:text-[#00F6E5]'
              }`}
              title="Field Controls"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
              </svg>
            </button>
          )}

          <button
            onClick={() => togglePanel('export')}
            data-widget-button
            className={`p-3 rounded-lg backdrop-blur-xl border shadow-lg transition ${
              activePanel === 'export'
                ? 'bg-[#00F6E5]/20 border-[#00F6E5] text-[#00F6E5]'
                : 'bg-[#0A0A0A]/95 border-[#00F6E5]/20 text-slate-400 hover:text-[#00F6E5]'
            }`}
            title="Export & Share"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5-5m0 0l5 5m-5-5v12"/>
            </svg>
          </button>

          <button
            onClick={() => togglePanel('guide')}
            data-widget-button
            className={`p-3 rounded-lg backdrop-blur-xl border shadow-lg transition ${
              activePanel === 'guide'
                ? 'bg-[#00F6E5]/20 border-[#00F6E5] text-[#00F6E5]'
                : 'bg-[#0A0A0A]/95 border-[#00F6E5]/20 text-slate-400 hover:text-[#00F6E5]'
            }`}
            title="Quick Guide"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4m0-4h.01"/>
            </svg>
          </button>
        </div>

        {/* Floating Panel Content */}
        {activePanel && (
          <div ref={panelRef} className="absolute top-8 right-24 z-10 w-96 max-h-[calc(100vh-200px)] rounded-lg bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#00F6E5]/20 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1B1E20]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#00F6E5]">
                {activePanel === 'info' && 'Play Information'}
                {activePanel === 'routes' && 'Routes'}
                {activePanel === 'templates' && 'Route Templates'}
                {activePanel === 'controls' && 'Field Controls'}
                {activePanel === 'export' && 'Export & Share'}
                {activePanel === 'guide' && 'Quick Guide'}
              </h3>
              <button
                onClick={() => setActivePanel(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Play Info Panel */}
              {activePanel === 'info' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Play Name *
                    </label>
                    <input
                      type="text"
                      value={playName}
                      onChange={(e) => setPlayName(e.target.value)}
                      disabled={viewOnly}
                      className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
                      placeholder="e.g., 'Y-Sail Combo'"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Formation *
                    </label>
                    <input
                      type="text"
                      value={formation}
                      onChange={(e) => setFormation(e.target.value)}
                      disabled={viewOnly}
                      className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
                      placeholder="e.g., 'Trips Right'"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Concept
                    </label>
                    <input
                      type="text"
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      disabled={viewOnly}
                      className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
                      placeholder="e.g., 'Levels Concept'"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Play Type
                    </label>
                    <select
                      value={playType}
                      onChange={(e) => setPlayType(e.target.value as any)}
                      disabled={viewOnly}
                      className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="PASS">Pass</option>
                      <option value="RUN">Run</option>
                      <option value="RPO">RPO</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Strength
                      </label>
                      <select
                        value={strength}
                        onChange={(e) => setStrength(e.target.value as any)}
                        disabled={viewOnly}
                        className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
                      >
                        <option value="Right">Right</option>
                        <option value="Left">Left</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Personnel
                      </label>
                      <input
                        type="text"
                        value={personnel}
                        onChange={(e) => setPersonnel(e.target.value)}
                        disabled={viewOnly}
                        className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
                        placeholder="11"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Routes Panel */}
              {activePanel === 'routes' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 mb-3">Click and drag from a player to draw their route</p>
                  {offensePlayers.filter(p => p.group === 'skill' || p.group === 'backfield').map(player => {
                    const hasRoute = routes.some(r => r.playerId === player.id);
                    const isDrawing = isDrawingRoute && selectedPlayer === player.id;

                    return (
                      <div key={player.id} className="flex items-center gap-2">
                        <div
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
                            isDrawing
                              ? 'bg-[#FFFFFF]/10 text-white ring-1 ring-[#FFFFFF]/30'
                              : hasRoute
                              ? 'bg-[#00F6E5]/10 text-[#00F6E5]'
                              : 'bg-[#1B1E20]/50 text-slate-400'
                          }`}
                        >
                          {player.label} {hasRoute && '✓'}
                        </div>
                        {hasRoute && (
                          <>
                            <button
                              onClick={() => handleCopyRoute(player.id)}
                              className="px-2 py-2 rounded-lg bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition"
                              title="Copy route"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <rect x="9" y="9" width="13" height="13" rx="2"/>
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRoute(player.id)}
                              className="px-2 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition"
                              title="Delete route"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </>
                        )}
                        {!hasRoute && copiedRoute && (
                          <button
                            onClick={() => handlePasteRoute(player.id)}
                            className="px-2 py-2 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/30 transition"
                            title="Paste route"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                              <rect x="8" y="2" width="8" height="4" rx="1"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Route Templates Panel */}
              {activePanel === 'templates' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 mb-3">Select a player, then click a template to apply</p>

                  {/* Player selector */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {offensePlayers.filter(p => p.group === 'skill' || p.group === 'backfield').map(player => (
                      <button
                        key={player.id}
                        onClick={() => setSelectedTemplatePlayer(player.id)}
                        className={`px-2 py-1.5 rounded text-xs font-semibold transition ${
                          selectedTemplatePlayer === player.id
                            ? 'bg-[#00F6E5]/20 text-[#00F6E5] ring-1 ring-[#00F6E5]'
                            : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                        }`}
                      >
                        {player.label}
                      </button>
                    ))}
                  </div>

                  {/* Templates grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {ROUTE_TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        onClick={() => selectedTemplatePlayer && handleApplyTemplate(template, selectedTemplatePlayer)}
                        disabled={!selectedTemplatePlayer}
                        className="p-3 rounded-lg bg-[#1B1E20]/50 hover:bg-[#1B1E20] disabled:opacity-30 disabled:cursor-not-allowed transition text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{template.icon}</span>
                          <span className="text-sm font-semibold text-white">{template.name}</span>
                        </div>
                        <p className="text-xs text-slate-400">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Field Controls Panel */}
              {activePanel === 'controls' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Zoom
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                        className="px-3 py-2 rounded-lg bg-[#1B1E20]/50 text-white hover:bg-[#1B1E20] transition"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="11" cy="11" r="8"/>
                          <path d="M21 21l-4.35-4.35M8 11h6"/>
                        </svg>
                      </button>
                      <span className="text-sm text-white font-mono flex-1 text-center">{(zoom * 100).toFixed(0)}%</span>
                      <button
                        onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                        className="px-3 py-2 rounded-lg bg-[#1B1E20]/50 text-white hover:bg-[#1B1E20] transition"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="11" cy="11" r="8"/>
                          <path d="M21 21l-4.35-4.35M11 8v6m-3-3h6"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">
                      Tip: Hold <strong className="text-white">Shift + scroll</strong> to zoom
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-400">Snap to Grid</label>
                    <button
                      onClick={() => setSnapToGrid(!snapToGrid)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        snapToGrid ? 'bg-[#00F6E5]' : 'bg-[#1B1E20]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          snapToGrid ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    onClick={resetView}
                    className="w-full px-4 py-2 rounded-lg bg-[#1B1E20]/50 text-white hover:bg-[#1B1E20] transition"
                  >
                    Reset View
                  </button>

                  <div className="pt-4 border-t border-[#1B1E20]">
                    <p className="text-xs text-slate-400 mb-2">Quick Tips:</p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• <strong className="text-white">Double-click/tap</strong> field to reset zoom</li>
                      <li>• <strong className="text-white">Pinch</strong> to zoom on iPad</li>
                      {isTouchDevice ? (
                        <li>• Use <strong className="text-white">Touch Mode toggle</strong> (bottom left) to switch between Draw/Move</li>
                      ) : (
                        <>
                          <li>• Hold <strong className="text-white">Shift</strong> + drag to move players</li>
                          <li>• Or use <strong className="text-white">Run mode</strong> for drag-only</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Export Panel */}
              {activePanel === 'export' && (
                <div className="space-y-3">
                  <button
                    onClick={handleExportPNG}
                    className="w-full px-4 py-3 rounded-lg bg-[#1B1E20]/50 hover:bg-[#1B1E20] transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <div>
                        <div className="text-sm font-semibold text-white">Export as PNG</div>
                        <div className="text-xs text-slate-400">High quality image</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportSVG}
                    className="w-full px-4 py-3 rounded-lg bg-[#1B1E20]/50 hover:bg-[#1B1E20] transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div>
                        <div className="text-sm font-semibold text-white">Export as SVG</div>
                        <div className="text-xs text-slate-400">Vector format</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full px-4 py-3 rounded-lg bg-[#1B1E20]/50 hover:bg-[#1B1E20] transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                      </svg>
                      <div>
                        <div className="text-sm font-semibold text-white">Copy to Clipboard</div>
                        <div className="text-xs text-slate-400">Paste into any app</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Guide Panel */}
              {activePanel === 'guide' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#00F6E5] mb-2">Desktop</h4>
                    <ul className="text-sm text-slate-400 space-y-2">
                      <li>• <strong className="text-white">Click & drag</strong> from player to draw route</li>
                      <li>• <strong className="text-white">Shift + drag</strong> player to move position</li>
                      <li>• <strong className="text-white">Shift + scroll</strong> to zoom in/out at cursor</li>
                      <li>• <strong className="text-white">Double-click field</strong> to reset zoom to 100%</li>
                      <li>• <strong className="text-white">Scroll</strong> or <strong className="text-white">drag field</strong> to pan up/down</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#00F6E5] mb-2">iPad/Touch</h4>
                    <ul className="text-sm text-slate-400 space-y-2">
                      <li>• <strong className="text-white">Pinch</strong> to zoom in/out</li>
                      <li>• <strong className="text-white">Double-tap field</strong> to reset zoom to 100%</li>
                      <li>• <strong className="text-white">Drag field</strong> to pan up/down</li>
                      <li>• Use <strong className="text-white">Touch Mode toggle</strong> (bottom left) to switch between:</li>
                      <li className="pl-4">- <strong className="text-white">Draw mode:</strong> Tap & drag from player to draw route</li>
                      <li className="pl-4">- <strong className="text-white">Move mode:</strong> Tap & drag to reposition players</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#00F6E5] mb-2">General</h4>
                    <ul className="text-sm text-slate-400 space-y-2">
                      <li>• Use <strong className="text-white">Route Templates</strong> for quick routes</li>
                      <li>• <strong className="text-white">Copy/paste</strong> routes between players</li>
                      <li>• <strong className="text-white">Undo/redo</strong> buttons in bottom right corner</li>
                      <li>• <strong className="text-white">Click outside panel</strong> to close it</li>
                      <li>• <strong className="text-white">Export</strong> as PNG/SVG or copy to clipboard</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Touch Mode Toggle - Bottom left (iPad only) */}
        {!viewOnly && isTouchDevice && playMode === 'pass' && (
          <div className="absolute bottom-8 left-8 z-20">
            <div className="flex flex-col gap-2 backdrop-blur-xl rounded-lg border border-[#00F6E5]/20 bg-[#0A0A0A]/95 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center px-2">
                Touch Mode
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTouchMode('draw')}
                  className={`px-4 py-3 rounded-lg transition flex flex-col items-center gap-1 ${
                    touchMode === 'draw'
                      ? 'bg-[#00F6E5]/20 text-[#00F6E5] ring-1 ring-[#00F6E5]'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                  title="Draw routes from players"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                    <path d="M2 2l7.586 7.586"/>
                  </svg>
                  <span className="text-xs font-semibold">Draw</span>
                </button>
                <button
                  onClick={() => setTouchMode('move')}
                  className={`px-4 py-3 rounded-lg transition flex flex-col items-center gap-1 ${
                    touchMode === 'move'
                      ? 'bg-[#00F6E5]/20 text-[#00F6E5] ring-1 ring-[#00F6E5]'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                  title="Move player positions"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
                  </svg>
                  <span className="text-xs font-semibold">Move</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Undo/Redo Overlay - Bottom right */}
        {!viewOnly && (
          <div className="absolute bottom-8 right-8 z-20 flex gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-3 rounded-lg backdrop-blur-xl border shadow-lg transition ${
                canUndo
                  ? 'bg-[#0A0A0A]/95 border-[#00F6E5]/20 text-slate-400 hover:text-[#00F6E5] hover:bg-[#00F6E5]/10'
                  : 'bg-[#0A0A0A]/50 border-[#1B1E20] text-slate-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6"/>
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-3 rounded-lg backdrop-blur-xl border shadow-lg transition ${
                canRedo
                  ? 'bg-[#0A0A0A]/95 border-[#00F6E5]/20 text-slate-400 hover:text-[#00F6E5] hover:bg-[#00F6E5]/10'
                  : 'bg-[#0A0A0A]/50 border-[#1B1E20] text-slate-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6"/>
                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
              </svg>
            </button>
          </div>
        )}

        {/* Field Container */}
        <div
          ref={containerRef}
          className="w-full max-w-6xl aspect-[100/120] relative touch-none"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <svg
            ref={fieldRef}
            viewBox={`${panOffset.x} ${panOffset.y} ${100 / zoom} ${120 / zoom}`}
            className="w-full h-full bg-[#2D5016] rounded-lg border border-[#1B1E20] shadow-2xl"
            onMouseDown={handleFieldMouseDown}
            onMouseMove={handleFieldMouseMove}
            onMouseUp={handleFieldMouseUp}
            onMouseLeave={handleFieldMouseUp}
            onDoubleClick={handleFieldDoubleClick}
          >
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="2.5" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,5 L7,2.5 z" fill="#FFFFFF" />
              </marker>
              <marker id="arrowhead-drawing" markerWidth="8" markerHeight="8" refX="6" refY="2.5" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,5 L7,2.5 z" fill="#FFFFFF" />
              </marker>
              <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="#2D5016"/>
                <rect width="2" height="4" fill="#2D5016" opacity="0.9"/>
              </pattern>
            </defs>

            <rect x="0" y="0" width="100" height="120" fill="url(#grass)" />
            <rect x="0" y="0" width="100" height="10" fill="#0D1117" opacity="0.3" />
            <rect x="0" y="110" width="100" height="10" fill="#0D1117" opacity="0.3" />

            {/* Yard lines */}
            {Array.from({ length: 11 }).map((_, i) => {
              const y = 10 + i * 10;
              // Football field style: 0, 10, 20, 30, 40, 50, 40, 30, 20, 10, 0
              const yardNumber = i <= 5 ? i * 10 : (10 - i) * 10;
              return (
                <g key={i}>
                  <line x1="0" y1={y} x2="100" y2={y} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.2"/>
                  <text x="5" y={y - 1} textAnchor="middle" fill="rgba(255, 255, 255, 0.3)" fontSize="3" fontWeight="bold">
                    {yardNumber}
                  </text>
                  <text x="95" y={y - 1} textAnchor="middle" fill="rgba(255, 255, 255, 0.3)" fontSize="3" fontWeight="bold">
                    {yardNumber}
                  </text>
                </g>
              );
            })}

            {/* LOS */}
            <line x1="0" y1={losY} x2="100" y2={losY} stroke="#F5C253" strokeWidth="0.4" strokeDasharray="2,1"/>
            <text x="50" y={losY - 1.5} textAnchor="middle" fill="#F5C253" fontSize="2.5" fontWeight="bold">LOS</text>

            {/* Hash marks */}
            {Array.from({ length: 11 }).map((_, i) => {
              const y = 10 + i * 10;
              return (
                <g key={`hash-${i}`}>
                  <line x1="30" y1={y} x2="30" y2={y + 0.5} stroke="rgba(255,255,255,0.3)" strokeWidth="0.1"/>
                  <line x1="70" y1={y} x2="70" y2={y + 0.5} stroke="rgba(255,255,255,0.3)" strokeWidth="0.1"/>
                </g>
              );
            })}

            {/* Defense players */}
            {defensePlayers.map((player) => (
              <g
                key={player.id}
                onMouseDown={(e) => handlePlayerMouseDown(e, player.id, 'defense')}
                style={{ cursor: !viewOnly ? 'move' : 'default' }}
              >
                <circle cx={player.x} cy={player.y} r="2" fill="#EF4444" stroke="#EF4444" strokeWidth="0.4"/>
                <text x={player.x} y={player.y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="2" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {player.label}
                </text>
              </g>
            ))}

            {/* Offense players */}
            {offensePlayers.map((player) => {
              const isDrawing = isDrawingRoute && selectedPlayer === player.id;
              const hasRoute = routes.some(r => r.playerId === player.id);
              const isDragging = isDraggingPlayer && draggedPlayerId === player.id;

              return (
                <g
                  key={player.id}
                  onMouseDown={(e) => handlePlayerMouseDown(e, player.id, 'offense')}
                  style={{ cursor: playMode === 'pass' && !viewOnly ? 'crosshair' : !viewOnly ? 'move' : 'default' }}
                >
                  {(isDrawing || isDragging) && (
                    <circle cx={player.x} cy={player.y} r="3" fill="#FFFFFF" opacity="0.3"/>
                  )}
                  <circle
                    cx={player.x}
                    cy={player.y}
                    r="2"
                    fill={isDrawing || isDragging ? "#FFFFFF" : hasRoute ? "#3DF3FF" : "#00F6E5"}
                    stroke={isDrawing || isDragging ? "#FFFFFF" : hasRoute ? "#3DF3FF" : "#00F6E5"}
                    strokeWidth="0.4"
                  />
                  <text x={player.x} y={player.y} textAnchor="middle" dominantBaseline="middle" fill="#0A0A0A" fontSize="2" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {player.label}
                  </text>
                </g>
              );
            })}

            {/* Routes */}
            {routes.map((route) => {
              if (route.points.length < 2) return null;
              const pathData = route.points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
              return (
                <path key={route.playerId} d={pathData} stroke="#FFFFFF" strokeWidth="0.4" fill="none" markerEnd="url(#arrowhead)"/>
              );
            })}

            {/* Current drawing */}
            {isDrawingRoute && currentRoutePoints.length > 1 && (
              <path
                d={currentRoutePoints.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')}
                stroke="#FFFFFF"
                strokeWidth="0.5"
                fill="none"
                strokeDasharray="1,0.5"
                markerEnd="url(#arrowhead-drawing)"
              />
            )}
          </svg>
        </div>
      </main>
    </div>
  );
}
