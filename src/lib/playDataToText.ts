/**
 * Converts structured play data (from Play Builder) into text descriptions
 * for AI analysis and content generation
 */

import type { BuiltPlayData } from '@/components/play-recognition/PlayBuilder';
import type { DiagramPlayer, DiagramRoute } from '@/components/playbook-diagram/types';

/**
 * Main function to convert play data to AI-readable text
 */
export function playDataToText(playData: BuiltPlayData): string {
  const sections: string[] = [];

  // Header
  sections.push(`PLAY ANALYSIS REQUEST`);
  sections.push(`===================`);
  sections.push('');

  // Basic Info
  sections.push(`Play Name: ${playData.metadata.name}`);
  sections.push(`Formation: ${playData.metadata.formation}`);
  sections.push(`Concept: ${playData.metadata.concept || 'Not specified'}`);
  sections.push(`Play Type: ${playData.metadata.playType}`);
  sections.push(`Strength: ${playData.metadata.strength}`);
  sections.push(`Personnel: ${playData.metadata.personnel}`);
  sections.push('');

  // Formation Details
  sections.push(`FORMATION ALIGNMENT`);
  sections.push(`------------------`);
  sections.push(describeFormation(playData.offensePlayers, playData.defensePlayers));
  sections.push('');

  // Play Action (Pass or Run specific)
  if (playData.mode === 'pass' && playData.routes && playData.routes.length > 0) {
    sections.push(`PASSING ROUTES`);
    sections.push(`-------------`);
    sections.push(describeRoutes(playData.routes, playData.offensePlayers));
    sections.push('');

    sections.push(`ROUTE COMBINATIONS`);
    sections.push(`-----------------`);
    sections.push(analyzeRouteCombinations(playData.routes, playData.offensePlayers));
    sections.push('');
  } else if (playData.mode === 'run') {
    sections.push(`RUN SCHEME`);
    sections.push(`----------`);
    if (playData.blocking && playData.blocking.length > 0) {
      sections.push(describeBlocking(playData.blocking, playData.offensePlayers, playData.defensePlayers));
    } else {
      sections.push('No blocking assignments specified.');
    }
    sections.push('');

    if (playData.ballCarrierPath) {
      sections.push(`BALL CARRIER PATH`);
      sections.push(`----------------`);
      sections.push(describeBallCarrier(playData.ballCarrierPath, playData.offensePlayers));
      sections.push('');
    }
  }

  // Defense Alignment
  sections.push(`DEFENSIVE ALIGNMENT`);
  sections.push(`------------------`);
  sections.push(describeDefense(playData.defensePlayers));
  sections.push('');

  // Analysis Request
  sections.push(`ANALYSIS REQUEST`);
  sections.push(`---------------`);
  sections.push(`Please analyze this ${playData.metadata.playType} play and generate:`);
  sections.push(`1. Position-specific assignments (alignment, landmark, assignment, key reads)`);
  sections.push(`2. Strategic insights (strengths, weaknesses, coverage adjustments)`);
  sections.push(`3. Knowledge test questions (alignment, assignment, coverage reads)`);
  sections.push('');

  return sections.join('\n');
}

/**
 * Describe offensive formation and alignment
 */
