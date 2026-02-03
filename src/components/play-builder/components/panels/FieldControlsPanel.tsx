import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// FIELD CONTROLS PANEL
// ═══════════════════════════════════════════════════════════════════════════

export interface FieldControlsPanelProps {
  zoom: number;
  snapToGrid: boolean;
  isTouchDevice: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleSnapToGrid: () => void;
  onResetView: () => void;
}

export const FieldControlsPanel: React.FC<FieldControlsPanelProps> = ({
  zoom,
  snapToGrid,
  isTouchDevice,
  onZoomIn,
  onZoomOut,
  onToggleSnapToGrid,
  onResetView,
}) => {
  return (
    <div className="space-y-4">
      {/* Zoom Controls */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Zoom
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={onZoomOut}
            className="px-3 py-2 rounded-lg bg-[#1B1E20]/50 text-white hover:bg-[#1B1E20] transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35M8 11h6"/>
            </svg>
          </button>
          <span className="text-sm text-white font-mono flex-1 text-center">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={onZoomIn}
            className="px-3 py-2 rounded-lg bg-[#1B1E20]/50 text-white hover:bg-[#1B1E20] transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35M11 8v6m-3-3h6"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Tip: Hold <strong className="text-white">Shift + scroll</strong> to zoom
        </p>
      </div>

      {/* Snap to Grid Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-400">Snap to Grid</label>
        <button
          onClick={onToggleSnapToGrid}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            snapToGrid ? 'bg-[#00F6E5]' : 'bg-[#1B1E20]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              snapToGrid ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Reset View Button */}
      <button
        onClick={onResetView}
        className="w-full px-4 py-2 rounded-lg bg-[#1B1E20]/50 text-white hover:bg-[#1B1E20] transition"
      >
        Reset View
      </button>

      {/* Quick Tips */}
      <div className="pt-4 border-t border-[#1B1E20]">
        <p className="text-xs text-slate-400 mb-2">Quick Tips:</p>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• <strong className="text-white">Double-click/tap</strong> field to reset zoom</li>
          <li>• <strong className="text-white">Pinch</strong> to zoom on iPad</li>
          {isTouchDevice ? (
            <li>• Use <strong className="text-white">Touch Mode toggle</strong> (bottom left) to switch between Draw/Move</li>
          ) : (
            <>
              <li>• Hold <strong className="text-white">Shift</strong> + drag to move players</li>
              <li>• Or use <strong className="text-white">Run mode</strong> for drag-only</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};
