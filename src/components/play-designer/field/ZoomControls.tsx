// ═══════════════════════════════════════════════════════════════════════════
// ZOOM CONTROLS — UI controls for zoom and pan
// Floating buttons for +/- zoom and reset
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo } from 'react';
import { ZoomControlsProps } from './types';

/**
 * ZoomControls renders floating zoom control buttons
 * Features:
 * - Zoom in (+)
 * - Zoom out (-)
 * - Reset to default view
 * - Current zoom level display
 */
export const ZoomControls = memo(function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  currentScale,
  minScale = 0.5,
  maxScale = 4,
  className = '',
}: ZoomControlsProps) {
  const zoomPercent = Math.round(currentScale * 100);
  const canZoomIn = currentScale < maxScale;
  const canZoomOut = currentScale > minScale;

  return (
    <div className={`flex items-center gap-1 rounded-xl border border-[#1B1E20] bg-[#0A0A0A]/90 p-1.5 backdrop-blur-sm ${className}`}>
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom Out"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
          canZoomOut
            ? 'text-slate-400 hover:bg-[#1B1E20] hover:text-white'
            : 'text-slate-600 cursor-not-allowed opacity-50'
        }`}
      >
        <MinusIcon />
      </button>

      {/* Zoom Level Display */}
      <div className="min-w-[48px] px-2 text-center">
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {zoomPercent}%
        </span>
      </div>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom In"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
          canZoomIn
            ? 'text-slate-400 hover:bg-[#1B1E20] hover:text-white'
            : 'text-slate-600 cursor-not-allowed opacity-50'
        }`}
      >
        <PlusIcon />
      </button>

      {/* Divider */}
      <div className="mx-1 h-6 w-px bg-[#1B1E20]" />

      {/* Reset */}
      <button
        onClick={onReset}
        title="Reset View"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-[#1B1E20] hover:text-[#00F6E5]"
      >
        <ResetIcon />
      </button>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export default ZoomControls;