function describeFormation(offense: DiagramPlayer[], defense: DiagramPlayer[]): string {
  const lines: string[] = [];

  // Group players by position group
  const line = offense.filter(p => p.group === 'line');
  const backfield = offense.filter(p => p.group === 'backfield');
  const skill = offense.filter(p => p.group === 'skill');

  // Offensive Line
  if (line.length > 0) {
    const linePositions = line
      .sort((a, b) => a.x - b.x)
      .map(p => p.label)
      .join(' - ');
    lines.push(`Offensive Line: ${linePositions}`);
  }

  // Backfield
  if (backfield.length > 0) {
    const backfieldDesc = backfield.map(p => {
      const depth = Math.abs(p.y - 32); // Distance from LOS (assumed at y=32)
      return `${p.label} at ${depth.toFixed(1)} yards depth`;
    }).join(', ');
    lines.push(`Backfield: ${backfieldDesc}`);
  }

  // Skill Positions
  if (skill.length > 0) {
    // Determine left/right/slot based on X position
    const skillByPosition = skill.map(p => {
      const xPos = p.x;
      let position = '';

      if (xPos < 45) position = 'Left';
      else if (xPos > 55) position = 'Right';
      else position = 'Slot';

      const split = Math.abs(xPos - 50); // Distance from center
      return `${p.label} ${position} (${split.toFixed(1)} yards split)`;
    });
    lines.push(`Skill Players: ${skillByPosition.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Describe passing routes
 */
function describeRoutes(routes: DiagramRoute[], players: DiagramPlayer[]): string {
  const lines: string[] = [];

  for (const route of routes) {
    const player = players.find(p => p.id === route.playerId);
    if (!player || route.points.length < 2) continue;

    const routeDesc = analyzeRoutePath(route.points);
    lines.push(`${player.label}: ${routeDesc}`);
  }

  return lines.length > 0 ? lines.join('\n') : 'No routes defined.';
}

/**
 * Analyze a route path to describe it in football terms
 */
function analyzeRoutePath(points: {x: number, y: number}[]): string {
  if (points.length < 2) return 'No route';

  const start = points[0];
  const end = points[points.length - 1];

  // Calculate vertical distance (depth)
  const depth = Math.abs(start.y - end.y);

  // Calculate horizontal distance (direction)
  const horizontal = end.x - start.x;

  // Determine route type based on path
  const hasBreaks = points.length > 2;

  let routeType = '';

  if (!hasBreaks) {
    // Simple vertical or diagonal route
    if (Math.abs(horizontal) < 2) {
      routeType = depth > 10 ? 'Go/Streak' : 'Hitch';
    } else if (horizontal > 0) {
      routeType = depth > 10 ? 'Deep Out' : 'Out';
    } else {
      routeType = depth > 10 ? 'Deep In' : 'In/Dig';
    }
  } else {
    // Route with breaks
    if (points.length === 3) {
      const breakPoint = points[1];
      const firstLegVertical = Math.abs(breakPoint.y - start.y);
      const secondLegHorizontal = Math.abs(end.x - breakPoint.x);

      if (firstLegVertical > secondLegHorizontal) {
        routeType = horizontal > 0 ? 'Corner' : 'Post';
      } else {
        routeType = depth > 15 ? 'Deep Cross' : 'Shallow Cross';
      }
    } else {
      routeType = 'Multi-break route';
    }
  }

  return `${routeType} (${depth.toFixed(0)} yards depth, ${points.length} points)`;
}

/**
 * Analyze route combinations and concepts
 */
function analyzeRouteCombinations(routes: DiagramRoute[], players: DiagramPlayer[]): string {
  if (routes.length < 2) return 'Single route - no combination analysis.';

  const lines: string[] = [];

  // Group routes by depth
  const depths = routes.map(r => {
    const start = r.points[0];
    const end = r.points[r.points.length - 1];
    return Math.abs(end.y - start.y);
  });

  const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
  const hasLevels = depths.some(d => d < avgDepth * 0.7) && depths.some(d => d > avgDepth * 1.3);

  if (hasLevels) {
    lines.push('- Vertical stretch with multiple levels');
  }

  // Check for horizontal stretch
  const endPoints = routes.map(r => r.points[r.points.length - 1].x);
  const spread = Math.max(...endPoints) - Math.min(...endPoints);

  if (spread > 30) {
    lines.push('- Wide horizontal stretch across the field');
  }

  // Check for high-low combinations
  const shortRoutes = routes.filter((r, i) => depths[i] < 10).length;
  const deepRoutes = routes.filter((r, i) => depths[i] > 15).length;

  if (shortRoutes > 0 && deepRoutes > 0) {
    lines.push(`- High-low concept (${deepRoutes} deep, ${shortRoutes} short)`);
  }

  return lines.length > 0 ? lines.join('\n') : 'Standard route distribution.';
}

/**
 * Describe blocking scheme for run plays
 */
function describeBlocking(
  blocking: any[],
  offense: DiagramPlayer[],
  defense: DiagramPlayer[]
): string {
  const lines: string[] = [];

  for (const block of blocking) {
    const blocker = offense.find(p => p.id === block.blockerId);
    const target = defense.find(p => p.id === block.targetId);

    if (blocker && target) {
      lines.push(`${blocker.label} - ${block.type} block on ${target.label}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'Blocking scheme not specified.';
}

/**
 * Describe ball carrier path
 */
function describeBallCarrier(path: any, players: DiagramPlayer[]): string {
  const carrier = players.find(p => p.id === path.playerId);
  if (!carrier || !path.points || path.points.length < 2) {
    return 'Ball carrier path not specified.';
  }

  const start = path.points[0];
  const end = path.points[path.points.length - 1];

  const horizontal = end.x - start.x;
  const direction = horizontal > 5 ? 'Right' : horizontal < -5 ? 'Left' : 'Straight';

  return `${carrier.label} running ${direction} (${path.points.length} cut points)`;
}

/**
 * Describe defensive alignment
 */
function describeDefense(defense: DiagramPlayer[]): string {
  const lines: string[] = [];

  // Group by position group
  const dline = defense.filter(p => p.group === 'line');
  const lbs = defense.filter(p => p.group === 'linebacker');
  const secondary = defense.filter(p => p.group === 'secondary');

  if (dline.length > 0) {
    lines.push(`D-Line: ${dline.length} players (${dline.map(p => p.label).join(', ')})`);
  }

  if (lbs.length > 0) {
    lines.push(`Linebackers: ${lbs.length} players (${lbs.map(p => p.label).join(', ')})`);
  }

  if (secondary.length > 0) {
    lines.push(`Secondary: ${secondary.length} players (${secondary.map(p => p.label).join(', ')})`);

    // Try to identify coverage
    const deepSafeties = secondary.filter(p => p.y < 20).length;
    if (deepSafeties >= 2) {
      lines.push(`Likely 2-deep safety shell`);
    } else if (deepSafeties === 1) {
      lines.push(`Likely single-high safety`);
    }
  }

  return lines.join('\n');
}

/**
 * Extract key information for AI prompt
 */
export function getPlaySummary(playData: BuiltPlayData): string {
  return `${playData.metadata.playType} play "${playData.metadata.name}" from ${playData.metadata.formation} formation, ${playData.metadata.concept || 'no specific concept'}`;
}
