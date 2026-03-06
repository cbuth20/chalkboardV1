"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';
import { STOCK_SCENARIOS } from '@/data/stock-protection-scenarios';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Defender {
  id: string;
  x: number;
  y: number;
  label: string;
  rushing: boolean;
  blitz?: boolean;
  hot?: boolean;
  walked_up?: boolean;
  tb_read?: number;
}

interface ProtectionScenario {
  id: string;
  coverage_name: string;       // front name (e.g., "OVER", "UNDER")
  coverage_type: string;       // zone/man/blitz
  front_family?: string;       // "Odd", "Even", or "5 Down"
  protection_type: string;     // team's actual protection name
  protection_concept: string;  // behavioral classification (full_slide, half_slide, etc.)
  call_side: string;           // "left" or "right"
  solid_call: boolean;
  free_release: boolean;
  play_action: boolean;
  boot: boolean;
  naked: boolean;
  hoss: boolean;
  scat_release: string | null;
  defensive_positions: Record<string, Defender>;
  correct_block_target: string; // defender id or "RELEASE"
  explanation: string;
  coaching_notes?: string;
  offensive_formation?: string;
}

interface PlayResult {
  scenario: ProtectionScenario;
  userAnswer: string;
  correct: boolean;          // block read correct
  responseTime: number;      // block read response time (snap → click)
  frontCorrect: boolean;     // front ID correct
  frontPicked: string | null; // what user picked (null = timeout)
  frontResponseTime: number; // front ID response time
}

interface SessionStats {
  totalReps: number;
  totalCorrect: number;       // block read correct (unchanged for backward compat)
  totalFrontCorrect: number;  // front ID correct count
  totalTime: number;
  byProtection: Record<string, { reps: number; correct: number; totalTime: number }>;
  byFront: Record<string, { reps: number; correct: number; totalTime: number }>;
  sessions: Array<{ date: string; reps: number; correct: number; frontCorrect: number; avgTime: number }>;
}

type Difficulty = 'chill' | 'normal' | 'fast' | 'elite';
type Screen = 'menu' | 'playing' | 'feedback' | 'results' | 'stats';
type PlayPhase = 'call' | 'front_id' | 'pre_snap' | 'snapped';

// Front family categories — every defensive front is one of these three
const FRONT_FAMILIES = ['Odd', 'Even', '5 Down'] as const;

/** Get the front family from scenario data (AI-classified) */
function getScenarioFrontFamily(scenario: ProtectionScenario): string {
  return scenario.front_family || 'Even'; // fallback for old scenarios without front_family
}

const SECONDARY_LABELS = new Set(['CB', 'SS', 'FS', 'R']);
const isSecondary = (label: string) => SECONDARY_LABELS.has(label.toUpperCase());
const LB_LABELS = new Set(['M', 'W', 'S', 'Q']);
const isLB = (label: string) => LB_LABELS.has(label.toUpperCase());

// Backward-compat bridge: infer protection concept from new field, legacy regex, or boolean flags
function inferProtectionConcept(scenario: ProtectionScenario): string {
  if (scenario.protection_concept && scenario.protection_concept !== 'unknown' && scenario.protection_concept !== '') {
    return scenario.protection_concept;
  }
  const pt = scenario.protection_type || '';
  if (/^3[56]/.test(pt)) return 'full_slide';
  if (/^6[45]/.test(pt)) return 'half_slide';
  if (/^(433|432|201|200)$/.test(pt)) return 'play_action';
  if (/^(50|51)$/.test(pt)) return 'full_slide';
  if (scenario.play_action) return 'play_action';
  return 'full_slide';
}

// WR/TE positions by formation keyword — x/y percentages matching the field coordinate system
// OL is at y:65%, so WR/TE sit at y:63-65% (on or just behind LOS)
interface SkillPlayer { x: number; y: number; label: string }
const DEFAULT_SKILL_POSITIONS: SkillPlayer[] = [
  { x: 18, y: 65, label: 'X' },   // split end wide left
  { x: 82, y: 65, label: 'Z' },   // flanker wide right
  { x: 68, y: 65, label: 'Y' },   // TE inline right
];

const FORMATION_SKILL_MAP: Record<string, SkillPlayer[]> = {
  '2x2': [
    { x: 15, y: 65, label: 'X' },
    { x: 30, y: 66, label: 'H' },
    { x: 70, y: 66, label: 'Y' },
    { x: 85, y: 65, label: 'Z' },
  ],
  '3x1': [
    { x: 15, y: 65, label: 'X' },
    { x: 70, y: 66, label: 'H' },
    { x: 78, y: 66, label: 'Y' },
    { x: 88, y: 65, label: 'Z' },
  ],
  'trips': [
    { x: 15, y: 65, label: 'X' },
    { x: 70, y: 66, label: 'H' },
    { x: 78, y: 66, label: 'Y' },
    { x: 88, y: 65, label: 'Z' },
  ],
  'spread': [
    { x: 12, y: 65, label: 'X' },
    { x: 30, y: 66, label: 'H' },
    { x: 70, y: 66, label: 'Y' },
    { x: 88, y: 65, label: 'Z' },
  ],
  'empty': [
    { x: 12, y: 65, label: 'X' },
    { x: 28, y: 66, label: 'H' },
    { x: 50, y: 66, label: 'Y' },
    { x: 72, y: 66, label: 'F' },
    { x: 88, y: 65, label: 'Z' },
  ],
  'ace': [
    { x: 15, y: 65, label: 'X' },
    { x: 85, y: 65, label: 'Z' },
    { x: 67, y: 65, label: 'Y' },
  ],
  'pro': [
    { x: 15, y: 65, label: 'X' },
    { x: 85, y: 65, label: 'Z' },
    { x: 67, y: 65, label: 'Y' },
  ],
  'shotgun': [
    { x: 15, y: 65, label: 'X' },
    { x: 30, y: 66, label: 'H' },
    { x: 70, y: 66, label: 'Y' },
    { x: 85, y: 65, label: 'Z' },
  ],
  'pistol': [
    { x: 15, y: 65, label: 'X' },
    { x: 30, y: 66, label: 'H' },
    { x: 70, y: 66, label: 'Y' },
    { x: 85, y: 65, label: 'Z' },
  ],
  'bunch': [
    { x: 15, y: 65, label: 'X' },
    { x: 72, y: 66, label: 'H' },
    { x: 76, y: 68, label: 'Y' },
    { x: 80, y: 66, label: 'Z' },
  ],
  'twins': [
    { x: 15, y: 65, label: 'X' },
    { x: 67, y: 65, label: 'Y' },
    { x: 78, y: 66, label: 'H' },
    { x: 85, y: 65, label: 'Z' },
  ],
};

function getSkillPositions(formation: string | undefined): SkillPlayer[] {
  if (!formation) return DEFAULT_SKILL_POSITIONS;
  const lower = formation.toLowerCase();
  for (const [key, positions] of Object.entries(FORMATION_SKILL_MAP)) {
    if (lower.includes(key)) return positions;
  }
  return DEFAULT_SKILL_POSITIONS;
}

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE ROTATION — secondary slides when someone blitzes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * When a defender blitzes, the remaining coverage secondary rotates
 * to fill vacated zones. Returns a map of defender id → {dx, dy} offsets.
 *
 * - CB blitz: nearest coverage safety (SS/FS) rotates to cover
 * - SS/FS blitz: nearest coverage safety rotates; if none, nearest CB
 * - LB blitz: no LB movement, only collision avoidance
 * - No two coverage players rotate to the same spot (assigned set)
 */
function computeCoverageRotation(defenders: Defender[]): Record<string, { dx: number; dy: number }> {
  const offsets: Record<string, { dx: number; dy: number }> = {};

  const blitzingSecondary = defenders.filter(d => isSecondary(d.label) && d.blitz);
  const blitzingLBs = defenders.filter(d => !isSecondary(d.label) && d.blitz);

  if (blitzingSecondary.length === 0 && blitzingLBs.length === 0) return offsets;

  const assigned = new Set<string>();

  // Secondary blitzes — only safeties and CBs rotate
  for (const blitzer of blitzingSecondary) {
    const isCBBlitz = blitzer.label.toUpperCase() === 'CB';

    // CB blitz → nearest safety rotates to cover
    // SS/FS blitz → other safeties first, then CBs if no safety available
    const isSafety = (l: string) => { const u = l.toUpperCase(); return u === 'SS' || u === 'FS' || u === 'R'; };
    const candidates = isCBBlitz
      ? defenders.filter(d => isSafety(d.label) && !d.rushing && !assigned.has(d.id))
      : (() => {
          const safeties = defenders.filter(d => isSafety(d.label) && !d.rushing && !assigned.has(d.id));
          return safeties.length > 0
            ? safeties
            : defenders.filter(d => d.label.toUpperCase() === 'CB' && !d.rushing && !assigned.has(d.id));
        })();

    let bestId = '';
    let bestDist = Infinity;

    for (const cov of candidates) {
      // Weight horizontal distance more — zone coverage is about lateral proximity.
      // The field is taller than wide, so raw y% diffs overpower x% visually.
      const dist = Math.sqrt((cov.x - blitzer.x) ** 2 + ((cov.y - blitzer.y) * 0.3) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = cov.id;
      }
    }

    if (!bestId) continue;
    assigned.add(bestId);

    const covPlayer = candidates.find(d => d.id === bestId)!;

    const dx = (blitzer.x - covPlayer.x) * 0.45;
    const dy = Math.min(0, (blitzer.y - covPlayer.y) * 0.3 - 3);

    offsets[bestId] = { dx, dy };
  }

  // Collision avoidance: nudge coverage defenders out of a blitzer's rush lane
  const allBlitzers = [...blitzingSecondary, ...blitzingLBs];
  const allCoverage = defenders.filter(d => !d.rushing);

  for (const cov of allCoverage) {
    const existing = offsets[cov.id] || { dx: 0, dy: 0 };
    const covX = cov.x + existing.dx;

    for (const blitzer of allBlitzers) {
      const xGap = Math.abs(covX - blitzer.x);
      // Only nudge if they're within ~6% horizontally (would visually overlap)
      // and the coverage player is in the blitzer's forward path (between blitzer and LOS)
      if (xGap < 6 && cov.y < blitzer.y + 15 && cov.y > blitzer.y - 5) {
        // Push laterally away from the blitzer
        const nudge = covX >= blitzer.x ? (6 - xGap) : -(6 - xGap);
        offsets[cov.id] = { dx: existing.dx + nudge, dy: existing.dy };
        break; // one nudge per defender
      }
    }
  }

  return offsets;
}

/**
 * Compute post-snap target positions for each OL based on protection scheme.
 * Blocked (rushing + not hot) defenders get matched to the nearest OL.
 * Hot defenders get no OL — they're free runners.
 */
