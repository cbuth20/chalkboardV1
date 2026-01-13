"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  PlayField,
  DiagramPlayer,
  DiagramRoute,
  BlockingAssignment,
  BallCarrierPath,
  HashType,
} from '@/components/playbook-diagram';

// ═══════════════════════════════════════════════════════════════════════════
// DEMO DATA — Sample formations and plays
// 
// COORDINATE SYSTEM:
// - X: 0 → 100 yards (HORIZONTAL, left ↔ right)
// - Y: 0 → 53.3 yards (VERTICAL, top ↕ bottom)
// - LOS at Y ≈ 35
// - Defense above (Y ≈ 20-30)
// - Offense at/below LOS (Y ≈ 35-45)
// - Field center at Y ≈ 26.65
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// RUN PLAY: Inside Zone from 11 Personnel
// ─────────────────────────────────────────────────────────────────────────────

const RUN_OFFENSE: DiagramPlayer[] = [
  // Offensive Line (on LOS at Y=35)
  { id: 'lt', label: 'LT', side: 'offense', x: 42, y: 35 },
  { id: 'lg', label: 'LG', side: 'offense', x: 46, y: 35 },
  { id: 'c', label: 'C', side: 'offense', x: 50, y: 35 },
  { id: 'rg', label: 'RG', side: 'offense', x: 54, y: 35 },
  { id: 'rt', label: 'RT', side: 'offense', x: 58, y: 35 },
  // Tight End (attached right)
  { id: 'te', label: 'TE', side: 'offense', x: 61, y: 35 },
  // QB (under center)
  { id: 'qb', label: 'QB', side: 'offense', x: 50, y: 36.5 },
  // RB (I-formation depth)
  { id: 'rb', label: 'RB', side: 'offense', x: 50, y: 42 },
  // Receivers
  { id: 'x', label: 'X', side: 'offense', x: 30, y: 35 }, // Split end left
  { id: 'z', label: 'Z', side: 'offense', x: 68, y: 36 }, // Flanker right
];

const RUN_DEFENSE: DiagramPlayer[] = [
  // Defensive Line (4-3 front)
  { id: 'de1', label: 'DE', side: 'defense', x: 41, y: 33 },
  { id: 'dt1', label: 'DT', side: 'defense', x: 47, y: 33 },
  { id: 'dt2', label: 'DT', side: 'defense', x: 53, y: 33 },
  { id: 'de2', label: 'DE', side: 'defense', x: 59, y: 33 },
  // Linebackers
  { id: 'wlb', label: 'W', side: 'defense', x: 43, y: 28 },
  { id: 'mlb', label: 'M', side: 'defense', x: 50, y: 28 },
  { id: 'slb', label: 'S', side: 'defense', x: 57, y: 28 },
  // Secondary
  { id: 'cb1', label: 'CB', side: 'defense', x: 30, y: 27 },
  { id: 'cb2', label: 'CB', side: 'defense', x: 68, y: 27 },
  { id: 'fs', label: 'FS', side: 'defense', x: 50, y: 20 },
  { id: 'ss', label: 'SS', side: 'defense', x: 58, y: 23 },
];

const RUN_BLOCKING: BlockingAssignment[] = [
  // Inside Zone blocking scheme
  { blockerId: 'lt', targetId: 'de1', type: 'reach' },
  { blockerId: 'lg', targetId: 'dt1', type: 'combo' },
  { blockerId: 'c', targetId: 'dt1', type: 'combo' }, // Combo to Mike
  { blockerId: 'rg', targetId: 'dt2', type: 'drive' },
  { blockerId: 'rt', targetId: 'de2', type: 'reach' },
  { blockerId: 'te', targetId: 'slb', type: 'drive' },
];

