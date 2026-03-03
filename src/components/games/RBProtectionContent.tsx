"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';

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
  protection_type: string;     // team's actual protection name
  protection_concept: string;  // behavioral classification (full_slide, half_slide, etc.)
  call_side: string;           // "left" or "right"
  solid_call: boolean;
  free_release: boolean;
  play_action: boolean;
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
  correct: boolean;
  responseTime: number;
}

interface SessionStats {
  totalReps: number;
  totalCorrect: number;
  totalTime: number;
  byProtection: Record<string, { reps: number; correct: number; totalTime: number }>;
  byFront: Record<string, { reps: number; correct: number; totalTime: number }>;
  sessions: Array<{ date: string; reps: number; correct: number; avgTime: number }>;
}

type Difficulty = 'chill' | 'normal' | 'fast' | 'elite';
type Screen = 'menu' | 'playing' | 'feedback' | 'results' | 'stats';
type PlayPhase = 'call' | 'front_id' | 'pre_snap' | 'snapped';

// Common defensive fronts for generating wrong answers
const COMMON_FRONTS = [
  'OVER', 'UNDER', '4-3', '3-4', 'BEAR', 'NICKEL', 'DIME',
  '4-3 OVER', '4-3 UNDER', '3-4 EAGLE', '46', 'ODD', 'EVEN',
  'NICKEL OVER', 'NICKEL UNDER', '3-3-5', '4-2-5',
];

