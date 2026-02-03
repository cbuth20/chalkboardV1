import { useState, useCallback, useEffect } from 'react';
import type { DiagramPlayer, DiagramRoute, HistoryState } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY HOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface UseHistoryReturn {
  history: HistoryState[];
  historyIndex: number;
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useHistory(
  offensePlayers: DiagramPlayer[],
  setOffensePlayers: (players: DiagramPlayer[]) => void,
  defensePlayers: DiagramPlayer[],
  setDefensePlayers: (players: DiagramPlayer[]) => void,
  routes: DiagramRoute[],
  setRoutes: (routes: DiagramRoute[]) => void,
  initialPlayData?: {
    routes?: DiagramRoute[];
    offensePlayers?: DiagramPlayer[];
    defensePlayers?: DiagramPlayer[];
  }
): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history with initial state
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        routes: initialPlayData?.routes || [],
        offensePlayers: initialPlayData?.offensePlayers || offensePlayers,
        defensePlayers: initialPlayData?.defensePlayers || defensePlayers,
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []); // Only run once on mount

  const saveSnapshot = useCallback(() => {
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

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setRoutes(prevState.routes);
      setOffensePlayers(prevState.offensePlayers);
      setDefensePlayers(prevState.defensePlayers);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex, setRoutes, setOffensePlayers, setDefensePlayers]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setRoutes(nextState.routes);
      setOffensePlayers(nextState.offensePlayers);
      setDefensePlayers(nextState.defensePlayers);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex, setRoutes, setOffensePlayers, setDefensePlayers]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    history,
    historyIndex,
    saveSnapshot,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
