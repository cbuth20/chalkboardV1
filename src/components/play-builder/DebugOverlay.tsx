import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// DEBUG OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface DebugOverlayProps {
  zoom: number;
  panOffset: { x: number; y: number };
  isDrawingRoute: boolean;
  isDraggingPlayer: boolean;
  selectedPlayer: string | null;
  routeCount: number;
  mousePos?: { x: number; y: number };
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  zoom,
  panOffset,
  isDrawingRoute,
  isDraggingPlayer,
  selectedPlayer,
  routeCount,
  mousePos
}) => {
  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono space-y-1 z-[100] pointer-events-none">
      <div className="font-bold text-[#00F6E5] mb-2">Debug Info</div>

      <div>Zoom: {zoom.toFixed(3)}x</div>
      <div>Pan Y: {panOffset.y.toFixed(1)}</div>

      <div className="border-t border-gray-600 my-2"></div>

      <div>Drawing Route: {isDrawingRoute ? '✅' : '❌'}</div>
      <div>Dragging Player: {isDraggingPlayer ? '✅' : '❌'}</div>

      <div className="border-t border-gray-600 my-2"></div>

      <div>Selected: {selectedPlayer || 'none'}</div>
      <div>Routes: {routeCount}</div>

      {mousePos && (
        <>
          <div className="border-t border-gray-600 my-2"></div>
          <div className="text-[#00F6E5]">SVG Coords:</div>
          <div>X: {mousePos.x.toFixed(1)}</div>
          <div>Y: {mousePos.y.toFixed(1)}</div>
        </>
      )}

      <div className="border-t border-gray-600 my-2"></div>
      <div className="text-gray-400 text-[10px]">
        Press Shift+D to toggle
      </div>
    </div>
  );
};
