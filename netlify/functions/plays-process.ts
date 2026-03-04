/**
 * POST /api/plays/:id/process
 * Trigger background processing for a play (AI analysis and flashcard generation)
 * Auth: Coach/Admin
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError, ValidationError } from './shared/errors';
import { validateUUID } from './shared/validators';
import { enqueuePlayProcessing } from './shared/queue-jobs';

interface ProcessPlayRequest {
  generateInsights?: boolean;
  generateAssignments?: boolean;
  generateKnowledge?: boolean;
}

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
    // Path format: /.netlify/functions/plays-process/:playId
    const pathParts = event.path.split('?')[0].split('/').filter(Boolean);
    const playId = pathParts[pathParts.length - 1]; // Get the last segment (after removing query params)
    validateUUID(playId, 'playId');

    // Parse request body
    const body: ProcessPlayRequest = JSON.parse(event.body || '{}');
    const generateInsights = body.generateInsights !== false; // Default true
    const generateAssignments = body.generateAssignments !== false; // Default true
    const generateKnowledge = body.generateKnowledge !== false; // Default true

    // Fetch play to verify ownership and get image URL
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select(`
        id,
        org_id,
        content_status,
        playbook_metadata:playbook_metadata_id (
          id,
          file_paths
        )
      `)
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Play');
    }

    // Verify play belongs to user's org
    if (play.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this play');
    }

    // Verify play is not already being processed
    if (play.content_status === 'generating') {
      throw new ValidationError('Play is already being processed');
    }

    // Get image URL from metadata
    const metadata = (play as any).playbook_metadata;
    const filePath = metadata?.file_paths?.[0];

    if (!filePath) {
      throw new ValidationError('No image file path found for this play');
    }

    // Get the full public URL from Supabase Storage
    const { data: urlData } = supabase.storage
      .from('Chalkboard Bucket')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Update play status to generating
    const { error: updateError } = await supabase
      .from('plays')
      .update({ content_status: 'generating' })
      .eq('id', playId);

    if (updateError) {
      throw new Error(`Failed to update play status: ${updateError.message}`);
    }

    // Enqueue job to Redis via BullMQ
    console.log(`Triggering background processing for play ${playId}`);

    const jobId = await enqueuePlayProcessing({
      playId,
      imageUrl,
      generateInsights,
      generateAssignments,
      generateKnowledge,
    });

    console.log(`Enqueued play processing job ${jobId} for play ${playId}`);

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
        playId,
        jobId,
        status: 'generating',
        message: 'Processing queued. You will be notified when complete.',
      }),
    };
  } catch (error) {
    console.error('Error triggering play processing:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
