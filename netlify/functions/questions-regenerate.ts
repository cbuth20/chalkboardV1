/**
 * POST /api/questions-regenerate
 * Trigger background question regeneration for an existing play
 * Auth: Coach/Admin
 *
 * This is a quick handler that kicks off the background job
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ValidationError } from './shared/errors';
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

    const {
      playId,
      questionCount,
      deactivateOld = true,
    } = JSON.parse(event.body || '{}');

    // Validate playId
    validateUUID(playId, 'playId');

    // Verify play exists and belongs to user's org
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select('id, name, org_id')
      .eq('id', playId)
      .eq('org_id', user.orgId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Play');
    }

    console.log(`[Questions] Triggering background regeneration for play: ${play.name}`);

    // Construct background function URL
    const backgroundFunctionUrl = `${event.headers.host?.includes('localhost') ? 'http' : 'https'}://${event.headers.host}/.netlify/functions/questions-regenerate-background`;

    // Fire-and-forget call to background function
    fetch(backgroundFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playId,
        orgId: user.orgId,
        userId: user.userId,
        questionCount,
        deactivateOld,
      }),
    }).catch((error) => {
      console.error('[Questions] Failed to trigger background function:', error);
    });

    console.log(`✅ [Questions] Background job triggered for play ${playId}`);

    return {
      statusCode: 202, // Accepted
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        playId,
        playName: play.name,
        status: 'processing',
        message: 'Question generation started. This may take 1-2 minutes. Refresh the page to see results.',
      }),
    };
  } catch (error) {
    console.error('[Questions] Error:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
