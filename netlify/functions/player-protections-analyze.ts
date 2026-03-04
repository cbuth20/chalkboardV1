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

    const jobId = await enqueueProtectionAnalysis({
      analysisId: analysis.id,
      userId: user.userId,
      orgId: user.orgId,
      pdfIds: analyzableFiles.map(f => f.id),
    });

    console.log(`Enqueued protection analysis job ${jobId}`);

    // Ping the worker to ensure it's running
    const protocol = event.headers.host?.includes('localhost') ? 'http' : 'https';
    const workerUrl = `${protocol}://${event.headers.host}/.netlify/functions/queue-worker-background`;
    fetch(workerUrl, { method: 'POST' }).catch(() => {
      // Worker may already be running — that's fine
    });

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
