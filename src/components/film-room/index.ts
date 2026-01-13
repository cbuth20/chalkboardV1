// ═══════════════════════════════════════════════════════════════════════════
// FILM ROOM — Component Barrel Export
// Chalkboard Football Intelligence Platform
// ═══════════════════════════════════════════════════════════════════════════

// Context & State (export first for dependency resolution)
export { FilmRoomProvider, useFilmRoom } from './FilmRoomContext';

// Core Player
export { VideoPlayer } from './Player/VideoPlayer';
export { PlayerControls } from './Player/PlayerControls';
export { TimelineScrubber } from './Player/TimelineScrubber';
export { PlaybackSpeed as PlaybackSpeedControl } from './Player/PlaybackSpeed';

// HUD Overlays
export { PlayerHUD } from './HUD/PlayerHUD';
export { FormationOverlay } from './HUD/FormationOverlay';
export { RouteOverlay } from './HUD/RouteOverlay';
export { CoverageOverlay } from './HUD/CoverageOverlay';

// Tagging System
export { TagPanel } from './TagPanel/TagPanel';
export { TagSelector } from './TagPanel/TagSelector';
export { AITagSuggestions } from './TagPanel/AITagSuggestions';
export { TagBadge } from './TagPanel/TagBadge';

// AI Coach Panel
export { AIBreakdownPanel } from './AIPanel/AIBreakdownPanel';
export { CoachNotes } from './AIPanel/CoachNotes';
export { PlayAnalysis } from './AIPanel/PlayAnalysis';

// Telestrator
export { TelestratorDock } from './Telestrator/TelestratorDock';
export { DrawingCanvas } from './Telestrator/DrawingCanvas';
export { ToolPalette } from './Telestrator/ToolPalette';
export { ShapeTools } from './Telestrator/ShapeTools';

// Playlist & Clips
export { ClipList } from './Playlist/ClipList';
export { ClipCard } from './Playlist/ClipCard';
export { PlaylistSidebar } from './Playlist/PlaylistSidebar';
export { ClipFilters } from './Playlist/ClipFilters';

// Analytics
export { FilmAnalytics } from './Analytics/FilmAnalytics';
export { StudyProgress } from './Analytics/StudyProgress';

// Types
export type {
  FilmClip,
  ClipTag,
  TagCategory,
  AIAnalysis,
  DetectedElement,
  DetectedRoute,
  SuggestedPlay,
  AssignmentBreakdown,
  TelestratorDrawing,
  DrawingTool,
  DrawingElement,
  TelestratorState,
  PlayerState,
  PlaybackSpeed,
  Playlist,
  ClipFilter,
  FilmRoomContextState,
  FilmRoomContextActions,
  FilmRoomContext,
} from './types';

export { KEYBOARD_SHORTCUTS } from './types';

