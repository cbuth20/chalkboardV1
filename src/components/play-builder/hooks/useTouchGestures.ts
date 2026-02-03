import { useState, useCallback, useEffect, useRef } from 'react';
import type { PlayMode } from '../types';
import { getTouchDistance, getTouchCenter } from '../utils/coordinateHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// TOUCH GESTURES HOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface UseTouchGesturesReturn {
  isTouchDevice: boolean;
  touchMode: 'draw' | 'move';
  setTouchMode: (mode: 'draw' | 'move') => void;
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
}

interface UseTouchGesturesProps {
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  isPanning: boolean;
  setIsPanning: (isPanning: boolean) => void;
  panStartPos: { x: number; y: number };
  setPanStartPos: (pos: { x: number; y: number }) => void;
  playMode: PlayMode;
  fieldRef: React.RefObject<SVGSVGElement>;
}

export function useTouchGestures({
  zoom,
  setZoom,
  panOffset,
  setPanOffset,
  isPanning,
  setIsPanning,
  panStartPos,
  setPanStartPos,
  playMode,
  fieldRef
}: UseTouchGesturesProps): UseTouchGesturesReturn {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchMode, setTouchMode] = useState<'draw' | 'move'>('draw');
  const [touchState, setTouchState] = useState<{
    initialDistance: number | null;
    initialZoom: number;
    lastTapTime: number;
  }>({
    initialDistance: null,
    initialZoom: 1,
    lastTapTime: 0,
  });

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

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
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
  }, [zoom, touchState.lastTapTime, setZoom, setPanOffset, setIsPanning, setPanStartPos]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
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
  }, [touchState.initialDistance, touchState.initialZoom, isPanning, panStartPos, panOffset, zoom, fieldRef, setZoom, setPanOffset, setPanStartPos]);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 0) {
      // All touches ended
      setIsPanning(false);
      setTouchState(prev => ({
        ...prev,
        initialDistance: null,
      }));
    }
  }, [setIsPanning]);

  return {
    isTouchDevice,
    touchMode,
    setTouchMode,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}
