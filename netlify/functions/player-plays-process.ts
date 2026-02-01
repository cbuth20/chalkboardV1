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
      .update({ content_status: 'generating' })
      .eq('id', playId);

    if (updateError) {
      throw new Error(`Failed to update player play status: ${updateError.message}`);
    }

    // Call background processing function
    const backgroundFunctionUrl = `${event.headers.host?.includes('localhost') ? 'http' : 'https'}://${event.headers.host}/.netlify/functions/process-player-play-content-background`;

    console.log(`🚀 Triggering background processing for player play ${playId}`);
    if (isDiagramPlay) {
      console.log(`📐 Diagram play - using diagram data`);
    } else {
      console.log(`📷 Image URL: ${imageUrl}`);
    }

    // Fire-and-forget call to background function
    fetch(backgroundFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playId,
        imageUrl,
        generateInsights,
        generateAssignments,
        generateKnowledge,
      }),
    }).catch((error) => {
      console.error('Failed to trigger background function:', error);
      // Don't throw - we already updated the status
    });

    console.log(`✅ Background processing triggered for player play ${playId}`);

    return {
      statusCode: 202, // Accepted
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        playId,
        status: 'generating',
        message: 'Background processing started. Check play status for completion.',
      }),
    };
  } catch (error) {
    console.error('Error triggering player play processing:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
