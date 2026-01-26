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
    const pathParts = event.path.split('/');
    const playId = pathParts[pathParts.indexOf('plays') + 1];
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

    // Call background processing function
    // Note: In production, this would be an async invocation
    // For now, we'll make a direct HTTP call to the background function
    const backgroundFunctionUrl = `${event.headers.host?.includes('localhost') ? 'http' : 'https'}://${event.headers.host}/.netlify/functions/process-play-content-background`;

    console.log(`🚀 Triggering background processing for play ${playId}`);
    console.log(`📷 Image URL: ${imageUrl}`);

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

    console.log(`✅ Background processing triggered for play ${playId}`);

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
    console.error('Error triggering play processing:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
