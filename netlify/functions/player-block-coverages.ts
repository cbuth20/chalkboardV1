/**
 * GET /api/player-block-coverages
 * Fetch all block coverage scenarios for the authenticated player
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse } from './shared/errors';

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  // DELETE - Clear all scenarios for the user
  if (event.httpMethod === 'DELETE') {
    try {
      const user = getAuthenticatedUser(event);
      const supabase = getSupabaseAdmin();

      const { error } = await supabase
        .from('player_block_coverages')
        .delete()
        .eq('user_id', user.userId)
        .eq('org_id', user.orgId);

      if (error) {
        throw new Error(`Failed to delete scenarios: ${error.message}`);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    } catch (error) {
      console.error('Error deleting block coverages:', error);
      return formatErrorResponse(error);
    }
  }

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

    const { data: coverages, error } = await supabase
      .from('player_block_coverages')
      .select('*')
      .eq('user_id', user.userId)
      .eq('org_id', user.orgId);

    if (error) {
      throw new Error(`Failed to fetch coverages: ${error.message}`);
    }

    // Fetch analysis status — use specific ID if provided, otherwise latest
    const params = new URLSearchParams(event.rawQuery || '');
    const requestedAnalysisId = params.get('analysisId');

    let latestAnalysis: any = null;
    if (requestedAnalysisId) {
      // Frontend is tracking a specific analysis — query it directly
      const { data } = await supabase
        .from('player_playbook_analysis')
        .select('id, status, error_message, started_at')
        .eq('id', requestedAnalysisId)
        .single();
      latestAnalysis = data;
    } else {
      // No specific ID — fall back to latest by started_at
      const { data } = await supabase
        .from('player_playbook_analysis')
        .select('id, status, error_message, started_at')
        .eq('user_id', user.userId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      latestAnalysis = data;
    }

    // Check if user has any analyzable files (PDFs/images)
    const SUPPORTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
    const { data: allFiles } = await supabase
      .from('player_playbook_metadata')
      .select('file_paths')
      .eq('user_id', user.userId);
    const hasAnalyzableFiles = (allFiles || []).some(f =>
      f.file_paths?.some((p: string) => SUPPORTED_EXTENSIONS.includes(p.split('.').pop()?.toLowerCase() || ''))
    );

    // Auto-mark stale 'processing' records as failed (>15 min old)
    if (latestAnalysis?.status === 'processing' && latestAnalysis.started_at) {
      const ageMinutes = (Date.now() - new Date(latestAnalysis.started_at).getTime()) / 60000;
      if (ageMinutes > 10) {
        await supabase
          .from('player_playbook_analysis')
          .update({
            status: 'failed',
            error_message: 'Analysis timed out. Please try again.',
            completed_at: new Date().toISOString(),
          })
          .eq('id', latestAnalysis.id);
        latestAnalysis.status = 'failed';
        latestAnalysis.error_message = 'Analysis timed out. Please try again.';
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        scenarios: coverages || [],
        total: coverages?.length || 0,
        analysisId: latestAnalysis?.id || null,
        analysisStatus: latestAnalysis?.status || null,
        analysisError: latestAnalysis?.error_message || null,
        analysisStartedAt: latestAnalysis?.started_at || null,
        hasAnalyzableFiles,
      }),
    };
  } catch (error) {
    console.error('Error fetching block coverages:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
