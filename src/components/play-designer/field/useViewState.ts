// ═══════════════════════════════════════════════════════════════════════════
// USE VIEW STATE — Zoom and pan state management for the football field
// Provides smooth zoom/pan with gesture support
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ViewState, UseViewStateReturn, UseViewStateOptions } from './types';
import { FIELD_DIMENSIONS, DEFAULT_VIEW_STATE, clampScale, viewStateToTransform } from './geometry';

const DEFAULT_OPTIONS: Required<UseViewStateOptions> = {
  initialState: DEFAULT_VIEW_STATE,
  minScale: 0.5,
  maxScale: 4,
  zoomStep: 0.25,
  persist: false,
  storageKey: 'chalkboard-field-view',
};

/**
 * Hook to manage zoom and pan state for the football field
 */
export function useViewState(options: UseViewStateOptions = {}): UseViewStateReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Initialize state
  const [viewState, setViewStateInternal] = useState<ViewState>(() => {
    // Try to load from storage if persistence is enabled
    if (opts.persist && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(opts.storageKey);
        if (stored) {
          return { ...DEFAULT_VIEW_STATE, ...JSON.parse(stored) };
        }
      } catch {
        // Ignore storage errors
      }
    }
    return { ...DEFAULT_VIEW_STATE, ...opts.initialState };
  });

  // Persist to storage when state changes
  useEffect(() => {
    if (opts.persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(opts.storageKey, JSON.stringify(viewState));
      } catch {
        // Ignore storage errors
      }
    }
  }, [viewState, opts.persist, opts.storageKey]);

  /**
   * Set view state with clamping
   */
  const setViewState = useCallback((newState: ViewState) => {
    setViewStateInternal({
      ...newState,
      scale: clampScale(newState.scale, opts.minScale, opts.maxScale),
    });
  }, [opts.minScale, opts.maxScale]);

  /**
   * Zoom in by one step
   */
  const zoomIn = useCallback(() => {
    setViewStateInternal((prev) => ({
      ...prev,
      scale: clampScale(prev.scale + opts.zoomStep, opts.minScale, opts.maxScale),
    }));
  }, [opts.zoomStep, opts.minScale, opts.maxScale]);

  /**
   * Zoom out by one step
   */
  const zoomOut = useCallback(() => {
    setViewStateInternal((prev) => ({
      ...prev,
      scale: clampScale(prev.scale - opts.zoomStep, opts.minScale, opts.maxScale),
    }));
  }, [opts.zoomStep, opts.minScale, opts.maxScale]);

  /**
   * Reset to default view, optionally centering on a specific X position
   */
  const resetView = useCallback((centerX?: number) => {
    if (centerX !== undefined) {
      // Center view on specific yard line
      const visibleWidth = FIELD_DIMENSIONS.LENGTH;
      const offsetX = (FIELD_DIMENSIONS.LENGTH / 2 - centerX);
      setViewStateInternal({
        scale: 1,
        offsetX: offsetX,
        offsetY: 0,
      });
    } else {
      setViewStateInternal(DEFAULT_VIEW_STATE);
    }
  }, []);

  /**
   * Pan to a specific position
   */
  const panTo = useCallback((x: number, y: number) => {
    setViewStateInternal((prev) => ({
      ...prev,
      offsetX: x,
      offsetY: y,
    }));
  }, []);

  // Calculate transform string
  const transform = useMemo(() => viewStateToTransform(viewState), [viewState]);

  // Check if we can zoom further
  const canZoomIn = viewState.scale < opts.maxScale;
  const canZoomOut = viewState.scale > opts.minScale;

  return {
    viewState,
    setViewState,
    zoomIn,
    zoomOut,
    resetView,
    panTo,
    transform,
    canZoomIn,
    canZoomOut,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GESTURE SUPPORT HOOK
// For pinch-zoom and drag-pan on touch devices
// ═══════════════════════════════════════════════════════════════════════════

type GestureState = {
  isDragging: boolean;
  isPinching: boolean;
  startX: number;
  startY: number;
  startScale: number;
  startDistance: number;
};

/**
 * Hook to add gesture support (pinch-zoom, drag-pan) to an SVG element
 */
export function useFieldGestures(
  svgRef: React.RefObject<SVGSVGElement | null>,
  viewState: ViewState,
  setViewState: (state: ViewState) => void,
  options: {
    enabled?: boolean;
    minScale?: number;
    maxScale?: number;
  } = {}
) {
  const { enabled = true, minScale = 0.5, maxScale = 4 } = options;
  const gestureState = useRef<GestureState>({
    isDragging: false,
    isPinching: false,
    startX: 0,
    startY: 0,
    startScale: 1,
    startDistance: 0,
  });

  // Get distance between two touch points
  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Get center of two touch points
  const getTouchCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  useEffect(() => {
    if (!enabled || !svgRef.current) return;

    const svg = svgRef.current;

    // Touch start
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - start drag
        gestureState.current = {
          ...gestureState.current,
          isDragging: true,
          startX: e.touches[0].clientX - viewState.offsetX,
          startY: e.touches[0].clientY - viewState.offsetY,
        };
      } else if (e.touches.length === 2) {
        // Two touches - start pinch
        e.preventDefault();
        gestureState.current = {
          ...gestureState.current,
          isPinching: true,
          isDragging: false,
          startDistance: getTouchDistance(e.touches),
          startScale: viewState.scale,
        };
      }
    };

    // Touch move
    const handleTouchMove = (e: TouchEvent) => {
      if (gestureState.current.isPinching && e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const scaleFactor = currentDistance / gestureState.current.startDistance;
        const newScale = clampScale(
          gestureState.current.startScale * scaleFactor,
          minScale,
          maxScale
        );
        setViewState({
          ...viewState,
          scale: newScale,
        });
      } else if (gestureState.current.isDragging && e.touches.length === 1) {
        const newX = e.touches[0].clientX - gestureState.current.startX;
        const newY = e.touches[0].clientY - gestureState.current.startY;
        setViewState({
          ...viewState,
          offsetX: newX,
          offsetY: newY,
        });
      }
    };

    // Touch end
    const handleTouchEnd = () => {
      gestureState.current = {
        ...gestureState.current,
        isDragging: false,
        isPinching: false,
      };
    };

    // Mouse wheel zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = clampScale(viewState.scale + delta, minScale, maxScale);
      setViewState({
        ...viewState,
        scale: newScale,
      });
    };

    // Add event listeners
    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd);
    svg.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchmove', handleTouchMove);
      svg.removeEventListener('touchend', handleTouchEnd);
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, svgRef, viewState, setViewState, minScale, maxScale, getTouchDistance, getTouchCenter]);
}

export default useViewState;








