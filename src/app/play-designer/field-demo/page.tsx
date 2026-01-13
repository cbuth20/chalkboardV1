"use client";

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FootballField,
  PlayerMarker,
  RouteLine,
  HashType,
  Point,
  FIELD_DIMENSIONS,
} from '@/components/play-designer/field';

// ═══════════════════════════════════════════════════════════════════════════
// DEMO DATA
// 
// COORDINATE SYSTEM:
// - X-axis: 0 → 120 yards (HORIZONTAL, left end zone to right end zone)
// - Y-axis: 0 → 53.3 yards (VERTICAL, top sideline to bottom sideline)
// 
// For a Trips Right formation at the 25-yard line (LOS at X=35):
// - Players are positioned at X=35 (on the LOS)
// - Y positions spread them across the field width
// - Routes go downfield (decreasing X toward X=0)
// ═══════════════════════════════════════════════════════════════════════════

type DemoPlayer = {
  id: string;
  label: string;
  side: 'offense' | 'defense';
  position: Point;
};

type DemoRoute = {
  playerId: string;
  points: Point[];
  color: string;
  label: string;
};

// Sample offensive formation (Trips Right from 25-yard line, LOS at X=35)
const DEMO_OFFENSE: DemoPlayer[] = [
  // Offensive Line - spread along the Y-axis at the LOS (X=35)
  { id: 'lt', label: 'LT', side: 'offense', position: { x: 35, y: 22.65 } },
  { id: 'lg', label: 'LG', side: 'offense', position: { x: 35, y: 24.65 } },
  { id: 'c', label: 'C', side: 'offense', position: { x: 35, y: 26.65 } },
  { id: 'rg', label: 'RG', side: 'offense', position: { x: 35, y: 28.65 } },
  { id: 'rt', label: 'RT', side: 'offense', position: { x: 35, y: 30.65 } },
  // QB - behind the LOS (higher X)
  { id: 'qb', label: 'QB', side: 'offense', position: { x: 40, y: 26.65 } },
  // RB - in backfield (higher X)
  { id: 'rb', label: 'RB', side: 'offense', position: { x: 43, y: 26.65 } },
  // Receivers - at LOS spread across width
  { id: 'x', label: 'X', side: 'offense', position: { x: 35, y: 5 } },  // Split end (top sideline)
  { id: 'z', label: 'Z', side: 'offense', position: { x: 35, y: 48 } }, // Flanker (bottom sideline)
  { id: 'y', label: 'Y', side: 'offense', position: { x: 35, y: 40 } }, // Slot
  { id: 'f', label: 'F', side: 'offense', position: { x: 35, y: 44 } }, // Far slot
];

// Sample defensive coverage (in front of LOS, lower X values)
const DEMO_DEFENSE: DemoPlayer[] = [
  // D-Line - just ahead of LOS
  { id: 'de1', label: 'DE', side: 'defense', position: { x: 34, y: 22 } },
  { id: 'dt1', label: 'DT', side: 'defense', position: { x: 34, y: 25 } },
  { id: 'dt2', label: 'DT', side: 'defense', position: { x: 34, y: 28 } },
  { id: 'de2', label: 'DE', side: 'defense', position: { x: 34, y: 31 } },
  // Linebackers - deeper (lower X)
  { id: 'mlb', label: 'M', side: 'defense', position: { x: 30, y: 26.65 } },
  { id: 'wlb', label: 'W', side: 'defense', position: { x: 31, y: 20 } },
  { id: 'slb', label: 'S', side: 'defense', position: { x: 31, y: 33 } },
  // Secondary - deepest (lowest X)
  { id: 'cb1', label: 'CB', side: 'defense', position: { x: 28, y: 5 } },
  { id: 'cb2', label: 'CB', side: 'defense', position: { x: 28, y: 48 } },
  { id: 'fs', label: 'FS', side: 'defense', position: { x: 20, y: 26.65 } },
  { id: 'ss', label: 'SS', side: 'defense', position: { x: 25, y: 38 } },
];

