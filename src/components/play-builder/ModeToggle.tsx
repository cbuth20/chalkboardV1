'use client';

import { Pencil, Target } from 'lucide-react';
import type { BuilderMode } from '@/types/play-assignments';

interface ModeToggleProps {
  mode: BuilderMode;
  onChange: (mode: BuilderMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-[#0D1117] border border-gray-800 rounded-lg">
      <button
        onClick={() => onChange('draw')}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          mode === 'draw'
            ? 'bg-[#00F6E5] text-black shadow-lg shadow-[#00F6E5]/20'
            : 'bg-[#161B22] text-gray-400 hover:text-white hover:bg-[#1C2128] border border-gray-700'
        }`}
      >
        <Pencil size={20} />
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold">Draw Mode</span>
          <span className={`text-xs ${mode === 'draw' ? 'text-black/70' : 'text-gray-500'}`}>
            Draw routes & paths
          </span>
        </div>
      </button>

      <button
        onClick={() => onChange('assign')}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          mode === 'assign'
            ? 'bg-[#00F6E5] text-black shadow-lg shadow-[#00F6E5]/20'
            : 'bg-[#161B22] text-gray-400 hover:text-white hover:bg-[#1C2128] border border-gray-700'
        }`}
      >
        <Target size={20} />
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold">Assign Mode</span>
          <span className={`text-xs ${mode === 'assign' ? 'text-black/70' : 'text-gray-500'}`}>
            Set assignments
          </span>
        </div>
      </button>

      {/* Mode Description */}
      <div className="mt-2 p-3 bg-[#161B22] border border-gray-700 rounded-lg">
        <p className="text-xs text-gray-400 leading-relaxed">
          {mode === 'draw' ? (
            <>
              <span className="text-[#00F6E5] font-medium">Draw Mode:</span> Click and drag to draw routes,
              blocks, and ball carrier paths on the field.
            </>
          ) : (
            <>
              <span className="text-[#00F6E5] font-medium">Assign Mode:</span> Select a player to define their
              structured assignment, responsibility, and coaching notes.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
