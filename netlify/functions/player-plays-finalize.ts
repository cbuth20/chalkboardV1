/**
 * POST /api/player-plays-finalize
 * Finalize a player play after validation
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired, validateUUID } from './shared/validators';

interface FinalizePlayerPlayRequest {
  playId: string;
  triggerProcessing?: boolean; // Whether to trigger AI processing after finalization
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
    const body: FinalizePlayerPlayRequest = JSON.parse(event.body || '{}');
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

    // Check if already finalized
    if (play.is_finalized) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Play is already finalized',
          playId: play.id,
        }),
      };
    }

    // Run validation by calling the validate endpoint
    const validateUrl = `${event.headers.host?.includes('localhost') ? 'http' : 'https'}://${event.headers.host}/.netlify/functions/player-plays-validate`;

    const validateResponse = await fetch(validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass through authentication headers
        'Authorization': event.headers.authorization || '',
      },
      body: JSON.stringify({ playId: body.playId }),
    });

    if (!validateResponse.ok) {
      throw new Error('Failed to validate play');
    }

    const validationResult = await validateResponse.json();

    if (!validationResult.isValid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Play validation failed',
          warnings: validationResult.warnings,
        }),
      };
    }

    // Update play to finalized
    const { error: updateError } = await supabase
      .from('player_plays')
      .update({
        is_finalized: true,
        completion_warnings: [],
        content_status: body.triggerProcessing ? 'generating' : 'draft',
      })
      .eq('id', body.playId)
      .eq('user_id', user.userId);

    if (updateError) {
      throw new Error(`Failed to finalize play: ${updateError.message}`);
    }

    console.log(`✅ Player play finalized: ${play.id}`);

    // Trigger AI processing if requested
    if (body.triggerProcessing) {
      const backgroundFunctionUrl = `${event.headers.host?.includes('localhost') ? 'http' : 'https'}://${event.headers.host}/.netlify/functions/process-player-play-content-background`;

      console.log(`🚀 Triggering AI processing for finalized player play ${play.id}`);

      // Fire-and-forget call to background function
      fetch(backgroundFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playId: play.id,
          generateInsights: true,
          generateAssignments: true,
          generateKnowledge: true,
          useStructuredData: true, // Flag to use structured assignments instead of image analysis
        }),
      }).catch((error) => {
        console.error('Failed to trigger AI processing:', error);
        // Don't throw - play is already finalized
      });

      console.log(`✅ AI processing triggered for player play ${play.id}`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: body.triggerProcessing
          ? 'Play finalized and AI processing started'
          : 'Play finalized successfully',
        playId: play.id,
      }),
    };
  } catch (error) {
    console.error('Error finalizing player play:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
