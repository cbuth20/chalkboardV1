/**
 * GET /activities-results
 * Get results for a specific activity attempt
 * Auth: All authenticated users (must own the attempt)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError } from './shared/errors';
import { validateUUID } from './shared/validators';

const handler: Handler = withOrgAuth()(async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    const params = event.queryStringParameters || {};
    const attemptId = params.attemptId;

    if (!attemptId) {
      throw new Error('attemptId is required');
    }

    validateUUID(attemptId, 'attemptId');

    // Fetch attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('activity_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      throw new NotFoundError('Attempt');
    }

    // Verify user owns this attempt (unless coach/admin)
    if (attempt.user_id !== user.userId && user.role !== 'coach' && user.role !== 'admin') {
      throw new ForbiddenError('You do not have permission to view this attempt');
    }

    // Fetch activity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', attempt.activity_id)
      .single();

    if (activityError || !activity) {
      throw new NotFoundError('Activity');
    }

    // If attempt hasn't been completed yet, return error
    if (!attempt.completed_at) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'This attempt has not been completed yet',
          code: 'ATTEMPT_NOT_COMPLETED',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        attempt,
        activity,
      }),
    };

  } catch (error) {
    console.error('[Activities Results] Error:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
