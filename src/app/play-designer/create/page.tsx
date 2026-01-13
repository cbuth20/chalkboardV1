"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useMemo } from "react";
import { RoutePicker } from "@/components/play-designer/RoutePicker";
// import { AssignedRoute, ROUTE_LIBRARY, getDepthForLevel } from "@/types/football";
import { 
  getRoutePoints, 
  routePointsToSvgString, 
  getRouteEndpoint,
  type PlayerRouteAssignment,
  type Level,
  type RouteDirection,
} from "@/components/play-designer/geometry";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Position = { x: number; y: number };
type PlayerSide = "offense" | "defense";
type Tool = "select" | "draw" | "delete";
type ViewFilter = "all" | "offense" | "defense";

// Undo system types
type UndoState = {
  routes: Route[];
  playerRoutes: Record<string, PlayerRouteAssignment>;
};

type Player = {
  id: string;
  label: string;
  side: PlayerSide;
  position: Position;
  color?: string;
};

type RoutePoint = Position & { type?: "start" | "break" | "end" };

type Route = {
  playerId: string;
  points: RoutePoint[];
  routeType: string;
  color: string;
};

type Assignment = {
  position: string;
  description: string;
};

type PlayMeta = {
  name: string;
  formation: string;
  concept: string;
  strength: "Right" | "Left";
  personnel: string;
  tags: string[];
  side: "offense" | "defense" | "special";
};

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const INITIAL_PLAYERS: Player[] = [
  // Offense - Initial formation (Trips Right)
  { id: "qb", label: "QB", side: "offense", position: { x: 400, y: 320 } },
  { id: "rb", label: "RB", side: "offense", position: { x: 400, y: 380 } },
  { id: "x", label: "X", side: "offense", position: { x: 120, y: 260 } },
  { id: "z", label: "Z", side: "offense", position: { x: 580, y: 260 } },
  { id: "y", label: "Y", side: "offense", position: { x: 520, y: 260 } },
  { id: "f", label: "F", side: "offense", position: { x: 620, y: 280 } },
  { id: "lt", label: "LT", side: "offense", position: { x: 300, y: 260 } },
  { id: "lg", label: "LG", side: "offense", position: { x: 340, y: 260 } },
  { id: "c", label: "C", side: "offense", position: { x: 380, y: 260 } },
  { id: "rg", label: "RG", side: "offense", position: { x: 420, y: 260 } },
  { id: "rt", label: "RT", side: "offense", position: { x: 460, y: 260 } },
  // Defense
  { id: "cb1", label: "CB", side: "defense", position: { x: 100, y: 180 } },
  { id: "cb2", label: "CB", side: "defense", position: { x: 620, y: 180 } },
  { id: "fs", label: "FS", side: "defense", position: { x: 400, y: 80 } },
  { id: "ss", label: "SS", side: "defense", position: { x: 500, y: 120 } },
  { id: "mlb", label: "MLB", side: "defense", position: { x: 400, y: 180 } },
  { id: "wlb", label: "WLB", side: "defense", position: { x: 280, y: 180 } },
  { id: "slb", label: "SLB", side: "defense", position: { x: 520, y: 180 } },
  { id: "de1", label: "DE", side: "defense", position: { x: 280, y: 230 } },
  { id: "de2", label: "DE", side: "defense", position: { x: 480, y: 230 } },
  { id: "dt1", label: "DT", side: "defense", position: { x: 340, y: 230 } },
  { id: "dt2", label: "DT", side: "defense", position: { x: 420, y: 230 } },
];

const INITIAL_ROUTES: Route[] = [
  {
    playerId: "x",
    points: [
      { x: 120, y: 260, type: "start" },
      { x: 120, y: 140, type: "break" },
      { x: 200, y: 80, type: "end" },
    ],
    routeType: "CORNER",
    color: "#00F6E5",
  },
  {
    playerId: "z",
    points: [
      { x: 580, y: 260, type: "start" },
      { x: 580, y: 100, type: "end" },
    ],
    routeType: "GO",
    color: "#00F6E5",
  },
  {
    playerId: "y",
    points: [
      { x: 520, y: 260, type: "start" },
      { x: 520, y: 180, type: "break" },
      { x: 400, y: 160, type: "end" },
    ],
    routeType: "DIG",
    color: "#00F6E5",
  },
  {
    playerId: "f",
    points: [
      { x: 620, y: 280, type: "start" },
      { x: 700, y: 280, type: "end" },
    ],
    routeType: "FLAT",
    color: "#00F6E5",
  },
  {
    playerId: "rb",
    points: [
      { x: 400, y: 380, type: "start" },
      { x: 280, y: 340, type: "end" },
    ],
    routeType: "SWING",
    color: "#A855F7",
  },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  { position: "X", description: "Corner route vs Off, post vs Press. Alert back-shoulder if safety rotates." },
  { position: "Z", description: "Go route - attack leverage, stack the CB at 12 yards." },
  { position: "Y", description: "10-yard dig, settle vs zone, find window between LBs." },
  { position: "F", description: "Flat route, immediate release. Hot read vs blitz." },
  { position: "RB", description: "Swing to field, scan protection if pressure shows." },
  { position: "QB", description: "Read FS rotation. 1st: Go, 2nd: Corner, 3rd: Dig, Check: Flat." },
  { position: "OL", description: "Full slide protection left. RG/RT combo on DE stunt." },
];