function computeOLAssignments(
  defenders: Record<string, Defender>,
  protectionConcept: string,
  callSide: string,
  correctBlockTarget?: string,
  boot?: boolean,
  naked?: boolean
): Record<string, { x: number; y: number }> {
  const OL_BASE = [
    { label: 'LT', x: 40 },
    { label: 'LG', x: 45 },
    { label: 'C',  x: 50 },
    { label: 'RG', x: 55 },
    { label: 'RT', x: 60 },
  ];

  // Pocket depth: tackles drift back most, guards less, center holds firm
  // Higher y% = further back toward QB (65% is base, QB is at 76%)
  const pocketDepth: Record<string, number> = {
    LT: 3, LG: 1.5, C: 0, RG: 1.5, RT: 3,
  };

  // Blocked defenders = rushing but NOT hot and NOT the correct block target
  // (correct block target is the RB's responsibility — OL doesn't pick them up)
  const blocked = Object.values(defenders)
    .filter(d => d.rushing && !d.hot && d.id !== correctBlockTarget)
    .sort((a, b) => a.x - b.x);

  const result: Record<string, { x: number; y: number }> = {};
  const assigned = new Set<string>();

  // Greedy nearest-match: each blocked defender gets the closest available OL
  for (const def of blocked) {
    let best: typeof OL_BASE[0] | null = null;
    let bestDist = Infinity;

    for (const ol of OL_BASE) {
      if (assigned.has(ol.label)) continue;
      const d = Math.abs(ol.x - def.x);
      if (d < bestDist) {
        bestDist = d;
        best = ol;
      }
    }

    if (best && bestDist <= 20) {
      assigned.add(best.label);
      // OL moves 45% toward defender's x, drifts back to form pocket
      result[best.label] = {
        x: best.x + (def.x - best.x) * 0.45,
        y: 66 + pocketDepth[best.label],
      };
    }
  }

  // Determine which OL should slide and how much
  const isFullSlide = protectionConcept === 'full_slide' || protectionConcept === 'unknown';
  const isHalfSlide = protectionConcept === 'half_slide';
  const slideAmount = callSide === 'right' ? 2.5 : -2.5;

  const slideSideOL = new Set<string>();
  if (isFullSlide) {
    // Full slide: all 5 OL shift together
    OL_BASE.forEach(ol => slideSideOL.add(ol.label));
  } else if (isHalfSlide) {
    // Half slide: C + 2 toward call side
    slideSideOL.add('C');
    if (callSide === 'right') {
      slideSideOL.add('RG');
      slideSideOL.add('RT');
    } else {
      slideSideOL.add('LG');
      slideSideOL.add('LT');
    }
  }

  // Build final positions — slide is additive to engagement
  // Engaged OL: move toward defender + slide bias
  // Unengaged OL: hold base position + slide bias
  for (const ol of OL_BASE) {
    const slide = slideSideOL.has(ol.label) ? slideAmount : 0;

    if (assigned.has(ol.label)) {
      // Already computed engagement x — add slide on top
      result[ol.label].x += slide;
    } else {
      // Unengaged: base position + slide
      result[ol.label] = {
        x: ol.x + slide,
        y: 66 + pocketDepth[ol.label],
      };
    }
  }

  // Pulling guard on non-naked boot: backside guard pulls to lead-block for QB
  // QB boots OPPOSITE call_side, so backside guard is ON the call_side
  if (boot && !naked) {
    const pullGuard = callSide === 'right' ? 'RG' : 'LG';
    // Pull to the boot side, leading the QB
    const pullX = callSide === 'right' ? 38 : 62;
    result[pullGuard] = { x: pullX, y: 80 };
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// MIKE DESIGNATION — QB pre-snap identification of the "Mike" linebacker
// ═══════════════════════════════════════════════════════════════════════════

function computeMikeDesignation(
  defenders: Record<string, Defender>,
  protectionConcept: string,
  callSide: string
): string | null {
  const LB_LABELS = new Set(['M', 'W', 'S', 'Q']);
  // API data may not include .id on objects — use the map key as fallback
  const all = Object.entries(defenders).map(([key, d]) => ({ ...d, id: d.id || key }));
  const candidates = all.filter(d =>
    LB_LABELS.has(d.label.toUpperCase()) ||
    (d.walked_up && ['SS', 'FS', 'R'].includes(d.label.toUpperCase()))
  );

  if (candidates.length === 0) return null;

  const isHalfSlide = protectionConcept === 'half_slide';

  // For half-slide: prefer man-side (away from call) candidates
  let pool = candidates;
  if (isHalfSlide) {
    const manSide = callSide === 'right'
      ? candidates.filter(d => d.x < 50)   // man side is LEFT when call is right
      : candidates.filter(d => d.x > 50);  // man side is RIGHT when call is left
    if (manSide.length > 0) pool = manSide;
  }

  // Sort: closest to center (x:50), then shallowest (highest y = closest to LOS)
  pool.sort((a, b) => {
    const distA = Math.abs(a.x - 50);
    const distB = Math.abs(b.x - 50);
    if (distA !== distB) return distA - distB;
    return b.y - a.y; // higher y = shallower = closer to LOS
  });

  return pool[0].id;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; time: number }> = {
  chill: { label: 'Chill', time: 5000 },
  normal: { label: 'Normal', time: 3500 },
  fast: { label: 'Fast', time: 2500 },
  elite: { label: 'Elite', time: 1800 },
};

const GRADE_TIERS = [
  { min: 100, grade: 'S', label: 'ELITE', color: '#fbbf24' },
  { min: 80, grade: 'A', label: 'PRO BOWL', color: '#00d4aa' },
  { min: 60, grade: 'B', label: 'STARTER', color: '#3b82f6' },
  { min: 40, grade: 'C', label: 'BACKUP', color: '#f97316' },
  { min: 0, grade: 'D', label: 'PRACTICE SQUAD', color: '#ef4444' },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELMET ICON — Top-down football helmet SVG
// ═══════════════════════════════════════════════════════════════════════════

function HelmetIcon({
  label,
  fill,
  stroke,
  strokeWidth = 2.5,
  stripeColor,
  stripeOpacity = 0.4,
  maskColor = '#6b7280',
  maskOpacity = 1,
  textColor,
  fontSize = 13,
  facing = 'down',
}: {
  label: string;
  fill: string;
  stroke: string;
  strokeWidth?: number;
  stripeColor: string;
  stripeOpacity?: number;
  maskColor?: string;
  maskOpacity?: number;
  textColor: string;
  fontSize?: number;
  facing?: 'up' | 'down';
}) {
  const down = facing === 'down';
  // Elongated helmet: 48 wide x 56 tall viewBox
  // Facemask end is narrower (egg shape via path, not ellipse)
  const cy = down ? 24 : 32;
  const glossId = `gloss-${facing}-${label}`;

  return (
    <svg viewBox="0 0 48 56" width="100%" height="100%" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7)) drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
      {/* Helmet shell — elongated egg shape, narrow at facemask end */}
      {down ? (
        <path d="M 24 3 C 6 3, 3 18, 3 26 C 3 34, 8 42, 14 46 Q 24 52 34 46 C 40 42, 45 34, 45 26 C 45 18, 42 3, 24 3 Z"
          fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      ) : (
        <path d="M 24 53 C 6 53, 3 38, 3 30 C 3 22, 8 14, 14 10 Q 24 4 34 10 C 40 14, 45 22, 45 30 C 45 38, 42 53, 24 53 Z"
          fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      )}
      {/* Gloss reflection */}
      <defs>
        <radialGradient id={glossId} cx="50%" cy="30%" rx="50%" ry="40%">
          <stop offset="0%" stopColor="white" stopOpacity={0.18} />
          <stop offset="60%" stopColor="white" stopOpacity={0.06} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Broad soft glow */}
      <ellipse cx={24} cy={cy - 6} rx={14} ry={8} fill={`url(#${glossId})`} />
      {/* Tight specular highlight */}
      <ellipse cx={20} cy={cy - 10} rx={5} ry={2.5} fill="white" opacity={0.14} />
      {/* Double center stripe */}
      <rect x={18} y={down ? 5 : 12} width={3.5} height={down ? 36 : 36} rx={1.75} fill={stripeColor} opacity={stripeOpacity + 0.15} />
      <rect x={26.5} y={down ? 5 : 12} width={3.5} height={down ? 36 : 36} rx={1.75} fill={stripeColor} opacity={stripeOpacity + 0.15} />
      {/* Ear holes */}
      <ellipse cx={4.5} cy={cy} rx={2} ry={3} fill="none" stroke={stroke} strokeWidth={1} opacity={0.4} />
      <ellipse cx={43.5} cy={cy} rx={2} ry={3} fill="none" stroke={stroke} strokeWidth={1} opacity={0.4} />
      {/* Facemask cage */}
      {down ? (
        <>
          <path d="M 14 42 Q 24 54 34 42" fill="none" stroke={maskColor} strokeWidth={2.5} strokeLinecap="round" opacity={maskOpacity} />
          <line x1={17} y1={45} x2={31} y2={45} stroke={maskColor} strokeWidth={2} strokeLinecap="round" opacity={maskOpacity} />
          <line x1={19} y1={48} x2={29} y2={48} stroke={maskColor} strokeWidth={1.5} strokeLinecap="round" opacity={maskOpacity} />
          {/* Vertical cage bars */}
          <line x1={24} y1={42} x2={24} y2={49} stroke={maskColor} strokeWidth={1.2} opacity={maskOpacity * 0.7} />
          <line x1={19} y1={43} x2={18.5} y2={48} stroke={maskColor} strokeWidth={1} opacity={maskOpacity * 0.5} />
          <line x1={29} y1={43} x2={29.5} y2={48} stroke={maskColor} strokeWidth={1} opacity={maskOpacity * 0.5} />
        </>
      ) : (
        <>
          <path d="M 14 14 Q 24 2 34 14" fill="none" stroke={maskColor} strokeWidth={2.5} strokeLinecap="round" opacity={maskOpacity} />
          <line x1={17} y1={11} x2={31} y2={11} stroke={maskColor} strokeWidth={2} strokeLinecap="round" opacity={maskOpacity} />
          <line x1={19} y1={8} x2={29} y2={8} stroke={maskColor} strokeWidth={1.5} strokeLinecap="round" opacity={maskOpacity} />
          {/* Vertical cage bars */}
          <line x1={24} y1={14} x2={24} y2={7} stroke={maskColor} strokeWidth={1.2} opacity={maskOpacity * 0.7} />
          <line x1={19} y1={13} x2={18.5} y2={8} stroke={maskColor} strokeWidth={1} opacity={maskOpacity * 0.5} />
          <line x1={29} y1={13} x2={29.5} y2={8} stroke={maskColor} strokeWidth={1} opacity={maskOpacity * 0.5} />
        </>
      )}
      {/* Position label */}
      <text x={24} y={cy + 1} textAnchor="middle" dy="0.1em" fill={textColor} fontSize={fontSize} fontWeight={800} fontFamily="system-ui, sans-serif">{label}</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface RBProtectionContentProps {
  demoMode?: boolean;
  demoScenarios?: ProtectionScenario[];
}

export function RBProtectionContent({ demoMode = false, demoScenarios }: RBProtectionContentProps = {}) {
  const { session, orgId, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [screen, setScreen] = useState<Screen>('menu');
  const [scenarios, setScenarios] = useState<ProtectionScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUploadedFiles, setHasUploadedFiles] = useState<boolean | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Menu state
  const [selectedProtection, setSelectedProtection] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [useStockScenarios, setUseStockScenarios] = useState(false);

  // Active scenarios: stock or user's custom
  const activeScenarios = useStockScenarios ? (STOCK_SCENARIOS as unknown as ProtectionScenario[]) : scenarios;

  // Playing state
  const [currentScenarios, setCurrentScenarios] = useState<ProtectionScenario[]>([]);
  const [playIndex, setPlayIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const playStartTimeRef = useRef(0);
  const frontIdStartTimeRef = useRef(0);
  const frontResponseTimeRef = useRef(0);
  const [results, setResults] = useState<PlayResult[]>([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Pre-snap phase state
  const [playPhase, setPlayPhase] = useState<PlayPhase>('snapped');
  const [preSnapAnimating, setPreSnapAnimating] = useState(false);
  const [coverageSliding, setCoverageSliding] = useState(false);
  const [postSnapRushing, setPostSnapRushing] = useState(false);
  const [postSnapBreakthrough, setPostSnapBreakthrough] = useState(false);
  const [qbBootPhase, setQbBootPhase] = useState(0); // 0=pre, 1=fake, 2=loop back, 3=boot out
  const [mikeCallout, setMikeCallout] = useState<string | null>(null);
  const [mikeVisible, setMikeVisible] = useState(false);
  const [mikeAnnouncement, setMikeAnnouncement] = useState(false);
  const [callTextVisible, setCallTextVisible] = useState(false);
  const [playersVisible, setPlayersVisible] = useState(false);
  const callPhaseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callTextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playersVisibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preSnapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preSnapAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverageSlideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breakthroughRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootPhase3Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mikeCalloutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Front ID phase state
  const [frontChoices, setFrontChoices] = useState<string[]>([]);
  const [frontIdResult, setFrontIdResult] = useState<'correct' | 'wrong' | null>(null);
  const [frontIdPicked, setFrontIdPicked] = useState<string | null>(null);
  const [frontIdTimer, setFrontIdTimer] = useState(5000);
  const frontIdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frontIdOverlayVisible = useRef(false);
  const [frontIdOverlay, setFrontIdOverlay] = useState(false);
  const [makeReadOverlay, setMakeReadOverlay] = useState(false);
  const makeReadRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [defendersHighlight, setDefendersHighlight] = useState(false);
  const [snapCountdown, setSnapCountdown] = useState<number | null>(null);
  const snapCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Feedback state
  const [lastResult, setLastResult] = useState<PlayResult | null>(null);

  // Stats
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalReps: 0, totalCorrect: 0, totalFrontCorrect: 0, totalTime: 0,
    byProtection: {}, byFront: {}, sessions: [],
  });

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  const statsKey = useStockScenarios ? 'rbProtectionStats_practice' : 'rbProtectionStats';

  // Load stats from localStorage (with backward compat for old data missing front ID fields)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(statsKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.totalFrontCorrect === undefined) parsed.totalFrontCorrect = 0;
        if (parsed.sessions) {
          parsed.sessions = parsed.sessions.map((s: any) => ({
            ...s,
            frontCorrect: s.frontCorrect ?? 0,
          }));
        }
        setSessionStats(parsed);
      } else {
        setSessionStats({ totalReps: 0, totalCorrect: 0, totalFrontCorrect: 0, totalTime: 0, byProtection: {}, byFront: {}, sessions: [] });
      }
    } catch {
      // ignore
    }
  }, [statsKey]);

  const saveSessionStats = (newStats: SessionStats) => {
    setSessionStats(newStats);
    localStorage.setItem(statsKey, JSON.stringify(newStats));
  };

  // Load scenarios on mount
  useEffect(() => {
    if (demoMode && demoScenarios) {
      setScenarios(demoScenarios);
      setLoading(false);
      return;
    }
    if (!authLoading && session && orgId) {
      const timer = setTimeout(() => loadScenarios(), 300);
      return () => clearTimeout(timer);
    } else if (!authLoading && !session) {
      setLoading(false);
    }
  }, [authLoading, session, orgId, demoMode, demoScenarios]);

  const loadScenarios = async () => {
    if (!session?.access_token || !orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/player-block-coverages?orgId=${orgId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const scenarioData = (data.scenarios || []).map((s: any) => ({
          id: s.id,
          coverage_name: s.coverage_name || 'Unknown',
          coverage_type: s.coverage_type || 'all',
          front_family: s.front_family || undefined,
          protection_type: s.protection_type || 'unknown',
          protection_concept: s.protection_concept || '',
          call_side: s.call_side || 'right',
          solid_call: s.solid_call || false,
          free_release: s.free_release || false,
          play_action: s.play_action || false,
          naked: s.naked || false,
          hoss: s.hoss || false,
          scat_release: s.scat_release || null,
          defensive_positions: s.defensive_positions || {},
          correct_block_target: s.correct_block_target || 'RELEASE',
          explanation: s.explanation || s.coaching_notes || '',
          coaching_notes: s.blocking_rules || '',
        }));
        setScenarios(scenarioData);
        setHasUploadedFiles(data.hasAnalyzableFiles ?? false);

        // Pick up analysis status if one was running (e.g., page reload during analysis)
        // Only resume if the analysis started within the last 10 minutes (not a stale record)
        if (data.analysisStatus === 'processing' && data.analysisStartedAt) {
          const startedAt = new Date(data.analysisStartedAt).getTime();
          const ageMinutes = (Date.now() - startedAt) / 60000;
          if (ageMinutes < 10) {
            setAnalysisStatus('processing');
            setAnalyzing(true);
            if (data.analysisError) setAnalysisProgress(data.analysisError);
            setAnalysisId(data.analysisId || null);
            startPolling(data.analysisId);
          }
        }
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    if (!(await confirm({ message: 'This will analyze your playbook PDFs using AI to extract protection scenarios. This may take several minutes. Continue?', confirmLabel: 'Continue' }))) return;
    if (!session?.access_token || !orgId) return;

    setAnalyzing(true);
    setAnalysisStatus('processing');
    try {
      const response = await fetch(`/api/player-protections-analyze?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const err = await response.json();
        const msg = err.error || 'Analysis failed';
        if (msg.includes('No analyzable files')) {
          setAnalysisStatus('idle');
          setAnalyzing(false);
          showToast('No playbook files found. Upload PDFs or images in My Notes first.', 'error');
          return;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      setAnalysisId(data.analysisId);

      // Start polling for completion — pass the specific analysis ID
      startPolling(data.analysisId);
    } catch (error) {
      setAnalysisStatus('failed');
      setAnalyzing(false);
      showToast(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleClearScenarios = async () => {
    if (!(await confirm({ message: 'Clear all protection scenarios? You will need to re-analyze your playbooks to generate new ones.', variant: 'destructive', confirmLabel: 'Clear All' }))) return;
    if (!session?.access_token || !orgId) return;

    try {
      const response = await fetch(`/api/player-block-coverages?orgId=${orgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error('Failed to clear scenarios');

      setScenarios([]);
      setAnalysisStatus('idle');
      showToast('All scenarios cleared.', 'success');
    } catch (error) {
      showToast(`Failed to clear scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const startPolling = (trackAnalysisId?: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    // Snapshot current scenario IDs so we can detect when new ones replace them
    const idsAtStart = new Set(scenarios.map(s => s.id));
    const countAtStart = scenarios.length;
    // Use the specific analysis ID if provided (from startAnalysis or page-load resume)
    const pollAnalysisId = trackAnalysisId || analysisId;

    let pollTimeout: ReturnType<typeof setTimeout> | null = null;

    const stopPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (pollTimeout) clearTimeout(pollTimeout);
      pollTimeout = null;
    };

    pollRef.current = setInterval(async () => {
      try {
        let pollUrl = `/api/player-block-coverages?orgId=${orgId}`;
        if (pollAnalysisId) pollUrl += `&analysisId=${pollAnalysisId}`;
        const response = await fetch(pollUrl, {
          headers: { Authorization: `Bearer ${session!.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const newScenarios = data.scenarios || [];

          // Update progress message from backend
          if (data.analysisStatus === 'processing' && data.analysisError) {
            setAnalysisProgress(data.analysisError);
          }

          // Check if analysis failed on the backend
          if (data.analysisStatus === 'failed') {
            setAnalysisStatus('failed');
            setAnalysisProgress(null);
            setAnalyzing(false);
            stopPolling();
            showToast(data.analysisError || 'Analysis failed. Please try again.', 'error');
            return;
          }

          // Done when: status is completed, new IDs appear, or count changes from 0 to >0
          const isCompleted = data.analysisStatus === 'completed';
          const hasNewIds = newScenarios.some((s: any) => !idsAtStart.has(s.id));
          const firstAnalysis = countAtStart === 0 && newScenarios.length > 0;

          if (isCompleted || hasNewIds || firstAnalysis) {
            // New scenarios arrived — analysis completed
            const scenarioData = newScenarios.map((s: any) => ({
              id: s.id,
              coverage_name: s.coverage_name || 'Unknown',
              coverage_type: s.coverage_type || 'all',
              front_family: s.front_family || undefined,
              protection_type: s.protection_type || 'unknown',
              protection_concept: s.protection_concept || '',
              call_side: s.call_side || 'right',
              solid_call: s.solid_call || false,
              free_release: s.free_release || false,
              play_action: s.play_action || false,
              naked: s.naked || false,
              hoss: s.hoss || false,
              scat_release: s.scat_release || null,
              defensive_positions: s.defensive_positions || {},
              correct_block_target: s.correct_block_target || 'RELEASE',
              explanation: s.explanation || s.coaching_notes || '',
              coaching_notes: s.blocking_rules || '',
            }));
            setScenarios(scenarioData);
            setAnalysisStatus('completed');
            setAnalysisProgress(null);
            setAnalyzing(false);
            stopPolling();
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 8000); // Poll every 8 seconds

    // Stop polling after 10 minutes
    pollTimeout = setTimeout(() => {
      if (pollRef.current) {
        stopPolling();
        setAnalysisStatus('failed');
        setAnalyzing(false);
      }
    }, 10 * 60 * 1000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Group scenarios by protection type
  const groupedScenarios = activeScenarios.reduce((acc, s) => {
    const type = s.protection_type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(s);
    return acc;
  }, {} as Record<string, ProtectionScenario[]>);

  // Categorize scenarios by concept + boolean flags
  const categorizeScenario = (scenario: ProtectionScenario): string => {
    if (scenario.free_release || scenario.hoss) return 'TB Free Release';
    if (scenario.play_action || scenario.naked) return 'Play Action';
    const concept = inferProtectionConcept(scenario);
    if (concept === 'play_action') return 'Play Action';
    if (concept === 'max_protect') return 'Max Protect';
    if (concept === 'screen') return 'Screen';
    if (concept === 'sprint_out') return 'Sprint Out';
    return 'TB Has Assignment';
  };

  const protectionsByCategory = Object.keys(groupedScenarios).reduce((acc, type) => {
    const cat = categorizeScenario(groupedScenarios[type][0]);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(type);
    return acc;
  }, {} as Record<string, string[]>);

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  const startTraining = () => {
    let pool: ProtectionScenario[];
    if (selectedProtection === 'mix' || selectedProtection === null) {
      pool = [...activeScenarios];
    } else {
      pool = activeScenarios.filter(s => s.protection_type === selectedProtection);
    }

    if (pool.length === 0) {
      showToast('No scenarios available for this protection type.', 'error');
      return;
    }

    // Shuffle and take 5
    const shuffled = shuffleArray(pool).slice(0, 5);
    setCurrentScenarios(shuffled);
    setPlayIndex(0);
    setResults([]);
    setBestStreak(0);
    setCurrentStreak(0);
    startPlay(shuffled[0]);
    setScreen('playing');
  };

  const startPlay = (scenario: ProtectionScenario) => {
    const totalTime = DIFFICULTY_CONFIG[difficulty].time;
    setTimeRemaining(totalTime);

    // Clear any existing timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (callPhaseRef.current) clearTimeout(callPhaseRef.current);
    if (preSnapTimeoutRef.current) clearTimeout(preSnapTimeoutRef.current);
    if (preSnapAnimRef.current) clearTimeout(preSnapAnimRef.current);
    if (coverageSlideRef.current) clearTimeout(coverageSlideRef.current);
    if (breakthroughRef.current) clearTimeout(breakthroughRef.current);
    if (bootPhase3Ref.current) clearTimeout(bootPhase3Ref.current);
    if (mikeCalloutRef.current) clearTimeout(mikeCalloutRef.current);
    if (callTextTimerRef.current) clearTimeout(callTextTimerRef.current);
    if (playersVisibleTimerRef.current) clearTimeout(playersVisibleTimerRef.current);
    if (frontIdTimerRef.current) clearInterval(frontIdTimerRef.current);

    // Reset all animation state
    setPreSnapAnimating(true);
    setCoverageSliding(false);
    setPostSnapRushing(false);
    setPostSnapBreakthrough(false);
    setQbBootPhase(0);
    setDefendersHighlight(false);
    setSnapCountdown(null);
    if (snapCountdownRef.current) clearInterval(snapCountdownRef.current);
    setMikeCallout(null);
    setMikeVisible(false);
    setMikeAnnouncement(false);
    setCallTextVisible(true);
    setPlayersVisible(false);
    setFrontIdResult(null);
    setFrontIdPicked(null);
    setFrontIdTimer(DIFFICULTY_CONFIG[difficulty].time);
    setFrontIdOverlay(false);
    frontIdOverlayVisible.current = false;

    // Generate front ID multiple choice options (always all 3 families)
    setFrontChoices(shuffleArray([...FRONT_FAMILIES]));

    // Phase 1: Show the call screen (protection name + TB side)
    setPlayPhase('call');

    // Players fade in while call text is still showing
    playersVisibleTimerRef.current = setTimeout(() => setPlayersVisible(true), 1200);
    // Call text fades out
    callTextTimerRef.current = setTimeout(() => setCallTextVisible(false), 1600);

    // Phase 2: After 2.2s, show field and ask user to ID the front
    callPhaseRef.current = setTimeout(() => {
      setPlayPhase('front_id');
      frontResponseTimeRef.current = 0;

      // Show "IDENTIFY THE FRONT" overlay immediately
      frontIdOverlayVisible.current = true;
      setFrontIdOverlay(true);

      // After 0.8s, hide overlay and start the front ID countdown
      const frontIdTime = DIFFICULTY_CONFIG[difficulty].time;
      setTimeout(() => {
        setFrontIdOverlay(false);
        frontIdStartTimeRef.current = Date.now();

        const startMs = Date.now();
        frontIdTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startMs;
          const remaining = Math.max(0, frontIdTime - elapsed);
          setFrontIdTimer(remaining);
          if (remaining <= 0) {
            if (frontIdTimerRef.current) clearInterval(frontIdTimerRef.current);
            if (!frontIdOverlayVisible.current) return; // already answered
            frontIdOverlayVisible.current = false;
            frontResponseTimeRef.current = Date.now() - frontIdStartTimeRef.current;
            setFrontIdResult('wrong');
            setFrontIdPicked(null);
            setTimeout(() => beginPreSnap(scenario), 1200);
          }
        }, 50);
      }, 800);
    }, 2200);
  };

  /** Runs the pre-snap → snap sequence after the user identifies the front */
  const beginPreSnap = (scenario: ProtectionScenario) => {
    const totalTime = DIFFICULTY_CONFIG[difficulty].time;
    setPlayPhase('pre_snap');
    setPreSnapAnimating(false);

    // 3-second countdown with overlays:
    // 0–1s: Mike announcement (countdown 3→2)
    // 1–2s: "Make Your Read" + defender highlight (countdown 2→1)
    // 2–3s: clear, countdown finishes
    // 3s: snap

    // Start cadence: DOWN → SET → HIKE
    const cadence = ['DOWN', 'SET', 'HIKE'];
    setSnapCountdown(0);
    let step = 0;
    snapCountdownRef.current = setInterval(() => {
      step++;
      if (step >= cadence.length) {
        if (snapCountdownRef.current) clearInterval(snapCountdownRef.current);
        setSnapCountdown(null);
      } else {
        setSnapCountdown(step);
      }
    }, 1000);

    // Mike announcement: 0–1s
    const mikeId = computeMikeDesignation(
      scenario.defensive_positions,
      inferProtectionConcept(scenario),
      scenario.call_side
    );
    setMikeCallout(mikeId);
    setTimeout(() => {
      setMikeVisible(true);
      setMikeAnnouncement(true);
    }, 100);
    setTimeout(() => setMikeAnnouncement(false), 1000);

    // "Make Your Read" + defender highlight: 1–2s
    setTimeout(() => {
      setMakeReadOverlay(true);
      setDefendersHighlight(true);
    }, 1000);
    setTimeout(() => {
      setMakeReadOverlay(false);
      setDefendersHighlight(false);
    }, 2000);

    // Coverage rotation slide at 900ms
    coverageSlideRef.current = setTimeout(() => {
      setCoverageSliding(true);
    }, 900);

    // After 3s: snap the ball, start the timer
    preSnapTimeoutRef.current = setTimeout(() => {
      setPlayPhase('snapped');
      setPostSnapRushing(true);
      playStartTimeRef.current = Date.now();
      setQbBootPhase(1);

      breakthroughRef.current = setTimeout(() => {
        setPostSnapBreakthrough(true);
        setQbBootPhase(2);
        bootPhase3Ref.current = setTimeout(() => setQbBootPhase(3), 900);
      }, 1000);

      const startMs = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startMs;
        const remaining = Math.max(0, totalTime - elapsed);
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAnswer('TIMEOUT', scenario);
        }
      }, 50);
    }, 3000);
  };

  /** Called when user picks a front in the front_id phase */
  const handleFrontAnswer = (choice: string) => {
    const scenario = currentScenarios[playIndex];
    if (!scenario || frontIdResult) return;

    // Stop the countdown
    if (frontIdTimerRef.current) clearInterval(frontIdTimerRef.current);
    frontIdOverlayVisible.current = false;
    setFrontIdOverlay(false);
    frontResponseTimeRef.current = Date.now() - frontIdStartTimeRef.current;

    const correctFamily = getScenarioFrontFamily(scenario);
    const correct = choice === correctFamily;
    setFrontIdResult(correct ? 'correct' : 'wrong');
    setFrontIdPicked(choice);

    // Brief flash, then move to pre-snap
    setTimeout(() => {
      beginPreSnap(scenario);
    }, correct ? 600 : 1200);
  };

  const handleAnswer = useCallback((answer: string, scenario?: ProtectionScenario) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const current = scenario || currentScenarios[playIndex];
    if (!current) return;

    const rawResponseTime = Date.now() - playStartTimeRef.current;
    // Cap at 30s to prevent corrupted data from bad playStartTime
    const responseTime = rawResponseTime > 0 && rawResponseTime < 30000 ? rawResponseTime : DIFFICULTY_CONFIG[difficulty].time;
    // Normalize defender labels so aliases (R/Rover = SS, $ = Q, etc.) match
    const DEFENDER_ALIASES: Record<string, string> = {
      'R': 'SS', 'ROVER': 'SS', 'ROBBER': 'SS', '$': 'Q', 'STAR': 'Q', 'STUD': 'Q',
    };
    const normalizeLabel = (l: string) => { const u = l.toUpperCase(); return DEFENDER_ALIASES[u] || u; };
    const isCorrect = answer.toUpperCase() === current.correct_block_target.toUpperCase()
      || normalizeLabel(answer) === normalizeLabel(current.correct_block_target);

    const result: PlayResult = {
      scenario: current,
      userAnswer: answer,
      correct: isCorrect,
      responseTime,
      frontCorrect: frontIdResult === 'correct',
      frontPicked: frontIdPicked,
      frontResponseTime: frontResponseTimeRef.current,
    };

    setLastResult(result);
    setResults(prev => [...prev, result]);

    if (isCorrect) {
      setCurrentStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(best => Math.max(best, newStreak));
        return newStreak;
      });
    } else {
      setCurrentStreak(0);
    }

    // Update cumulative stats
    const newStats = { ...sessionStats };
    newStats.totalReps++;
    if (isCorrect) newStats.totalCorrect++;
    if (frontIdResult === 'correct') newStats.totalFrontCorrect++;
    newStats.totalTime += responseTime;

    const pType = current.protection_type || 'unknown';
    if (!newStats.byProtection[pType]) newStats.byProtection[pType] = { reps: 0, correct: 0, totalTime: 0 };
    newStats.byProtection[pType].reps++;
    if (isCorrect) newStats.byProtection[pType].correct++;
    newStats.byProtection[pType].totalTime += responseTime;

    const front = getScenarioFrontFamily(current);
    if (!newStats.byFront[front]) newStats.byFront[front] = { reps: 0, correct: 0, totalTime: 0 };
    newStats.byFront[front].reps++;
    if (isCorrect) newStats.byFront[front].correct++;
    newStats.byFront[front].totalTime += responseTime;

    saveSessionStats(newStats);

    setScreen('feedback');
  }, [currentScenarios, playIndex, sessionStats, frontIdResult, frontIdPicked, difficulty]);

  const nextPlay = () => {
    const nextIdx = playIndex + 1;
    if (nextIdx >= currentScenarios.length) {
      // Save session to history — results already contains all plays including the last one
      const allResultsForSession = results;
      const correctCount = allResultsForSession.filter(r => r.correct).length;
      const totalTimeMs = allResultsForSession.reduce((s, r) => s + r.responseTime, 0);
      const total = allResultsForSession.length;
      const frontCorrectCount = allResultsForSession.filter(r => r.frontCorrect).length;
      const newStats = { ...sessionStats };
      newStats.sessions.push({
        date: new Date().toISOString(),
        reps: total,
        correct: correctCount,
        frontCorrect: frontCorrectCount,
        avgTime: total > 0 ? Math.round(totalTimeMs / total) : 0,
      });
      // Keep last 20 sessions
      if (newStats.sessions.length > 20) newStats.sessions = newStats.sessions.slice(-20);
      saveSessionStats(newStats);

      setScreen('results');
    } else {
      setPlayIndex(nextIdx);
      startPlay(currentScenarios[nextIdx]);
      setScreen('playing');
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (callPhaseRef.current) clearTimeout(callPhaseRef.current);
      if (frontIdTimerRef.current) clearInterval(frontIdTimerRef.current);
      if (preSnapTimeoutRef.current) clearTimeout(preSnapTimeoutRef.current);
      if (preSnapAnimRef.current) clearTimeout(preSnapAnimRef.current);
      if (coverageSlideRef.current) clearTimeout(coverageSlideRef.current);
      if (breakthroughRef.current) clearTimeout(breakthroughRef.current);
      if (mikeCalloutRef.current) clearTimeout(mikeCalloutRef.current);
      if (callTextTimerRef.current) clearTimeout(callTextTimerRef.current);
      if (playersVisibleTimerRef.current) clearTimeout(playersVisibleTimerRef.current);
    };
  }, []);

  // Scroll game container into view on screen/phase transitions
  useEffect(() => {
    if ((screen === 'playing' || screen === 'feedback') && gameContainerRef.current) {
      gameContainerRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    if (screen === 'results') {
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    }
  }, [screen, playIndex, playPhase]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING / AUTH
  // ═══════════════════════════════════════════════════════════════════════════

  if (!demoMode && (authLoading || loading)) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00d4aa]/20 border-t-[#00d4aa]" />
          <p className="text-gray-400">Loading protection trainer...</p>
        </div>
      </div>
    );
  }

  if (!demoMode && !session) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-400">Please log in to access the protection trainer</p>
        </div>
      </div>
    );
  }

  if (demoMode && loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00d4aa]/20 border-t-[#00d4aa]" />
          <p className="text-gray-400">Loading protection trainer...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MENU SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'menu') {
    return (
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚡</div>
          <h2 className="text-4xl font-bold text-white mb-2">PROTECTION IQ</h2>
          <p className="text-gray-400 italic mb-4">The snap starts the play. Preparation finishes it.</p>
          <p className="text-sm text-gray-500">
            Tap the defender you need to block — or release if it's not your job.
          </p>
        </div>

        {/* Analysis Status Banner */}
        {analysisStatus === 'processing' && (
          <div className="bg-[#00d4aa]/5 border border-[#00d4aa]/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 flex-shrink-0 animate-spin rounded-full border-4 border-[#00d4aa]/20 border-t-[#00d4aa]" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#00d4aa] mb-1">Analyzing Playbooks...</h3>
                <p className="text-sm text-gray-400">
                  {analysisProgress || 'Extracting protection schemes, defensive fronts, and RB assignments from your playbook files.'}
                </p>
                <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00d4aa]/60 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${(() => {
                      if (!analysisProgress) return 5;
                      if (analysisProgress.startsWith('Preparing')) return 10;
                      const fileMatch = analysisProgress.match(/Analyzing file (\d+) of (\d+)/);
                      if (fileMatch) {
                        const current = parseInt(fileMatch[1]);
                        const total = parseInt(fileMatch[2]);
                        return 10 + Math.round((current / total) * 75);
                      }
                      if (analysisProgress.startsWith('Saving')) return 90;
                      return 50;
                    })()}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {analysisStatus === 'completed' && scenarios.length > 0 && (
          <div className="bg-green-500/5 border border-green-500/30 rounded-xl p-5 mb-8 flex items-center gap-4">
            <div className="text-3xl">✓</div>
            <div>
              <h3 className="text-lg font-semibold text-green-400">Analysis Complete</h3>
              <p className="text-sm text-gray-400">{scenarios.length} protection scenarios ready to train.</p>
            </div>
          </div>
        )}

        {analysisStatus === 'failed' && (
          <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-5 mb-8 flex items-center gap-4">
            <div className="text-3xl">✗</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400">Analysis Failed</h3>
              <p className="text-sm text-gray-400">Something went wrong. Please try again.</p>
            </div>
            <button
              onClick={startAnalysis}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg text-sm font-semibold transition"
            >
              Retry
            </button>
          </div>
        )}

        {scenarios.length === 0 && analysisStatus === 'processing' ? (
          /* Analysis in progress with no scenarios yet — just show the banner above, nothing else */
          null
        ) : (
          <>
            {/* Mode Toggle — My Playbook vs Practice Mode */}
            {!demoMode && (
              <div className="flex rounded-lg overflow-hidden border border-gray-700 mb-6">
                <button
                  onClick={() => { setUseStockScenarios(false); setSelectedProtection(null); }}
                  className={`flex-1 py-3 text-sm font-semibold transition ${
                    !useStockScenarios
                      ? 'bg-[#00d4aa] text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  My Playbook
                  {scenarios.length > 0 && <span className="ml-1 text-xs opacity-70">({scenarios.length})</span>}
                </button>
                <button
                  onClick={() => { setUseStockScenarios(true); setSelectedProtection(null); }}
                  className={`flex-1 py-3 text-sm font-semibold transition ${
                    useStockScenarios
                      ? 'bg-[#00d4aa] text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Practice Mode
                </button>
              </div>
            )}

            {/* Empty state for My Playbook tab */}
            {!useStockScenarios && scenarios.length === 0 && !demoMode ? (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">No Playbook Scenarios</h3>
                <p className="text-gray-300 mb-4">
                  {hasUploadedFiles
                    ? 'Your playbook files are ready. Analyze them to generate protection scenarios.'
                    : 'Upload your playbook PDFs or images in My Notes, then come back here to analyze them.'}
                </p>
                <div className="flex gap-3">
                  {!hasUploadedFiles ? (
                    <a
                      href="/player-notes"
                      className="px-6 py-3 bg-[#00d4aa] hover:bg-[#00bfa0] text-black font-bold rounded-lg transition text-center"
                    >
                      Go to My Notes
                    </a>
                  ) : (
                    <button
                      onClick={startAnalysis}
                      disabled={analyzing}
                      className="px-6 py-3 bg-[#00d4aa] hover:bg-[#00bfa0] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition"
                    >
                      {analyzing ? 'Starting Analysis...' : 'Analyze Playbooks'}
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Or switch to <button onClick={() => { setUseStockScenarios(true); setSelectedProtection(null); }} className="text-[#00d4aa] hover:underline font-medium">Practice Mode</button> to train with general scenarios.
                </p>
              </div>
            ) : activeScenarios.length > 0 ? (
              <>
                {/* Practice mode banner */}
                {useStockScenarios && (
                  <div className="bg-blue-500/5 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-300">
                      General practice scenarios covering slide, man, and exotic protections.
                      {scenarios.length === 0 && ' Upload your playbook for drills tailored to your team.'}
                    </p>
                  </div>
                )}

                {/* Protection Selection */}
                {Object.entries(protectionsByCategory).map(([category, types]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {types.map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedProtection(selectedProtection === type ? null : type)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            selectedProtection === type
                              ? 'bg-[#00d4aa] text-black'
                              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-[#00d4aa]'
                          }`}
                        >
                          {type} <span className="text-xs opacity-70">({groupedScenarios[type].length})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Mix All Button */}
                <button
                  onClick={() => setSelectedProtection(selectedProtection === 'mix' ? null : 'mix')}
                  className={`w-full py-3 rounded-lg font-bold text-sm transition mb-8 ${
                    selectedProtection === 'mix'
                      ? 'bg-[#00d4aa] text-black'
                      : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-[#00d4aa]'
                  }`}
                >
                  Mix All Protections ({activeScenarios.length} scenarios)
                </button>

                {/* Difficulty Selector */}
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Difficulty</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`py-3 rounded-lg text-sm font-semibold transition ${
                          difficulty === d
                            ? 'bg-[#00d4aa] text-black'
                            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-[#00d4aa]'
                        }`}
                      >
                        {DIFFICULTY_CONFIG[d].label}
                        <div className="text-xs opacity-70">{DIFFICULTY_CONFIG[d].time / 1000}s</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={startTraining}
                  disabled={analysisStatus === 'processing' && !useStockScenarios}
                  className="w-full py-4 bg-[#00d4aa] hover:bg-[#00bfa0] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-bold text-lg rounded-lg transition mb-4"
                >
                  {analysisStatus === 'processing' && !useStockScenarios ? 'Analysis in progress...' : 'START TRAINING →'}
                </button>

                {/* View Stats */}
                <button
                  onClick={() => setScreen('stats')}
                  className="w-full py-3 bg-transparent border border-gray-700 hover:border-[#00d4aa] text-gray-300 hover:text-[#00d4aa] font-semibold rounded-lg transition"
                >
                  View Stats ({sessionStats.totalReps} total reps)
                </button>

                {/* Re-analyze & Clear — only show on My Playbook tab */}
                {!demoMode && !useStockScenarios && (
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={startAnalysis}
                      disabled={analyzing}
                      className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-700/60 rounded-lg hover:border-[#00d4aa]/50 hover:text-[#00d4aa] disabled:opacity-40 transition"
                    >
                      {analyzing ? 'Analyzing...' : 'Re-analyze Playbooks'}
                    </button>
                    {scenarios.length > 0 && (
                      <button
                        onClick={handleClearScenarios}
                        disabled={analyzing}
                        className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-700/60 rounded-lg hover:border-red-500/50 hover:text-red-400 disabled:opacity-40 transition"
                      >
                        Clear All Scenarios
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'playing') {
    const scenario = currentScenarios[playIndex];
    if (!scenario) return null;

    const totalTime = DIFFICULTY_CONFIG[difficulty].time;
    const pct = playPhase === 'pre_snap' ? 100 : (timeRemaining / totalTime) * 100;
    const timerColor = pct > 60 ? '#00d4aa' : pct > 30 ? '#fbbf24' : '#ef4444';
    const isPreSnap = playPhase === 'pre_snap' || playPhase === 'call' || playPhase === 'front_id';
    const isCallPhase = playPhase === 'call';
    const isFrontId = playPhase === 'front_id';

    const defenders = Object.entries(scenario.defensive_positions).map(([id, def]) => {
      // Support both old format (just coordinates) and new format (full defender object)
      const defender = typeof def === 'object' && def !== null ? def as Defender : { id, x: 50, y: 30, label: id, rushing: false };
      return { ...defender, id: defender.id || id };
    });

    // Compute coverage rotation offsets for post-snap secondary sliding
    const coverageRotation = computeCoverageRotation(defenders);
    const disguised = difficulty === 'elite' || difficulty === 'fast';

    // Pre-snap noise: 0-2 defenders make realistic fake movements
    // so real walk-ups, rotations, and blitz tells don't stand out.
    // Skip noise on heavy blitz looks (cover 0, overloads) — no spare defenders.
    const preSnapNoise: Record<string, { dx: number; dy: number }> = {};
    if (disguised) {
      const seed = playIndex * 7 + 13;
      const rushCount = defenders.filter(d => d.rushing).length;
      const rotCount = Object.keys(coverageRotation).length;
      // Skip noise if too many are already moving (cover 0, overload, etc.)
      const toobusy = rushCount >= 6 || rotCount >= 3;

      if (!toobusy) {
        const noiseCandidates = defenders.filter(d =>
          !coverageRotation[d.id] && !d.rushing && !d.walked_up && !d.blitz
          && (isSecondary(d.label) || isLB(d.label))
        );
        // 0, 1, or 2 noise defenders (deterministic from seed)
        const maxNoise = Math.min(seed % 3, noiseCandidates.length); // 0, 1, or 2
        const shuffled = [...noiseCandidates].sort((a, b) =>
          ((a.x * 31 + seed) % 97) - ((b.x * 31 + seed) % 97)
        );
        for (let i = 0; i < maxNoise; i++) {
          const d = shuffled[i];
          const hash = (d.x * 17 + seed * 3 + i * 41) % 5;
          const ul = d.label.toUpperCase();

          if (ul === 'CB') {
            // Fake CB blitz show: press forward 8-12%, angle inside 3-5%
            const forward = 8 + (hash % 5);
            const inside = d.x < 50 ? (3 + hash % 3) : -(3 + hash % 3);
            preSnapNoise[d.id] = { dx: inside, dy: forward };
          } else if (ul === 'SS' || ul === 'FS' || ul === 'R') {
            // Fake safety rotation: slide 6-12% laterally, creep forward 3-5%
            const dir = d.x < 50 ? 1 : -1;
            preSnapNoise[d.id] = { dx: dir * (6 + (hash % 7)), dy: (3 + hash % 3) };
          } else {
            // Fake LB walk-up: creep toward LOS 6-10%, slight lateral 2-3%
            const lateral = d.x < 50 ? (2 + hash % 2) : -(2 + hash % 2);
            preSnapNoise[d.id] = { dx: lateral, dy: 6 + (hash % 5) };
          }
        }
      }
    }

    const concept = inferProtectionConcept(scenario);
    const skillPositions = getSkillPositions(scenario.offensive_formation);
    const olAssignments = computeOLAssignments(
      scenario.defensive_positions,
      concept,
      scenario.call_side,
      scenario.correct_block_target,
      scenario.boot,
      scenario.naked
    );
    const tbX = scenario.call_side === 'left' ? 38 : 62;

    // Build flag badges
    const flags: string[] = [];
    if (scenario.solid_call) flags.push('SOLID');
    if (scenario.free_release) flags.push('FREE RELEASE');
    if (scenario.play_action) flags.push('PLAY ACTION');
    if (scenario.boot) flags.push('BOOT');
    if (scenario.naked) flags.push('NAKED');
    if (scenario.hoss) flags.push('HOSS');

    // Detect cross dog blitz — two LBs blitzing near each other, they swap gaps
    const isCrossDog = /cross|dawg|dog/i.test(scenario.coverage_name);
    const crossDogOffsets: Record<string, number> = {};
    if (isCrossDog) {
      const blitzingLBs = defenders
        .filter(d => d.blitz && isLB(d.label))
        .sort((a, b) => a.x - b.x);
      if (blitzingLBs.length === 2) {
        const [left, right] = blitzingLBs;
        const crossDist = Math.max(8, Math.abs(right.x - left.x) + 6);
        // Left LB crosses right, right LB crosses left
        crossDogOffsets[left.id] = crossDist / 2;
        crossDogOffsets[right.id] = -crossDist / 2;
      }
    }

    // Pre-compute collision nudges so overlapping defenders spread apart
    const defenderNudges: Record<string, number> = (() => {
      const nudges: Record<string, number> = {};
      const positions = defenders.map(def => {
        const rot = coverageRotation[def.id];
        const rX = (coverageSliding && rot) ? rot.dx : 0;
        const rY = (coverageSliding && rot) ? rot.dy : 0;

        const edge = Math.min(Math.abs(def.x - 50) / 15, 1);
        const engY = 58 + edge * 4;
        let rushY = 0;

        const isTarget = def.id === scenario.correct_block_target;
        const effRush = def.rushing || isTarget;
        let rushX = 0;
        if (postSnapRushing && effRush) {
          if (def.hot || def.blitz || isTarget) {
            rushY = Math.max(0, 76 - def.y - rY);
            // Mirror wide blitzer angle toward pocket edge
            const dist = def.x + rX - 50;
            if (Math.abs(dist) > 18) {
              rushX = (dist > 0 ? 65 : 35) - (def.x + rX);
            }
          } else {
            rushY = Math.max(0, engY - def.y - rY);
          }
        } else if (postSnapRushing && !effRush) {
          const uLabel = def.label.toUpperCase();
          const covDepth = uLabel === 'FS' ? 18 : (uLabel === 'SS' || uLabel === 'R') ? 28 : uLabel === 'CB' ? 42 : (!isSecondary(def.label) && !isLB(def.label)) ? 42 : 36;
          const bail = (def.y + rY) - covDepth;
          rushY = bail > 4 ? -bail : -(isSecondary(def.label) ? 5 : 3);
        }

        const crossX = postSnapRushing ? (crossDogOffsets[def.id] || 0) : 0;
        return { id: def.id, x: def.x + rX + crossX + rushX, y: def.y + rY + rushY };
      });

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const a = positions[i];
          const b = positions[j];
          const dx = Math.abs(a.x - b.x);
          const dy = Math.abs(a.y - b.y);

          if (dx < 5 && dy < 6) {
            const nudge = (5 - dx) / 2 + 0.5;
            if (a.x <= b.x) {
              nudges[a.id] = (nudges[a.id] || 0) - nudge;
              nudges[b.id] = (nudges[b.id] || 0) + nudge;
            } else {
              nudges[a.id] = (nudges[a.id] || 0) + nudge;
              nudges[b.id] = (nudges[b.id] || 0) - nudge;
            }
          }
        }
      }

      return nudges;
    })();

    return (
      <div ref={gameContainerRef}>
        {/* Header — fades in after call phase */}
        <div style={{
          opacity: isCallPhase ? 0 : 1,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: isCallPhase ? 'none' as const : 'auto' as const,
        }}>

        {/* Front ID / Cadence / Mike callout / post-snap prompt */}
        <div className="text-center mb-2">
          {isFrontId ? (
            <span className={`text-lg font-semibold uppercase tracking-widest ${
              frontIdResult === 'correct' ? 'text-emerald-400' : frontIdResult === 'wrong' ? 'text-red-400' : 'text-[#67e8f9]'
            }`}>
              {frontIdResult === 'correct' ? 'Correct!' : frontIdResult === 'wrong' ? `${getScenarioFrontFamily(scenario)}` : 'What front is this?'}
            </span>
          ) : isPreSnap ? (
            <span className="text-lg font-semibold text-gray-400 uppercase tracking-widest animate-cadence">
              Reading defense...
            </span>
          ) : (
            <span className="text-lg font-semibold text-[#67e8f9] uppercase tracking-widest">
              Make your read
            </span>
          )}
        </div>

        {/* Progress dots + timer */}
        <div className="mb-4">
          <div className="flex items-baseline" style={{ marginBottom: '-2px' }}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#67e8f9]/60 border border-[#67e8f9]/20 rounded px-2 py-0.5" style={{ fontFamily: 'var(--font-rajdhani)' }}>{DIFFICULTY_CONFIG[difficulty].label} Mode</span>
            <span className="text-2xl font-bold font-mono tabular-nums uppercase tracking-wide ml-auto" style={{
              color: isFrontId && !frontIdResult
                ? (frontIdTimer / DIFFICULTY_CONFIG[difficulty].time > 0.6 ? '#67e8f9' : frontIdTimer / DIFFICULTY_CONFIG[difficulty].time > 0.3 ? '#fbbf24' : '#ef4444')
                : isPreSnap ? '#64748b' : timerColor
            }}>
              {isFrontId ? (!frontIdResult ? `${(frontIdTimer / 1000).toFixed(1)}s` : 'FRONT ID')
                : isPreSnap ? 'PRE-SNAP' : `${(timeRemaining / 1000).toFixed(1)}s`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            {currentScenarios.map((_, i) => {
              const result = results[i];
              const isCurrent = i === playIndex;
              let bg = 'bg-gray-700'; // upcoming
              if (result) bg = result.correct ? 'bg-emerald-500' : 'bg-red-500';
              else if (isCurrent) bg = isPreSnap ? 'bg-gray-500' : 'bg-[#fbbf24]';
              return (
                <div
                  key={i}
                  className={`rounded-full ${bg} transition-all duration-300 ${isCurrent ? 'ring-2 ring-white/30' : ''}`}
                  style={{ width: isCurrent ? 12 : 8, height: isCurrent ? 12 : 8 }}
                />
              );
            })}
          </div>
        </div>
        </div>

        {/* Football Field */}
        <div
          className="relative bg-[#1a3a25] rounded-lg overflow-hidden mb-4"
          style={{ height: 560 }}
        >
          {/* Turf texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  rgba(255,255,255,0.012) 0px,
                  transparent 1px,
                  transparent 3px
                ),
                repeating-linear-gradient(
                  90deg,
                  rgba(255,255,255,0.006) 0px,
                  transparent 1px,
                  transparent 5px
                )
              `,
            }}
          />
          {/* Subtle mow-stripe pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  rgba(255,255,255,0.015) 0px,
                  rgba(255,255,255,0.015) 28px,
                  transparent 28px,
                  transparent 56px
                )
              `,
            }}
          />

          {/* Field depth — darker at top/bottom edges, lighter at center */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(
                  180deg,
                  rgba(0,0,0,0.2) 0%,
                  transparent 20%,
                  transparent 80%,
                  rgba(0,0,0,0.2) 100%
                )
              `,
            }}
          />

          {/* Sideline markings */}
          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-white/[0.12]" />
          <div className="absolute right-0 top-0 bottom-0 w-[5px] bg-white/[0.12]" />
          {/* Inner boundary line (6ft marks) */}
          <div className="absolute left-[8px] top-0 bottom-0 w-[1px] bg-white/[0.06]" />
          <div className="absolute right-[8px] top-0 bottom-0 w-[1px] bg-white/[0.06]" />

          {/* Call overlay — fades in/out on the field */}
          <div
            key={`call-${playIndex}`}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            style={{
              opacity: callTextVisible ? 1 : 0,
              transition: 'opacity 0.5s ease-out',
            }}
          >
            <style>{`
              @keyframes callFadeIn { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
              @keyframes callZoomIn { 0% { opacity: 0; transform: scale(0.3); } 60% { opacity: 1; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
              @keyframes callSlideIn { 0% { opacity: 0; transform: translateX(-30px); } 100% { opacity: 1; transform: translateX(0); } }
              @keyframes callPopIn { 0% { opacity: 0; transform: scale(0.5); } 70% { transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
            `}</style>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 text-center px-8">
              <div
                className="text-gray-400 text-sm font-semibold uppercase tracking-[0.3em] mb-8"
                style={{ animation: 'callFadeIn 0.4s ease-out both' }}
              >
                Play {playIndex + 1} of {currentScenarios.length}
              </div>
              <div
                className="mb-8"
                style={{ animation: 'callZoomIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both' }}
              >
                <div className="inline-block border-2 border-[#00d4aa]/40 rounded-xl px-10 py-4 shadow-[0_0_30px_rgba(0,212,170,0.15)]">
                  <div className="text-[#00d4aa] text-6xl sm:text-7xl font-black tracking-wide">
                    {scenario.protection_type}
                  </div>
                </div>
              </div>
              <div
                className="text-gray-300 text-xl font-bold uppercase tracking-[0.4em] mb-8 flex items-center justify-center gap-3"
                style={{ animation: 'callSlideIn 0.4s ease-out 0.4s both' }}
              >
                {scenario.call_side?.toUpperCase() === 'LEFT' && (
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="text-[#00d4aa]"><path d="M8 1L1 8L8 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="1" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                )}
                <span>TB {scenario.call_side?.toUpperCase() || ''}</span>
                {scenario.call_side?.toUpperCase() === 'RIGHT' && (
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className="text-[#00d4aa]"><path d="M12 1L19 8L12 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="1" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                )}
              </div>
              {flags.length > 0 && (
                <div className="flex gap-3 flex-wrap justify-center">
                  {flags.map((flag, i) => (
                    <span
                      key={flag}
                      className="text-sm font-bold uppercase tracking-wider bg-[#00d4aa]/15 text-[#00d4aa] px-4 py-1.5 rounded-full border border-[#00d4aa]/30"
                      style={{ animation: `callPopIn 0.3s ease-out ${0.6 + i * 0.1}s both` }}
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Inner positioning wrapper — shifted up to reclaim dead space at top */}
          <div className="absolute left-0 right-0" style={{ top: '-6%', height: '108%' }}>

          {/* Yard lines + hash marks */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(pctLine => (
            <div key={pctLine}>
              <div
                className="absolute w-full border-t border-white/[0.06]"
                style={{ top: `${pctLine}%` }}
              />
              <div
                className="absolute bg-white/[0.12]"
                style={{ top: `${pctLine}%`, left: '28%', width: 8, height: 1 }}
              />
              <div
                className="absolute bg-white/[0.12]"
                style={{ top: `${pctLine}%`, left: '72%', width: 8, height: 1 }}
              />
            </div>
          ))}

          {/* Minor hash ticks between yard lines */}
          {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map(pctLine => (
            <div key={`minor-${pctLine}`}>
              <div
                className="absolute bg-white/[0.08]"
                style={{ top: `${pctLine}%`, left: '28%', width: 5, height: 1 }}
              />
              <div
                className="absolute bg-white/[0.08]"
                style={{ top: `${pctLine}%`, left: '72%', width: 5, height: 1 }}
              />
            </div>
          ))}

          {/* Line of Scrimmage */}
          <div
            className="absolute w-full border-t-2 border-[#00d4aa]/40"
            style={{ top: '60%' }}
          />

          {/* Players wrapper — fades in after call phase */}
          <div
            className="absolute inset-0"
            style={{
              opacity: playersVisible ? 1 : 0,
              transition: 'opacity 0.6s ease-in',
            }}
          >

          {/* OL */}
          {(() => {
            const pullingGuard = scenario.boot && !scenario.naked
              ? (scenario.call_side === 'right' ? 'RG' : 'LG')
              : null;
            return ['LT', 'LG', 'C', 'RG', 'RT'].map((label, i) => {
              const baseX = 40 + i * 5;
              const target = olAssignments[label];
              const isPulling = label === pullingGuard;
              return (
                <div
                  key={label}
                  className="absolute"
                  style={{
                    left: `${postSnapRushing && target ? target.x : baseX}%`,
                    top: postSnapRushing && target ? `${target.y}%` : '65%',
                    transform: 'translate(-50%, -50%)',
                    width: 48,
                    height: 56,
                    zIndex: 20,
                    transition: isPulling
                      ? 'left 4.5s ease-in-out, top 4.5s ease-in-out'
                      : 'left 1.4s cubic-bezier(0.22, 1, 0.36, 1), top 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <HelmetIcon label={label.replace('L', '').replace('R', '')} fill="#1a2744" stroke="#2a3f66" stripeColor="#2a3f66" stripeOpacity={0.5} maskColor="#4b5563" textColor="#9ca3af" facing="up" />
                </div>
              );
            });
          })()}

          {/* Slide direction pulsing dots — below OL */}
          {['full_slide', 'half_slide'].includes(concept) && mikeVisible && !postSnapRushing && (() => {
            const slidingRight = scenario.call_side === 'right';
            const isHalf = concept === 'half_slide';
            const startX = isHalf ? 50 : (slidingRight ? 40 : 60);
            const dots = [0, 1, 2, 3, 4];
            const spacing = 5;
            return dots.map(i => {
              const offset = slidingRight ? i * spacing : -(i * spacing);
              return (
                <div
                  key={`slide-dot-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${startX + offset}%`,
                    top: '69%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 21,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#fbbf24',
                      animation: `slide-chase 1s ease-out ${i * 0.2}s infinite`,
                    }}
                  />
                </div>
              );
            });
          })()}

          {/* WR/TE — drift upfield post-snap */}
          {skillPositions.map((sp) => (
            <div
              key={sp.label}
              className="absolute"
              style={{
                left: `${sp.x}%`,
                top: postSnapRushing ? `${sp.y - 15}%` : `${sp.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 40,
                height: 48,
                zIndex: 10,
                transition: 'top 3s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <HelmetIcon label={sp.label} fill="#1a2744" stroke="#2a3f66" stripeColor="#2a3f66" stripeOpacity={0.4} maskColor="#4b5563" textColor="#8094ab" facing="up" />
            </div>
          ))}

          {/* QB — boot: 3-phase loop (fake → drop → boot out); PA no boot: fake → pocket; normal: drift back */}
          <div
            className="absolute"
            style={{
              left: !scenario.boot ? '50%'
                : qbBootPhase >= 3 ? (scenario.call_side === 'right' ? '35%' : '65%')
                : qbBootPhase >= 2 ? '50%'
                : qbBootPhase >= 1 ? (scenario.call_side === 'right' ? '54%' : '46%')
                : '50%',
              top: !scenario.boot ? (postSnapRushing ? '79%' : '76%')
                : qbBootPhase >= 3 ? '87%'
                : qbBootPhase >= 2 ? '87%'
                : qbBootPhase >= 1 ? '82%'
                : '76%',
              transform: 'translate(-50%, -50%)',
              width: 48,
              height: 56,
              zIndex: 25,
              transition: !postSnapRushing ? 'none'
                : scenario.boot
                  ? (qbBootPhase >= 3
                    ? 'left 1.6s ease-in-out, top 1.6s ease-in-out'
                    : qbBootPhase >= 2
                      ? 'left 0.8s ease-in, top 0.8s ease-in'
                      : 'left 0.8s ease-out, top 0.8s ease-out')
                  : 'left 1s ease-out, top 1s ease-out',
            }}
          >
            <HelmetIcon label="QB" fill="#1a2744" stroke="#3a5f88" stripeColor="#3a5f88" stripeOpacity={0.5} maskColor="#4b5563" textColor="#d1d5db" facing="up" />
          </div>

          {/* TB */}
          <div
            className="absolute"
            style={{
              left: `${tbX}%`,
              top: '80%',
              transform: 'translate(-50%, -50%)',
              width: 48,
              height: 56,
              zIndex: 30,
            }}
          >
            <HelmetIcon label="TB" fill="rgba(0,212,170,0.15)" stroke="#00d4aa" stripeColor="#00d4aa" stripeOpacity={0.3} maskColor="#00d4aa" maskOpacity={0.6} textColor="#00d4aa" facing="up" />
          </div>

          {/* Release button — attached below TB */}
          <button
            onClick={() => handleAnswer('RELEASE')}
            disabled={isPreSnap}
            className={`absolute py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all text-center ${
              isPreSnap
                ? 'bg-gray-800/50 border border-gray-600/30 text-gray-600 cursor-not-allowed'
                : 'bg-[#00d4aa]/15 border-2 border-[#00d4aa]/60 text-[#00d4aa] hover:bg-[#00d4aa]/25 hover:border-[#00d4aa] hover:scale-105 active:scale-95 animate-release-idle'
            }`}
            style={{
              left: scenario.call_side === 'left' ? '38.2%' : '62.2%',
              top: '89%',
              transform: 'translate(-50%, -50%)',
              width: 72,
            }}
          >
            Release
          </button>

          {/* Defenders */}
          {defenders.map(def => {
            const secondary = isSecondary(def.label);
            const dl = !secondary && !isLB(def.label);
            const isChill = difficulty === 'chill';
            const fillColor = dl ? '#3d0f0f'
              : isChill
              ? (def.rushing ? '#5f1a1a' : 'rgba(55,12,12,0.55)')
              : '#5f1a1a';
            const strokeColor = isChill
              ? (def.blitz ? '#facc15'
                : def.walked_up ? '#e5e7eb'
                : def.rushing ? '#c45050'
                : 'rgba(140,45,45,0.45)')
              : '#c45050';
            const textColor = isChill
              ? (def.rushing ? '#dba8a8' : 'rgba(200,140,140,0.6)')
              : '#dba8a8';
            const stripeColor = isChill
              ? (def.rushing ? '#c45050' : 'rgba(140,45,45,0.45)')
              : '#c45050';
            const maskColor = dl ? '#888'
              : isChill
              ? (def.rushing ? '#6b7280' : '#4b5563')
              : '#6b7280';

            // Compute pre-snap margin offset in pixels (field height = 560px)
            // Walked-up defenders start at their natural coverage depth and animate
            // forward to their data y position. Blitzers get a smaller disguise offset.
            const FIELD_H = 560;
            const upperLabel = def.label.toUpperCase();
            const naturalDepth =
              upperLabel === 'FS' ? 18 :
              (upperLabel === 'SS' || upperLabel === 'R') ? 28 :
              upperLabel === 'CB' ? 42 :
              dl ? def.y :  // DL don't walk up
              36;           // LBs
            let offsetY = 0;
            if (preSnapAnimating && def.walked_up && !disguised) {
              // Start at natural coverage depth, animate to walked-up position
              const walkDistance = Math.max(0, def.y - naturalDepth);
              offsetY = -(walkDistance / 100) * FIELD_H;
            } else if (preSnapAnimating && def.walked_up && disguised) {
              // Disguised: walk up only partway (looks normal-ish)
              const walkDistance = Math.max(0, def.y - naturalDepth);
              const disguisePct = difficulty === 'elite' ? 0.15 : 0.4;
              offsetY = -(walkDistance * (1 - disguisePct) / 100) * FIELD_H;
            } else if (preSnapAnimating && def.blitz && !disguised) {
              // Smaller disguise offset — just slightly deeper than data position
              offsetY = secondary
                ? -(8 / 100) * FIELD_H
                : -(5 / 100) * FIELD_H;
            } else if (preSnapAnimating && def.blitz && disguised) {
              // Disguised blitzers stay at their natural depth
              const blitzDistance = Math.max(0, def.y - naturalDepth);
              offsetY = -(blitzDistance / 100) * FIELD_H;
            }

            // Coverage rotation + pre-snap noise
            const rotation = coverageRotation[def.id];
            const noise = preSnapNoise[def.id];
            const rotX = coverageSliding ? ((rotation?.dx || 0) + (noise?.dx || 0)) : 0;
            const rotY = coverageSliding ? ((rotation?.dy || 0) + (noise?.dy || 0)) : 0;

            // Post-snap: two-phase rush targeting
            // Edge rushers bend deeper, interior guys stay shallow (mirrors OL pocket)
            const edgeness = Math.min(Math.abs(def.x - 50) / 15, 1); // 0=interior, 1=edge
            const ENGAGEMENT_Y = 58 + edgeness * 4; // interior 58%, edge up to 62%
            const BREAKTHROUGH_Y = 70;  // past OL, approaching QB (76%)
            let rushOffsetY = 0;
            let rushOffsetX = 0;
            let rushDuration = 0;

            const isCorrectTarget = def.id === scenario.correct_block_target;
            const effectiveRushing = def.rushing || isCorrectTarget;
            if (postSnapRushing && effectiveRushing) {
              // Uniform rush speed: all rushers move at the same pace per unit distance
              // Calibrated so a DL ~25 units away arrives in about diffTime
              const diffTime = DIFFICULTY_CONFIG[difficulty].time / 1000;
              const speed = 25 / diffTime; // units per second (baseline: DL distance)
              if (def.hot || def.blitz || isCorrectTarget) {
                // Blitzers/hot/correct target rush to QB depth
                const TARGET_Y = 76;
                rushOffsetY = TARGET_Y - def.y - rotY;
                rushOffsetY = Math.max(0, rushOffsetY);
                rushDuration = Math.max(0.8, rushOffsetY / speed);

                // Wide blitzers (CBs, safeties) angle toward the pocket edge, not straight down
                // Pocket edge is roughly x:35 (left) or x:65 (right)
                const distFromCenter = def.x + rotX - 50;
                if (Math.abs(distFromCenter) > 18) {
                  const pocketEdge = distFromCenter > 0 ? 65 : 35;
                  rushOffsetX = pocketEdge - (def.x + rotX);
                }
              } else {
                // Regular DL: engage at the line
                rushOffsetY = ENGAGEMENT_Y - def.y - rotY;
                rushOffsetY = Math.max(0, rushOffsetY);
                rushDuration = Math.max(0.8, rushOffsetY / speed);
              }
            } else if (postSnapRushing && !effectiveRushing) {
              // Non-rushing defender: bail to natural coverage depth or drift deeper
              const upperLabel = def.label.toUpperCase();
              const coverageDepth =
                upperLabel === 'FS' ? 18 :
                (upperLabel === 'SS' || upperLabel === 'R') ? 28 :
                upperLabel === 'CB' ? 42 :
                dl ? 42 :   // DL dropping into zone (fire zone)
                36;         // LBs (M, W, S, Q)

              const currentY = def.y + rotY;
              const bailDistance = currentY - coverageDepth;

              if (bailDistance > 4) {
                // Defender is notably shallower than natural depth — bail out
                rushOffsetY = -bailDistance;
                rushDuration = Math.max(0.8, bailDistance / 12);
              } else {
                // At or near natural depth — gentle drift deeper into coverage
                rushOffsetY = -(secondary ? 5 : 3);
                rushDuration = 3;
              }
            }

            return (
              <button
                key={def.id}
                onClick={() => handleAnswer(def.id)}
                disabled={isPreSnap}
                className={`absolute flex items-center justify-center ${
                  isPreSnap ? 'cursor-default' : 'cursor-pointer animate-defender-idle hover:brightness-125'
                } ${defendersHighlight ? 'animate-defender-highlight' : ''}`}
                style={{
                  left: `${def.x + rotX + (defenderNudges[def.id] || 0) + (postSnapRushing ? (crossDogOffsets[def.id] || 0) + rushOffsetX : 0)}%`,
                  top: `${def.y + rotY + rushOffsetY}%`,
                  transform: `translate(-50%, -50%) scale(${
                    postSnapBreakthrough && (def.hot || isCorrectTarget) ? 1.14
                    : postSnapRushing && effectiveRushing ? 1.08
                    : 1
                  })`,
                  width: dl ? 56 : 48,
                  height: dl ? 64 : 56,
                  overflow: 'visible',
                  zIndex: def.id === scenario.correct_block_target ? 55
                    : (mikeCallout === def.id && isPreSnap) ? 50
                    : def.hot ? 35
                    : secondary ? 25
                    : def.blitz ? 25
                    : def.rushing ? 22
                    : 21,
                  marginTop: offsetY,
                  transition: `left 1.4s ease-in-out, top ${rushDuration > 0 ? rushDuration : 1.4}s cubic-bezier(0.25, 0.6, 0.35, 1), margin-top 1.6s ease-out, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)`,
                }}
              >
                <HelmetIcon label={def.label} fill={fillColor} stroke={strokeColor} stripeColor={stripeColor} maskColor={maskColor} textColor={textColor} facing="down" />

                {/* Badges — only shown in chill mode */}
                {isChill && def.tb_read && (
                  <span className="absolute -top-2 -right-0.5 text-[10px] bg-gray-900 text-[#00d4aa] rounded-full w-4 h-4 flex items-center justify-center border border-[#00d4aa]/50">
                    {def.tb_read}
                  </span>
                )}
                {isChill && def.hot && (
                  <span className="absolute -top-2 -left-0.5 text-[10px]">🔥</span>
                )}

                {/* Mike reticle — rendered as child so it tracks the player exactly */}
                {mikeCallout === def.id && isPreSnap && (
                  <>
                    <div
                      className={`absolute pointer-events-none transition-opacity duration-300 ${mikeVisible ? 'opacity-100' : 'opacity-0'}`}
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 72,
                        height: 72,
                      }}
                    >
                      <svg viewBox="0 0 72 72" className={mikeVisible ? 'animate-mike-reticle' : ''}>
                        <circle cx="36" cy="36" r="32" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
                        <line x1="36" y1="0" x2="36" y2="12" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
                        <line x1="36" y1="60" x2="36" y2="72" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
                        <line x1="0" y1="36" x2="12" y2="36" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
                        <line x1="60" y1="36" x2="72" y2="36" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
                        <line x1="36" y1="24" x2="36" y2="28" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5" />
                        <line x1="36" y1="44" x2="36" y2="48" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5" />
                        <line x1="24" y1="36" x2="28" y2="36" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5" />
                        <line x1="44" y1="36" x2="48" y2="36" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5" />
                      </svg>
                    </div>
                  </>
                )}
              </button>
            );
          })}

          </div>{/* end players wrapper */}
          </div>{/* end inner positioning wrapper */}

          {/* "IDENTIFY THE FRONT" overlay — stays up entire front_id phase */}
          {isFrontId && (
            <div className="absolute inset-x-0 flex justify-center pointer-events-none z-40" style={{ top: '25%', transform: 'translateY(-50%)' }}>
              <div className={`bg-black/40 backdrop-blur-[2px] px-10 py-5 rounded-2xl border ${
                frontIdResult === 'correct' ? 'border-emerald-400/20' : frontIdResult === 'wrong' ? 'border-red-400/20' : 'border-[#67e8f9]/20'
              }`}>
                <div className={`text-3xl sm:text-4xl font-black uppercase tracking-widest text-center ${
                  frontIdResult === 'correct' ? 'text-emerald-400/80' : frontIdResult === 'wrong' ? 'text-red-400/80' : 'text-[#67e8f9]/80 animate-pulse'
                }`}>
                  {frontIdResult === 'correct' ? 'Correct!' : frontIdResult === 'wrong' && !frontIdPicked ? `Time\u2019s Up — ${getScenarioFrontFamily(scenario)}` : frontIdResult === 'wrong' ? `Wrong — ${getScenarioFrontFamily(scenario)}` : 'Identify the Front'}
                </div>
              </div>
            </div>
          )}

          {/* Mike announcement — first 1.5s of countdown, translucent */}
          {mikeCallout && mikeAnnouncement && isPreSnap && (
            <div className="absolute inset-x-0 top-0 flex justify-center pt-4 pointer-events-none z-40">
              <div className="bg-black/40 backdrop-blur-[2px] px-10 py-5 rounded-2xl border border-[#fbbf24]/20">
                <div className="text-[#fbbf24]/80 text-3xl sm:text-4xl font-black uppercase tracking-widest text-center">
                  {defenders.find(d => d.id === mikeCallout)?.label} is the Mike!
                </div>
              </div>
            </div>
          )}

          {/* "Make Your Read" — last 1.5s of countdown, same spot, translucent */}
          {makeReadOverlay && isPreSnap && (
            <div className="absolute inset-x-0 top-0 flex justify-center pt-4 pointer-events-none z-40">
              <div className="bg-black/40 backdrop-blur-[2px] px-10 py-5 rounded-2xl border border-[#67e8f9]/20">
                <div className="text-[#67e8f9]/80 text-3xl sm:text-4xl font-black uppercase tracking-widest text-center">
                  Make Your Read
                </div>
              </div>
            </div>
          )}

          {/* DOWN / SET / HIKE cadence — behind the text overlays */}
          {snapCountdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div key={snapCountdown} className="animate-snap-countdown text-5xl sm:text-6xl font-black text-[#67e8f9]/40 uppercase tracking-widest" style={{ textShadow: '0 0 20px rgba(103,232,249,0.2)' }}>
                {['DOWN', 'SET', 'HIKE'][snapCountdown]}
              </div>
            </div>
          )}

          {/* Snap flash overlay — brief white flash on snap, then gone */}
          {!isPreSnap && (
            <div key={`snap-flash-${playIndex}`} className="absolute inset-0 animate-snap-flash rounded-lg pointer-events-none" />
          )}
        </div>

        <div style={{
          opacity: isCallPhase ? 0 : 1,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: isCallPhase ? 'none' as const : 'auto' as const,
        }}>
        {/* Front ID multiple choice — persists after answer to show result */}
        {(() => {
          const active = isFrontId || !!frontIdResult;
          const pastFrontId = !isFrontId && !!frontIdResult;
          const waiting = isFrontId && !frontIdResult;
          const correctFamily = getScenarioFrontFamily(scenario);
          const visibleChoices = frontChoices;
          // During front_id: pull buttons up into the field (under QB/TB area)
          // After answer: slide back down to normal position below the field
          // Always render to reserve space — hide with visibility when inactive
          return (
            <div
              className="relative z-50 grid grid-cols-3 gap-3 mb-4"
              style={{
                transform: waiting ? 'translateY(-120px)' : 'translateY(0)',
                transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                visibility: active ? 'visible' : 'hidden',
              }}
            >
              {visibleChoices.map((choice, idx) => {
                const isCorrectChoice = choice === correctFamily;
                const isPickedChoice = frontIdPicked === choice;
                let btnClass = waiting
                  ? 'bg-gray-900/90 text-white border-2 border-[#67e8f9] hover:bg-[#67e8f9]/20 hover:shadow-[0_0_20px_rgba(103,232,249,0.4)] shadow-[0_0_12px_rgba(103,232,249,0.2)]'
                  : 'bg-gray-800 text-gray-200 border-2 border-gray-600';
                if (frontIdResult) {
                  const timedOut = frontIdResult === 'wrong' && !frontIdPicked;
                  if (isCorrectChoice && !timedOut) {
                    // User picked correctly
                    btnClass = 'bg-emerald-900/60 text-emerald-300 border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
                  } else if (isCorrectChoice && timedOut) {
                    // Timed out — show correct answer in amber so it doesn't look like success
                    btnClass = 'bg-amber-900/60 text-amber-300 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]';
                  } else if (isPickedChoice && frontIdResult === 'wrong') {
                    btnClass = 'bg-red-900/60 text-red-300 border-2 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]';
                  } else {
                    btnClass = 'bg-gray-800/40 text-gray-600 border-2 border-gray-700/50';
                  }
                }
                return (
                  <button
                    key={choice}
                    onClick={() => handleFrontAnswer(choice)}
                    disabled={!!frontIdResult}
                    className={`${waiting ? 'py-4 px-5 text-base' : 'py-3 px-4 text-sm'} rounded-lg font-bold uppercase tracking-wide transition-all ${btnClass} ${waiting ? 'animate-front-btn-active' : ''}`}
                    style={waiting ? { animationDelay: `0s, 0.7s` } : undefined}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Legend — chill mode only */}
        {difficulty === 'chill' && (
          <div className="flex justify-center gap-4 text-xs text-gray-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 18" width="14" height="16">
                <ellipse cx="8" cy="9" rx="7" ry="8" fill="#5f1a1a" stroke="#c45050" strokeWidth="1.5" />
                <rect x="6.5" y="2" width="3" height="12" rx="1.5" fill="#c45050" opacity="0.4" />
              </svg>
              <span>Rushing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 18" width="14" height="16">
                <ellipse cx="8" cy="9" rx="7" ry="8" fill="rgba(55,12,12,0.55)" stroke="rgba(140,45,45,0.45)" strokeWidth="1.5" />
                <rect x="6.5" y="2" width="3" height="12" rx="1.5" fill="rgba(140,45,45,0.45)" opacity="0.4" />
              </svg>
              <span>Coverage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 18" width="14" height="16" className="drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]">
                <ellipse cx="8" cy="9" rx="7" ry="8" fill="#5f1a1a" stroke="#facc15" strokeWidth="1.5" />
              </svg>
              <span>Blitz</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🔥</span>
              <span>Hot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 18 18" width="16" height="16">
                <circle cx="9" cy="9" r="8" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
                <line x1="9" y1="0" x2="9" y2="4" stroke="#fbbf24" strokeWidth="1.5" opacity="0.8" />
                <line x1="9" y1="14" x2="9" y2="18" stroke="#fbbf24" strokeWidth="1.5" opacity="0.8" />
                <line x1="0" y1="9" x2="4" y2="9" stroke="#fbbf24" strokeWidth="1.5" opacity="0.8" />
                <line x1="14" y1="9" x2="18" y2="9" stroke="#fbbf24" strokeWidth="1.5" opacity="0.8" />
              </svg>
              <span>Mike</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 20 10" width="18" height="9">
                <line x1="2" y1="5" x2="16" y2="5" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
                <polyline points="14,2 18,5 14,8" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.8" />
              </svg>
              <span>Slide</span>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDBACK SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'feedback' && lastResult) {
    const blockCorrect = lastResult.correct;
    const frontCorrect = lastResult.frontCorrect;
    const isTimeout = lastResult.userAnswer === 'TIMEOUT';
    const bothCorrect = blockCorrect && frontCorrect;
    const oneCorrect = blockCorrect || frontCorrect;
    const correctFront = getScenarioFrontFamily(lastResult.scenario);

    const bannerColor = bothCorrect ? '#22c55e' : oneCorrect ? '#f59e0b' : '#ef4444';
    const bannerBg = bothCorrect ? 'bg-green-500/10 border-green-500' : oneCorrect ? 'bg-amber-500/10 border-amber-500' : 'bg-red-500/10 border-red-500';
    const bannerLabel = bothCorrect ? 'PERFECT' : oneCorrect ? 'PARTIAL' : 'INCORRECT';

    return (
      <div ref={gameContainerRef}>
        {/* Banner */}
        <div className={`rounded-xl p-6 mb-6 text-center border-2 ${bannerBg}`}>
          <div className="text-3xl font-bold mb-1" style={{ color: bannerColor }}>
            {bothCorrect ? '✓' : oneCorrect ? '◐' : '✗'} {bannerLabel}
          </div>
          <div className="text-sm text-gray-400">
            {bothCorrect ? 'Both parts correct' : oneCorrect ? '1 of 2 correct' : 'Both parts wrong'}
          </div>
        </div>

        {/* Two-row breakdown */}
        <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
          {/* Row 1: Front ID */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <span className={`text-lg ${frontCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {frontCorrect ? '✓' : '✗'}
              </span>
              <span className="text-sm font-semibold text-gray-300">Front ID</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={frontCorrect ? 'text-green-400' : 'text-red-400'}>
                {lastResult.frontPicked || 'No answer'}
              </span>
              {!frontCorrect && (
                <span className="text-gray-500">→ <span className="text-green-400">{correctFront}</span></span>
              )}
            </div>
          </div>
          {/* Row 2: Block Read */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`text-lg ${blockCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {blockCorrect ? '✓' : '✗'}
              </span>
              <span className="text-sm font-semibold text-gray-300">Block Read</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={blockCorrect ? 'text-green-400' : 'text-red-400'}>
                {isTimeout ? 'No answer' : lastResult.userAnswer}
              </span>
              {!blockCorrect && (
                <span className="text-gray-500">→ <span className="text-green-400">{lastResult.scenario.correct_block_target}</span></span>
              )}
            </div>
          </div>
        </div>

        {/* Explanation */}
        {lastResult.scenario.explanation && (
          <div className="bg-gray-800 rounded-lg p-5 mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Why?</div>
            <p className="text-gray-300">{lastResult.scenario.explanation}</p>
          </div>
        )}

        {/* Times */}
        <div className="flex justify-center gap-6 text-sm text-gray-400 mb-6">
          <span>Front ID: {(lastResult.frontResponseTime / 1000).toFixed(1)}s</span>
          <span>Block Read: {(lastResult.responseTime / 1000).toFixed(1)}s</span>
        </div>

        {/* Next Button */}
        <button
          onClick={nextPlay}
          className="w-full py-4 bg-[#00d4aa] hover:bg-[#00bfa0] text-black font-bold text-lg rounded-lg transition"
        >
          {playIndex + 1 >= currentScenarios.length ? 'See Results' : 'Next Play →'}
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'results') {
    const allResults = results;
    const blockCorrectCount = allResults.filter(r => r.correct).length;
    const frontCorrectCount = allResults.filter(r => r.frontCorrect).length;
    const total = allResults.length;
    const totalPoints = blockCorrectCount + frontCorrectCount;
    const pct = total > 0 ? Math.round((totalPoints / (total * 2)) * 100) : 0;
    const avgBlockTime = total > 0 ? Math.round(allResults.reduce((s, r) => s + r.responseTime, 0) / total) : 0;
    const avgFrontTime = total > 0 ? Math.round(allResults.reduce((s, r) => s + (r.frontResponseTime || 0), 0) / total) : 0;

    const tier = GRADE_TIERS.find(t => pct >= t.min) || GRADE_TIERS[GRADE_TIERS.length - 1];

    return (
      <div>
        {/* Grade Badge */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 text-5xl font-black mb-3"
            style={{ borderColor: tier.color, color: tier.color }}
          >
            {tier.grade}
          </div>
          <div className="text-lg font-bold" style={{ color: tier.color }}>{tier.label}</div>
          <div className="text-sm text-gray-400 mt-1">{totalPoints}/{total * 2} points</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{blockCorrectCount}/{total}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Block Read</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{frontCorrectCount}/{total}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Front ID</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{(avgFrontTime / 1000).toFixed(1)}s</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Avg Front</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{(avgBlockTime / 1000).toFixed(1)}s</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Avg Block</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{bestStreak}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Best Streak</div>
          </div>
        </div>

        {/* Play-by-play */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Play-by-Play</h3>
          {allResults.map((r, i) => (
            <div key={i} className="py-2 border-b border-gray-700 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-300">
                  {r.scenario.protection_type} vs {r.scenario.coverage_name}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className={r.frontCorrect ? 'text-green-400' : 'text-red-400'}>
                  {r.frontCorrect ? '✓' : '✗'} Front: {r.frontPicked || 'N/A'}
                </span>
                <span className="text-gray-500">{((r.frontResponseTime || 0) / 1000).toFixed(1)}s</span>
                <span className={r.correct ? 'text-green-400' : 'text-red-400'}>
                  {r.correct ? '✓' : '✗'} Block: {r.userAnswer === 'TIMEOUT' ? 'N/A' : r.userAnswer}
                </span>
                <span className="text-gray-500">{(r.responseTime / 1000).toFixed(1)}s</span>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startTraining}
            className="py-3 bg-[#00d4aa] hover:bg-[#00bfa0] text-black font-bold rounded-lg transition"
          >
            Run Again
          </button>
          <button
            onClick={() => setScreen('menu')}
            className="py-3 bg-transparent border border-gray-700 hover:border-[#00d4aa] text-gray-300 hover:text-[#00d4aa] font-semibold rounded-lg transition"
          >
            Menu
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'stats') {
    const avgTime = sessionStats.totalReps > 0
      ? Math.round(sessionStats.totalTime / sessionStats.totalReps)
      : 0;
    const blockAccuracy = sessionStats.totalReps > 0
      ? Math.round((sessionStats.totalCorrect / sessionStats.totalReps) * 100)
      : 0;
    const frontAccuracy = sessionStats.totalReps > 0
      ? Math.round((sessionStats.totalFrontCorrect / sessionStats.totalReps) * 100)
      : 0;

    return (
      <div>
        <div
          className="text-sm text-gray-400 mb-6 cursor-pointer hover:text-[#00d4aa] transition"
          onClick={() => setScreen('menu')}
        >
          ← Back to menu
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Your Stats</h2>

        {/* Overview */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-gray-800 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#00d4aa]">{sessionStats.totalReps}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Total Reps</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#00d4aa]">{blockAccuracy}%</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Block Read</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#00d4aa]">{frontAccuracy}%</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Front ID</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#00d4aa]">{(avgTime / 1000).toFixed(1)}s</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Avg Time</div>
          </div>
        </div>

        {/* By Protection */}
        {Object.keys(sessionStats.byProtection).length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Protection</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {Object.entries(sessionStats.byProtection).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
                  <span className="text-sm font-semibold text-white">{type}</span>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{data.reps} reps</span>
                    <span>{data.reps > 0 ? Math.round((data.correct / data.reps) * 100) : 0}%</span>
                    <span>{data.reps > 0 ? (data.totalTime / data.reps / 1000).toFixed(1) : '0.0'}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By Front */}
        {Object.keys(sessionStats.byFront).length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Front</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {Object.entries(sessionStats.byFront).map(([front, data]) => (
                <div key={front} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
                  <span className="text-sm font-semibold text-white">{front}</span>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{data.reps} reps</span>
                    <span>{data.reps > 0 ? Math.round((data.correct / data.reps) * 100) : 0}%</span>
                    <span>{data.reps > 0 ? (data.totalTime / data.reps / 1000).toFixed(1) : '0.0'}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {sessionStats.sessions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Sessions</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {[...sessionStats.sessions].reverse().slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
                  <span className="text-sm text-gray-400">{new Date(s.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{s.correct}/{s.reps}</span>
                    <span className="text-xs text-gray-500">Front {s.frontCorrect}/{s.reps}</span>
                    <span>{(s.avgTime / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset */}
        <button
          onClick={async () => {
            if (await confirm({ message: 'Reset all protection training stats? This cannot be undone.', variant: 'destructive', confirmLabel: 'Reset' })) {
              const empty: SessionStats = {
                totalReps: 0, totalCorrect: 0, totalFrontCorrect: 0, totalTime: 0,
                byProtection: {}, byFront: {}, sessions: [],
              };
              saveSessionStats(empty);
            }
          }}
          className="w-full py-3 bg-transparent border border-red-800/50 text-red-400 hover:bg-red-900/20 rounded-lg font-semibold transition"
        >
          Reset Stats
        </button>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
