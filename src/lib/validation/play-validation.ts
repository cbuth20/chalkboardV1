/**
 * Play Validation Utilities
 * Validates structured play data before finalization
 */

import type { BuiltPlayData, DiagramPlayer } from '@/types/play-assignments';

export interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
  playerId?: string;
  field?: string;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  playerCount: number;
  playersWithAssignments: number;
  playersWithResponsibilities: number;
}

/**
 * Comprehensive play validation
 */
export function validatePlay(play: BuiltPlayData): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const allPlayers = [...play.offensePlayers, ...play.defensePlayers];

  // ═══════════════════════════════════════════════════════════════════
  // METADATA VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  if (!play.metadata.playName || play.metadata.playName.trim() === '') {
    warnings.push({
      type: 'error',
      message: 'Play name is required',
      field: 'playName',
    });
  }

  if (!play.metadata.sideOfBall) {
    warnings.push({
      type: 'error',
      message: 'Side of ball must be selected (Offense or Defense)',
      field: 'sideOfBall',
    });
  }

  if (!play.metadata.playType) {
    warnings.push({
      type: 'error',
      message: 'Play type is required',
      field: 'playType',
    });
  }

  if (!play.metadata.formationName && !play.metadata.formationId) {
    warnings.push({
      type: 'error',
      message: 'Formation must be selected',
      field: 'formation',
    });
  }

  if (!play.metadata.personnel || play.metadata.personnel.trim() === '') {
    warnings.push({
      type: 'warning',
      message: 'Personnel grouping is recommended',
      field: 'personnel',
    });
  }

  if (!play.metadata.situationalTags || play.metadata.situationalTags.length === 0) {
    warnings.push({
      type: 'warning',
      message: 'At least one situational tag is recommended for better organization',
      field: 'situationalTags',
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PLAYER COUNT VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  if (allPlayers.length === 0) {
    warnings.push({
      type: 'error',
      message: 'At least one player is required',
    });
  }

  if (play.metadata.sideOfBall === 'offense' && play.offensePlayers.length < 11) {
    warnings.push({
      type: 'warning',
      message: `Only ${play.offensePlayers.length} offensive players (11 recommended)`,
    });
  }

  if (play.metadata.sideOfBall === 'defense' && play.defensePlayers.length < 11) {
    warnings.push({
      type: 'warning',
      message: `Only ${play.defensePlayers.length} defensive players (11 recommended)`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // ASSIGNMENT VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  const playersWithoutAssignments = allPlayers.filter(p => !p.assignment);

  if (playersWithoutAssignments.length > 0) {
    warnings.push({
      type: 'error',
      message: `${playersWithoutAssignments.length} player(s) missing assignments`,
    });

    // Add individual warnings for each player
    playersWithoutAssignments.forEach(player => {
      warnings.push({
        type: 'error',
        message: `${player.label} (${player.position}) has no assignment`,
        playerId: player.id,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // RESPONSIBILITY VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  const playersWithoutResponsibilities = allPlayers.filter(
    p => !p.responsibility?.responsibility || p.responsibility.responsibility.trim() === ''
  );

  if (playersWithoutResponsibilities.length > 0) {
    warnings.push({
      type: 'error',
      message: `${playersWithoutResponsibilities.length} player(s) missing responsibilities`,
    });

    // Add individual warnings for each player
    playersWithoutResponsibilities.forEach(player => {
      warnings.push({
        type: 'error',
        message: `${player.label} (${player.position}) has no responsibility defined`,
        playerId: player.id,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // VISUAL DATA VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  // Check for orphaned routes (routes not tied to players)
  if (play.visualData?.routes) {
    const orphanedRoutes = play.visualData.routes.filter(
      route => !allPlayers.find(p => p.id === route.playerId)
    );

    if (orphanedRoutes.length > 0) {
      warnings.push({
        type: 'warning',
        message: `${orphanedRoutes.length} route(s) not tied to any player`,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // CALCULATE RESULT
  // ═══════════════════════════════════════════════════════════════════

  const hasErrors = warnings.some(w => w.type === 'error');
  const isValid = !hasErrors && allPlayers.length > 0;

  const playersWithAssignments = allPlayers.filter(p => p.assignment).length;
  const playersWithResponsibilities = allPlayers.filter(
    p => p.responsibility?.responsibility && p.responsibility.responsibility.trim() !== ''
  ).length;

  return {
    isValid,
    warnings,
    playerCount: allPlayers.length,
    playersWithAssignments,
    playersWithResponsibilities,
  };
}

/**
 * Quick validation check (returns only boolean)
 */
export function isPlayValid(play: BuiltPlayData): boolean {
  const result = validatePlay(play);
  return result.isValid;
}

/**
 * Get validation summary text
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return 'Play is ready to finalize';
  }

  const errorCount = result.warnings.filter(w => w.type === 'error').length;
  const warningCount = result.warnings.filter(w => w.type === 'warning').length;

  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}
