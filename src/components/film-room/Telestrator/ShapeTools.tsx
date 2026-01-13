"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SHAPE TOOLS — Additional Shape Options
// Fill, opacity, and other shape-specific settings
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';

export function ShapeTools() {
  const [fill, setFill] = useState(false);
  const [opacity, setOpacity] = useState(1);

  return (
    <div className="space-y-3">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block">
        Shape Options
      </span>

      {/* Fill Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Fill Shape</span>
        <button
          onClick={() => setFill(!fill)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            fill ? 'bg-[#00F6E5]' : 'bg-[#1B1E20]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              fill ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Opacity Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Opacity</span>
          <span className="text-xs text-slate-500 tabular-nums">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-[#1B1E20] cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#00F6E5]
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-[#00F6E5]/30
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Animation Options */}
      <div>
        <span className="text-xs text-slate-400 block mb-2">Animation</span>
        <div className="flex gap-2">
          {['none', 'draw', 'pulse', 'flash'].map((anim) => (
            <button
              key={anim}
              className="flex-1 px-2 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#1B1E20] text-slate-400 hover:bg-[#00F6E5]/15 hover:text-[#00F6E5] transition-colors"
            >
              {anim}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShapeTools;








