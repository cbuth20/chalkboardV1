import { useState, useCallback } from 'react';
import type { DiagramPlayer } from '../types';
import { LOS_OPTIONS } from '../utils/formationPresets';

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER DRAG HOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface UsePlayerDragReturn {
  isDraggingPlayer: boolean;
  draggedPlayerId: string | null;
  draggedPlayerSide: 'offense' | 'defense' | null;
  startDrag: (playerId: string, side: 'offense' | 'defense') => void;
  updateDrag: (coords: { x: number; y: number }) => void;
  endDrag: () => void;
}

export function usePlayerDrag(
  offensePlayers: DiagramPlayer[],
  setOffensePlayers: (players: DiagramPlayer[] | ((prev: DiagramPlayer[]) => DiagramPlayer[])) => void,
  defensePlayers: DiagramPlayer[],
  setDefensePlayers: (players: DiagramPlayer[] | ((prev: DiagramPlayer[]) => DiagramPlayer[])) => void,
  lineOfScrimmage: number,
  saveSnapshot: () => void
): UsePlayerDragReturn {
  const [isDraggingPlayer, setIsDraggingPlayer] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [draggedPlayerSide, setDraggedPlayerSide] = useState<'offense' | 'defense' | null>(null);

  const startDrag = useCallback((playerId: string, side: 'offense' | 'defense') => {
    setIsDraggingPlayer(true);
    setDraggedPlayerId(playerId);
    setDraggedPlayerSide(side);
  }, []);

  const updateDrag = useCallback((coords: { x: number; y: number }) => {
    if (!isDraggingPlayer || !draggedPlayerId || !draggedPlayerSide) return;

    // Get LOS Y coordinate
    const losY = LOS_OPTIONS.find(opt => opt.value === lineOfScrimmage)?.y || 60;

    if (draggedPlayerSide === 'offense') {
      // Offensive players must stay at least 1 yard behind LOS
      const constrainedY = Math.max(losY + 1, coords.y);
      setOffensePlayers(prev =>
        prev.map(p => p.id === draggedPlayerId ? { ...p, x: coords.x, y: constrainedY } : p)
      );
    } else {
      // Defensive players must stay at least 1 yard in front of LOS
      const constrainedY = Math.min(losY - 1, coords.y);
      setDefensePlayers(prev =>
        prev.map(p => p.id === draggedPlayerId ? { ...p, x: coords.x, y: constrainedY } : p)
      );
    }
  }, [isDraggingPlayer, draggedPlayerId, draggedPlayerSide, lineOfScrimmage, setOffensePlayers, setDefensePlayers]);

  const endDrag = useCallback(() => {
    if (isDraggingPlayer) {
      saveSnapshot();
    }
    setIsDraggingPlayer(false);
    setDraggedPlayerId(null);
    setDraggedPlayerSide(null);
  }, [isDraggingPlayer, saveSnapshot]);

  return {
    isDraggingPlayer,
    draggedPlayerId,
    draggedPlayerSide,
    startDrag,
    updateDrag,
    endDrag
  };
}
