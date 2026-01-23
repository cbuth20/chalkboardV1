"use client";

import React, { useState, useRef } from 'react';
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

interface PlayBuilderProps {
  onSave: (playData: BuiltPlayData, metadata?: PlaybookMetadataInput) => void;
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATION PRESETS
// ═══════════════════════════════════════════════════════════════════════════

type FormationPreset = {
  [key: string]: { x: number; y: number };
};

const OFFENSIVE_FORMATIONS: Record<string, FormationPreset> = {
  'Pro Set': {
    qb: { x: 50, y: 38 },
    rb: { x: 45, y: 41 },
    fb: { x: 50, y: 40 },
    x: { x: 30, y: 28 },
    z: { x: 70, y: 28 },
    y: { x: 59, y: 33 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
  'Shotgun': {
    qb: { x: 50, y: 41 },
    rb: { x: 45, y: 41 },
    fb: { x: 55, y: 41 },
    x: { x: 30, y: 28 },
    z: { x: 70, y: 28 },
    y: { x: 59, y: 33 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
  'I-Formation': {
    qb: { x: 50, y: 38 },
    rb: { x: 50, y: 43 },
    fb: { x: 50, y: 40 },
    x: { x: 30, y: 28 },
    z: { x: 70, y: 28 },
    y: { x: 59, y: 33 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
  'Singleback': {
    qb: { x: 50, y: 38 },
    rb: { x: 50, y: 41 },
    fb: { x: 45, y: 38 },
    x: { x: 30, y: 28 },
    z: { x: 70, y: 28 },
    y: { x: 59, y: 33 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
  'Pistol': {
    qb: { x: 50, y: 39 },
    rb: { x: 50, y: 42 },
    fb: { x: 45, y: 39 },
    x: { x: 30, y: 28 },
    z: { x: 70, y: 28 },
    y: { x: 59, y: 33 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
  'Spread': {
    qb: { x: 50, y: 41 },
    rb: { x: 50, y: 44 },
    fb: { x: 45, y: 41 },
    x: { x: 25, y: 28 },
    z: { x: 75, y: 28 },
    y: { x: 63, y: 30 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
  'Trips Right': {
    qb: { x: 50, y: 41 },
    rb: { x: 45, y: 41 },
    fb: { x: 55, y: 41 },
    x: { x: 30, y: 28 },
    z: { x: 73, y: 28 },
    y: { x: 65, y: 30 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
  'Trips Left': {
    qb: { x: 50, y: 41 },
    rb: { x: 55, y: 41 },
    fb: { x: 45, y: 41 },
    x: { x: 27, y: 28 },
    z: { x: 70, y: 28 },
    y: { x: 35, y: 30 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
  'Empty': {
    qb: { x: 50, y: 41 },
    rb: { x: 38, y: 30 },
    fb: { x: 62, y: 30 },
    x: { x: 25, y: 28 },
    z: { x: 75, y: 28 },
    y: { x: 50, y: 28 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
  'Wing-T': {
    qb: { x: 50, y: 38 },
    rb: { x: 50, y: 41 },
    fb: { x: 50, y: 40 },
    x: { x: 30, y: 28 },
    z: { x: 59, y: 33 },
    y: { x: 41, y: 33 },
    lt: { x: 42, y: 33 },
    lg: { x: 46, y: 33 },
    c: { x: 50, y: 33 },
    rg: { x: 54, y: 33 },
    rt: { x: 58, y: 33 },
  },
};

const DEFENSIVE_FORMATIONS: Record<string, FormationPreset> = {
  '4-3': {
    cb1: { x: 30, y: 24 },
    cb2: { x: 70, y: 24 },
    fs: { x: 50, y: 15 },
    ss: { x: 58, y: 20 },
    mlb: { x: 50, y: 27 },
    wlb: { x: 42, y: 27 },
    slb: { x: 58, y: 27 },
    de1: { x: 40, y: 29 },
    de2: { x: 60, y: 29 },
    dt1: { x: 46, y: 29 },
    dt2: { x: 54, y: 29 },
  },
  '3-4': {
    cb1: { x: 30, y: 24 },
    cb2: { x: 70, y: 24 },
    fs: { x: 50, y: 15 },
    ss: { x: 58, y: 20 },
    mlb: { x: 50, y: 27 },
    wlb: { x: 42, y: 27 },
    slb: { x: 58, y: 27 },
    de1: { x: 44, y: 29 },
    de2: { x: 56, y: 29 },
    dt1: { x: 50, y: 29 },
    dt2: { x: 62, y: 26 }, // OLB positioned wider
  },
  'Nickel (4-2-5)': {
    cb1: { x: 30, y: 24 },
    cb2: { x: 70, y: 24 },
    fs: { x: 50, y: 15 },
    ss: { x: 58, y: 20 },
    mlb: { x: 46, y: 27 },
    wlb: { x: 54, y: 27 },
    slb: { x: 38, y: 26 }, // Nickelback
    de1: { x: 40, y: 29 },
    de2: { x: 60, y: 29 },
    dt1: { x: 46, y: 29 },
    dt2: { x: 54, y: 29 },
  },
  'Dime (4-1-6)': {
    cb1: { x: 28, y: 24 },
    cb2: { x: 72, y: 24 },
    fs: { x: 50, y: 15 },
    ss: { x: 58, y: 20 },
    mlb: { x: 50, y: 27 },
    wlb: { x: 38, y: 24 }, // Extra DB
    slb: { x: 62, y: 24 }, // Extra DB
    de1: { x: 40, y: 29 },
    de2: { x: 60, y: 29 },
    dt1: { x: 46, y: 29 },
    dt2: { x: 54, y: 29 },
  },
  '3-3-5': {
    cb1: { x: 30, y: 24 },
    cb2: { x: 70, y: 24 },
    fs: { x: 50, y: 15 },
    ss: { x: 58, y: 20 },
    mlb: { x: 50, y: 27 },
    wlb: { x: 42, y: 27 },
    slb: { x: 58, y: 27 },
    de1: { x: 44, y: 29 },
    de2: { x: 56, y: 29 },
    dt1: { x: 50, y: 29 },
    dt2: { x: 42, y: 22 }, // Extra safety
  },
  '5-2': {
    cb1: { x: 30, y: 24 },
    cb2: { x: 70, y: 24 },
    fs: { x: 50, y: 15 },
    ss: { x: 58, y: 20 },
    mlb: { x: 46, y: 27 },
    wlb: { x: 54, y: 27 },
    slb: { x: 50, y: 26 },
    de1: { x: 38, y: 29 },
    de2: { x: 62, y: 29 },
    dt1: { x: 44, y: 29 },
    dt2: { x: 56, y: 29 },
  },
  'Cover 2': {
    cb1: { x: 34, y: 26 },
    cb2: { x: 66, y: 26 },
    fs: { x: 42, y: 15 }, // Two-deep safeties
    ss: { x: 58, y: 15 },
    mlb: { x: 50, y: 27 },
    wlb: { x: 42, y: 27 },
    slb: { x: 58, y: 27 },
    de1: { x: 40, y: 29 },
    de2: { x: 60, y: 29 },
    dt1: { x: 46, y: 29 },
    dt2: { x: 54, y: 29 },
  },
  'Cover 3': {
    cb1: { x: 30, y: 18 }, // Deep third
    cb2: { x: 70, y: 18 }, // Deep third
    fs: { x: 50, y: 15 }, // Deep middle third
    ss: { x: 58, y: 24 },
    mlb: { x: 50, y: 27 },
    wlb: { x: 42, y: 27 },
    slb: { x: 58, y: 27 },
    de1: { x: 40, y: 29 },
    de2: { x: 60, y: 29 },
    dt1: { x: 46, y: 29 },
    dt2: { x: 54, y: 29 },
  },
};

const INITIAL_OFFENSE: DiagramPlayer[] = [
  { id: "qb", label: "QB", side: "offense", x: 50, y: 38, group: "backfield" },
  { id: "rb", label: "RB", side: "offense", x: 45, y: 41, group: "backfield" },
  { id: "fb", label: "FB", side: "offense", x: 50, y: 40, group: "backfield" },
  { id: "x", label: "X", side: "offense", x: 30, y: 28, group: "skill" },
  { id: "z", label: "Z", side: "offense", x: 70, y: 28, group: "skill" },
  { id: "y", label: "Y", side: "offense", x: 59, y: 33, group: "skill" },
  { id: "lt", label: "LT", side: "offense", x: 42, y: 33, group: "line" },
  { id: "lg", label: "LG", side: "offense", x: 46, y: 33, group: "line" },
  { id: "c", label: "C", side: "offense", x: 50, y: 33, group: "line" },
  { id: "rg", label: "RG", side: "offense", x: 54, y: 33, group: "line" },
  { id: "rt", label: "RT", side: "offense", x: 58, y: 33, group: "line" },
];

const INITIAL_DEFENSE: DiagramPlayer[] = [
  { id: "cb1", label: "CB", side: "defense", x: 30, y: 24, group: "secondary" },
  { id: "cb2", label: "CB", side: "defense", x: 70, y: 24, group: "secondary" },
  { id: "fs", label: "FS", side: "defense", x: 50, y: 15, group: "secondary" },
  { id: "ss", label: "SS", side: "defense", x: 58, y: 20, group: "secondary" },
  { id: "mlb", label: "MLB", side: "defense", x: 50, y: 27, group: "linebacker" },
  { id: "wlb", label: "WLB", side: "defense", x: 42, y: 27, group: "linebacker" },
  { id: "slb", label: "SLB", side: "defense", x: 58, y: 27, group: "linebacker" },
  { id: "de1", label: "DE", side: "defense", x: 40, y: 29, group: "line" },
  { id: "de2", label: "DE", side: "defense", x: 60, y: 29, group: "line" },
  { id: "dt1", label: "DT", side: "defense", x: 46, y: 29, group: "line" },
  { id: "dt2", label: "DT", side: "defense", x: 54, y: 29, group: "line" },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PlayBuilder({ onSave, onBack }: PlayBuilderProps) {
  // Play state
  const [playMode, setPlayMode] = useState<PlayMode>('pass');
  const [offensePlayers, setOffensePlayers] = useState<DiagramPlayer[]>(INITIAL_OFFENSE);
  const [defensePlayers, setDefensePlayers] = useState<DiagramPlayer[]>(INITIAL_DEFENSE);
  const [routes, setRoutes] = useState<DiagramRoute[]>([]);
  const [blocking, setBlocking] = useState<BlockingAssignment[]>([]);
  const [ballCarrierPath, setBallCarrierPath] = useState<BallCarrierPath | undefined>();

  // Metadata state
  const [playName, setPlayName] = useState('');
  const [formation, setFormation] = useState('');
  const [concept, setConcept] = useState('');
  const [playType, setPlayType] = useState<'PASS' | 'RUN' | 'RPO'>('PASS');
  const [strength, setStrength] = useState<'Right' | 'Left'>('Right');
  const [personnel, setPersonnel] = useState('11');

  // Drawing state
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoutePoints, setCurrentRoutePoints] = useState<{x: number, y: number}[]>([]);
  const [draggingPlayer, setDraggingPlayer] = useState<{
    id: string;
    side: 'offense' | 'defense';
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [clickedPlayer, setClickedPlayer] = useState<{ id: string; side: 'offense' | 'defense' } | null>(null);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const ignoreClickRef = useRef(false);

  // Formation state
  const [offensiveFormation, setOffensiveFormation] = useState('Pro Set');
  const [defensiveFormation, setDefensiveFormation] = useState('4-3');

  // UI state
  const [showQuickGuide, setShowQuickGuide] = useState(true);

  // Field reference
  const fieldRef = useRef<SVGSVGElement>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Convert mouse event to field coordinates
  const getFieldCoordinates = (event: React.MouseEvent<SVGSVGElement> | React.MouseEvent<SVGCircleElement> | React.MouseEvent<SVGGElement> | MouseEvent) => {
    const svg = fieldRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 53.333;

    return { x, y };
  };

  const handleDeleteRoute = (playerId: string) => {
    setRoutes(prev => prev.filter(r => r.playerId !== playerId));
  };

  const clampToField = (coords: { x: number; y: number }) => ({
    x: Math.min(100, Math.max(0, coords.x)),
    y: Math.min(53.333, Math.max(0, coords.y)),
  });

  const handlePlayerMouseDown = (
    event: React.MouseEvent<SVGGElement>,
    player: DiagramPlayer,
    side: 'offense' | 'defense'
  ) => {
    event.stopPropagation();

    const coords = getFieldCoordinates(event);
    if (!coords) return;

    dragMovedRef.current = false;
    dragStartRef.current = coords;

    if (playMode === 'pass' && side === 'offense' && event.shiftKey) {
      // Start drawing route from this player (Shift + drag)
      setSelectedPlayer(player.id);
      setIsDrawingRoute(true);
      setCurrentRoutePoints([{ x: player.x, y: player.y }]);
      return;
    }

    // Start dragging player
    setDraggingPlayer({
      id: player.id,
      side,
      offsetX: coords.x - player.x,
      offsetY: coords.y - player.y,
    });
  };

  const handleFieldMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (draggingPlayer) {
      const coords = getFieldCoordinates(event);
      if (!coords) return;

      if (dragStartRef.current) {
        const distance = Math.hypot(
          coords.x - dragStartRef.current.x,
          coords.y - dragStartRef.current.y
        );
        if (distance > 0.5) {
          dragMovedRef.current = true;
        }
      }

      const next = clampToField({
        x: coords.x - draggingPlayer.offsetX,
        y: coords.y - draggingPlayer.offsetY,
      });

      if (draggingPlayer.side === 'offense') {
        setOffensePlayers(prev =>
          prev.map(player =>
            player.id === draggingPlayer.id ? { ...player, x: next.x, y: next.y } : player
          )
        );
      } else {
        setDefensePlayers(prev =>
          prev.map(player =>
            player.id === draggingPlayer.id ? { ...player, x: next.x, y: next.y } : player
          )
        );
      }

      return;
    }

    if (!isDrawingRoute || !selectedPlayer) return;

    const coords = getFieldCoordinates(event);
    if (!coords) return;

    // Add point to route (sample points every few pixels to avoid too many points)
    setCurrentRoutePoints(prev => {
      // Only add point if it's far enough from the last point
      if (prev.length > 0) {
        const lastPoint = prev[prev.length - 1];
        const distance = Math.sqrt(
          Math.pow(coords.x - lastPoint.x, 2) + Math.pow(coords.y - lastPoint.y, 2)
        );
        // Only add point if distance is greater than 1 unit
        if (distance < 1) return prev;
      }
      return [...prev, coords];
    });
  };

  const handleFieldMouseUp = () => {
    if (draggingPlayer) {
      setDraggingPlayer(null);
      dragStartRef.current = null;
      if (dragMovedRef.current) {
        ignoreClickRef.current = true;
        setTimeout(() => {
          ignoreClickRef.current = false;
        }, 0);
      }
      dragMovedRef.current = false;
      return;
    }

    if (isDrawingRoute && selectedPlayer && currentRoutePoints.length > 1) {
      // Finish the route
      const newRoute: DiagramRoute = {
        playerId: selectedPlayer,
        points: currentRoutePoints,
        color: '#FFFFFF',
        style: 'solid',
      };

      setRoutes(prev => [...prev, newRoute]);
    }

    // Reset drawing state
    setCurrentRoutePoints([]);
    setIsDrawingRoute(false);
    setSelectedPlayer(null);
  };

  const handlePlayerClick = (playerId: string, side: 'offense' | 'defense') => {
    if (ignoreClickRef.current) {
      return;
    }
    setClickedPlayer({ id: playerId, side });
  };

  // ═══ FORMATION HANDLERS ═══

  const handleOffensiveFormationChange = (formationName: string) => {
    setOffensiveFormation(formationName);
    const formationPreset = OFFENSIVE_FORMATIONS[formationName];
    if (!formationPreset) return;

    // Update player positions based on formation
    setOffensePlayers(prev =>
      prev.map(player => {
        const newPos = formationPreset[player.id];
        if (newPos) {
          return { ...player, x: newPos.x, y: newPos.y };
        }
        return player;
      })
    );

    // Auto-populate formation field if it's empty
    if (!formation) {
      setFormation(formationName);
    }

    // Clear routes when formation changes
    setRoutes([]);
    setIsDrawingRoute(false);
    setCurrentRoutePoints([]);
    setSelectedPlayer(null);
  };

  const handleDefensiveFormationChange = (formationName: string) => {
    setDefensiveFormation(formationName);
    const formationPreset = DEFENSIVE_FORMATIONS[formationName];
    if (!formationPreset) return;

    // Update player positions based on formation
    setDefensePlayers(prev =>
      prev.map(player => {
        const newPos = formationPreset[player.id];
        if (newPos) {
          return { ...player, x: newPos.x, y: newPos.y };
        }
        return player;
      })
    );
  };

  const handleSave = () => {
    if (!playName) {
      alert('Please enter a play name');
      return;
    }

    if (!formation) {
      alert('Please enter a formation');
      return;
    }

    const playData: BuiltPlayData = {
      mode: playMode,
      offensePlayers,
      defensePlayers,
      routes: playMode === 'pass' ? routes : undefined,
      blocking: playMode === 'run' ? blocking : undefined,
      ballCarrierPath: playMode === 'run' ? ballCarrierPath : undefined,
      metadata: {
        name: playName,
        formation,
        concept: concept || '',
        playType,
        strength,
        personnel,
      },
    };

    const metadata: PlaybookMetadataInput = {
      team_id: '00000000-0000-0000-0000-000000000000', // TODO: Get from auth
      file_paths: [], // No file paths for built plays
      formation_name: formation,
      concept_name: concept || '',
      side_of_ball: 'offense',
      content_type: 'single_play',
      level: 'high_school',
      position_relevance: ['all'],
      custom_notes: `Built play: ${playName}. Formation: ${formation}. Concept: ${concept || 'N/A'}`,
    };

    onSave(playData, metadata);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl px-6 py-4">
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
            <h1 className="text-2xl font-bold text-white">Play Builder</h1>
          </div>
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
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Formation Dropdowns */}
        <div className="border-b border-[#1B1E20] bg-[#0A0A0A] px-6 py-4">
          <div className="flex items-start gap-4">
            {/* Formation Presets */}
            <div className="flex-1 flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Offensive Formation
                </label>
                <select
                  value={offensiveFormation}
                  onChange={(e) => handleOffensiveFormationChange(e.target.value)}
                  className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
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
                  className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                >
                  {Object.keys(DEFENSIVE_FORMATIONS).map(formation => (
                    <option key={formation} value={formation}>{formation}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Play Metadata */}
          <aside className="w-80 border-r border-[#1B1E20] bg-[#0A0A0A] p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Play Information</h2>

            <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Play Name *
              </label>
              <input
                type="text"
                value={playName}
                onChange={(e) => setPlayName(e.target.value)}
                className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
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
                className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
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
                className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
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
                className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
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
                  className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
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
                  className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                  placeholder="11"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#1B1E20]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlayMode('pass')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    playMode === 'pass'
                      ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                >
                  Pass
                </button>
                <button
                  onClick={() => setPlayMode('run')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    playMode === 'run'
                      ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                >
                  Run
                </button>
              </div>
            </div>

          </div>
        </aside>

        {/* Main Content - Field */}
        <main className="flex-1 flex items-center justify-center bg-[#0D1117] p-8 relative">
          {/* Quick Guide Overlay - Top Left */}
          {showQuickGuide && (
            <div className="absolute top-8 left-8 z-10 p-3 rounded-lg bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#00F6E5]/20 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00F6E5]">Quick Guide</h3>
                <button
                  onClick={() => setShowQuickGuide(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Use <strong className="text-white">Formation dropdowns</strong> to position players</li>
                <li>• <strong className="text-white">Click a player</strong> to select them</li>
                <li>• <strong className="text-white">Drag players</strong> to reposition them</li>
                <li>• <strong className="text-white">Shift + drag</strong> from a player to draw their route</li>
                <li>• <strong className="text-white">Release</strong> to finish the route</li>
              </ul>
            </div>
          )}

          {/* Show Quick Guide Button (when hidden) */}
          {!showQuickGuide && (
            <button
              onClick={() => setShowQuickGuide(true)}
              className="absolute top-8 left-8 z-10 p-2 rounded-lg bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#00F6E5]/20 shadow-lg text-[#00F6E5] hover:bg-[#00F6E5]/10 transition"
              title="Show Quick Guide"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4m0-4h.01"/>
              </svg>
            </button>
          )}

          {/* Draw Routes Overlay - Bottom Left */}
          {playMode === 'pass' && (
            <div className="absolute bottom-8 left-8 z-10 w-72 p-4 rounded-lg bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#FFFFFF]/20 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-2">Routes</h3>
              <p className="text-xs text-slate-400 mb-3">Shift + drag from a player to draw their route</p>

              <div className="space-y-2 max-h-80 overflow-y-auto">
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
                        <button
                          onClick={() => handleDeleteRoute(player.id)}
                          className="px-2 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="w-full max-w-5xl aspect-[100/53.333] relative">
            {/* Simple field rendering - using basic SVG */}
            <svg
              ref={fieldRef}
              viewBox="0 0 100 53.333"
              className="w-full h-full bg-[#0D1117] rounded-lg border border-[#1B1E20]"
              onMouseMove={handleFieldMouseMove}
              onMouseUp={handleFieldMouseUp}
              onMouseLeave={handleFieldMouseUp}
            >
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="2.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,5 L7,2.5 z" fill="#FFFFFF" />
                </marker>
                <marker
                  id="arrowhead-drawing"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="2.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,5 L7,2.5 z" fill="#FFFFFF" />
                </marker>
              </defs>

              {/* Field background */}
              <rect x="0" y="0" width="100" height="53.333" fill="#0D1117" />

              {/* Yard lines */}
              {Array.from({ length: 11 }).map((_, i) => {
                const x = i * 10;
                return (
                  <line
                    key={i}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2="53.333"
                    stroke="rgba(0, 246, 229, 0.1)"
                    strokeWidth="0.1"
                  />
                );
              })}

              {/* LOS */}
              <line
                x1="0"
                y1="32"
                x2="100"
                y2="32"
                stroke="#F5C253"
                strokeWidth="0.2"
                strokeDasharray="1,0.5"
              />

              {/* Defense players */}
              {defensePlayers.map((player) => {
                const isClicked = clickedPlayer?.id === player.id && clickedPlayer?.side === 'defense';
                return (
                <g
                  key={player.id}
                  onMouseDown={(e) => handlePlayerMouseDown(e, player, 'defense')}
                  onClick={() => handlePlayerClick(player.id, 'defense')}
                  style={{ cursor: draggingPlayer?.id === player.id ? 'grabbing' : 'grab' }}
                >
                  <circle
                    cx={player.x}
                    cy={player.y}
                    r="1.5"
                    fill={isClicked ? "#FCA5A5" : "#EF4444"}
                    stroke={isClicked ? "#FCA5A5" : "#EF4444"}
                    strokeWidth="0.3"
                  />
                  {isClicked && (
                    <circle
                      cx={player.x}
                      cy={player.y}
                      r="2.2"
                      fill="none"
                      stroke="#FCA5A5"
                      strokeWidth="0.2"
                      opacity="0.8"
                    />
                  )}
                  <text
                    x={player.x}
                    y={player.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="1.5"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {player.label}
                  </text>
                </g>
              )})}

              {/* Offense players */}
              {offensePlayers.map((player) => {
                const isDrawing = isDrawingRoute && selectedPlayer === player.id;
                const hasRoute = routes.some(r => r.playerId === player.id);
                const isClicked = clickedPlayer?.id === player.id && clickedPlayer?.side === 'offense';

                return (
                  <g
                    key={player.id}
                    onMouseDown={(e) => handlePlayerMouseDown(e, player, 'offense')}
                    onClick={() => handlePlayerClick(player.id, 'offense')}
                    style={{ cursor: draggingPlayer?.id === player.id ? 'grabbing' : 'grab' }}
                  >
                    {/* Glow effect when drawing */}
                    {isDrawing && (
                      <circle
                        cx={player.x}
                        cy={player.y}
                        r="2.5"
                        fill="#FFFFFF"
                        opacity="0.3"
                      />
                    )}

                    <circle
                      cx={player.x}
                      cy={player.y}
                      r="1.5"
                      fill={
                        isDrawing
                          ? "#FFFFFF"
                          : isClicked
                          ? "#7DD3FC"
                          : hasRoute
                          ? "#3DF3FF"
                          : "#00F6E5"
                      }
                      stroke={
                        isDrawing
                          ? "#FFFFFF"
                          : isClicked
                          ? "#7DD3FC"
                          : hasRoute
                          ? "#3DF3FF"
                          : "#00F6E5"
                      }
                      strokeWidth="0.3"
                    />
                    {isClicked && (
                      <circle
                        cx={player.x}
                        cy={player.y}
                        r="2.2"
                        fill="none"
                        stroke="#7DD3FC"
                        strokeWidth="0.2"
                        opacity="0.8"
                      />
                    )}
                    <text
                      x={player.x}
                      y={player.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="black"
                      fontSize="1.5"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {player.label}
                    </text>
                  </g>
                );
              })}

              {/* Routes */}
              {routes.map((route, idx) => {
                if (route.points.length < 2) return null;
                const pathData = `M ${route.points.map(p => `${p.x},${p.y}`).join(' L ')}`;
                return (
                  <path
                    key={idx}
                    d={pathData}
                    stroke={route.color || '#FFFFFF'}
                    strokeWidth="0.35"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}

              {/* Current drawing route */}
              {isDrawingRoute && currentRoutePoints.length > 1 && (
                <path
                  d={`M ${currentRoutePoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
                  stroke="#FFFFFF"
                  strokeWidth="0.35"
                  fill="none"
                  strokeOpacity="0.6"
                  markerEnd="url(#arrowhead-drawing)"
                />
              )}
            </svg>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
