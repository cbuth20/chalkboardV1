/**
 * POST /api/player-protections-analyze
 * Trigger analysis of uploaded PDFs to extract RB protection scenarios
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { enqueueProtectionAnalysis } from './shared/queue-jobs';

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

    // Fetch all PDF files for this user
    const { data: allFiles, error: filesError } = await supabase
      .from('player_playbook_metadata')
      .select('id, file_paths, note_type, tags, created_at')
      .eq('user_id', user.userId)
      .eq('org_id', user.orgId);

    if (filesError) {
      throw new Error(`Failed to fetch files: ${filesError.message}`);
    }

    // Filter for PDFs and images (supported by Claude API)
    const SUPPORTED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']);
    const analyzableFiles = allFiles?.filter(file =>
      file.file_paths?.some((path: string) => {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        return SUPPORTED_EXTENSIONS.has(ext);
      })
    ) || [];

    if (analyzableFiles.length === 0) {
      throw new ValidationError('No analyzable files found. Please upload playbook PDFs or images first.');
    }

    console.log(`📚 Found ${analyzableFiles.length} files for protection analysis`);

    // Auto-fail any analysis stuck processing for > 15 minutes (stale cleanup)
    await supabase.from('player_playbook_analysis')
      .update({ status: 'failed', error_message: 'Analysis timed out.', completed_at: new Date().toISOString() })
      .eq('user_id', user.userId)
      .eq('status', 'processing')
      .lt('started_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    // Check if there's already a processing analysis
    const { data: existingAnalysis } = await supabase
      .from('player_playbook_analysis')
      .select('id, status')
      .eq('user_id', user.userId)
      .eq('status', 'processing')
      .single();

    if (existingAnalysis) {
      throw new ValidationError('An analysis is already in progress. Please wait for it to complete.');
    }

    // Create analysis record with initial progress message
    const { data: analysis, error: analysisError } = await supabase
      .from('player_playbook_analysis')
      .insert({
        user_id: user.userId,
        org_id: user.orgId,
        pdf_count: analyzableFiles.length,
        status: 'processing',
        started_at: new Date().toISOString(),
        error_message: `Preparing to analyze ${analyzableFiles.length} file${analyzableFiles.length === 1 ? '' : 's'}...`,
      })
      .select()
      .single();

    if (analysisError || !analysis) {
      throw new Error(`Failed to create analysis record: ${analysisError?.message}`);
    }

    console.log(`🎯 Created analysis record ${analysis.id}`);

    // Enqueue job to Redis via BullMQ
    console.log(`Triggering background protection analysis for ${analyzableFiles.length} files`);

    let jobId: string;
    try {
      jobId = await enqueueProtectionAnalysis({
        analysisId: analysis.id,
        userId: user.userId,
        orgId: user.orgId,
        pdfIds: analyzableFiles.map(f => f.id),
      });
    } catch (enqueueError) {
      // Rollback: delete the analysis record so user can retry
      await supabase.from('player_playbook_analysis').delete().eq('id', analysis.id);
      throw new Error('Failed to queue analysis job. Please try again.');
    }

    console.log(`Enqueued protection analysis job ${jobId}`);

    // Ping the worker to ensure it's running
    const protocol = event.headers.host?.includes('localhost') ? 'http' : 'https';
    const workerUrl = `${protocol}://${event.headers.host}/.netlify/functions/queue-worker-background`;
    try {
      await fetch(workerUrl, { method: 'POST', signal: AbortSignal.timeout(5000) });
      console.log('Queue worker pinged successfully');
    } catch (err: any) {
      console.error('Failed to ping queue worker:', err.message || err);
    }

    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        analysisId: analysis.id,
        jobId,
        status: 'processing',
        pdfCount: analyzableFiles.length,
        estimatedDuration: `${Math.ceil(analyzableFiles.length * 3)} minutes`,
        message: 'Protection analysis started. This may take several minutes.',
      }),
    };
  } catch (error) {
    console.error('Error triggering protection analysis:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
