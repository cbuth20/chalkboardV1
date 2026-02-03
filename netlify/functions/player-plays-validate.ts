/**
 * POST /api/player-plays-validate
 * Validate a player play for finalization
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired, validateUUID } from './shared/validators';

interface ValidatePlayerPlayRequest {
  playId: string;
}

interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
  playerId?: string;
}

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    // Parse request body
    const body: ValidatePlayerPlayRequest = JSON.parse(event.body || '{}');
    validateRequired(body.playId, 'playId');
    validateUUID(body.playId, 'playId');

    // Fetch the play
    const { data: play, error: playError } = await supabase
      .from('player_plays')
      .select('*')
      .eq('id', body.playId)
      .eq('user_id', user.userId)
      .single();

    if (playError || !play) {
      throw new ValidationError('Play not found or you do not have permission to access it');
    }

    const warnings: ValidationWarning[] = [];

    // Parse player assignments and responsibilities
    const playerAssignments = play.player_assignments || {};
    const playerResponsibilities = play.player_responsibilities || {};
    const visualData = play.visual_data || {};

    // Get all player IDs from visual data
    const allPlayerIds = new Set<string>();

    // Extract player IDs from diagram_data if it exists (legacy)
    if (play.diagram_data) {
      const diagramData = play.diagram_data;
      if (diagramData.offensePlayers) {
        diagramData.offensePlayers.forEach((p: any) => allPlayerIds.add(p.id));
      }
      if (diagramData.defensePlayers) {
        diagramData.defensePlayers.forEach((p: any) => allPlayerIds.add(p.id));
      }
    }

    // Extract player IDs from visual_data (new structured format)
    if (visualData.offensePlayers) {
      visualData.offensePlayers.forEach((p: any) => allPlayerIds.add(p.id));
    }
    if (visualData.defensePlayers) {
      visualData.defensePlayers.forEach((p: any) => allPlayerIds.add(p.id));
    }

    // Check required metadata
    if (!play.name || play.name === 'Untitled Play') {
      warnings.push({
        type: 'error',
        message: 'Play name is required',
      });
    }

    if (!play.formation_name && !play.formation_id) {
      warnings.push({
        type: 'error',
        message: 'Formation is required',
      });
    }

    if (!play.side_of_ball) {
      warnings.push({
        type: 'error',
        message: 'Side of ball is required',
      });
    }

    if (!play.structured_play_type && !play.play_type) {
      warnings.push({
        type: 'error',
        message: 'Play type is required',
      });
    }

    // Check for situational tags
    const { data: situationalTags } = await supabase
      .from('player_play_situational_tags')
      .select('tag_id')
      .eq('player_play_id', play.id);

    if (!situationalTags || situationalTags.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'At least one situational tag is recommended',
      });
    }

    // Check assignments for all players
    const playersWithoutAssignments: string[] = [];
    allPlayerIds.forEach(playerId => {
      if (!playerAssignments[playerId]) {
        playersWithoutAssignments.push(playerId);
      }
    });

    if (playersWithoutAssignments.length > 0) {
      warnings.push({
        type: 'error',
        message: `${playersWithoutAssignments.length} player(s) missing assignments`,
      });
    }

    // Check responsibilities for all players
    const playersWithoutResponsibilities: string[] = [];
    allPlayerIds.forEach(playerId => {
      const responsibility = playerResponsibilities[playerId];
      if (!responsibility || !responsibility.responsibility) {
        playersWithoutResponsibilities.push(playerId);
      }
    });

    if (playersWithoutResponsibilities.length > 0) {
      warnings.push({
        type: 'error',
        message: `${playersWithoutResponsibilities.length} player(s) missing responsibilities`,
      });
    }

    // Check for orphaned routes (routes not tied to players)
    if (visualData.routes) {
      const orphanedRoutes = visualData.routes.filter((route: any) =>
        !allPlayerIds.has(route.playerId)
      );

      if (orphanedRoutes.length > 0) {
        warnings.push({
          type: 'warning',
          message: `${orphanedRoutes.length} route(s) not tied to players`,
        });
      }
    }

    // Determine if play is valid (no errors, only warnings allowed)
    const hasErrors = warnings.some(w => w.type === 'error');
    const isValid = !hasErrors && allPlayerIds.size > 0;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        isValid,
        warnings,
        playerCount: allPlayerIds.size,
        playersWithAssignments: Object.keys(playerAssignments).length,
        playersWithResponsibilities: Object.keys(playerResponsibilities).length,
      }),
    };
  } catch (error) {
    console.error('Error validating player play:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
