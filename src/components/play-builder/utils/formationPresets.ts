import type { DiagramPlayer } from '@/components/playbook-diagram/types';

// ═══════════════════════════════════════════════════════════════════════════
// FORMATION PRESETS
// ═══════════════════════════════════════════════════════════════════════════

export type FormationPreset = {
  [key: string]: { x: number; y: number };
};

export const OFFENSIVE_FORMATIONS: Record<string, FormationPreset> = {
  'Pro Set': {
    qb: { x: 50, y: 65 },
    rb: { x: 45, y: 70 },
    fb: { x: 50, y: 68 },
    wr1: { x: 30, y: 61 },  // 1 yard behind LOS
    wr3: { x: 70, y: 61 },  // 1 yard behind LOS
    wr2: { x: 59, y: 61 },  // 1 yard behind LOS
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
  'Shotgun': {
    qb: { x: 50, y: 70 },
    rb: { x: 45, y: 70 },
    fb: { x: 55, y: 70 },
    wr1: { x: 30, y: 61 },  // 1 yard behind LOS
    wr3: { x: 70, y: 61 },  // 1 yard behind LOS
    wr2: { x: 59, y: 61 },  // 1 yard behind LOS
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
  'I-Formation': {
    qb: { x: 50, y: 65 },
    rb: { x: 50, y: 73 },
    fb: { x: 50, y: 68 },
    wr1: { x: 30, y: 61 },  // 1 yard behind LOS
    wr3: { x: 70, y: 61 },  // 1 yard behind LOS
    wr2: { x: 59, y: 61 },  // 1 yard behind LOS
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
  'Singleback': {
    qb: { x: 50, y: 65 },
    rb: { x: 50, y: 70 },
    fb: { x: 45, y: 65 },
    wr1: { x: 30, y: 61 },  // 1 yard behind LOS
    wr3: { x: 70, y: 61 },  // 1 yard behind LOS
    wr2: { x: 59, y: 61 },  // 1 yard behind LOS
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
  'Pistol': {
    qb: { x: 50, y: 67 },
    rb: { x: 50, y: 72 },
    fb: { x: 45, y: 67 },
    wr1: { x: 30, y: 61 },  // 1 yard behind LOS
    wr3: { x: 70, y: 61 },  // 1 yard behind LOS
    wr2: { x: 59, y: 61 },  // 1 yard behind LOS
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
  'Spread': {
    qb: { x: 50, y: 70 },
    rb: { x: 50, y: 75 },
    fb: { x: 45, y: 70 },
    wr1: { x: 25, y: 61 },  // 1 yard behind LOS
    wr3: { x: 75, y: 61 },  // 1 yard behind LOS
    wr2: { x: 63, y: 62 },  // 2 yards behind LOS (slot)
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
  'Trips Right': {
    qb: { x: 50, y: 70 },
    rb: { x: 45, y: 70 },
    fb: { x: 55, y: 70 },
    wr1: { x: 30, y: 61 },  // 1 yard behind LOS
    wr3: { x: 73, y: 61 },  // 1 yard behind LOS
    wr2: { x: 65, y: 62 },  // 2 yards behind LOS (slot)
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
  'Trips Left': {
    qb: { x: 50, y: 70 },
    rb: { x: 55, y: 70 },
    fb: { x: 45, y: 70 },
    wr1: { x: 27, y: 61 },  // 1 yard behind LOS
    wr3: { x: 70, y: 61 },  // 1 yard behind LOS
    wr2: { x: 35, y: 62 },  // 2 yards behind LOS (slot)
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
  'Empty': {
    qb: { x: 50, y: 70 },
    rb: { x: 38, y: 62 },  // 2 yards behind LOS (slot)
    fb: { x: 62, y: 62 },  // 2 yards behind LOS (slot)
    wr1: { x: 25, y: 61 },   // 1 yard behind LOS
    wr3: { x: 75, y: 61 },   // 1 yard behind LOS
    wr2: { x: 50, y: 61 },   // 1 yard behind LOS
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
  'Wing-T': {
    qb: { x: 50, y: 65 },
    rb: { x: 50, y: 70 },
    fb: { x: 50, y: 68 },
    wr1: { x: 30, y: 61 },  // 1 yard behind LOS
    wr3: { x: 59, y: 61 },  // 1 yard behind LOS (wing)
    wr2: { x: 41, y: 61 },  // 1 yard behind LOS (wing)
    lt: { x: 42, y: 61 },
    lg: { x: 46, y: 61 },
    c: { x: 50, y: 61 },
    rg: { x: 54, y: 61 },
    rt: { x: 58, y: 61 },
  },
};

export const DEFENSIVE_FORMATIONS: Record<string, FormationPreset> = {
  '4-3': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 40, y: 59 },  // 1 yard in front of LOS
    de2: { x: 60, y: 59 },  // 1 yard in front of LOS
    dt1: { x: 46, y: 59 },  // 1 yard in front of LOS
    dt2: { x: 54, y: 59 },  // 1 yard in front of LOS
  },
  '3-4': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 44, y: 59 },  // 1 yard in front of LOS
    de2: { x: 56, y: 59 },  // 1 yard in front of LOS
    dt1: { x: 50, y: 59 },  // 1 yard in front of LOS
    dt2: { x: 62, y: 52 },
  },
  'Nickel (4-2-5)': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 46, y: 54 },
    wlb: { x: 54, y: 54 },
    slb: { x: 38, y: 52 },
    de1: { x: 40, y: 59 },  // 1 yard in front of LOS
    de2: { x: 60, y: 59 },  // 1 yard in front of LOS
    dt1: { x: 46, y: 59 },  // 1 yard in front of LOS
    dt2: { x: 54, y: 59 },  // 1 yard in front of LOS
  },
  'Dime (4-1-6)': {
    cb1: { x: 28, y: 48 },
    cb2: { x: 72, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 38, y: 48 },
    slb: { x: 62, y: 48 },
    de1: { x: 40, y: 59 },  // 1 yard in front of LOS
    de2: { x: 60, y: 59 },  // 1 yard in front of LOS
    dt1: { x: 46, y: 59 },  // 1 yard in front of LOS
    dt2: { x: 54, y: 59 },  // 1 yard in front of LOS
  },
  '3-3-5': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 44, y: 59 },  // 1 yard in front of LOS
    de2: { x: 56, y: 59 },  // 1 yard in front of LOS
    dt1: { x: 50, y: 59 },  // 1 yard in front of LOS
    dt2: { x: 42, y: 45 },
  },
  '5-2': {
    cb1: { x: 30, y: 48 },
    cb2: { x: 70, y: 48 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 42 },
    mlb: { x: 46, y: 54 },
    wlb: { x: 54, y: 54 },
    slb: { x: 50, y: 52 },
    de1: { x: 38, y: 59 },  // 1 yard in front of LOS
    de2: { x: 62, y: 59 },  // 1 yard in front of LOS
    dt1: { x: 44, y: 59 },  // 1 yard in front of LOS
    dt2: { x: 56, y: 59 },  // 1 yard in front of LOS
  },
  'Cover 2': {
    cb1: { x: 34, y: 52 },
    cb2: { x: 66, y: 52 },
    fs: { x: 42, y: 35 },
    ss: { x: 58, y: 35 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 40, y: 59 },  // 1 yard in front of LOS
    de2: { x: 60, y: 59 },  // 1 yard in front of LOS
    dt1: { x: 46, y: 59 },  // 1 yard in front of LOS
    dt2: { x: 54, y: 59 },  // 1 yard in front of LOS
  },
  'Cover 3': {
    cb1: { x: 30, y: 40 },
    cb2: { x: 70, y: 40 },
    fs: { x: 50, y: 35 },
    ss: { x: 58, y: 48 },
    mlb: { x: 50, y: 54 },
    wlb: { x: 42, y: 54 },
    slb: { x: 58, y: 54 },
    de1: { x: 40, y: 59 },  // 1 yard in front of LOS
    de2: { x: 60, y: 59 },  // 1 yard in front of LOS
    dt1: { x: 46, y: 59 },  // 1 yard in front of LOS
    dt2: { x: 54, y: 59 },  // 1 yard in front of LOS
  },
};

export const INITIAL_OFFENSE: DiagramPlayer[] = [
  { id: "qb", label: "QB", side: "offense", x: 50, y: 65, group: "backfield" },
  { id: "rb", label: "RB", side: "offense", x: 45, y: 70, group: "backfield" },
  { id: "fb", label: "FB", side: "offense", x: 50, y: 68, group: "backfield" },
  { id: "wr1", label: "WR1", side: "offense", x: 30, y: 61, group: "skill" },  // 1 yard behind LOS
  { id: "wr3", label: "WR3", side: "offense", x: 70, y: 61, group: "skill" },  // 1 yard behind LOS
  { id: "wr2", label: "WR2", side: "offense", x: 59, y: 61, group: "skill" },
  { id: "lt", label: "LT", side: "offense", x: 42, y: 61, group: "line" },
  { id: "lg", label: "LG", side: "offense", x: 46, y: 61, group: "line" },
  { id: "c", label: "C", side: "offense", x: 50, y: 61, group: "line" },
  { id: "rg", label: "RG", side: "offense", x: 54, y: 61, group: "line" },
  { id: "rt", label: "RT", side: "offense", x: 58, y: 61, group: "line" },
];

export const INITIAL_DEFENSE: DiagramPlayer[] = [
  { id: "cb1", label: "CB", side: "defense", x: 30, y: 48, group: "secondary" },
  { id: "cb2", label: "CB", side: "defense", x: 70, y: 48, group: "secondary" },
  { id: "fs", label: "FS", side: "defense", x: 50, y: 35, group: "secondary" },
  { id: "ss", label: "SS", side: "defense", x: 58, y: 42, group: "secondary" },
  { id: "mlb", label: "MLB", side: "defense", x: 50, y: 54, group: "linebacker" },
  { id: "wlb", label: "WLB", side: "defense", x: 42, y: 54, group: "linebacker" },
  { id: "slb", label: "SLB", side: "defense", x: 58, y: 54, group: "linebacker" },
  { id: "de1", label: "DE", side: "defense", x: 40, y: 59, group: "line" },  // 1 yard in front of LOS
  { id: "de2", label: "DE", side: "defense", x: 60, y: 59, group: "line" },  // 1 yard in front of LOS
  { id: "dt1", label: "DT", side: "defense", x: 46, y: 59, group: "line" },  // 1 yard in front of LOS
  { id: "dt2", label: "DT", side: "defense", x: 54, y: 59, group: "line" },  // 1 yard in front of LOS
];

export const LOS_OPTIONS = [
  { label: 'Own 20', value: 20, y: 80 },
  { label: 'Own 40', value: 40, y: 70 },
  { label: '50 Yard Line', value: 50, y: 60 },
  { label: 'Opp 40', value: 60, y: 50 },
  { label: 'Opp 20 (Red Zone)', value: 80, y: 30 },
];
