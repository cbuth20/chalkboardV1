/**
 * POST /api/flashcards/regenerate/:playId
 * Regenerate flashcards for a play
 * Auth: Coach/Admin
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError, ValidationError } from './shared/errors';
import { validateUUID } from './shared/validators';

const handler: Handler = withOrgAuth('coach')(async (event, context) => {
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

    // Get play ID from path
    const pathParts = event.path.split('/');
    const playId = pathParts[pathParts.length - 1];
    validateUUID(playId, 'playId');

    // Fetch play to verify ownership
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select('id, org_id, content_status')
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Play');
    }

    // Verify play belongs to user's org
    if (play.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this play');
    }

    // Deactivate existing flashcards (don't delete - maintain history)
    const { error: deactivateError } = await supabase
      .from('flashcard_templates')
      .update({ is_active: false })
      .eq('play_id', playId)
      .eq('is_auto_generated', true); // Only deactivate auto-generated cards

    if (deactivateError) {
      console.warn('Failed to deactivate existing flashcards:', deactivateError);
    }

    console.log(`✅ Deactivated auto-generated flashcards for play ${playId}`);

    // Return success
    // Note: Actual regeneration would happen via the background processing endpoint
    // This endpoint just marks existing flashcards as inactive and returns
    // The client should then call the process-play endpoint to regenerate

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Existing flashcards deactivated. Trigger play processing to regenerate.',
        playId,
      }),
    };
  } catch (error) {
    console.error('Error regenerating flashcards:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
