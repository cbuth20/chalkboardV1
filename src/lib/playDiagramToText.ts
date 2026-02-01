/**
 * Converts PlayBuilder diagram data to a text description for LLM processing
 */

import type { DiagramPlayer, DiagramRoute, PlayMode } from '@/components/playbook-diagram/types';

export interface DiagramData {
  mode: PlayMode;
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
  routes?: DiagramRoute[];
  blocking?: any[];
  ballCarrierPath?: any;
}

interface PlayMetadata {
  name: string;
  formation: string;
  concept: string;
  playType: 'PASS' | 'RUN' | 'RPO';
  strength: 'Right' | 'Left';
  personnel: string;
}

/**
 * Converts diagram data to a detailed text description for LLM processing
 */
export function diagramToText(diagram: DiagramData, metadata: PlayMetadata): string {
  const sections: string[] = [];

  // Play Header
  sections.push(`=== PLAY: ${metadata.name} ===`);
  sections.push(`Formation: ${metadata.formation}`);
  sections.push(`Concept: ${metadata.concept || 'N/A'}`);
  sections.push(`Play Type: ${metadata.playType}`);
  sections.push(`Strength: ${metadata.strength}`);
  sections.push(`Personnel: ${metadata.personnel}`);
  sections.push(`Mode: ${diagram.mode.toUpperCase()}`);
  sections.push('');

  // Offensive Formation
  sections.push('--- OFFENSIVE ALIGNMENT ---');

  // Group players by position group
  const backfield = diagram.offensePlayers.filter(p => p.group === 'backfield');
  const skill = diagram.offensePlayers.filter(p => p.group === 'skill');
  const line = diagram.offensePlayers.filter(p => p.group === 'line');

  if (backfield.length > 0) {
    sections.push('\nBackfield:');
    backfield.forEach(player => {
      sections.push(`  ${player.label}: positioned at (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`);
    });
  }

  if (skill.length > 0) {
    sections.push('\nSkill Positions:');
    skill.forEach(player => {
      sections.push(`  ${player.label}: positioned at (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`);
    });
  }

  if (line.length > 0) {
    sections.push('\nOffensive Line:');
    line.forEach(player => {
      sections.push(`  ${player.label}: positioned at (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`);
    });
  }

  // Routes (for pass plays)
  if (diagram.mode === 'pass' && diagram.routes && diagram.routes.length > 0) {
    sections.push('\n--- ROUTE ASSIGNMENTS ---');

    diagram.routes.forEach(route => {
      const player = diagram.offensePlayers.find(p => p.id === route.playerId);
      if (!player) return;

      sections.push(`\n${player.label} Route:`);

      // Describe the route path
      if (route.points.length >= 2) {
        const start = route.points[0];
        const end = route.points[route.points.length - 1];

        // Calculate direction
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;

        let direction = '';
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          direction = deltaY > 0 ? 'downfield' : 'upfield';
        } else {
          direction = deltaX > 0 ? 'right' : 'left';
        }

        // Calculate approximate distance
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        sections.push(`  - Starts at (${start.x.toFixed(1)}, ${start.y.toFixed(1)})`);
        sections.push(`  - Runs ${direction} approximately ${distance.toFixed(1)} yards`);
        sections.push(`  - Ends at (${end.x.toFixed(1)}, ${end.y.toFixed(1)})`);

        // Describe route shape (straight, curling, etc.)
        if (route.points.length > 2) {
          const isLinear = isRouteStraight(route.points);
          if (isLinear) {
            sections.push(`  - Route shape: STRAIGHT/GO route`);
          } else {
            const breaks = findRouteBreaks(route.points);
            if (breaks.length > 0) {
              sections.push(`  - Route shape: Breaking route with ${breaks.length} cut(s)`);
            } else {
              sections.push(`  - Route shape: CURVED/ROUNDED route`);
            }
          }
        }
      }
    });
  }

  // Defensive Alignment
  sections.push('\n--- DEFENSIVE ALIGNMENT ---');

  const secondary = diagram.defensePlayers.filter(p => p.group === 'secondary');
  const linebackers = diagram.defensePlayers.filter(p => p.group === 'linebacker');
  const dline = diagram.defensePlayers.filter(p => p.group === 'line');

  if (secondary.length > 0) {
    sections.push('\nSecondary:');
    secondary.forEach(player => {
      sections.push(`  ${player.label}: positioned at (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`);
    });
  }

  if (linebackers.length > 0) {
    sections.push('\nLinebackers:');
    linebackers.forEach(player => {
      sections.push(`  ${player.label}: positioned at (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`);
    });
  }

  if (dline.length > 0) {
    sections.push('\nDefensive Line:');
    dline.forEach(player => {
      sections.push(`  ${player.label}: positioned at (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`);
    });
  }

  return sections.join('\n');
}

/**
 * Check if a route is mostly straight
 */
function isRouteStraight(points: {x: number, y: number}[]): boolean {
  if (points.length < 3) return true;

  // Calculate average angle deviation
  let totalDeviation = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const v1x = points[i].x - points[i-1].x;
    const v1y = points[i].y - points[i-1].y;
    const v2x = points[i+1].x - points[i].x;
    const v2y = points[i+1].y - points[i].y;

    const angle1 = Math.atan2(v1y, v1x);
    const angle2 = Math.atan2(v2y, v2x);
    const deviation = Math.abs(angle2 - angle1);

    totalDeviation += deviation;
  }

  const avgDeviation = totalDeviation / (points.length - 2);

  // If average deviation is small, it's a straight route
  return avgDeviation < 0.3; // ~17 degrees
}

/**
 * Find breaking points in a route
 */
function findRouteBreaks(points: {x: number, y: number}[]): number[] {
  const breaks: number[] = [];

  for (let i = 2; i < points.length - 1; i++) {
    const v1x = points[i].x - points[i-2].x;
    const v1y = points[i].y - points[i-2].y;
    const v2x = points[i+2].x - points[i].x;
    const v2y = points[i+2].y - points[i].y;

    const angle1 = Math.atan2(v1y, v1x);
    const angle2 = Math.atan2(v2y, v2x);
    const deviation = Math.abs(angle2 - angle1);

    // If deviation is significant, it's a break
    if (deviation > 0.7) { // ~40 degrees
      breaks.push(i);
    }
  }

  return breaks;
}

/**
 * Generate a concise summary for quick reference
 */
export function diagramToSummary(diagram: DiagramData, metadata: PlayMetadata): string {
  const routeCount = diagram.routes?.length || 0;
  const playerPositions = diagram.offensePlayers.map(p => p.label).join(', ');

  return `${metadata.name} (${metadata.formation}) - ${metadata.playType} play with ${routeCount} routes. Players: ${playerPositions}`;
}
