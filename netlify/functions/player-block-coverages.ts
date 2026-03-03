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
      .eq('user_id', user.userId);

    if (error) {
      throw new Error(`Failed to fetch coverages: ${error.message}`);
    }

    // Fetch latest analysis status so frontend can detect failures
    const { data: latestAnalysis } = await supabase
      .from('player_playbook_analysis')
      .select('id, status, error_message, started_at')
      .eq('user_id', user.userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

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
