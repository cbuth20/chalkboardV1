// ═══════════════════════════════════════════════════════════════════════════
// FILM ROOM — Type Definitions
// Chalkboard Football Intelligence Platform
// ═══════════════════════════════════════════════════════════════════════════

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLIP TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FilmClip {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number; // seconds
  createdAt: Date;
  updatedAt: Date;
  
  // Metadata
  teamId?: string;
  playerId?: string;
  opponent?: string;
  gameDate?: Date;
  quarter?: 1 | 2 | 3 | 4;
  
  // Tags
  tags: ClipTag[];
  aiAnalysis?: AIAnalysis;
  
  // Telestrator
  drawings?: TelestratorDrawing[];
  
  // Playbook Link
  linkedPlayId?: string;
  linkedPlayName?: string;
  
  // Study Tracking
  viewCount: number;
  lastViewedAt?: Date;
  isStudied: boolean;
}

export interface ClipTag {
  id: string;
  category: TagCategory;
  value: string;
  confidence?: number; // AI confidence 0-1
  isAIGenerated: boolean;
  timestamp?: number; // optional time in clip
}

export type TagCategory =
  | 'formation'
  | 'personnel'
  | 'playName'
  | 'motion'
  | 'playType'
  | 'front'
  | 'coverage'
  | 'routeConcept'
  | 'assignment'
  | 'downDistance'
  | 'hash'
  | 'result';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI ANALYSIS TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AIAnalysis {
  id: string;
  clipId: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'complete' | 'error';
  
  // Detected Elements
  offenseFormation?: DetectedElement;
  defensiveFront?: DetectedElement;
  coverageShell?: DetectedElement;
  concept?: DetectedElement;
  routes?: DetectedRoute[];
  personnel?: DetectedElement;
  motion?: DetectedElement;
  
  // Play Matching
  suggestedPlay?: SuggestedPlay;
  
  // Coaching Insights
  coachingNotes: string[];
  keyReads: string[];
  assignmentBreakdown?: AssignmentBreakdown[];
}

export interface DetectedElement {
  value: string;
  confidence: number;
  alternates?: { value: string; confidence: number }[];
}

export interface DetectedRoute {
  player: string; // e.g., "X", "Z", "H"
  routeName: string;
  depth?: number;
  breakPoint?: string;
  confidence: number;
}

export interface SuggestedPlay {
  playId: string;
  playName: string;
  matchScore: number;
  explanation: string;
}

export interface AssignmentBreakdown {
  position: string;
  assignment: string;
  key: string;
  coaching: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TELESTRATOR TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TelestratorDrawing {
  id: string;
  clipId: string;
  timestamp: number; // time in clip when drawing appears
  duration?: number; // how long drawing is visible
  elements: DrawingElement[];
  createdAt: Date;
  createdBy?: string;
}

export type DrawingTool =
  | 'pen'
  | 'arrow'
  | 'line'
  | 'circle'
  | 'rectangle'
  | 'route'
  | 'playerSpot'
  | 'text'
  | 'eraser';

export interface DrawingElement {
  id: string;
  type: DrawingTool;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  animation?: 'none' | 'draw' | 'pulse' | 'flash';
  
  // For player spots
  playerLabel?: string;
  
  // For routes
  routeType?: 'solid' | 'dashed' | 'arrow';
}

export interface TelestratorState {
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  isDrawing: boolean;
  elements: DrawingElement[];
  undoStack: DrawingElement[][];
  redoStack: DrawingElement[][];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PLAYER STATE TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  error?: string;
  
  // Zoom & Pan
  zoom: number;
  panX: number;
  panY: number;
  
  // Frame stepping
  fps: number;
  currentFrame: number;
  
  // Overlays
  showFormationOverlay: boolean;
  showRouteOverlay: boolean;
  showCoverageOverlay: boolean;
  showTelestrator: boolean;
}

export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PLAYLIST TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  clips: FilmClip[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Sharing
  isShared: boolean;
  sharedWith?: string[];
  teamId?: string;
  
  // Categorization
  type: 'cutup' | 'install' | 'scout' | 'personal';
  tags?: string[];
}

export interface ClipFilter {
  search?: string;
  formations?: string[];
  coverages?: string[];
  concepts?: string[];
  opponents?: string[];
  dateRange?: { start: Date; end: Date };
  hasAIAnalysis?: boolean;
  isStudied?: boolean;
  playlistId?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILM ROOM CONTEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FilmRoomContextState {
  // Current clip
  currentClip: FilmClip | null;
  playerState: PlayerState;
  
  // Clips & Playlists
  clips: FilmClip[];
  currentPlaylist: Playlist | null;
  playlists: Playlist[];
  filters: ClipFilter;
  
  // Panels
  activePanel: 'tags' | 'ai' | 'telestrator' | 'playlist' | null;
  isPanelCollapsed: boolean;
  
  // Telestrator
  telestratorState: TelestratorState;
  
  // AI Analysis
  isAnalyzing: boolean;
  analysisProgress: number;
}

export interface FilmRoomContextActions {
  // Clip Actions
  loadClip: (clip: FilmClip) => void;
  nextClip: () => void;
  prevClip: () => void;
  
  // Player Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  seekFrame: (direction: 'forward' | 'back') => void;
  setPlaybackRate: (rate: PlaybackSpeed) => void;
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
  toggleFullscreen: () => void;
  
  // Tag Actions
  addTag: (tag: Omit<ClipTag, 'id'>) => void;
  removeTag: (tagId: string) => void;
  confirmAITags: () => void;
  
  // AI Actions
  requestAnalysis: () => Promise<void>;
  askCoach: (question: string) => Promise<string>;
  
  // Telestrator Actions
  setTool: (tool: DrawingTool) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  addElement: (element: DrawingElement) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  saveDrawing: () => Promise<void>;
  
  // Panel Actions
  setActivePanel: (panel: FilmRoomContextState['activePanel']) => void;
  togglePanel: () => void;
  
  // Playlist Actions
  setFilters: (filters: ClipFilter) => void;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  addToPlaylist: (playlistId: string, clipId: string) => void;
  removeFromPlaylist: (playlistId: string, clipId: string) => void;
}

export type FilmRoomContext = FilmRoomContextState & FilmRoomContextActions;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KEYBOARD SHORTCUTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const KEYBOARD_SHORTCUTS = {
  // Playback
  'Space': 'togglePlay',
  'ArrowLeft': 'seekBack',
  'ArrowRight': 'seekForward',
  ',': 'frameBack',
  '.': 'frameForward',
  'j': 'seekBack5',
  'k': 'togglePlay',
  'l': 'seekForward5',
  '1': 'speed025',
  '2': 'speed05',
  '3': 'speed075',
  '4': 'speed1',
  '5': 'speed125',
  '6': 'speed15',
  '7': 'speed2',
  
  // View
  'f': 'toggleFullscreen',
  'z': 'toggleZoom',
  
  // Panels
  't': 'toggleTagPanel',
  'a': 'toggleAIPanel',
  'd': 'toggleTelestrator',
  'p': 'togglePlaylist',
  
  // Telestrator
  'Escape': 'cancelDraw',
  'Ctrl+z': 'undo',
  'Ctrl+Shift+z': 'redo',
  
  // Navigation
  'n': 'nextClip',
  'b': 'prevClip',
} as const;








