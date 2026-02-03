import { useState, useCallback, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// VIEWPORT HOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface UseViewportReturn {
  zoom: number;
  panOffset: { x: number; y: number };
  isPanning: boolean;
  panStartPos: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement>;
  handleWheel: (e: WheelEvent) => void;
  handlePanStart: (clientX: number, clientY: number) => void;
  handlePanMove: (clientX: number, clientY: number) => void;
  handlePanEnd: () => void;
  resetView: () => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setIsPanning: (isPanning: boolean) => void;
  setPanStartPos: (pos: { x: number; y: number }) => void;
}

export function useViewport(): UseViewportReturn {
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    // Shift + scroll = zoom
    if (e.shiftKey) {

    // Reduced sensitivity: 0.03 for smoother control
    const delta = e.deltaY > 0 ? -0.03 : 0.03;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));

    if (newZoom === zoom) return; // No change needed

    // Get mouse position relative to the container
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate normalized position (0 to 1)
    const normalizedX = mouseX / rect.width;
    const normalizedY = mouseY / rect.height;

    // Calculate the point in the current viewBox that the mouse is over
    const viewBoxWidth = 100 / zoom;
    const viewBoxHeight = 120 / zoom;
    const pointX = panOffset.x + normalizedX * viewBoxWidth;
    const pointY = panOffset.y + normalizedY * viewBoxHeight;

    // Calculate new viewBox dimensions
    const newViewBoxWidth = 100 / newZoom;
    const newViewBoxHeight = 120 / newZoom;

    // Adjust pan offset so the point under the cursor stays in the same place
    const newPanX = pointX - normalizedX * newViewBoxWidth;
    const newPanY = pointY - normalizedY * newViewBoxHeight;

      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    } else {
      // Regular scroll = pan vertically (when zoomed)
      const panDelta = e.deltaY * 0.05; // Scale for smooth panning
      setPanOffset(prev => ({
        x: prev.x,
        y: Math.max(-10, Math.min(30, prev.y + panDelta)) // Constrain pan range
      }));
    }
  }, [zoom, panOffset]);

  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    setPanStartPos({ x: clientX, y: clientY });
  }, []);

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isPanning) return;

    const deltaX = (clientX - panStartPos.x) * 0.1;
    const deltaY = (clientY - panStartPos.y) * 0.1;

    setPanOffset(prev => ({
      x: Math.max(-20, Math.min(20, prev.x - deltaX)),
      y: Math.max(-20, Math.min(20, prev.y - deltaY))
    }));

    setPanStartPos({ x: clientX, y: clientY });
  }, [isPanning, panStartPos]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Register wheel event listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelHandler = (e: WheelEvent) => {
      handleWheel(e);
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      container.removeEventListener('wheel', wheelHandler);
    };
  }, [handleWheel]);

  return {
    zoom,
    panOffset,
    isPanning,
    panStartPos,
    containerRef,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetView,
    setZoom,
    setPanOffset,
    setIsPanning,
    setPanStartPos
  };
}
