"use client";

// ═══════════════════════════════════════════════════════════════════════════
// TELESTRATOR DOCK — Drawing Tools Panel
// Madden-style telestrator with route drawing and annotations
// ═══════════════════════════════════════════════════════════════════════════

import { useFilmRoom } from '../FilmRoomContext';
import { ToolPalette } from './ToolPalette';
import { ShapeTools } from './ShapeTools';
import type { DrawingTool } from '../types';

const COLORS = [
  { name: 'Teal', value: '#00F6E5' },
  { name: 'Yellow', value: '#F5C253' },
  { name: 'Orange', value: '#FF6A3D' },
  { name: 'Red', value: '#EF4444' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Blue', value: '#3B82F6' },
];

const STROKE_WIDTHS = [
  { name: 'Thin', value: 2 },
  { name: 'Medium', value: 4 },
  { name: 'Thick', value: 6 },
  { name: 'Bold', value: 8 },
];

export function TelestratorDock() {
  const {
    currentClip,
    playerState,
    telestratorState,
    setTool,
    setColor,
    setStrokeWidth,
    undo,
    redo,
    clearCanvas,
    saveDrawing,
  } = useFilmRoom();

  if (!currentClip) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <DrawIcon className="h-12 w-12 text-slate-700 mb-4" />
        <p className="text-slate-500 text-sm text-center">
          Load a clip to use the telestrator
        </p>
      </div>
    );
  }

  const canUndo = telestratorState.undoStack.length > 0;
  const canRedo = telestratorState.redoStack.length > 0;
  const hasDrawings = telestratorState.elements.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DrawIcon className="h-5 w-5 text-[#00F6E5]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Telestrator
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {/* Undo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1B1E20] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <UndoIcon className="h-4 w-4" />
            </button>

            {/* Redo */}
            <button
              onClick={redo}
              disabled={!canRedo}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1B1E20] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              <RedoIcon className="h-4 w-4" />
            </button>

            {/* Clear */}
            <button
              onClick={clearCanvas}
              disabled={!hasDrawings}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#FF6A3D] hover:bg-[#FF6A3D]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Clear All"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          playerState.showTelestrator
            ? 'bg-[#00F6E5]/10 border border-[#00F6E5]/30'
            : 'bg-[#1B1E20] border border-transparent'
        }`}>
          <span className={`h-2 w-2 rounded-full ${
            playerState.showTelestrator ? 'bg-[#00F6E5] animate-pulse' : 'bg-slate-600'
          }`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            playerState.showTelestrator ? 'text-[#00F6E5]' : 'text-slate-500'
          }`}>
            {playerState.showTelestrator ? 'Drawing Mode Active' : 'Drawing Mode Off'}
          </span>
        </div>
      </div>

      {/* Tool Palette */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
        <ToolPalette />
      </div>

      {/* Shape Tools (when applicable) */}
      {['circle', 'rectangle', 'arrow', 'line'].includes(telestratorState.tool) && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
          <ShapeTools />
        </div>
      )}

      {/* Color Picker */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3 block">
          Color
        </span>
        <div className="flex items-center gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setColor(color.value)}
              className={`h-8 w-8 rounded-lg border-2 transition-all ${
                telestratorState.color === color.value
                  ? 'border-white scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3 block">
          Stroke Width
        </span>
        <div className="flex items-center gap-2">
          {STROKE_WIDTHS.map((stroke) => (
            <button
              key={stroke.value}
              onClick={() => setStrokeWidth(stroke.value)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                telestratorState.strokeWidth === stroke.value
                  ? 'bg-[#00F6E5]/15 border-[#00F6E5]/30 text-[#00F6E5]'
                  : 'border-transparent hover:bg-[#1B1E20] text-slate-400 hover:text-white'
              }`}
              title={stroke.name}
            >
              <span
                className="rounded-full"
                style={{
                  width: stroke.value * 2,
                  height: stroke.value * 2,
                  backgroundColor: telestratorState.color,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Player Labels (for player spot tool) */}
      {telestratorState.tool === 'playerSpot' && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3 block">
            Player Labels
          </span>
          <div className="grid grid-cols-6 gap-2">
            {['X', 'Y', 'Z', 'H', 'F', 'T', 'Q', 'S', 'M', 'W', 'C', 'N'].map((label) => (
              <button
                key={label}
                className="h-8 flex items-center justify-center rounded-lg bg-[#1B1E20] text-xs font-bold text-slate-300 hover:bg-[#00F6E5]/15 hover:text-[#00F6E5] transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drawing Count */}
      <div className="flex-1 flex flex-col justify-end p-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span>{telestratorState.elements.length} drawings</span>
          <span>@ {playerState.currentTime.toFixed(2)}s</span>
        </div>

        {/* Save Button */}
        <button
          onClick={saveDrawing}
          disabled={!hasDrawings}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-[#00F6E5] to-[#00d4c5] text-[#0A0A0A] font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#00F6E5]/30 transition-all"
        >
          Save Drawing
        </button>

        {/* Export Options */}
        <div className="mt-3 flex gap-2">
          <button className="flex-1 py-2 rounded-lg bg-[#1B1E20] text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            Export to Flashcard
          </button>
          <button className="flex-1 py-2 rounded-lg bg-[#1B1E20] text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            Export to Quiz
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[#1B1E20]">
        <div className="flex items-center justify-between text-[10px] text-slate-600">
          <span>
            <span className="font-mono bg-[#1B1E20] px-1.5 py-0.5 rounded">D</span> Toggle draw mode
          </span>
          <span>
            <span className="font-mono bg-[#1B1E20] px-1.5 py-0.5 rounded">Esc</span> Cancel
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function DrawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

function UndoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default TelestratorDock;








