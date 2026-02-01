/**
 * PATCH /api/player-plays-update-status/:id
 * Update player play content status
 * Auth: Player (only access own content)
 * Note: No publish workflow for player plays - they are auto-approved
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError, ValidationError } from './shared/errors';
import { validateUUID, validateEnum } from './shared/validators';

interface UpdateStatusRequest {
  contentStatus?: 'draft' | 'generating' | 'approved' | 'rejected';
  isArchived?: boolean;
}

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  if (event.httpMethod !== 'PATCH') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    // Get play ID from path (last segment)
    const pathParts = event.path.split('/').filter(p => p);
    const playId = pathParts[pathParts.length - 1];
    validateUUID(playId, 'playId');

    // Parse request body
    const body: UpdateStatusRequest = JSON.parse(event.body || '{}');

    // Validate at least one field is provided
    if (body.contentStatus === undefined && body.isArchived === undefined) {
      throw new ValidationError('Must provide contentStatus or isArchived');
    }

    // Validate contentStatus if provided
    if (body.contentStatus) {
      validateEnum(
        body.contentStatus,
        ['draft', 'generating', 'approved', 'rejected'],
        'contentStatus'
      );
    }

    // Fetch play to verify ownership
    const { data: play, error: playError } = await supabase
      .from('player_plays')
      .select('id, user_id, org_id, content_status, is_archived')
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Player play');
    }

    // Verify play belongs to user
    if (play.user_id !== user.userId || play.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this play');
    }

    // Build update object
    const updates: any = {};
    if (body.contentStatus !== undefined) {
      updates.content_status = body.contentStatus;
    }
    if (body.isArchived !== undefined) {
      updates.is_archived = body.isArchived;
    }

    updates.updated_at = new Date().toISOString();

    // Update play
    const { data: updatedPlay, error: updateError } = await supabase
      .from('player_plays')
      .update(updates)
      .eq('id', playId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update player play status: ${updateError.message}`);
    }

    console.log(`✅ Player play ${playId} status updated by user ${user.userId}:`, updates);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        play: {
          id: updatedPlay.id,
          contentStatus: updatedPlay.content_status,
          isArchived: updatedPlay.is_archived,
        },
      }),
    };
  } catch (error) {
    console.error('Error updating player play status:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
