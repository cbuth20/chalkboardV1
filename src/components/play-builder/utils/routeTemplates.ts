import type { RouteTemplate } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

export const ROUTE_TEMPLATES: RouteTemplate[] = [
  {
    id: 'go',
    name: 'Go/Streak',
    description: 'Straight vertical route',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -25 }
    ],
    icon: '↑'
  },
  {
    id: 'slant',
    name: 'Slant',
    description: '45° angle inside',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -5 },
      { x: 8, y: -15 }
    ],
    icon: '↗'
  },
  {
    id: 'out',
    name: 'Out',
    description: 'Break outside at 90°',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: 10, y: -12 }
    ],
    icon: '→'
  },
  {
    id: 'in',
    name: 'In/Dig',
    description: 'Break inside at 90°',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: -10, y: -12 }
    ],
    icon: '←'
  },
  {
    id: 'curl',
    name: 'Curl',
    description: 'Run and comeback',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: 0, y: -8 }
    ],
    icon: '↩'
  },
  {
    id: 'post',
    name: 'Post',
    description: 'Break to middle',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: -8, y: -22 }
    ],
    icon: '↖'
  },
  {
    id: 'corner',
    name: 'Corner',
    description: 'Break to corner',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -12 },
      { x: 8, y: -22 }
    ],
    icon: '↗'
  },
  {
    id: 'comeback',
    name: 'Comeback',
    description: 'Deep return route',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -18 },
      { x: 0, y: -14 }
    ],
    icon: '⤴'
  },
  {
    id: 'flat',
    name: 'Flat',
    description: 'Quick outside route',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -3 },
      { x: 8, y: -3 }
    ],
    icon: '⇨'
  },
  {
    id: 'wheel',
    name: 'Wheel',
    description: 'Outside then vertical',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: -3 },
      { x: 6, y: -5 },
      { x: 8, y: -18 }
    ],
    icon: '↻'
  },
];
