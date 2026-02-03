import { useState, useCallback, useMemo } from 'react';
import type { DiagramPlayer, DiagramRoute } from '../types';
import { calculateDistance } from '../utils/coordinateHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE DRAWING HOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface UseRouteDrawingReturn {
  isDrawingRoute: boolean;
  currentRoutePoints: { x: number; y: number }[];
  selectedPlayer: string | null;
  copiedRoute: DiagramRoute | null;
  routeByPlayerId: Record<string, DiagramRoute>;
  startDrawing: (playerId: string, startPoint: { x: number; y: number }) => void;
  addPoint: (point: { x: number; y: number }) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  copyRoute: (playerId: string) => void;
  pasteRoute: (playerId: string) => void;
  deleteRoute: (playerId: string) => void;
  setSelectedPlayer: (playerId: string | null) => void;
}

export function useRouteDrawing(
  routes: DiagramRoute[],
  setRoutes: (routes: DiagramRoute[] | ((prev: DiagramRoute[]) => DiagramRoute[])) => void,
  offensePlayers: DiagramPlayer[],
  saveSnapshot: () => void
): UseRouteDrawingReturn {
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoutePoints, setCurrentRoutePoints] = useState<{ x: number; y: number }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [copiedRoute, setCopiedRoute] = useState<DiagramRoute | null>(null);

  // PERFORMANCE OPTIMIZATION: Memoized route lookup map
  // Converts O(n) search per player to O(1) lookup
  const routeByPlayerId = useMemo(() => {
    return routes.reduce((acc, route) => {
      acc[route.playerId] = route;
      return acc;
    }, {} as Record<string, DiagramRoute>);
  }, [routes]);

  const startDrawing = useCallback((playerId: string, startPoint: { x: number; y: number }) => {
    setSelectedPlayer(playerId);
    setIsDrawingRoute(true);
    setCurrentRoutePoints([startPoint]);
  }, []);

  const addPoint = useCallback((point: { x: number; y: number }) => {
    setCurrentRoutePoints(prev => {
      if (prev.length > 0) {
        const lastPoint = prev[prev.length - 1];
        const distance = calculateDistance(lastPoint, point);

        // PERFORMANCE OPTIMIZATION: Only add point if > 2 units from last
        // Prevents route from having too many points during fast mouse movement
        if (distance < 2) return prev;
      }

      return [...prev, point];
    });
  }, []);

  const finishDrawing = useCallback(() => {
    if (isDrawingRoute && selectedPlayer && currentRoutePoints.length > 1) {
      saveSnapshot();

      const newRoute: DiagramRoute = {
        playerId: selectedPlayer,
        points: currentRoutePoints,
      };

      setRoutes(prev => {
        const filtered = prev.filter(r => r.playerId !== selectedPlayer);
        return [...filtered, newRoute];
      });
    }

    setIsDrawingRoute(false);
    setSelectedPlayer(null);
    setCurrentRoutePoints([]);
  }, [isDrawingRoute, selectedPlayer, currentRoutePoints, saveSnapshot, setRoutes]);

  const cancelDrawing = useCallback(() => {
    setIsDrawingRoute(false);
    setSelectedPlayer(null);
    setCurrentRoutePoints([]);
  }, []);

  const deleteRoute = useCallback((playerId: string) => {
    saveSnapshot();
    setRoutes(prev => prev.filter(r => r.playerId !== playerId));
  }, [saveSnapshot, setRoutes]);

  const copyRoute = useCallback((playerId: string) => {
    const route = routes.find(r => r.playerId === playerId);
    if (route) {
      setCopiedRoute(route);
    }
  }, [routes]);

  const pasteRoute = useCallback((playerId: string) => {
    if (!copiedRoute) return;

    const player = offensePlayers.find(p => p.id === playerId);
    if (!player) return;

    saveSnapshot();

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
  }, [copiedRoute, offensePlayers, saveSnapshot, setRoutes]);

  return {
    isDrawingRoute,
    currentRoutePoints,
    selectedPlayer,
    copiedRoute,
    routeByPlayerId,
    startDrawing,
    addPoint,
    finishDrawing,
    cancelDrawing,
    copyRoute,
    pasteRoute,
    deleteRoute,
    setSelectedPlayer
  };
}
