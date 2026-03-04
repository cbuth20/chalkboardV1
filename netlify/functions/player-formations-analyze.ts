/**
 * POST /api/player-formations-analyze
 * Trigger analysis of all uploaded PDFs to extract formations
 * This is an expensive operation that should be manually triggered
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { enqueueFormationsAnalysis } from './shared/queue-jobs';

interface AnalyzeFormationsRequest {
  positions?: string[]; // Optional: filter by positions (QB, RB, WR, OT)
  modules?: string[]; // Optional: filter by modules
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
    const body: AnalyzeFormationsRequest = JSON.parse(event.body || '{}');

    // Fetch all files for this user
    const { data: allFiles, error: filesError } = await supabase
      .from('player_playbook_metadata')
      .select('id, file_paths, note_type, tags, created_at')
      .eq('user_id', user.userId)
      .eq('org_id', user.orgId);

    if (filesError) {
      throw new Error(`Failed to fetch files: ${filesError.message}`);
    }

    // Filter for PDFs in JavaScript (file_paths is an array)
    const pdfs = allFiles?.filter(file =>
      file.file_paths?.some((path: string) => path.toLowerCase().endsWith('.pdf'))
    ) || [];

    if (pdfs.length === 0) {
      throw new ValidationError('No PDF files found. Please upload playbook PDFs first.');
    }

    console.log(`📚 Found ${pdfs.length} PDFs for analysis`);

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

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('player_playbook_analysis')
      .insert({
        user_id: user.userId,
        org_id: user.orgId,
        pdf_count: pdfs.length,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (analysisError || !analysis) {
      throw new Error(`Failed to create analysis record: ${analysisError?.message}`);
    }

    console.log(`🎯 Created analysis record ${analysis.id}`);

    // Enqueue job to Redis via BullMQ
    console.log(`Triggering background analysis for ${pdfs.length} PDFs`);

    const jobId = await enqueueFormationsAnalysis({
      analysisId: analysis.id,
      userId: user.userId,
      orgId: user.orgId,
      pdfIds: pdfs.map(p => p.id),
      positions: body.positions || ['QB', 'RB', 'WR', 'OT'],
      modules: body.modules || ['posse_2x2', 'posse_trips', 'quads', 'ranger', 'zombie', 'empty', 'special'],
    });

    console.log(`Enqueued formations analysis job ${jobId}`);

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
      statusCode: 202, // Accepted
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        analysisId: analysis.id,
        jobId,
        status: 'processing',
        pdfCount: pdfs.length,
        estimatedDuration: `${Math.ceil(pdfs.length * 2)} minutes`,
        message: 'Analysis started. This may take several minutes. Check analysis status for completion.',
      }),
    };
  } catch (error) {
    console.error('Error triggering formations analysis:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