const ALL_TAGS = [
  "RPO",
  "RED ZONE",
  "3RD & MEDIUM",
  "SHOT PLAY",
  "TWO-MINUTE",
  "GOAL LINE",
  "PLAY ACTION",
  "SCREEN",
  "QUICK GAME",
  "DEEP SHOT",
];

const FORMATIONS = [
  "Trips Right",
  "Trips Left",
  "Bunch Right",
  "Bunch Left",
  "2x2 Open",
  "Empty Spread",
  "I-Formation",
  "Gun Split",
  "Pistol",
  "Singleback",
];

const PERSONNEL_OPTIONS = ["10", "11", "12", "21", "22", "13"];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function PlayDesignerCreatePage() {
  // State
  const [players] = useState<Player[]>(INITIAL_PLAYERS);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RoutePoint[]>([]);
  const [showToast, setShowToast] = useState(false);

  // Route Picker State
  const [isRoutePickerOpen, setIsRoutePickerOpen] = useState(false);
  const [playerRoutes, setPlayerRoutes] = useState<Record<string, PlayerRouteAssignment>>({});
  const [level, setLevel] = useState<Level>('youth');

  // Undo history - stores previous states for undo functionality
  const [undoHistory, setUndoHistory] = useState<UndoState[]>([]);
  const MAX_UNDO_HISTORY = 50; // Limit history size

  // Use refs to always have access to current state values
  const routesRef = useRef(routes);
  const playerRoutesRef = useRef(playerRoutes);
  
  // Keep refs in sync with state
  routesRef.current = routes;
  playerRoutesRef.current = playerRoutes;

  // Helper to save current state to undo history before making changes
  const saveToUndoHistory = useCallback(() => {
    const currentRoutes = routesRef.current;
    const currentPlayerRoutes = playerRoutesRef.current;
    
    setUndoHistory((prev) => {
      const newHistory = [...prev, { routes: currentRoutes, playerRoutes: currentPlayerRoutes }];
      // Keep history within limits
      if (newHistory.length > MAX_UNDO_HISTORY) {
        return newHistory.slice(-MAX_UNDO_HISTORY);
      }
      return newHistory;
    });
  }, []);

  // View Filter State - controls which players are visible
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");

  // Compute visible players based on filter
  const visiblePlayers = players.filter((player) => {
    if (viewFilter === "all") return true;
    return player.side === viewFilter;
  });

  // Get IDs of visible players for filtering routes
  const visiblePlayerIds = new Set(visiblePlayers.map(p => p.id));
  
  // Filter routes to only show routes for visible players
  const visibleRoutes = routes.filter(route => visiblePlayerIds.has(route.playerId));

  const [playMeta, setPlayMeta] = useState<PlayMeta>({
    name: "Zorro Right 3 Jet Smoke",
    formation: "Trips Right",
    concept: "Smash Concept",
    strength: "Right",
    personnel: "11",
    tags: ["SHOT PLAY", "3RD & MEDIUM"],
    side: "offense",
  });

  const handleSave = () => {
    console.log("Play saved", { playMeta, players, routes, playerRoutes });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUndo = useCallback(() => {
    if (undoHistory.length === 0) return;
    
    // Get the last saved state
    const previousState = undoHistory[undoHistory.length - 1];
    
    // Restore state
    setRoutes(previousState.routes);
    setPlayerRoutes(previousState.playerRoutes);
    
    // Remove from history
    setUndoHistory((prev) => prev.slice(0, -1));
  }, [undoHistory]);

  const handleReset = () => {
    // Save current state before reset
    saveToUndoHistory();
    
    setRoutes([]);
    setPlayerRoutes({});
    setSelectedPlayerId(null);
    setIsRoutePickerOpen(false);
  };

  const handleDeleteRoute = () => {
    if (selectedPlayerId) {
      // Save current state before delete
      saveToUndoHistory();
      
      setRoutes(routes.filter((r) => r.playerId !== selectedPlayerId));
      const newPlayerRoutes = { ...playerRoutes };
      delete newPlayerRoutes[selectedPlayerId];
      setPlayerRoutes(newPlayerRoutes);
    }
  };

  const handlePlayerSelect = (id: string | null) => {
    setSelectedPlayerId(id);
    if (id && currentTool === "select") {
      setIsRoutePickerOpen(true);
    } else {
      setIsRoutePickerOpen(false);
    }
  };

  const handleToggleRouteDirection = (playerId: string) => {
    // Save current state before change
    saveToUndoHistory();
    
    setPlayerRoutes((prev) => {
      const current = prev[playerId];
      if (!current) return prev;
      
      // Cycle through: auto -> left -> right -> auto
      const nextDirection: RouteDirection = 
        current.direction === 'auto' ? 'left' :
        current.direction === 'left' ? 'right' : 'auto';
      
      return {
        ...prev,
        [playerId]: {
          ...current,
          direction: nextDirection,
        },
      };
    });
  };

  const handleUpdateRouteDepth = (playerId: string, delta: number) => {
    // Save current state before change
    saveToUndoHistory();
    
    setPlayerRoutes((prev) => {
      const current = prev[playerId];
      if (!current) return prev;
      
      const newDepth = Math.max(-5, current.depth + delta); // Allow negative for screens behind LOS
      
      return {
        ...prev,
        [playerId]: {
          ...current,
          depth: newDepth,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
          <div className="flex items-center gap-3 rounded-lg border border-[#00F6E5]/30 bg-[#00F6E5]/10 px-4 py-3 shadow-lg shadow-[#00F6E5]/10">
            <CheckIcon className="h-5 w-5 text-[#00F6E5]" />
            <span className="text-sm font-semibold text-[#00F6E5]">
              Play saved to Playbook
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <PlayDesignerHeader
        playMeta={playMeta}
        onPlayMetaChange={setPlayMeta}
        onSave={handleSave}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col xl:flex-row gap-4 p-4 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative flex-1 rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#0d1117] to-[#0A0A0A] overflow-hidden">
            {/* Toolbox */}
            <Toolbox
              currentTool={currentTool}
              onToolChange={setCurrentTool}
              onUndo={handleUndo}
              onRedo={() => {}}
              onReset={handleReset}
              onDelete={handleDeleteRoute}
              canDelete={!!selectedPlayerId}
              canUndo={undoHistory.length > 0}
            />

            {/* Level Toggle */}
            <LevelToggle level={level} onLevelChange={setLevel} />

            {/* View Filter Toggle */}
            <ViewFilterToggle viewFilter={viewFilter} onViewFilterChange={setViewFilter} />

            {/* Field Canvas */}
            <PlayFieldCanvas
              players={visiblePlayers}
              routes={visibleRoutes}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={handlePlayerSelect}
              currentTool={currentTool}
              isDrawing={isDrawing}
              setIsDrawing={setIsDrawing}
              currentRoute={currentRoute}
              setCurrentRoute={setCurrentRoute}
              onAddRoute={(route) => {
                saveToUndoHistory();
                setRoutes([...routes, route]);
              }}
              playerRoutes={playerRoutes}
              onUpdateRouteDepth={handleUpdateRouteDepth}
              onToggleRouteDirection={handleToggleRouteDirection}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <PlayDetailsSidebar
          playMeta={playMeta}
          onPlayMetaChange={setPlayMeta}
          assignments={INITIAL_ASSIGNMENTS}
          selectedPlayerId={selectedPlayerId}
        />
      </div>

      {/* Route Picker */}
      {/* <RoutePicker
        isOpen={isRoutePickerOpen && !!selectedPlayerId}
        onClose={() => setIsRoutePickerOpen(false)}
        playerLabel={players.find(p => p.id === selectedPlayerId)?.label}
        onSelect={handleRouteSelect}
        currentRouteId={selectedPlayerId ? playerRoutes[selectedPlayerId]?.routeId : undefined}
        currentDepth={selectedPlayerId ? playerRoutes[selectedPlayerId]?.depth : undefined}
        level={level}
      /> */}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function PlayDesignerHeader({
  playMeta,
  onPlayMetaChange,
  onSave,
}: {
  playMeta: PlayMeta;
  onPlayMetaChange: (meta: PlayMeta) => void;
  onSave: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playMeta.name);

  const handleNameSubmit = () => {
    onPlayMetaChange({ ...playMeta, name: editName });
    setIsEditing(false);
  };

  return (
    <header className="flex-shrink-0 border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl">
      <div className="mx-auto max-w-[1800px] px-4 lg:px-6">
        {/* Top Row: Logo, Breadcrumb, Controls */}
        <div className="flex h-14 items-center justify-between">
          {/* Left: Logo + Back Button + Breadcrumb */}
          <div className="flex items-center gap-4">
            {/* Logo + Back Button Stack */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00F6E5] to-[#00d4c5] shadow-lg shadow-[#00F6E5]/20">
                <LightningIcon className="h-4 w-4 text-[#0A0A0A]" />
              </div>
              
              {/* Neon Back Button */}
              <Link
                href="/playbook"
                className="group flex items-center gap-1.5 rounded-lg border border-[#00F6E5]/30 bg-[#00F6E5]/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#00F6E5] transition-all hover:border-[#00F6E5]/60 hover:bg-[#00F6E5]/10 hover:shadow-[0_0_15px_rgba(0,246,229,0.3)]"
              >
                <BackArrowIcon className="h-3.5 w-3.5" />
                <span>Back</span>
              </Link>
            </div>

            {/* Separator */}
            <div className="hidden md:block h-6 w-px bg-[#1B1E20]" />

            {/* Breadcrumb */}
            <nav className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
              <Link href="/playbook" className="text-slate-500 hover:text-[#00F6E5] transition-colors">
                Playbook
              </Link>
              <ChevronRightIcon className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-[#00F6E5]">Create Play</span>
            </nav>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Side Dropdown */}
            <select
              value={playMeta.side}
              onChange={(e) =>
                onPlayMetaChange({
                  ...playMeta,
                  side: e.target.value as PlayMeta["side"],
                })
              }
              className="hidden sm:block h-9 rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 text-xs font-semibold uppercase tracking-wide text-slate-300 outline-none transition-colors hover:border-slate-600 focus:border-[#00F6E5]"
            >
              <option value="offense">Offense</option>
              <option value="defense">Defense</option>
              <option value="special">Special Teams</option>
            </select>

            {/* Cancel Button */}
            <button className="hidden sm:flex h-9 items-center gap-2 rounded-lg border border-[#1B1E20] px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 transition-all hover:border-slate-600 hover:text-white">
              Cancel
            </button>

            {/* Save Button */}
            <button
              onClick={onSave}
              className="flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-[#00F6E5] to-[#00d4c5] px-4 text-xs font-bold uppercase tracking-wide text-[#0A0A0A] shadow-lg shadow-[#00F6E5]/25 transition-all hover:shadow-[#00F6E5]/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <SaveIcon className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Play Name (centered, prominent) */}
        <div className="flex items-center justify-center py-3 border-t border-[#1B1E20]/50">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              autoFocus
              className="w-full max-w-lg rounded-lg border border-[#00F6E5]/40 bg-[#1B1E20] px-5 py-2.5 text-center text-xl font-bold tracking-wide text-white outline-none focus:border-[#00F6E5] focus:ring-1 focus:ring-[#00F6E5]"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="group flex items-center gap-3 rounded-xl px-5 py-2 transition-all hover:bg-[#1B1E20]/50"
            >
              <span className="text-xl md:text-2xl font-bold tracking-wide text-white">
                {playMeta.name}
              </span>
              <EditIcon className="h-4 w-4 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOLBOX COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function Toolbox({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  onReset,
  onDelete,
  canDelete,
  canUndo,
}: {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onDelete: () => void;
  canDelete: boolean;
  canUndo: boolean;
}) {
  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "select", icon: <CursorIcon className="h-4 w-4" />, label: "Select" },
    { id: "draw", icon: <PenIcon className="h-4 w-4" />, label: "Draw Route" },
    { id: "delete", icon: <TrashIcon className="h-4 w-4" />, label: "Delete" },
  ];

  return (
    <div className="absolute left-4 top-4 z-20 flex items-center gap-1 rounded-xl border border-[#1B1E20] bg-[#0A0A0A]/90 p-1.5 backdrop-blur-sm">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          title={tool.label}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            currentTool === tool.id
              ? "bg-[#00F6E5]/20 text-[#00F6E5] shadow-[inset_0_0_0_1px_rgba(0,246,229,0.3)]"
              : "text-slate-400 hover:bg-[#1B1E20] hover:text-white"
          }`}
        >
          {tool.icon}
        </button>
      ))}

      <div className="mx-1 h-6 w-px bg-[#1B1E20]" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        title={canUndo ? "Undo last action" : "Nothing to undo"}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          canUndo 
            ? "text-slate-400 hover:bg-[#1B1E20] hover:text-white" 
            : "text-slate-600 cursor-not-allowed opacity-50"
        }`}
      >
        <UndoIcon className="h-4 w-4" />
      </button>

      <button
        onClick={onRedo}
        title="Redo"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#1B1E20] hover:text-white"
      >
        <RedoIcon className="h-4 w-4" />
      </button>

      <div className="mx-1 h-6 w-px bg-[#1B1E20]" />

      <button
        onClick={onReset}
        title="Reset Play"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#1B1E20] hover:text-[#FF6A3D]"
      >
        <ResetIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function LevelToggle({
  level,
  onLevelChange,
}: {
  level: Level;
  onLevelChange: (level: Level) => void;
}) {
  return (
    <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-xl border border-[#1B1E20] bg-[#0A0A0A]/90 p-1.5 backdrop-blur-sm">
      <button
        onClick={() => onLevelChange('youth')}
        title="Youth depths (12-18 y/o)"
        className={`flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold uppercase tracking-wide transition-all ${
          level === 'youth'
            ? "bg-[#00F6E5]/20 text-[#00F6E5] shadow-[inset_0_0_0_1px_rgba(0,246,229,0.3)]"
            : "text-slate-400 hover:bg-[#1B1E20] hover:text-white"
        }`}
      >
        Youth
      </button>
      <button
        onClick={() => onLevelChange('nfl')}
        title="NFL depths (Pro landmarks)"
        className={`flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold uppercase tracking-wide transition-all ${
          level === 'nfl'
            ? "bg-[#00F6E5]/20 text-[#00F6E5] shadow-[inset_0_0_0_1px_rgba(0,246,229,0.3)]"
            : "text-slate-400 hover:bg-[#1B1E20] hover:text-white"
        }`}
      >
        NFL
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW FILTER TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ViewFilterToggle({
  viewFilter,
  onViewFilterChange,
}: {
  viewFilter: ViewFilter;
  onViewFilterChange: (filter: ViewFilter) => void;
}) {
  const filters: { id: ViewFilter; label: string; icon: React.ReactNode }[] = [
    { 
      id: 'all', 
      label: 'All',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    { 
      id: 'offense', 
      label: 'OFF',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
    { 
      id: 'defense', 
      label: 'DEF',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="absolute right-4 top-16 z-20 flex flex-col items-center gap-1 rounded-xl border border-[#1B1E20] bg-[#0A0A0A]/90 p-1.5 backdrop-blur-sm">
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-0.5">View</span>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onViewFilterChange(filter.id)}
          title={`Show ${filter.id === 'all' ? 'all players' : filter.id + ' only'}`}
          className={`flex h-8 w-full items-center justify-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold uppercase tracking-wide transition-all ${
            viewFilter === filter.id
              ? filter.id === 'offense'
                ? "bg-[#00F6E5]/20 text-[#00F6E5] shadow-[inset_0_0_0_1px_rgba(0,246,229,0.3)]"
                : filter.id === 'defense'
                ? "bg-[#FF6A3D]/20 text-[#FF6A3D] shadow-[inset_0_0_0_1px_rgba(255,106,61,0.3)]"
                : "bg-purple-500/20 text-purple-400 shadow-[inset_0_0_0_1px_rgba(168,85,247,0.3)]"
              : "text-slate-400 hover:bg-[#1B1E20] hover:text-white"
          }`}
        >
          {filter.icon}
          <span>{filter.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAY FIELD CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function PlayFieldCanvas({
  players,
  routes,
  selectedPlayerId,
  onSelectPlayer,
  currentTool,
  isDrawing,
  setIsDrawing,
  currentRoute,
  setCurrentRoute,
  onAddRoute,
  playerRoutes,
  onUpdateRouteDepth,
  onToggleRouteDirection,
}: {
  players: Player[];
  routes: Route[];
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
  currentTool: Tool;
  isDrawing: boolean;
  setIsDrawing: (v: boolean) => void;
  currentRoute: RoutePoint[];
  setCurrentRoute: (r: RoutePoint[]) => void;
  onAddRoute: (route: Route) => void;
  playerRoutes: Record<string, PlayerRouteAssignment>;
  onUpdateRouteDepth: (playerId: string, delta: number) => void;
  onToggleRouteDirection: (playerId: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const getMousePosition = useCallback(
    (e: React.MouseEvent): Position | null => {
      if (!svgRef.current) return null;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = 800 / rect.width;
      const scaleY = 450 / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (currentTool !== "draw" || !selectedPlayerId) return;

    const pos = getMousePosition(e);
    if (!pos) return;

    if (!isDrawing) {
      const player = players.find((p) => p.id === selectedPlayerId);
      if (player) {
        setCurrentRoute([{ ...player.position, type: "start" }]);
        setIsDrawing(true);
      }
    } else {
      // Add point to route
      const newRoute = [...currentRoute, { ...pos, type: "break" as const }];
      setCurrentRoute(newRoute);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isDrawing || !selectedPlayerId) return;

    const pos = getMousePosition(e);
    if (!pos) return;

    // Complete the route
    const finalRoute = [...currentRoute, { ...pos, type: "end" as const }];
    const routeTypes = ["GO", "SLANT", "OUT", "DIG", "CORNER", "POST", "FLAT", "CROSS"];
    const randomType = routeTypes[Math.floor(Math.random() * routeTypes.length)];

    onAddRoute({
      playerId: selectedPlayerId,
      points: finalRoute,
      routeType: randomType,
      color: players.find((p) => p.id === selectedPlayerId)?.side === "offense" ? "#00F6E5" : "#FF6A3D",
    });

    setCurrentRoute([]);
    setIsDrawing(false);
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 800 450"
      className="w-full h-full cursor-crosshair"
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Field Background */}
      <defs>
        <pattern id="fieldGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,246,229,0.05)" strokeWidth="0.5" />
        </pattern>
        <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0d1117" />
          <stop offset="50%" stopColor="#0f1419" />
          <stop offset="100%" stopColor="#0d1117" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="800" height="450" fill="url(#fieldGradient)" />
      <rect x="0" y="0" width="800" height="450" fill="url(#fieldGrid)" />

      {/* Yard Lines */}
      {[...Array(9)].map((_, i) => (
        <g key={i}>
          <line
            x1={80 + i * 80}
            y1="20"
            x2={80 + i * 80}
            y2="430"
            stroke="rgba(0,246,229,0.08)"
            strokeWidth="1"
          />
          <text
            x={80 + i * 80}
            y="440"
            fill="rgba(100,116,139,0.4)"
            fontSize="10"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {10 + i * 10}
          </text>
        </g>
      ))}

      {/* Hash Marks */}
      {[...Array(17)].map((_, i) => (
        <g key={i}>
          <line
            x1={40 + i * 45}
            y1="160"
            x2={40 + i * 45}
            y2="165"
            stroke="rgba(0,246,229,0.1)"
            strokeWidth="2"
          />
          <line
            x1={40 + i * 45}
            y1="285"
            x2={40 + i * 45}
            y2="290"
            stroke="rgba(0,246,229,0.1)"
            strokeWidth="2"
          />
        </g>
      ))}

      {/* Line of Scrimmage */}
      <line
        x1="0"
        y1="260"
        x2="800"
        y2="260"
        stroke="#F5C253"
        strokeWidth="2"
        strokeDasharray="8 4"
        opacity="0.6"
      />

      {/* End Zones (faint) */}
      <rect x="0" y="0" width="40" height="450" fill="rgba(0,246,229,0.03)" />
      <rect x="760" y="0" width="40" height="450" fill="rgba(0,246,229,0.03)" />

      {/* Manually Drawn Routes */}
      {routes.map((route, idx) => (
        <RouteOverlay key={idx} route={route} />
      ))}

      {/* Assigned Routes from Route Picker - rendered as polylines */}
      {players.map((player) => {
        const assignment = playerRoutes[player.id];
        if (!assignment) return null;
        
        const routePoints = getRoutePoints(assignment, player.position);
        const pointsString = routePointsToSvgString(routePoints);
        const endpoint = getRouteEndpoint(routePoints);
        // const routeDef = ROUTE_LIBRARY.find(r => r.id === assignment.routeId);
        const routeDef = {label: 'n', id: 1};
        const isOffense = player.side === "offense";
        const routeColor = isOffense ? "#00F6E5" : "#FF6A3D";
        
        return (
          <g key={`assigned-${player.id}`} className="pointer-events-none">
            {/* Route polyline */}
            <polyline
              points={pointsString}
              fill="none"
              stroke={routeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              opacity="0.9"
            />
            {/* Route endpoint marker */}
            <circle
              cx={endpoint.x}
              cy={endpoint.y}
              r="4"
              fill={routeColor}
            />
            {/* Arrowhead at end */}
            {routePoints.length >= 2 && (
              <RouteArrowhead
                points={routePoints}
                color={routeColor}
              />
            )}
            {/* Route label at endpoint */}
            <g transform={`translate(${endpoint.x + 8}, ${endpoint.y - 8})`}>
              <rect
                x="-4"
                y="-8"
                width={(routeDef?.label.length ?? 4) * 6 + 12}
                height="16"
                rx="4"
                fill="#0A0A0A"
                stroke={routeColor}
                strokeWidth="1"
                opacity="0.9"
              />
              <text
                x={((routeDef?.label.length ?? 4) * 6) / 2}
                y="0"
                dy="0.35em"
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                fill={routeColor}
                fontFamily="system-ui"
              >
                {routeDef?.label ?? assignment.routeId}
              </text>
            </g>
          </g>
        );
      })}

      {/* Current Drawing Route */}
      {isDrawing && currentRoute.length > 0 && (
        <polyline
          points={currentRoute.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#00F6E5"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.7"
        />
      )}

      {/* Players */}
      {players.map((player) => (
        <PlayerToken
          key={player.id}
          player={player}
          isSelected={selectedPlayerId === player.id}
          onClick={() => onSelectPlayer(player.id)}
          assignedRoute={playerRoutes[player.id]}
          onUpdateDepth={(delta) => onUpdateRouteDepth(player.id, delta)}
          onToggleDirection={() => onToggleRouteDirection(player.id)}
        />
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER TOKEN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function PlayerToken({
  player,
  isSelected,
  onClick,
  assignedRoute,
  onUpdateDepth,
  onToggleDirection,
}: {
  player: Player;
  isSelected: boolean;
  onClick: () => void;
  assignedRoute?: PlayerRouteAssignment;
  onUpdateDepth: (delta: number) => void;
  onToggleDirection: () => void;
}) {
  const isOffense = player.side === "offense";
  const baseColor = isOffense ? "#00F6E5" : "#64748b";
  const fillColor = isOffense ? "rgba(0,246,229,0.15)" : "rgba(100,116,139,0.15)";

  const getRouteLabel = () => {
    if (!assignedRoute) return null;
    // const routeDef = ROUTE_LIBRARY.find(r => r.id === assignedRoute.routeId);
    const routeDef = {label: 'n', id: 1};
    if (!routeDef) return null;
    
    // Use the depth from the assignment (already includes custom depth)
    // Add direction indicator if not auto
    const dirIndicator = assignedRoute.direction === 'left' ? ' ←' : 
                         assignedRoute.direction === 'right' ? ' →' : '';
    return `${routeDef.label} – ${assignedRoute.depth} yds${dirIndicator}`;
  };

  const routeLabel = getRouteLabel();

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
      style={{ transition: "transform 0.15s ease" }}
    >
      {/* Selection Glow */}
      {isSelected && (
        <circle
          cx={player.position.x}
          cy={player.position.y}
          r="22"
          fill="none"
          stroke={baseColor}
          strokeWidth="2"
          opacity="0.5"
          filter="url(#glow)"
        >
          <animate
            attributeName="r"
            values="20;24;20"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.3;0.5"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Token Circle */}
      <circle
        cx={player.position.x}
        cy={player.position.y}
        r="16"
        fill={fillColor}
        stroke={baseColor}
        strokeWidth={isSelected ? "2.5" : "1.5"}
        className="transition-all duration-150"
      />

      {/* Position Label */}
      <text
        x={player.position.x}
        y={player.position.y}
        dy="0.35em"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fontFamily="system-ui"
        fill={baseColor}
        className="select-none pointer-events-none"
      >
        {player.label}
      </text>

      {/* Assigned Route Label & Controls */}
      {routeLabel && (
        <g transform={`translate(${player.position.x}, ${player.position.y + 28})`}>
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fontFamily="system-ui"
            fill={baseColor}
            className="select-none pointer-events-none opacity-90"
          >
            {routeLabel}
          </text>
          
          {/* Controls - Only visible when selected */}
          {isSelected && (
            <g transform="translate(0, 12)" opacity="0.9">
              {/* Minus Button (depth) */}
              <g 
                onClick={(e) => { e.stopPropagation(); onUpdateDepth(-1); }} 
                className="cursor-pointer hover:opacity-70"
              >
                <rect x="-28" y="-6" width="12" height="12" rx="2" fill="#1B1E20" stroke={baseColor} strokeWidth="0.5" />
                <line x1="-25" y1="0" x2="-19" y2="0" stroke={baseColor} strokeWidth="1.5" />
              </g>
              
              {/* Plus Button (depth) */}
              <g 
                onClick={(e) => { e.stopPropagation(); onUpdateDepth(1); }} 
                className="cursor-pointer hover:opacity-70"
              >
                <rect x="-14" y="-6" width="12" height="12" rx="2" fill="#1B1E20" stroke={baseColor} strokeWidth="0.5" />
                <line x1="-11" y1="0" x2="-5" y2="0" stroke={baseColor} strokeWidth="1.5" />
                <line x1="-8" y1="-3" x2="-8" y2="3" stroke={baseColor} strokeWidth="1.5" />
              </g>

              {/* Direction Toggle Button */}
              <g 
                onClick={(e) => { e.stopPropagation(); onToggleDirection(); }} 
                className="cursor-pointer hover:opacity-70"
              >
                <title>Toggle route direction (Left/Right/Auto)</title>
                <rect x="2" y="-6" width="24" height="12" rx="2" fill="#1B1E20" stroke={assignedRoute?.direction !== 'auto' ? '#A855F7' : baseColor} strokeWidth="0.5" />
                {/* Left arrow */}
                <path 
                  d="M7 0 L10 -2 L10 2 Z" 
                  fill={assignedRoute?.direction === 'left' ? '#A855F7' : '#64748b'} 
                />
                {/* Right arrow */}
                <path 
                  d="M21 0 L18 -2 L18 2 Z" 
                  fill={assignedRoute?.direction === 'right' ? '#A855F7' : '#64748b'} 
                />
                {/* Auto indicator (center dot) */}
                {assignedRoute?.direction === 'auto' && (
                  <circle cx="14" cy="0" r="1.5" fill={baseColor} />
                )}
              </g>
            </g>
          )}
        </g>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function RouteOverlay({ route }: { route: Route }) {
  const points = route.points.map((p) => `${p.x},${p.y}`).join(" ");
  const lastPoint = route.points[route.points.length - 1];

  return (
    <g className="pointer-events-none">
      {/* Route Line */}
      <polyline
        points={points}
        fill="none"
        stroke={route.color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Arrow at end */}
      {route.points.length >= 2 && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="4"
          fill={route.color}
        />
      )}

      {/* Route Tag */}
      <g transform={`translate(${lastPoint.x + 8}, ${lastPoint.y - 8})`}>
        <rect
          x="-4"
          y="-8"
          width={route.routeType.length * 7 + 8}
          height="16"
          rx="4"
          fill="#0A0A0A"
          stroke={route.color}
          strokeWidth="1"
          opacity="0.9"
        />
        <text
          x={(route.routeType.length * 7) / 2}
          y="0"
          dy="0.35em"
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill={route.color}
          fontFamily="system-ui"
        >
          {route.routeType}
        </text>
      </g>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE ARROWHEAD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function RouteArrowhead({ 
  points, 
  color 
}: { 
  points: { x: number; y: number }[];
  color: string;
}) {
  if (points.length < 2) return null;
  
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  
  // Calculate angle from previous point to last point
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
  
  // Arrowhead dimensions
  const arrowLength = 10;
  const arrowWidth = 6;
  
  // Calculate arrowhead points
  const tipX = last.x;
  const tipY = last.y;
  const leftX = tipX - arrowLength * Math.cos(angle - Math.PI / 6);
  const leftY = tipY - arrowLength * Math.sin(angle - Math.PI / 6);
  const rightX = tipX - arrowLength * Math.cos(angle + Math.PI / 6);
  const rightY = tipY - arrowLength * Math.sin(angle + Math.PI / 6);
  
  return (
    <polygon
      points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
      fill={color}
      opacity="0.9"
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAY DETAILS SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function PlayDetailsSidebar({
  playMeta,
  onPlayMetaChange,
  assignments,
  selectedPlayerId,
}: {
  playMeta: PlayMeta;
  onPlayMetaChange: (meta: PlayMeta) => void;
  assignments: Assignment[];
  selectedPlayerId: string | null;
}) {
  return (
    <aside className="w-full xl:w-96 flex-shrink-0 overflow-y-auto">
      <div className="space-y-4">
        {/* Play Info Card */}
        <div className="rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/50 to-transparent p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            Play Info
          </h3>

          <div className="space-y-4">
            {/* Formation */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Formation
              </label>
              <select
                value={playMeta.formation}
                onChange={(e) =>
                  onPlayMetaChange({ ...playMeta, formation: e.target.value })
                }
                className="w-full rounded-lg border border-[#1B1E20] bg-[#0A0A0A] px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[#00F6E5]"
              >
                {FORMATIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Concept */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Concept Name
              </label>
              <input
                type="text"
                value={playMeta.concept}
                onChange={(e) =>
                  onPlayMetaChange({ ...playMeta, concept: e.target.value })
                }
                className="w-full rounded-lg border border-[#1B1E20] bg-[#0A0A0A] px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[#00F6E5]"
                placeholder="e.g., Mesh, Smash, 4 Verts"
              />
            </div>

            {/* Strength + Personnel Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                  Strength
                </label>
                <select
                  value={playMeta.strength}
                  onChange={(e) =>
                    onPlayMetaChange({
                      ...playMeta,
                      strength: e.target.value as "Right" | "Left",
                    })
                  }
                  className="w-full rounded-lg border border-[#1B1E20] bg-[#0A0A0A] px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[#00F6E5]"
                >
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                  Personnel
                </label>
                <select
                  value={playMeta.personnel}
                  onChange={(e) =>
                    onPlayMetaChange({ ...playMeta, personnel: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#1B1E20] bg-[#0A0A0A] px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[#00F6E5]"
                >
                  {PERSONNEL_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Card */}
        <div className="rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/50 to-transparent p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            Tags & Situations
          </h3>
          <TagChips
            allTags={ALL_TAGS}
            selectedTags={playMeta.tags}
            onToggle={(tag) => {
              const newTags = playMeta.tags.includes(tag)
                ? playMeta.tags.filter((t) => t !== tag)
                : [...playMeta.tags, tag];
              onPlayMetaChange({ ...playMeta, tags: newTags });
            }}
          />
        </div>

        {/* Assignments Card */}
        <div className="rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/50 to-transparent p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            Assignments Summary
          </h3>
          <AssignmentsList
            assignments={assignments}
            selectedPlayerId={selectedPlayerId}
          />
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAG CHIPS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function TagChips({
  allTags,
  selectedTags,
  onToggle,
}: {
  allTags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              isSelected
                ? "bg-[#00F6E5]/20 text-[#00F6E5] shadow-[0_0_12px_rgba(0,246,229,0.25),inset_0_0_0_1px_rgba(0,246,229,0.4)]"
                : "bg-[#1B1E20] text-slate-500 hover:bg-[#1B1E20]/80 hover:text-slate-300"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGNMENTS LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function AssignmentsList({
  assignments,
  selectedPlayerId,
}: {
  assignments: Assignment[];
  selectedPlayerId: string | null;
}) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
      {assignments.map((assignment, idx) => {
        const isHighlighted =
          selectedPlayerId?.toUpperCase() === assignment.position.toLowerCase() ||
          selectedPlayerId?.toUpperCase() === assignment.position;

        return (
          <div
            key={idx}
            className={`rounded-lg border p-3 transition-all duration-200 ${
              isHighlighted
                ? "border-[#00F6E5]/40 bg-[#00F6E5]/5"
                : "border-[#1B1E20] bg-[#0A0A0A]/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isHighlighted
                    ? "bg-[#00F6E5]/20 text-[#00F6E5]"
                    : "bg-[#1B1E20] text-slate-400"
                }`}
              >
                {assignment.position}
              </span>
              <p className="text-xs leading-relaxed text-slate-400">
                {assignment.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function BackArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function UndoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

