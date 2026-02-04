/**
 * POST /api/player-plays-batch-process
 * Process multiple plays at once (max 10)
 * Auth: Player (only process own plays)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';

interface BatchProcessRequest {
  playIds: string[];
  generateInsights?: boolean;
  generateAssignments?: boolean;
  generateKnowledge?: boolean;
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

    const body: BatchProcessRequest = JSON.parse(event.body || '{}');
    const { playIds, generateInsights = true, generateAssignments = true, generateKnowledge = true } = body;

    // Validate playIds
    if (!playIds || !Array.isArray(playIds) || playIds.length === 0) {
      throw new ValidationError('playIds array is required and cannot be empty');
    }

    // Validate max 10 plays
    if (playIds.length > 10) {
      throw new ValidationError('Maximum 10 plays can be processed at once');
    }

    // Verify ownership of all plays
    const { data: plays, error: playsError } = await supabase
      .from('player_plays')
      .select('id, user_id, org_id, name, content_status')
      .in('id', playIds)
      .eq('org_id', user.orgId);

    if (playsError) {
      console.error('Failed to fetch plays:', playsError);
      throw new Error('Failed to fetch plays');
    }

    if (!plays || plays.length === 0) {
      throw new ValidationError('No plays found with the provided IDs');
    }

    // Verify all plays belong to the user
    const invalidPlays = plays.filter(p => p.user_id !== user.userId);
    if (invalidPlays.length > 0) {
      throw new ValidationError('You do not have permission to process all selected plays');
    }

    // Check for plays already processing
    const alreadyProcessing = plays.filter(p => p.content_status === 'generating');
    if (alreadyProcessing.length > 0) {
      console.warn('Some plays are already processing:', alreadyProcessing.map(p => p.id));
    }

    // Update all plays to generating status
    const { error: updateError } = await supabase
      .from('player_plays')
      .update({ content_status: 'generating' })
      .in('id', playIds);

    if (updateError) {
      console.error('Failed to update play statuses:', updateError);
      throw new Error('Failed to update play statuses');
    }

    // Get the Netlify function URL
    const functionUrl = process.env.URL
      ? `${process.env.URL}/.netlify/functions/process-player-play-content-background`
      : 'http://localhost:8888/.netlify/functions/process-player-play-content-background';

    console.log(`Starting batch processing for ${playIds.length} plays`);

    // Fire-and-forget to background processor for each play
    const processingPromises = playIds.map(async (playId) => {
      try {
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playId,
            generateInsights,
            generateAssignments,
            generateKnowledge,
          }),
        });
        console.log(`Started processing for play ${playId}`);
      } catch (error) {
        console.error(`Failed to trigger processing for play ${playId}:`, error);
        // Continue with other plays even if one fails
      }
    });

    // Don't wait for the processing to complete - fire and forget
    Promise.all(processingPromises).catch(err => {
      console.error('Error in batch processing:', err);
    });

    return {
      statusCode: 202, // Accepted
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Started processing ${playIds.length} play(s)`,
        playIds,
        processingCount: playIds.length,
      }),
    };
  } catch (error: any) {
    console.error('Error in batch process:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