// Sample routes (going downfield = decreasing X)
const DEMO_ROUTES: DemoRoute[] = [
  {
    playerId: 'x',
    points: [
      { x: 35, y: 5 },     // Start at LOS
      { x: 25, y: 5 },     // Go downfield
      { x: 18, y: 12 },    // Break inside (toward center, increasing Y)
    ],
    color: '#00F6E5',
    label: 'CORNER',
  },
  {
    playerId: 'z',
    points: [
      { x: 35, y: 48 },    // Start at LOS
      { x: 15, y: 48 },    // Go straight downfield
    ],
    color: '#00F6E5',
    label: 'GO',
  },
  {
    playerId: 'y',
    points: [
      { x: 35, y: 40 },    // Start at LOS
      { x: 25, y: 40 },    // Vertical stem
      { x: 22, y: 26.65 }, // Break in (toward center)
    ],
    color: '#00F6E5',
    label: 'DIG',
  },
  {
    playerId: 'f',
    points: [
      { x: 35, y: 44 },    // Start at LOS
      { x: 33, y: 50 },    // Flat route (toward sideline)
    ],
    color: '#00F6E5',
    label: 'FLAT',
  },
  {
    playerId: 'rb',
    points: [
      { x: 43, y: 26.65 }, // Start in backfield
      { x: 40, y: 20 },    // Swing out
      { x: 30, y: 15 },    // Continue upfield
    ],
    color: '#A855F7',
    label: 'SWING',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DEMO PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function FieldDemoPage() {
  const [hashType, setHashType] = useState<HashType>('NFL');
  const [losX, setLosX] = useState(35);
  const [showLOS, setShowLOS] = useState(true);
  const [showDepthLines, setShowDepthLines] = useState(false);
  const [showEndZones, setShowEndZones] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showOffense, setShowOffense] = useState(true);
  const [showDefense, setShowDefense] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const visiblePlayers = [
    ...(showOffense ? DEMO_OFFENSE : []),
    ...(showDefense ? DEMO_DEFENSE : []),
  ];

  const handleFieldClick = useCallback((point: Point) => {
    console.log('Field clicked at:', point);
    setSelectedPlayerId(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/play-designer/create"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <BackIcon />
                <span className="text-sm">Back to Designer</span>
              </Link>
              <div className="h-6 w-px bg-[#1B1E20]" />
              <h1 className="text-lg font-bold tracking-wide">
                <span className="text-[#00F6E5]">Football Field</span> Component Demo
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              viewBox: 0 0 {FIELD_DIMENSIONS.LENGTH} {FIELD_DIMENSIONS.WIDTH}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Field Container */}
          <div className="space-y-6">
            {/* Desktop/Tablet View */}
            <div className="rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/50 to-transparent p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                  Responsive Field Preview
                </h2>
                <span className="text-xs text-slate-600">
                  Pinch to zoom • Drag to pan
                </span>
              </div>

              {/* 
                CRITICAL: The FootballField component handles its own aspect ratio.
                The parent just provides width constraints.
              */}
              <FootballField
                hashType={hashType}
                losX={losX}
                showLOS={showLOS}
                showDepthLines={showDepthLines}
                showEndZones={showEndZones}
                showNumbers={showNumbers}
                showGrid={showGrid}
                onFieldClick={handleFieldClick}
              >
                {/* Players */}
                {visiblePlayers.map((player) => (
                  <PlayerMarker
                    key={player.id}
                    id={player.id}
                    x={player.position.x}
                    y={player.position.y}
                    label={player.label}
                    side={player.side}
                    isSelected={selectedPlayerId === player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                  />
                ))}

                {/* Routes */}
                {showRoutes &&
                  DEMO_ROUTES.map((route) => (
                    <RouteLine
                      key={route.playerId}
                      points={route.points}
                      color={route.color}
                      label={route.label}
                    />
                  ))}
              </FootballField>
            </div>

            {/* Mobile Preview (simulated 375px width) */}
            <div className="rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/50 to-transparent p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">
                Mobile Preview (375px width)
              </h2>
              
              {/* 
                Mobile container - 375px max width
                The FootballField inside will be 375px wide × ~166px tall (375 * 53.3/120)
                This maintains the SAME landscape orientation, just smaller
              */}
              <div className="mx-auto" style={{ maxWidth: '375px' }}>
                <FootballField
                  hashType={hashType}
                  losX={losX}
                  showLOS={showLOS}
                  showEndZones={false}
                  showNumbers={showNumbers}
                >
                  {showOffense &&
                    DEMO_OFFENSE.map((player) => (
                      <PlayerMarker
                        key={player.id}
                        {...player}
                        x={player.position.x}
                        y={player.position.y}
                        isSelected={selectedPlayerId === player.id}
                        onClick={() => setSelectedPlayerId(player.id)}
                      />
                    ))}
                </FootballField>
              </div>
            </div>

            {/* Coordinate System Info */}
            <div className="rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/50 to-transparent p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">
                Coordinate System Reference
              </h2>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold text-[#00F6E5]">World Coordinates (Yards)</h3>
                  <ul className="space-y-1 text-slate-400">
                    <li>• X-axis: 0 → 120 (HORIZONTAL, left to right)</li>
                    <li>• Y-axis: 0 → 53.3 (VERTICAL, top to bottom)</li>
                    <li>• End zones: X=0-10 and X=110-120</li>
                    <li>• Playing field: X=10-110</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-[#F5C253]">Orientation Rules</h3>
                  <ul className="space-y-1 text-slate-400">
                    <li>• Field is ALWAYS landscape (wider than tall)</li>
                    <li>• Aspect ratio: 120:53.3 ≈ 2.25:1</li>
                    <li>• NO rotation transforms allowed</li>
                    <li>• All text reads left-to-right</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-4">
            {/* Field Settings */}
            <ControlPanel title="Field Settings">
              <ToggleControl
                label="Hash Type"
                options={['NFL', 'YOUTH'] as HashType[]}
                value={hashType}
                onChange={setHashType}
              />
              <SliderControl
                label={`LOS Position: ${losX} yards`}
                min={15}
                max={105}
                value={losX}
                onChange={setLosX}
              />
              <CheckboxControl
                label="Show Line of Scrimmage"
                checked={showLOS}
                onChange={setShowLOS}
              />
              <CheckboxControl
                label="Show Depth Lines"
                checked={showDepthLines}
                onChange={setShowDepthLines}
              />
              <CheckboxControl
                label="Show End Zones"
                checked={showEndZones}
                onChange={setShowEndZones}
              />
              <CheckboxControl
                label="Show Yard Numbers"
                checked={showNumbers}
                onChange={setShowNumbers}
              />
              <CheckboxControl
                label="Show Debug Grid"
                checked={showGrid}
                onChange={setShowGrid}
              />
            </ControlPanel>

            {/* Player Visibility */}
            <ControlPanel title="Player Visibility">
              <CheckboxControl
                label="Show Offense"
                checked={showOffense}
                onChange={setShowOffense}
              />
              <CheckboxControl
                label="Show Defense"
                checked={showDefense}
                onChange={setShowDefense}
              />
              <CheckboxControl
                label="Show Routes"
                checked={showRoutes}
                onChange={setShowRoutes}
              />
            </ControlPanel>

            {/* Selected Player Info */}
            {selectedPlayerId && (
              <ControlPanel title="Selected Player">
                <div className="space-y-2 text-sm">
                  {(() => {
                    const player = visiblePlayers.find((p) => p.id === selectedPlayerId);
                    if (!player) return null;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ID:</span>
                          <span className="font-mono text-[#00F6E5]">{player.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Label:</span>
                          <span className="font-semibold">{player.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Position:</span>
                          <span className="font-mono">
                            ({player.position.x.toFixed(1)}, {player.position.y.toFixed(1)})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Side:</span>
                          <span className={player.side === 'offense' ? 'text-[#00F6E5]' : 'text-slate-400'}>
                            {player.side}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                  <button
                    onClick={() => setSelectedPlayerId(null)}
                    className="mt-2 w-full rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800"
                  >
                    Deselect
                  </button>
                </div>
              </ControlPanel>
            )}

            {/* API Reference */}
            <ControlPanel title="Component API">
              <div className="space-y-2 text-xs font-mono text-slate-500">
                <pre className="rounded bg-black/30 p-2 overflow-x-auto">
{`<FootballField
  hashType="${hashType}"
  losX={${losX}}
  showLOS={${showLOS}}
  showNumbers={${showNumbers}}
/>`}
                </pre>
              </div>
            </ControlPanel>
          </div>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ControlPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/50 to-transparent p-4">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CheckboxControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-[#00F6E5]/30' : 'bg-[#1B1E20]'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full transition-transform ${
            checked ? 'translate-x-5 bg-[#00F6E5]' : 'translate-x-0 bg-slate-500'
          }`}
        />
      </button>
    </label>
  );
}

function SliderControl({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#00F6E5]"
      />
    </div>
  );
}

function ToggleControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex rounded-lg border border-[#1B1E20] bg-[#0A0A0A] p-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${
              value === opt
                ? 'bg-[#00F6E5]/20 text-[#00F6E5]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function BackIcon() {
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
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
