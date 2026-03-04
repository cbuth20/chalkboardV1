/**
 * POST /api/player-plays-process/:id
 * Trigger background processing for a player play (AI analysis and flashcard generation)
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError, ValidationError } from './shared/errors';
import { validateUUID } from './shared/validators';
import { enqueuePlayerPlayProcessing } from './shared/queue-jobs';

interface ProcessPlayerPlayRequest {
  generateInsights?: boolean;
  generateAssignments?: boolean;
  generateKnowledge?: boolean;
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

    // Get play ID from path
    const pathParts = event.path.split('?')[0].split('/').filter(Boolean);
    const playId = pathParts[pathParts.length - 1];
    validateUUID(playId, 'playId');

    // Parse request body
    const body: ProcessPlayerPlayRequest = JSON.parse(event.body || '{}');
    const generateInsights = body.generateInsights !== false; // Default true
    const generateAssignments = body.generateAssignments !== false; // Default true
    const generateKnowledge = body.generateKnowledge !== false; // Default true

    // Fetch play to verify ownership and get image URL
    const { data: play, error: playError } = await supabase
      .from('player_plays')
      .select(`
        id,
        user_id,
        org_id,
        content_status,
        diagram_data,
        player_playbook_metadata:player_playbook_metadata_id (
          id,
          file_paths
        )
      `)
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Player play');
    }

    // Verify play belongs to user
    if (play.user_id !== user.userId || play.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this play');
    }

    // Verify play is not already being processed
    if (play.content_status === 'generating') {
      throw new ValidationError('Play is already being processed');
    }

    // Check if this is a diagram play or image play
    const isDiagramPlay = play.diagram_data && play.diagram_data.offensePlayers;
    console.log(`Play type check: isDiagramPlay=${isDiagramPlay}, hasDiagramData=${!!play.diagram_data}`);

    // Get image URL from metadata (only for image-based plays)
    let imageUrl = null;
    if (!isDiagramPlay) {
      const metadata = (play as any).player_playbook_metadata;
      const filePath = metadata?.file_paths?.[0];

      if (!filePath) {
        throw new ValidationError('No image file path found for this play. Diagram plays should have diagram_data.');
      }

      // Get the full public URL from Supabase Storage
      const { data: urlData } = supabase.storage
        .from('Chalkboard Bucket')
        .getPublicUrl(filePath);

      imageUrl = urlData.publicUrl;
    }

    // Update play status to generating
    const { error: updateError } = await supabase
      .from('player_plays')
      .update({ content_status: 'generating', ai_insights: 'Queued for processing...' })
      .eq('id', playId);

    if (updateError) {
      throw new Error(`Failed to update player play status: ${updateError.message}`);
    }

    // Enqueue job to Redis via BullMQ
    console.log(`Triggering background processing for player play ${playId}`);
    if (isDiagramPlay) {
      console.log(`Diagram play - using diagram data`);
    } else {
      console.log(`Image URL: ${imageUrl}`);
    }

    const jobId = await enqueuePlayerPlayProcessing({
      playId,
      imageUrl: imageUrl || undefined,
      generateInsights,
      generateAssignments,
      generateKnowledge,
    });

    console.log(`Enqueued player play processing job ${jobId} for play ${playId}`);

    // Ping the worker to ensure it's running
    const protocol = event.headers.host?.includes('localhost') ? 'http' : 'https';
    const workerUrl = `${protocol}://${event.headers.host}/.netlify/functions/queue-worker-background`;
    fetch(workerUrl, { method: 'POST' }).catch(() => {
      // Worker may already be running — that's fine
    });

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
    console.error('Error triggering player play processing:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
