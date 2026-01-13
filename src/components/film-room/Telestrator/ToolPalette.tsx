"use client";

// ═══════════════════════════════════════════════════════════════════════════
// TOOL PALETTE — Drawing Tool Selection
// Primary tools for telestrator drawing
// ═══════════════════════════════════════════════════════════════════════════

import { useFilmRoom } from '../FilmRoomContext';
import type { DrawingTool } from '../types';

const TOOLS: { key: DrawingTool; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: 'pen',
    label: 'Pen',
    icon: <PenIcon />,
    description: 'Freehand drawing',
  },
  {
    key: 'arrow',
    label: 'Arrow',
    icon: <ArrowIcon />,
    description: 'Direction arrows',
  },
  {
    key: 'line',
    label: 'Line',
    icon: <LineIcon />,
    description: 'Straight lines',
  },
  {
    key: 'route',
    label: 'Route',
    icon: <RouteIcon />,
    description: 'Route paths (dashed)',
  },
  {
    key: 'circle',
    label: 'Circle',
    icon: <CircleIcon />,
    description: 'Circle highlights',
  },
  {
    key: 'rectangle',
    label: 'Box',
    icon: <RectIcon />,
    description: 'Rectangle highlights',
  },
  {
    key: 'playerSpot',
    label: 'Player',
    icon: <PlayerIcon />,
    description: 'Player spot markers',
  },
  {
    key: 'text',
    label: 'Text',
    icon: <TextIcon />,
    description: 'Text labels',
  },
  {
    key: 'eraser',
    label: 'Eraser',
    icon: <EraserIcon />,
    description: 'Erase elements',
  },
];

export function ToolPalette() {
  const { telestratorState, setTool } = useFilmRoom();

  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3 block">
        Tools
      </span>
      <div className="grid grid-cols-3 gap-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.key}
            onClick={() => setTool(tool.key)}
            className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border transition-all ${
              telestratorState.tool === tool.key
                ? 'bg-[#00F6E5]/15 border-[#00F6E5]/30 text-[#00F6E5]'
                : 'border-transparent hover:bg-[#1B1E20] text-slate-400 hover:text-white'
            }`}
            title={tool.description}
          >
            <span className="h-5 w-5">{tool.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {tool.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOL ICONS
// ═══════════════════════════════════════════════════════════════════════════

function PenIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="15 5 19 5 19 9" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="4 2">
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V7" />
      <path d="M7 12l5-5 5 5" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function RectIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

function PlayerIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="8" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="10"
        fill="currentColor"
        stroke="none"
      >
        X
      </text>
    </svg>
  );
}

function TextIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 20H9l-7-7 5-5 7 7" />
      <path d="M14 11l5-5" />
      <path d="M18 7l2-2" />
    </svg>
  );
}

export default ToolPalette;








