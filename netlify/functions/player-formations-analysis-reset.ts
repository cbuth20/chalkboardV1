/**
 * POST /api/player-formations-analysis-reset
 * Reset a stuck formations analysis to allow retrying
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateUUID } from './shared/validators';

interface ResetAnalysisRequest {
  analysisId: string;
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
    const body: ResetAnalysisRequest = JSON.parse(event.body || '{}');
    const { analysisId } = body;

    validateUUID(analysisId, 'analysisId');

    console.log(`🔄 Resetting analysis ${analysisId} for user ${user.userId}`);

    // Verify ownership
    const { data: analysis, error: fetchError } = await supabase
      .from('player_playbook_analysis')
      .select('id, user_id, status, started_at')
      .eq('id', analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new ValidationError('Analysis not found');
    }

    if (analysis.user_id !== user.userId) {
      throw new ValidationError('Unauthorized');
    }

    // Only reset if it's stuck in processing
    if (analysis.status !== 'processing') {
      throw new ValidationError('Analysis is not in processing state');
    }

    // Check if it's been more than 15 minutes
    const startedAt = new Date(analysis.started_at).getTime();
    const now = Date.now();
    const minutesElapsed = (now - startedAt) / 1000 / 60;

    if (minutesElapsed < 15) {
      throw new ValidationError('Analysis is still running. Please wait at least 15 minutes before resetting.');
    }

    // Update status to failed
    const { error: updateError } = await supabase
      .from('player_playbook_analysis')
      .update({
        status: 'failed',
        error_message: 'Analysis timed out or was interrupted',
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysisId);

    if (updateError) {
      throw new Error(`Failed to reset analysis: ${updateError.message}`);
    }

    console.log(`✅ Successfully reset analysis ${analysisId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Analysis reset successfully. You can now start a new analysis.',
      }),
    };
  } catch (error) {
    console.error('Error resetting analysis:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