const SECONDARY_LABELS = new Set(['CB', 'SS', 'FS']);
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

    // CB blitz → only safeties can rotate; SS/FS blitz → only other safeties rotate (CBs must cover their man)
    const candidates = isCBBlitz
      ? defenders.filter(d => (d.label.toUpperCase() === 'SS' || d.label.toUpperCase() === 'FS') && !d.rushing && !assigned.has(d.id))
      : defenders.filter(d => (d.label.toUpperCase() === 'SS' || d.label.toUpperCase() === 'FS') && !d.rushing && !assigned.has(d.id));

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
  callSide: string
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

  // Blocked defenders = rushing but NOT hot (hot = free runners, no OL picks them up)
  const blocked = Object.values(defenders)
    .filter(d => d.rushing && !d.hot)
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
    (d.walked_up && ['SS', 'FS'].includes(d.label.toUpperCase()))
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
        <radialGradient id={`gloss-${facing}`} cx="50%" cy="30%" rx="50%" ry="40%">
          <stop offset="0%" stopColor="white" stopOpacity={0.18} />
          <stop offset="60%" stopColor="white" stopOpacity={0.06} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Broad soft glow */}
      <ellipse cx={24} cy={cy - 6} rx={14} ry={8} fill={`url(#gloss-${facing})`} />
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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Menu state
  const [selectedProtection, setSelectedProtection] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  // Playing state
  const [currentScenarios, setCurrentScenarios] = useState<ProtectionScenario[]>([]);
  const [playIndex, setPlayIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playStartTime, setPlayStartTime] = useState(0);
  const [results, setResults] = useState<PlayResult[]>([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Pre-snap phase state
  const [playPhase, setPlayPhase] = useState<PlayPhase>('snapped');
  const [preSnapAnimating, setPreSnapAnimating] = useState(false);
  const [coverageSliding, setCoverageSliding] = useState(false);
  const [postSnapRushing, setPostSnapRushing] = useState(false);
  const [postSnapBreakthrough, setPostSnapBreakthrough] = useState(false);
  const [mikeCallout, setMikeCallout] = useState<string | null>(null);
  const [mikeVisible, setMikeVisible] = useState(false);
  const callPhaseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preSnapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preSnapAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverageSlideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breakthroughRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Feedback state
  const [lastResult, setLastResult] = useState<PlayResult | null>(null);

  // Stats
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalReps: 0, totalCorrect: 0, totalTime: 0,
    byProtection: {}, byFront: {}, sessions: [],
  });

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rbProtectionStats');
      if (saved) setSessionStats(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const saveSessionStats = (newStats: SessionStats) => {
    setSessionStats(newStats);
    localStorage.setItem('rbProtectionStats', JSON.stringify(newStats));
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
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisId(data.analysisId);

      // Start polling for completion
      startPolling();
    } catch (error) {
      setAnalysisStatus('failed');
      setAnalyzing(false);
      showToast(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);

    // Track the scenario count at the moment polling starts (before delete wipes them)
    const countAtStart = scenarios.length;
    let sawEmpty = false;

    pollRef.current = setInterval(async () => {
      try {
        // Re-fetch scenarios to see if new ones appeared
        const response = await fetch(`/api/player-block-coverages?orgId=${orgId}`, {
          headers: { Authorization: `Bearer ${session!.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const newScenarios = data.scenarios || [];

          // Worker deletes old scenarios first, so we'll see 0 during processing
          if (newScenarios.length === 0) sawEmpty = true;

          // Done when: we see scenarios after seeing 0 (re-analysis), or count increased (first analysis)
          if (newScenarios.length > 0 && (sawEmpty || newScenarios.length > countAtStart)) {
            // New scenarios arrived — analysis completed
            const scenarioData = newScenarios.map((s: any) => ({
              id: s.id,
              coverage_name: s.coverage_name || 'Unknown',
              coverage_type: s.coverage_type || 'all',
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
            setAnalyzing(false);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 8000); // Poll every 8 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        if (analysisStatus === 'processing') {
          setAnalysisStatus('failed');
          setAnalyzing(false);
        }
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
  const groupedScenarios = scenarios.reduce((acc, s) => {
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
      pool = [...scenarios];
    } else {
      pool = scenarios.filter(s => s.protection_type === selectedProtection);
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
    if (mikeCalloutRef.current) clearTimeout(mikeCalloutRef.current);
    if (frontIdTimerRef.current) clearInterval(frontIdTimerRef.current);

    // Reset all animation state
    setPreSnapAnimating(true);
    setCoverageSliding(false);
    setPostSnapRushing(false);
    setPostSnapBreakthrough(false);
    setMikeCallout(null);
    setMikeVisible(false);
    setFrontIdResult(null);
    setFrontIdPicked(null);
    setFrontIdTimer(5000);
    setFrontIdOverlay(false);
    frontIdOverlayVisible.current = false;

    // Generate front ID multiple choice options
    const correctFront = scenario.coverage_name;
    const otherFronts = COMMON_FRONTS.filter(f => f.toUpperCase() !== correctFront.toUpperCase());
    const shuffledWrong = shuffleArray(otherFronts).slice(0, 3);
    setFrontChoices(shuffleArray([correctFront, ...shuffledWrong]));

    // Phase 1: Show the call screen (protection name + TB side)
    setPlayPhase('call');

    // Phase 2: After 1.5s, show field and ask user to ID the front
    callPhaseRef.current = setTimeout(() => {
      setPlayPhase('front_id');

      // Start defender walk-up animation
      preSnapAnimRef.current = setTimeout(() => {
        setPreSnapAnimating(false);
      }, 60);

      // Show "IDENTIFY THE FRONT" overlay immediately
      frontIdOverlayVisible.current = true;
      setFrontIdOverlay(true);

      // After 1s, hide overlay and start the 5-second countdown
      setTimeout(() => {
        setFrontIdOverlay(false);

        const startMs = Date.now();
        frontIdTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startMs;
          const remaining = Math.max(0, 5000 - elapsed);
          setFrontIdTimer(remaining);
          if (remaining <= 0) {
            if (frontIdTimerRef.current) clearInterval(frontIdTimerRef.current);
            if (!frontIdOverlayVisible.current) return; // already answered
            frontIdOverlayVisible.current = false;
            setFrontIdResult('wrong');
            setFrontIdPicked(null);
            setTimeout(() => beginPreSnap(scenario), 1200);
          }
        }, 50);
      }, 1000);
    }, 1500);
  };

  /** Runs the pre-snap → snap sequence after the user identifies the front */
  const beginPreSnap = (scenario: ProtectionScenario) => {
    const totalTime = DIFFICULTY_CONFIG[difficulty].time;
    setPlayPhase('pre_snap');

    // Show "MAKE YOUR READ" overlay for 1s
    setMakeReadOverlay(true);
    makeReadRef.current = setTimeout(() => {
      setMakeReadOverlay(false);
    }, 1000);

    // After 500ms: QB identifies and calls the Mike
    mikeCalloutRef.current = setTimeout(() => {
      const mikeId = computeMikeDesignation(
        scenario.defensive_positions,
        inferProtectionConcept(scenario),
        scenario.call_side
      );
      setMikeCallout(mikeId);
      setTimeout(() => setMikeVisible(true), 100);
    }, 500);

    // After 900ms: trigger coverage rotation slide
    coverageSlideRef.current = setTimeout(() => {
      setCoverageSliding(true);
    }, 900);

    // After 1.8s + 1s overlay = 2.8s: snap the ball, start the timer
    preSnapTimeoutRef.current = setTimeout(() => {
      setPlayPhase('snapped');
      setPostSnapRushing(true);
      setPlayStartTime(Date.now());

      breakthroughRef.current = setTimeout(() => {
        setPostSnapBreakthrough(true);
      }, 1500);

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
    }, 1800 + 1000);
  };

  /** Called when user picks a front in the front_id phase */
  const handleFrontAnswer = (choice: string) => {
    const scenario = currentScenarios[playIndex];
    if (!scenario || frontIdResult) return;

    // Stop the countdown
    if (frontIdTimerRef.current) clearInterval(frontIdTimerRef.current);
    frontIdOverlayVisible.current = false;
    setFrontIdOverlay(false);

    const correct = choice.toUpperCase() === scenario.coverage_name.toUpperCase();
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

    const responseTime = Date.now() - playStartTime;
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
    newStats.totalTime += responseTime;

    const pType = current.protection_type || 'unknown';
    if (!newStats.byProtection[pType]) newStats.byProtection[pType] = { reps: 0, correct: 0, totalTime: 0 };
    newStats.byProtection[pType].reps++;
    if (isCorrect) newStats.byProtection[pType].correct++;
    newStats.byProtection[pType].totalTime += responseTime;

    const front = current.coverage_name || 'unknown';
    if (!newStats.byFront[front]) newStats.byFront[front] = { reps: 0, correct: 0, totalTime: 0 };
    newStats.byFront[front].reps++;
    if (isCorrect) newStats.byFront[front].correct++;
    newStats.byFront[front].totalTime += responseTime;

    saveSessionStats(newStats);

    setScreen('feedback');
  }, [currentScenarios, playIndex, playStartTime, sessionStats]);

  const nextPlay = () => {
    const nextIdx = playIndex + 1;
    if (nextIdx >= currentScenarios.length) {
      // Save session to history
      const correctCount = results.length > 0
        ? results.filter(r => r.correct).length + (lastResult?.correct ? 1 : 0)
        : (lastResult?.correct ? 1 : 0);
      const totalTimeMs = results.reduce((s, r) => s + r.responseTime, 0) + (lastResult?.responseTime || 0);
      const total = results.length + (lastResult ? 1 : 0);

      const newStats = { ...sessionStats };
      newStats.sessions.push({
        date: new Date().toISOString(),
        reps: total,
        correct: correctCount,
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
    };
  }, []);

  // Scroll game container into view on screen/phase transitions
  useEffect(() => {
    if ((screen === 'playing' || screen === 'feedback') && gameContainerRef.current) {
      if (playPhase === 'front_id') {
        // Scroll all the way down so multiple choice buttons are visible
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
      } else {
        gameContainerRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
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
                  Extracting protection schemes, defensive fronts, and RB assignments from your playbook files.
                  This typically takes 2-5 minutes.
                </p>
                <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00d4aa]/60 rounded-full animate-pulse" style={{ width: '60%' }} />
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

        {scenarios.length === 0 ? (
          /* Empty State */
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">No Protection Scenarios</h3>
            <p className="text-gray-300 mb-4">
              Upload your playbook PDFs or images in <strong>My Notes</strong>, then analyze them to generate protection scenarios.
            </p>
            {analysisStatus !== 'processing' && (
              <button
                onClick={startAnalysis}
                disabled={analyzing}
                className="px-6 py-3 bg-[#00d4aa] hover:bg-[#00bfa0] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition"
              >
                {analyzing ? 'Starting Analysis...' : 'Analyze Playbooks'}
              </button>
            )}
          </div>
        ) : (
          <>
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
              Mix All Protections ({scenarios.length} scenarios)
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
              className="w-full py-4 bg-[#00d4aa] hover:bg-[#00bfa0] text-black font-bold text-lg rounded-lg transition mb-4"
            >
              START TRAINING →
            </button>

            {/* View Stats */}
            <button
              onClick={() => setScreen('stats')}
              className="w-full py-3 bg-transparent border border-gray-700 hover:border-[#00d4aa] text-gray-300 hover:text-[#00d4aa] font-semibold rounded-lg transition"
            >
              View Stats ({sessionStats.totalReps} total reps)
            </button>

            {/* Re-analyze */}
            {!demoMode && (
              <div className="mt-6 text-center">
                <button
                  onClick={startAnalysis}
                  disabled={analyzing}
                  className="text-sm text-gray-500 hover:text-[#00d4aa] transition"
                >
                  {analyzing ? 'Analyzing...' : 'Re-analyze Playbooks'}
                </button>
              </div>
            )}
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

    const concept = inferProtectionConcept(scenario);
    const skillPositions = getSkillPositions(scenario.offensive_formation);
    const olAssignments = computeOLAssignments(
      scenario.defensive_positions,
      concept,
      scenario.call_side
    );
    const tbX = scenario.call_side === 'left' ? 38 : 62;

    // Build flag badges
    const flags: string[] = [];
    if (scenario.solid_call) flags.push('SOLID');
    if (scenario.free_release) flags.push('FREE RELEASE');
    if (scenario.play_action) flags.push('PLAY ACTION');
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

        if (postSnapRushing && def.rushing) {
          if (postSnapBreakthrough && def.hot) {
            rushY = Math.max(0, 70 - def.y - rY);
          } else if (def.blitz) {
            rushY = Math.max(0, 74 - def.y - rY);
          } else {
            rushY = Math.max(0, engY - def.y - rY);
          }
        } else if (postSnapRushing && !def.rushing && isSecondary(def.label)) {
          rushY = -10;
        }

        const crossX = postSnapRushing ? (crossDogOffsets[def.id] || 0) : 0;
        return { id: def.id, x: def.x + rX + crossX, y: def.y + rY + rushY };
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
        {/* Call Screen — shows protection & front before the field appears */}
        {isCallPhase && (
          <div
            className="relative bg-[#1a3a25] rounded-lg overflow-hidden flex flex-col items-center justify-center"
            style={{ height: 560 }}
          >
            {/* Turf lines for visual consistency */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 56px)',
            }} />
            <div className="relative z-10 text-center px-8">
              <div className="text-gray-500 text-sm font-semibold uppercase tracking-[0.3em] mb-6">
                Play {playIndex + 1} of {currentScenarios.length}
              </div>
              <div className="text-[#00d4aa] text-5xl sm:text-6xl font-black tracking-wide mb-6">
                {scenario.protection_type}
              </div>
              <div className="text-gray-400 text-lg font-semibold uppercase tracking-widest mb-6">
                TB {scenario.call_side?.toUpperCase() || ''}
              </div>
              {flags.length > 0 && (
                <div className="flex gap-2 flex-wrap justify-center">
                  {flags.map(flag => (
                    <span key={flag} className="text-sm bg-[#00d4aa]/10 text-[#00d4aa] px-3 py-1 rounded-full font-semibold">
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Normal playing UI — hidden during call phase */}
        {!isCallPhase && (<>

        {/* Front ID / Cadence / Mike callout / post-snap prompt */}
        <div className="text-center mb-2">
          {isFrontId ? (
            <div>
              <span className={`text-lg font-semibold uppercase tracking-widest ${
                frontIdResult === 'correct' ? 'text-emerald-400' : frontIdResult === 'wrong' ? 'text-red-400' : 'text-[#67e8f9]'
              }`}>
                {frontIdResult === 'correct' ? 'Correct!' : frontIdResult === 'wrong' ? `${scenario.coverage_name}` : 'What front is this?'}
              </span>
              {!frontIdResult && (
                <span className="ml-3 text-sm font-mono" style={{ color: frontIdTimer > 2000 ? '#67e8f9' : frontIdTimer > 1000 ? '#fbbf24' : '#ef4444' }}>
                  {(frontIdTimer / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          ) : isPreSnap ? (
            mikeCallout && mikeVisible ? (
              <span className="text-lg font-bold text-[#fbbf24] uppercase tracking-widest" style={{ opacity: mikeVisible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}>
                {defenders.find(d => d.id === mikeCallout)?.label} IS THE MIKE!
              </span>
            ) : (
              <span className="text-lg font-semibold text-gray-400 uppercase tracking-widest animate-cadence">
                Reading defense...
              </span>
            )
          ) : (
            <span className="text-lg font-semibold text-[#67e8f9] uppercase tracking-widest">
              Make your read
            </span>
          )}
        </div>

        {/* Progress dots + timer */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Play {playIndex + 1} of {currentScenarios.length}</span>
            <span style={{ color: isPreSnap ? '#64748b' : timerColor }}>
              {isPreSnap ? 'PRE-SNAP' : `${(timeRemaining / 1000).toFixed(1)}s`}
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

          {/* OL */}
          {(() => {
            return ['LT', 'LG', 'C', 'RG', 'RT'].map((label, i) => {
              const baseX = 40 + i * 5;
              const target = olAssignments[label];
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
                    transition: 'left 1.4s cubic-bezier(0.22, 1, 0.36, 1), top 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
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

          {/* QB */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: postSnapRushing ? '79%' : '76%',
              transform: 'translate(-50%, -50%)',
              width: 48,
              height: 56,
              zIndex: 25,
              transition: 'top 1.8s ease-out',
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
            const isChill = difficulty === 'chill';
            const fillColor = isChill
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
            const maskColor = isChill
              ? (def.rushing ? '#6b7280' : '#4b5563')
              : '#6b7280';

            // Compute pre-snap margin offset in pixels (field height = 560px)
            const FIELD_H = 560;
            let offsetY = 0;
            if (preSnapAnimating && def.walked_up) {
              offsetY = secondary
                ? -(18 / 100) * FIELD_H   // -100.8px — deep secondary depth
                : -(12 / 100) * FIELD_H;  // -67.2px — natural LB depth
            } else if (preSnapAnimating && def.blitz) {
              offsetY = secondary
                ? -(8 / 100) * FIELD_H    // -44.8px — deeper disguise
                : -(5 / 100) * FIELD_H;   // -28px — LB disguise depth
            }

            // Coverage rotation: non-blitzing secondary slides pre-snap after walk-up
            const rotation = coverageRotation[def.id];
            const rotX = (coverageSliding && rotation) ? rotation.dx : 0;
            const rotY = (coverageSliding && rotation) ? rotation.dy : 0;

            // Post-snap: two-phase rush targeting
            // Edge rushers bend deeper, interior guys stay shallow (mirrors OL pocket)
            const edgeness = Math.min(Math.abs(def.x - 50) / 15, 1); // 0=interior, 1=edge
            const ENGAGEMENT_Y = 58 + edgeness * 4; // interior 58%, edge up to 62%
            const BREAKTHROUGH_Y = 70;  // past OL, approaching QB (76%)
            let rushOffsetY = 0;
            let rushDuration = 0;

            if (postSnapRushing && def.rushing) {
              if (postSnapBreakthrough && def.hot) {
                // Phase 2: hot defenders break through past OL toward QB
                rushOffsetY = BREAKTHROUGH_Y - def.y - rotY;
                rushOffsetY = Math.max(0, rushOffsetY);
                const breakthroughDist = Math.abs(BREAKTHROUGH_Y - def.y);
                rushDuration = Math.max(0.8, breakthroughDist * 0.08);
              } else if (def.blitz) {
                // Blitzing: rush through to backfield in one continuous motion
                const BLITZ_TARGET_Y = 74;
                rushOffsetY = BLITZ_TARGET_Y - def.y - rotY;
                rushOffsetY = Math.max(0, rushOffsetY);
                const blitzDist = Math.abs(BLITZ_TARGET_Y - def.y);
                rushDuration = Math.max(2.0, blitzDist * 0.09);
              } else {
                // Regular DL: engage at the line
                rushOffsetY = ENGAGEMENT_Y - def.y - rotY;
                rushOffsetY = Math.max(0, rushOffsetY);
                const rushDist = Math.abs(ENGAGEMENT_Y - def.y);
                rushDuration = rushDist > 0 ? Math.max(1.2, rushDist * 0.12) : 0;
              }
            } else if (postSnapRushing && !def.rushing && secondary) {
              // Non-rushing secondary drifts upfield with receivers
              rushOffsetY = -10;
              rushDuration = 3;
            } else if (postSnapRushing && !def.rushing && !secondary && def.y > 50) {
              // DL dropping into coverage (fire zone) — drop back into zone
              rushOffsetY = -(def.y - 42);
              rushDuration = 2.0;
            }

            return (
              <button
                key={def.id}
                onClick={() => handleAnswer(def.id)}
                disabled={isPreSnap}
                className={`absolute flex items-center justify-center ${
                  isPreSnap ? 'cursor-default' : 'cursor-pointer animate-defender-idle hover:brightness-125'
                }`}
                style={{
                  left: `${def.x + rotX + (defenderNudges[def.id] || 0) + (postSnapRushing ? (crossDogOffsets[def.id] || 0) : 0)}%`,
                  top: `${def.y + rotY + rushOffsetY}%`,
                  transform: `translate(-50%, -50%) scale(${
                    postSnapBreakthrough && def.hot ? 1.14
                    : postSnapRushing && def.rushing ? 1.08
                    : 1
                  })`,
                  width: 48,
                  height: 56,
                  overflow: 'visible',
                  zIndex: (mikeCallout === def.id && isPreSnap) ? 50 : def.hot ? 35 : secondary ? 5 : def.blitz ? 25 : def.rushing ? 22 : 15,
                  marginTop: offsetY,
                  transition: `left 1.4s ease-in-out, top ${rushDuration > 0 ? rushDuration : 1.4}s ${
                    postSnapBreakthrough && def.hot
                      ? 'cubic-bezier(0.45, 0, 0.55, 1)'
                      : def.blitz && rushDuration > 0
                        ? 'cubic-bezier(0.4, 0, 0.2, 1)'
                        : rushDuration > 0
                          ? 'cubic-bezier(0.22, 1, 0.36, 1)'
                          : 'ease-in-out'
                  }, margin-top 1.6s ease-out, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)`,
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

          </div>{/* end inner positioning wrapper */}

          {/* "IDENTIFY THE FRONT" overlay during front_id phase */}
          {isFrontId && frontIdOverlay && !frontIdResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <div className="bg-black/60 backdrop-blur-sm px-10 py-5 rounded-2xl">
                <div className="text-[#67e8f9] text-3xl sm:text-4xl font-black uppercase tracking-widest text-center animate-pulse">
                  Identify the Front
                </div>
              </div>
            </div>
          )}

          {/* "MAKE YOUR READ" overlay during pre_snap phase */}
          {playPhase === 'pre_snap' && makeReadOverlay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <div className="bg-black/60 backdrop-blur-sm px-10 py-5 rounded-2xl">
                <div className="text-[#fbbf24] text-3xl sm:text-4xl font-black uppercase tracking-widest text-center animate-pulse">
                  Make Your Read
                </div>
              </div>
            </div>
          )}

          {/* Snap flash overlay — brief white flash on snap, then gone */}
          {!isPreSnap && (
            <div key={`snap-flash-${playIndex}`} className="absolute inset-0 animate-snap-flash rounded-lg pointer-events-none" />
          )}
        </div>

        {/* Front ID multiple choice */}
        {isFrontId && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {frontChoices.map(choice => {
              const isCorrectChoice = choice.toUpperCase() === scenario.coverage_name.toUpperCase();
              const isPickedChoice = frontIdPicked?.toUpperCase() === choice.toUpperCase();
              let btnClass = 'bg-gray-800 text-gray-200 border-2 border-gray-600 hover:border-[#67e8f9] hover:bg-gray-700';
              if (frontIdResult) {
                if (isCorrectChoice) {
                  // Always highlight the correct answer in green
                  btnClass = 'bg-emerald-900/60 text-emerald-300 border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
                } else if (isPickedChoice && frontIdResult === 'wrong') {
                  // The wrong pick shows in red
                  btnClass = 'bg-red-900/60 text-red-300 border-2 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]';
                } else {
                  // Other buttons fade out
                  btnClass = 'bg-gray-800/40 text-gray-600 border-2 border-gray-700/50';
                }
              }
              return (
                <button
                  key={choice}
                  onClick={() => handleFrontAnswer(choice)}
                  disabled={!!frontIdResult}
                  className={`py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${btnClass}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-4 text-xs text-gray-400 flex-wrap">
          {difficulty === 'chill' && (
            <>
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
            </>
          )}
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
        </>)}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDBACK SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'feedback' && lastResult) {
    const isCorrect = lastResult.correct;
    const isTimeout = lastResult.userAnswer === 'TIMEOUT';

    return (
      <div ref={gameContainerRef}>
        {/* Banner */}
        <div
          className={`rounded-xl p-6 mb-6 text-center ${
            isCorrect ? 'bg-green-500/10 border-2 border-green-500' : 'bg-red-500/10 border-2 border-red-500'
          }`}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
            {isCorrect ? '✓ CORRECT' : isTimeout ? '⏰ TIME\'S UP' : '✗ INCORRECT'}
          </div>
          {!isCorrect && (
            <div className="flex justify-center gap-8 mt-4">
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Your Pick</div>
                <div className="text-lg font-bold text-red-400">
                  {isTimeout ? 'No answer' : lastResult.userAnswer}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Correct</div>
                <div className="text-lg font-bold text-green-400">{lastResult.scenario.correct_block_target}</div>
              </div>
            </div>
          )}
        </div>

        {/* Explanation */}
        {lastResult.scenario.explanation && (
          <div className="bg-gray-800 rounded-lg p-5 mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Why?</div>
            <p className="text-gray-300">{lastResult.scenario.explanation}</p>
          </div>
        )}

        {/* Time */}
        <div className="text-center text-sm text-gray-400 mb-6">
          Response time: {(lastResult.responseTime / 1000).toFixed(1)}s
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
    const allResults = [...results, ...(lastResult && !results.find(r => r === lastResult) ? [lastResult] : [])];
    const correctCount = allResults.filter(r => r.correct).length;
    const total = allResults.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const avgTime = total > 0 ? Math.round(allResults.reduce((s, r) => s + r.responseTime, 0) / total) : 0;

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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{correctCount}/{total}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Correct</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{(avgTime / 1000).toFixed(1)}s</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Avg Time</div>
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
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`text-lg ${r.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {r.correct ? '✓' : '✗'}
                </span>
                <span className="text-sm text-gray-300">
                  {r.scenario.protection_type} vs {r.scenario.coverage_name}
                </span>
              </div>
              <span className="text-sm text-gray-400">{(r.responseTime / 1000).toFixed(1)}s</span>
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
    const accuracy = sessionStats.totalReps > 0
      ? Math.round((sessionStats.totalCorrect / sessionStats.totalReps) * 100)
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
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-gray-800 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#00d4aa]">{sessionStats.totalReps}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Total Reps</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#00d4aa]">{accuracy}%</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Accuracy</div>
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
                    <span>{s.reps > 0 ? Math.round((s.correct / s.reps) * 100) : 0}%</span>
                    <span>{(s.avgTime / 1000).toFixed(1)}s avg</span>
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
                totalReps: 0, totalCorrect: 0, totalTime: 0,
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
