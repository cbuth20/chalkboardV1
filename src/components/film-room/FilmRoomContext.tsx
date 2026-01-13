"use client";

// ═══════════════════════════════════════════════════════════════════════════
// FILM ROOM CONTEXT — Global State Management
// Manages video player, clips, telestrator, and AI analysis state
// ═══════════════════════════════════════════════════════════════════════════

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type {
  FilmRoomContext,
  FilmRoomContextState,
  FilmClip,
  PlayerState,
  TelestratorState,
  DrawingTool,
  DrawingElement,
  ClipTag,
  ClipFilter,
  Playlist,
  PlaybackSpeed,
} from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INITIAL STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const initialPlayerState: PlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  isLoading: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  fps: 30,
  currentFrame: 0,
  showFormationOverlay: false,
  showRouteOverlay: false,
  showCoverageOverlay: false,
  showTelestrator: false,
};

const initialTelestratorState: TelestratorState = {
  tool: 'pen',
  color: '#00F6E5',
  strokeWidth: 3,
  isDrawing: false,
  elements: [],
  undoStack: [],
  redoStack: [],
};

const initialState: FilmRoomContextState = {
  currentClip: null,
  playerState: initialPlayerState,
  clips: [],
  currentPlaylist: null,
  playlists: [],
  filters: {},
  activePanel: 'playlist',
  isPanelCollapsed: false,
  telestratorState: initialTelestratorState,
  isAnalyzing: false,
  analysisProgress: 0,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REDUCER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Action =
  | { type: 'LOAD_CLIP'; payload: FilmClip }
  | { type: 'SET_CLIPS'; payload: FilmClip[] }
  | { type: 'UPDATE_PLAYER'; payload: Partial<PlayerState> }
  | { type: 'SET_ACTIVE_PANEL'; payload: FilmRoomContextState['activePanel'] }
  | { type: 'TOGGLE_PANEL' }
  | { type: 'UPDATE_TELESTRATOR'; payload: Partial<TelestratorState> }
  | { type: 'ADD_DRAWING_ELEMENT'; payload: DrawingElement }
  | { type: 'UNDO_TELESTRATOR' }
  | { type: 'REDO_TELESTRATOR' }
  | { type: 'CLEAR_TELESTRATOR' }
  | { type: 'ADD_TAG'; payload: ClipTag }
  | { type: 'REMOVE_TAG'; payload: string }
  | { type: 'SET_FILTERS'; payload: ClipFilter }
  | { type: 'SET_PLAYLISTS'; payload: Playlist[] }
  | { type: 'SET_CURRENT_PLAYLIST'; payload: Playlist | null }
  | { type: 'SET_ANALYZING'; payload: { isAnalyzing: boolean; progress?: number } };

function reducer(state: FilmRoomContextState, action: Action): FilmRoomContextState {
  switch (action.type) {
    case 'LOAD_CLIP':
      return {
        ...state,
        currentClip: action.payload,
        playerState: {
          ...initialPlayerState,
          duration: action.payload.duration,
        },
        telestratorState: {
          ...initialTelestratorState,
          elements: action.payload.drawings?.[0]?.elements || [],
        },
      };

    case 'SET_CLIPS':
      return { ...state, clips: action.payload };

    case 'UPDATE_PLAYER':
      return {
        ...state,
        playerState: { ...state.playerState, ...action.payload },
      };

    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload };

    case 'TOGGLE_PANEL':
      return { ...state, isPanelCollapsed: !state.isPanelCollapsed };

    case 'UPDATE_TELESTRATOR':
      return {
        ...state,
        telestratorState: { ...state.telestratorState, ...action.payload },
      };

    case 'ADD_DRAWING_ELEMENT':
      return {
        ...state,
        telestratorState: {
          ...state.telestratorState,
          elements: [...state.telestratorState.elements, action.payload],
          undoStack: [...state.telestratorState.undoStack, state.telestratorState.elements],
          redoStack: [],
        },
      };

    case 'UNDO_TELESTRATOR':
      if (state.telestratorState.undoStack.length === 0) return state;
      const prevElements = state.telestratorState.undoStack[state.telestratorState.undoStack.length - 1];
      return {
        ...state,
        telestratorState: {
          ...state.telestratorState,
          elements: prevElements,
          undoStack: state.telestratorState.undoStack.slice(0, -1),
          redoStack: [...state.telestratorState.redoStack, state.telestratorState.elements],
        },
      };

    case 'REDO_TELESTRATOR':
      if (state.telestratorState.redoStack.length === 0) return state;
      const nextElements = state.telestratorState.redoStack[state.telestratorState.redoStack.length - 1];
      return {
        ...state,
        telestratorState: {
          ...state.telestratorState,
          elements: nextElements,
          undoStack: [...state.telestratorState.undoStack, state.telestratorState.elements],
          redoStack: state.telestratorState.redoStack.slice(0, -1),
        },
      };

    case 'CLEAR_TELESTRATOR':
      return {
        ...state,
        telestratorState: {
          ...state.telestratorState,
          elements: [],
          undoStack: [...state.telestratorState.undoStack, state.telestratorState.elements],
          redoStack: [],
        },
      };

    case 'ADD_TAG':
      if (!state.currentClip) return state;
      return {
        ...state,
        currentClip: {
          ...state.currentClip,
          tags: [...state.currentClip.tags, action.payload],
        },
      };

    case 'REMOVE_TAG':
      if (!state.currentClip) return state;
      return {
        ...state,
        currentClip: {
          ...state.currentClip,
          tags: state.currentClip.tags.filter((t) => t.id !== action.payload),
        },
      };

    case 'SET_FILTERS':
      return { ...state, filters: action.payload };

    case 'SET_PLAYLISTS':
      return { ...state, playlists: action.payload };

    case 'SET_CURRENT_PLAYLIST':
      return { ...state, currentPlaylist: action.payload };

    case 'SET_ANALYZING':
      return {
        ...state,
        isAnalyzing: action.payload.isAnalyzing,
        analysisProgress: action.payload.progress ?? state.analysisProgress,
      };

    default:
      return state;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FilmRoomCtx = createContext<FilmRoomContext | null>(null);

export function FilmRoomProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ─────────────────────────────────────────────────────────────────────────
  // Clip Actions
  // ─────────────────────────────────────────────────────────────────────────

  const loadClip = useCallback((clip: FilmClip) => {
    dispatch({ type: 'LOAD_CLIP', payload: clip });
  }, []);

  const nextClip = useCallback(() => {
    const idx = state.clips.findIndex((c) => c.id === state.currentClip?.id);
    if (idx < state.clips.length - 1) {
      dispatch({ type: 'LOAD_CLIP', payload: state.clips[idx + 1] });
    }
  }, [state.clips, state.currentClip]);

  const prevClip = useCallback(() => {
    const idx = state.clips.findIndex((c) => c.id === state.currentClip?.id);
    if (idx > 0) {
      dispatch({ type: 'LOAD_CLIP', payload: state.clips[idx - 1] });
    }
  }, [state.clips, state.currentClip]);

  // ─────────────────────────────────────────────────────────────────────────
  // Player Actions
  // ─────────────────────────────────────────────────────────────────────────

  const play = useCallback(() => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { isPlaying: true } });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { isPlaying: false } });
  }, []);

  const togglePlay = useCallback(() => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { isPlaying: !state.playerState.isPlaying } });
  }, [state.playerState.isPlaying]);

  const seek = useCallback((time: number) => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { currentTime: time } });
  }, []);

  const seekFrame = useCallback((direction: 'forward' | 'back') => {
    const frameTime = 1 / state.playerState.fps;
    const newTime = direction === 'forward'
      ? state.playerState.currentTime + frameTime
      : state.playerState.currentTime - frameTime;
    dispatch({ type: 'UPDATE_PLAYER', payload: { currentTime: Math.max(0, newTime) } });
  }, [state.playerState.currentTime, state.playerState.fps]);

  const setPlaybackRate = useCallback((rate: PlaybackSpeed) => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { playbackRate: rate } });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { zoom } });
  }, []);

  const resetZoom = useCallback(() => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { zoom: 1, panX: 0, panY: 0 } });
  }, []);

  const toggleFullscreen = useCallback(() => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { isFullscreen: !state.playerState.isFullscreen } });
  }, [state.playerState.isFullscreen]);

  // ─────────────────────────────────────────────────────────────────────────
  // Tag Actions
  // ─────────────────────────────────────────────────────────────────────────

  const addTag = useCallback((tag: Omit<ClipTag, 'id'>) => {
    dispatch({
      type: 'ADD_TAG',
      payload: { ...tag, id: `tag-${Date.now()}` },
    });
  }, []);

  const removeTag = useCallback((tagId: string) => {
    dispatch({ type: 'REMOVE_TAG', payload: tagId });
  }, []);

  const confirmAITags = useCallback(() => {
    // Mark all AI-generated tags as confirmed
    // TODO: Implement confirmation logic
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // AI Actions
  // ─────────────────────────────────────────────────────────────────────────

  const requestAnalysis = useCallback(async () => {
    if (!state.currentClip) return;
    dispatch({ type: 'SET_ANALYZING', payload: { isAnalyzing: true, progress: 0 } });
    
    // TODO: Implement actual AI analysis via Supabase Edge Function
    // Simulated progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      dispatch({ type: 'SET_ANALYZING', payload: { isAnalyzing: true, progress: i } });
    }
    
    dispatch({ type: 'SET_ANALYZING', payload: { isAnalyzing: false, progress: 100 } });
  }, [state.currentClip]);

  const askCoach = useCallback(async (question: string): Promise<string> => {
    // TODO: Implement AI coach query via Edge Function
    await new Promise((r) => setTimeout(r, 1000));
    return `Coach analysis for: "${question}" - This would return AI-generated coaching insights.`;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Telestrator Actions
  // ─────────────────────────────────────────────────────────────────────────

  const setTool = useCallback((tool: DrawingTool) => {
    dispatch({ type: 'UPDATE_TELESTRATOR', payload: { tool } });
  }, []);

  const setColor = useCallback((color: string) => {
    dispatch({ type: 'UPDATE_TELESTRATOR', payload: { color } });
  }, []);

  const setStrokeWidth = useCallback((strokeWidth: number) => {
    dispatch({ type: 'UPDATE_TELESTRATOR', payload: { strokeWidth } });
  }, []);

  const addElement = useCallback((element: DrawingElement) => {
    dispatch({ type: 'ADD_DRAWING_ELEMENT', payload: element });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO_TELESTRATOR' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO_TELESTRATOR' });
  }, []);

  const clearCanvas = useCallback(() => {
    dispatch({ type: 'CLEAR_TELESTRATOR' });
  }, []);

  const saveDrawing = useCallback(async () => {
    // TODO: Save drawing to Supabase
    console.log('Saving drawing...', state.telestratorState.elements);
  }, [state.telestratorState.elements]);

  // ─────────────────────────────────────────────────────────────────────────
  // Panel Actions
  // ─────────────────────────────────────────────────────────────────────────

  const setActivePanel = useCallback((panel: FilmRoomContextState['activePanel']) => {
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: panel });
  }, []);

  const togglePanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_PANEL' });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Playlist Actions
  // ─────────────────────────────────────────────────────────────────────────

  const setFilters = useCallback((filters: ClipFilter) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const createPlaylist = useCallback(async (name: string, description?: string): Promise<Playlist> => {
    // TODO: Create playlist in Supabase
    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      description,
      clips: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
      isShared: false,
      type: 'personal',
    };
    dispatch({ type: 'SET_PLAYLISTS', payload: [...state.playlists, playlist] });
    return playlist;
  }, [state.playlists]);

  const addToPlaylist = useCallback((playlistId: string, clipId: string) => {
    // TODO: Implement playlist management
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, clipId: string) => {
    // TODO: Implement playlist management
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Context Value
  // ─────────────────────────────────────────────────────────────────────────

  const value: FilmRoomContext = {
    ...state,
    loadClip,
    nextClip,
    prevClip,
    play,
    pause,
    togglePlay,
    seek,
    seekFrame,
    setPlaybackRate,
    setZoom,
    resetZoom,
    toggleFullscreen,
    addTag,
    removeTag,
    confirmAITags,
    requestAnalysis,
    askCoach,
    setTool,
    setColor,
    setStrokeWidth,
    addElement,
    undo,
    redo,
    clearCanvas,
    saveDrawing,
    setActivePanel,
    togglePanel,
    setFilters,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
  };

  return <FilmRoomCtx.Provider value={value}>{children}</FilmRoomCtx.Provider>;
}

export function useFilmRoom(): FilmRoomContext {
  const ctx = useContext(FilmRoomCtx);
  if (!ctx) {
    throw new Error('useFilmRoom must be used within FilmRoomProvider');
  }
  return ctx;
}








