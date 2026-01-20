import { SkillPosition } from './supabase/types/database';

export type PositionCategory = 'offense' | 'defense' | 'special-teams';

export interface PositionInfo {
  code: SkillPosition;
  name: string;
  description: string;
  category: PositionCategory;
  group: string; // Sub-group within category (e.g., "Skill", "O-Line", "Secondary", etc.)
}

// Complete position listing with all offensive, defensive, and special teams positions
export const ALL_POSITIONS: Record<SkillPosition, PositionInfo> = {
  // OFFENSE - Skill Positions
  QB: { code: 'QB', name: 'Quarterback', description: 'Signal caller and field general', category: 'offense', group: 'Skill' },
  RB: { code: 'RB', name: 'Running Back', description: 'Primary ball carrier', category: 'offense', group: 'Skill' },
  FB: { code: 'FB', name: 'Fullback', description: 'Lead blocker and short yardage back', category: 'offense', group: 'Skill' },
  X: { code: 'X', name: 'X Receiver', description: 'Split end (left outside)', category: 'offense', group: 'Skill' },
  Z: { code: 'Z', name: 'Z Receiver', description: 'Flanker (right outside)', category: 'offense', group: 'Skill' },
  H: { code: 'H', name: 'H Receiver', description: 'Slot receiver', category: 'offense', group: 'Skill' },
  Y: { code: 'Y', name: 'Y Receiver', description: 'Tight end/Y receiver', category: 'offense', group: 'Skill' },
  TE: { code: 'TE', name: 'Tight End', description: 'Inline blocker and receiver', category: 'offense', group: 'Skill' },

  // OFFENSE - Offensive Line
  LT: { code: 'LT', name: 'Left Tackle', description: 'Blind side protector', category: 'offense', group: 'O-Line' },
  LG: { code: 'LG', name: 'Left Guard', description: 'Interior pass protector', category: 'offense', group: 'O-Line' },
  C: { code: 'C', name: 'Center', description: 'Snap and line calls', category: 'offense', group: 'O-Line' },
  RG: { code: 'RG', name: 'Right Guard', description: 'Interior pass protector', category: 'offense', group: 'O-Line' },
  RT: { code: 'RT', name: 'Right Tackle', description: 'Edge protector', category: 'offense', group: 'O-Line' },

  // DEFENSE - Defensive Line
  DE: { code: 'DE', name: 'Defensive End', description: 'Edge rusher and run stopper', category: 'defense', group: 'D-Line' },
  DT: { code: 'DT', name: 'Defensive Tackle', description: 'Interior gap control', category: 'defense', group: 'D-Line' },
  NT: { code: 'NT', name: 'Nose Tackle', description: 'Middle gap control (0-tech)', category: 'defense', group: 'D-Line' },

  // DEFENSE - Linebackers
  MLB: { code: 'MLB', name: 'Middle Linebacker', description: 'Run fits and coverage', category: 'defense', group: 'Linebacker' },
  OLB: { code: 'OLB', name: 'Outside Linebacker', description: 'Edge containment and coverage', category: 'defense', group: 'Linebacker' },
  ILB: { code: 'ILB', name: 'Inside Linebacker', description: 'Interior run fits', category: 'defense', group: 'Linebacker' },
  WILL: { code: 'WILL', name: 'Will Linebacker', description: 'Weakside linebacker', category: 'defense', group: 'Linebacker' },
  MIKE: { code: 'MIKE', name: 'Mike Linebacker', description: 'Middle linebacker', category: 'defense', group: 'Linebacker' },
  SAM: { code: 'SAM', name: 'Sam Linebacker', description: 'Strong side linebacker', category: 'defense', group: 'Linebacker' },

  // DEFENSE - Secondary
  CB: { code: 'CB', name: 'Cornerback', description: 'Man and zone coverage', category: 'defense', group: 'Secondary' },
  FS: { code: 'FS', name: 'Free Safety', description: 'Deep middle coverage', category: 'defense', group: 'Secondary' },
  SS: { code: 'SS', name: 'Strong Safety', description: 'Run support and coverage', category: 'defense', group: 'Secondary' },
  S: { code: 'S', name: 'Safety', description: 'Deep coverage and run support', category: 'defense', group: 'Secondary' },
  NB: { code: 'NB', name: 'Nickelback', description: 'Slot coverage specialist', category: 'defense', group: 'Secondary' },

  // SPECIAL TEAMS
  K: { code: 'K', name: 'Kicker', description: 'Field goals and kickoffs', category: 'special-teams', group: 'Kicking' },
  P: { code: 'P', name: 'Punter', description: 'Punts and field position', category: 'special-teams', group: 'Kicking' },
  LS: { code: 'LS', name: 'Long Snapper', description: 'Snaps for kicks and punts', category: 'special-teams', group: 'Kicking' },
  KR: { code: 'KR', name: 'Kick Returner', description: 'Returns kickoffs', category: 'special-teams', group: 'Returns' },
  PR: { code: 'PR', name: 'Punt Returner', description: 'Returns punts', category: 'special-teams', group: 'Returns' },
};

// Positions grouped by category
export const POSITIONS_BY_CATEGORY: Record<PositionCategory, SkillPosition[]> = {
  offense: ['QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'],
  defense: ['DE', 'DT', 'NT', 'MLB', 'OLB', 'ILB', 'WILL', 'MIKE', 'SAM', 'CB', 'FS', 'SS', 'S', 'NB'],
  'special-teams': ['K', 'P', 'LS', 'KR', 'PR'],
};

// Category labels for UI
export const CATEGORY_LABELS: Record<PositionCategory, string> = {
  offense: 'Offense',
  defense: 'Defense',
  'special-teams': 'Special Teams',
};

// Get positions by category
export function getPositionsByCategory(category: PositionCategory): PositionInfo[] {
  return Object.values(ALL_POSITIONS).filter(pos => pos.category === category);
}

// Get position info by code
export function getPositionInfo(code: SkillPosition): PositionInfo | undefined {
  return ALL_POSITIONS[code];
}

// Get category for a position
export function getPositionCategory(code: SkillPosition): PositionCategory | undefined {
  return ALL_POSITIONS[code]?.category;
}

// Group positions by their sub-group within a category
export function groupPositionsByGroup(category: PositionCategory): Record<string, PositionInfo[]> {
  const positions = getPositionsByCategory(category);
  const grouped: Record<string, PositionInfo[]> = {};

  positions.forEach(pos => {
    if (!grouped[pos.group]) {
      grouped[pos.group] = [];
    }
    grouped[pos.group].push(pos);
  });

  return grouped;
}
