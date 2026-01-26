/**
 * PATCH /api/plays/:id/status
 * Update play content status (approve, reject, publish)
 * Auth: Coach/Admin
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError, ValidationError } from './shared/errors';
import { validateUUID, validateEnum, validateRequired } from './shared/validators';

interface UpdateStatusRequest {
  contentStatus?: 'draft' | 'generating' | 'approved' | 'rejected';
  isPublished?: boolean;
}

const handler: Handler = withOrgAuth('coach')(async (event, context) => {
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
    if (body.contentStatus === undefined && body.isPublished === undefined) {
      throw new ValidationError('Must provide contentStatus or isPublished');
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
      .from('plays')
      .select('id, org_id, content_status, is_published')
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Play');
    }

    // Verify play belongs to user's org
    if (play.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this play');
    }

    // Build update object
    const updates: any = {};
    if (body.contentStatus !== undefined) {
      updates.content_status = body.contentStatus;
    }
    if (body.isPublished !== undefined) {
      updates.is_published = body.isPublished;

      // If publishing, ensure content is approved (or being approved in this request)
      const willBeApproved = body.contentStatus === 'approved';
      const isAlreadyApproved = play.content_status === 'approved';

      if (body.isPublished && !willBeApproved && !isAlreadyApproved) {
        throw new ValidationError('Can only publish approved plays');
      }
    }

    // Update play
    const { data: updatedPlay, error: updateError } = await supabase
      .from('plays')
      .update(updates)
      .eq('id', playId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update play: ${updateError.message}`);
    }

    console.log(`✅ Play ${playId} status updated by user ${user.userId}:`, updates);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        play: {
          id: updatedPlay.id,
          contentStatus: updatedPlay.content_status,
          isPublished: updatedPlay.is_published,
        },
      }),
    };
  } catch (error) {
    console.error('Error updating play status:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