const RUN_BALL_CARRIER: BallCarrierPath = {
  playerId: 'rb',
  points: [
    { x: 50, y: 42 },   // Start
    { x: 51, y: 38 },   // Cut
    { x: 53, y: 32 },   // Through hole
    { x: 55, y: 24 },   // Upfield
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PASS PLAY: Smash Concept from Trips Right
// ─────────────────────────────────────────────────────────────────────────────

const PASS_OFFENSE: DiagramPlayer[] = [
  // Offensive Line
  { id: 'lt', label: 'LT', side: 'offense', x: 42, y: 35 },
  { id: 'lg', label: 'LG', side: 'offense', x: 46, y: 35 },
  { id: 'c', label: 'C', side: 'offense', x: 50, y: 35 },
  { id: 'rg', label: 'RG', side: 'offense', x: 54, y: 35 },
  { id: 'rt', label: 'RT', side: 'offense', x: 58, y: 35 },
  // QB (shotgun)
  { id: 'qb', label: 'QB', side: 'offense', x: 50, y: 40 },
  // RB
  { id: 'rb', label: 'RB', side: 'offense', x: 46, y: 40 },
  // Trips right receivers
  { id: 'x', label: 'X', side: 'offense', x: 30, y: 35 },  // Solo left
  { id: 'h', label: 'H', side: 'offense', x: 60, y: 35 },  // #1 trips
  { id: 'y', label: 'Y', side: 'offense', x: 63, y: 36 },  // #2 trips (slot)
  { id: 'z', label: 'Z', side: 'offense', x: 70, y: 35 },  // #3 trips (outside)
];

const PASS_ROUTES: DiagramRoute[] = [
  // X - Go route (clear out)
  {
    playerId: 'x',
    points: [
      { x: 30, y: 35 },
      { x: 30, y: 18 },
    ],
    label: 'GO',
  },
  // Z - Corner route (deep)
  {
    playerId: 'z',
    points: [
      { x: 70, y: 35 },
      { x: 70, y: 28 },
      { x: 75, y: 18 },
    ],
    label: 'CORNER',
  },
  // H - Hitch route (underneath)
  {
    playerId: 'h',
    points: [
      { x: 60, y: 35 },
      { x: 60, y: 30 },
    ],
    label: 'HITCH',
  },
  // Y - Flat route
  {
    playerId: 'y',
    points: [
      { x: 63, y: 36 },
      { x: 68, y: 38 },
    ],
    label: 'FLAT',
  },
  // RB - Check/release
  {
    playerId: 'rb',
    points: [
      { x: 46, y: 40 },
      { x: 42, y: 38 },
      { x: 38, y: 35 },
    ],
    label: 'CHECK',
    color: '#A855F7',
  },
];

// Optional defense for pass play visualization
const PASS_DEFENSE: DiagramPlayer[] = [
  // Cover 2 shell
  { id: 'de1', label: 'DE', side: 'defense', x: 41, y: 33 },
  { id: 'dt1', label: 'DT', side: 'defense', x: 47, y: 33 },
  { id: 'dt2', label: 'DT', side: 'defense', x: 53, y: 33 },
  { id: 'de2', label: 'DE', side: 'defense', x: 59, y: 33 },
  { id: 'mlb', label: 'M', side: 'defense', x: 50, y: 28 },
  { id: 'wlb', label: 'W', side: 'defense', x: 42, y: 29 },
  { id: 'slb', label: 'S', side: 'defense', x: 58, y: 29 },
  { id: 'cb1', label: 'CB', side: 'defense', x: 30, y: 30 },
  { id: 'cb2', label: 'CB', side: 'defense', x: 70, y: 30 },
  { id: 'fs', label: 'FS', side: 'defense', x: 40, y: 18 },
  { id: 'ss', label: 'SS', side: 'defense', x: 60, y: 18 },
];

// ═══════════════════════════════════════════════════════════════════════════
// DEMO PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function DiagramDemoPage() {
  const [hashType, setHashType] = useState<HashType>('NFL');
  const [showPassDefense, setShowPassDefense] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/playbook"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back to Playbook</span>
              </Link>
              <div className="h-6 w-px bg-[#1B1E20]" />
              <h1 className="text-lg font-bold tracking-wide">
                <span className="text-[#00F6E5]">PlayField</span> Component Demo
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-mono">
                Coordinate System: X(0→100) horizontal, Y(0→53.3) vertical
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Controls */}
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border border-[#1B1E20] bg-[#0D1117] p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Hash Type:</span>
            <div className="flex rounded-lg border border-[#1B1E20] bg-[#0A0A0A] p-1">
              {(['NFL', 'NCAA', 'HIGH_SCHOOL'] as HashType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setHashType(type)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-all ${
                    hashType === type
                      ? 'bg-[#00F6E5]/20 text-[#00F6E5]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="h-6 w-px bg-[#1B1E20]" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPassDefense}
              onChange={(e) => setShowPassDefense(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-[#00F6E5] focus:ring-[#00F6E5]/20"
            />
            <span className="text-sm text-slate-400">Show Defense on Pass Play</span>
          </label>
        </div>

        {/* Diagrams Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Run Play Diagram */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                <span className="text-amber-400">Inside Zone</span>
                <span className="ml-2 text-sm font-normal text-slate-500">11 Personnel</span>
              </h2>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400">
                RUN PLAY
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Run diagram with offense + defense + blocking arrows + ball carrier path.
              Blocking scheme shown with yellow arrows.
            </p>
            <div className="rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/30 to-transparent p-4">
              <PlayField
                mode="run"
                hashType={hashType}
                offensePlayers={RUN_OFFENSE}
                defensePlayers={RUN_DEFENSE}
                blocking={RUN_BLOCKING}
                ballCarrierPath={RUN_BALL_CARRIER}
                losY={35}
                viewBox={[25, 15, 50, 35]}
              />
            </div>
            <div className="rounded-lg bg-[#0D1117] p-3 font-mono text-xs text-slate-500">
              <pre>{`<PlayField
  mode="run"
  offensePlayers={offense}
  defensePlayers={defense}
  blocking={blockingAssignments}
  ballCarrierPath={carrierPath}
/>`}</pre>
            </div>
          </div>

          {/* Pass Play Diagram */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                <span className="text-cyan-400">Smash Concept</span>
                <span className="ml-2 text-sm font-normal text-slate-500">Trips Right</span>
              </h2>
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-400">
                PASS PLAY
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Pass diagram with offense + routes. Defense can be toggled on for coverage visualization.
              Corner/Hitch combo read on the right side.
            </p>
            <div className="rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/30 to-transparent p-4">
              <PlayField
                mode="pass"
                hashType={hashType}
                offensePlayers={PASS_OFFENSE}
                defensePlayers={PASS_DEFENSE}
                routes={PASS_ROUTES}
                showDefense={showPassDefense}
                losY={35}
                viewBox={[25, 15, 50, 35]}
              />
            </div>
            <div className="rounded-lg bg-[#0D1117] p-3 font-mono text-xs text-slate-500">
              <pre>{`<PlayField
  mode="pass"
  offensePlayers={offense}
  routes={passRoutes}
  showDefense={${showPassDefense}}
/>`}</pre>
            </div>
          </div>
        </div>

        {/* Coordinate System Reference */}
        <div className="mt-12 rounded-xl border border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/30 to-transparent p-6">
          <h3 className="mb-4 text-lg font-bold">Coordinate System Reference</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold text-[#00F6E5]">World Coordinates</h4>
              <ul className="space-y-1 text-sm text-slate-400">
                <li>• <strong>X-axis:</strong> 0 → 100 yards (HORIZONTAL)</li>
                <li>• <strong>Y-axis:</strong> 0 → 53.3 yards (VERTICAL)</li>
                <li>• <strong>Center:</strong> X=50, Y=26.65</li>
                <li>• <strong>LOS:</strong> typically Y ≈ 35</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-amber-400">Formation Layout</h4>
              <ul className="space-y-1 text-sm text-slate-400">
                <li>• <strong>Defense:</strong> Y ≈ 18-33 (above LOS)</li>
                <li>• <strong>LOS:</strong> Y = 35</li>
                <li>• <strong>Offense:</strong> Y ≈ 35-45 (at/below LOS)</li>
                <li>• <strong>Backfield:</strong> Y ≈ 38-45</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-purple-400">Key Rules</h4>
              <ul className="space-y-1 text-sm text-slate-400">
                <li>• svgX = worldX (NO SWAP)</li>
                <li>• svgY = worldY (NO SWAP)</li>
                <li>• NEVER rotate the field</li>
                <li>• ALWAYS landscape orientation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Variations */}
        <div className="mt-12">
          <h3 className="mb-6 text-lg font-bold">Additional ViewBox Examples</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Wide view */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-400">Wide View (60 yards)</h4>
              <PlayField
                mode="pass"
                hashType={hashType}
                offensePlayers={PASS_OFFENSE}
                routes={PASS_ROUTES}
                losY={35}
                viewBox={[20, 12, 60, 40]}
              />
              <code className="text-xs text-slate-600">viewBox=[20, 12, 60, 40]</code>
            </div>
            {/* Tight view */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-400">Tight View (35 yards)</h4>
              <PlayField
                mode="run"
                hashType={hashType}
                offensePlayers={RUN_OFFENSE}
                defensePlayers={RUN_DEFENSE}
                blocking={RUN_BLOCKING}
                ballCarrierPath={RUN_BALL_CARRIER}
                losY={35}
                viewBox={[35, 20, 35, 28]}
              />
              <code className="text-xs text-slate-600">viewBox=[35, 20, 35, 28]</code>
            </div>
            {/* Full width */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-400">Full Width (100 yards)</h4>
              <PlayField
                mode="pass"
                hashType={hashType}
                offensePlayers={PASS_OFFENSE}
                routes={PASS_ROUTES}
                losY={35}
                viewBox={[0, 10, 100, 40]}
              />
              <code className="text-xs text-slate-600">viewBox=[0, 10, 100, 40]</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}







