/**
 * DELETE /api/player-plays-delete/:id
 * Delete player play and all related data
 * Auth: Player (only delete own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError } from './shared/errors';
import { validateUUID } from './shared/validators';

const BUCKET_NAME = 'Chalkboard Bucket';

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  if (event.httpMethod !== 'DELETE') {
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
    const playId = pathParts[pathParts.length - 1];
    validateUUID(playId, 'playId');

    console.log(`[Player Play Delete] Starting deletion for play ${playId} by user ${user.userId}`);

    // Fetch play to verify ownership and get metadata ID
    const { data: play, error: playError } = await supabase
      .from('player_plays')
      .select('id, user_id, org_id, player_playbook_metadata_id, name')
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Player play');
    }

    // Verify ownership
    if (play.user_id !== user.userId || play.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this play');
    }

    const metadataId = play.player_playbook_metadata_id;

    // Fetch metadata to get file paths
    let filePaths: string[] = [];
    if (metadataId) {
      const { data: metadata, error: metadataError } = await supabase
        .from('player_playbook_metadata')
        .select('file_paths')
        .eq('id', metadataId)
        .single();

      if (metadata && !metadataError) {
        filePaths = metadata.file_paths || [];
      }
    }

    // Delete flashcards
    const { error: flashcardsError } = await supabase
      .from('player_flashcard_templates')
      .delete()
      .eq('player_play_id', playId);

    if (flashcardsError) {
      console.warn('[Player Play Delete] Failed to delete flashcards:', flashcardsError);
    } else {
      console.log('[Player Play Delete] Deleted flashcards');
    }

    // Delete assignments
    const { error: assignmentsError } = await supabase
      .from('player_play_assignments')
      .delete()
      .eq('player_play_id', playId);

    if (assignmentsError) {
      console.warn('[Player Play Delete] Failed to delete assignments:', assignmentsError);
    } else {
      console.log('[Player Play Delete] Deleted assignments');
    }

    // Delete the play
    const { error: deletePlayError } = await supabase
      .from('player_plays')
      .delete()
      .eq('id', playId);

    if (deletePlayError) {
      console.error('[Player Play Delete] Failed to delete play:', deletePlayError);
      throw new Error('Failed to delete play');
    }

    console.log('[Player Play Delete] Deleted play');

    // Delete files from storage
    if (filePaths.length > 0) {
      const { data: deleteFilesData, error: deleteFilesError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (deleteFilesError) {
        console.warn('[Player Play Delete] Failed to delete files from storage:', deleteFilesError);
      } else {
        console.log(`[Player Play Delete] Deleted ${filePaths.length} files from storage`);
      }
    }

    // Delete metadata
    if (metadataId) {
      const { error: deleteMetadataError } = await supabase
        .from('player_playbook_metadata')
        .delete()
        .eq('id', metadataId);

      if (deleteMetadataError) {
        console.warn('[Player Play Delete] Failed to delete metadata:', deleteMetadataError);
      } else {
        console.log('[Player Play Delete] Deleted metadata');
      }
    }

    console.log(`[Player Play Delete] Successfully deleted play "${play.name}" and all related data`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Play and all related data deleted successfully',
        playId,
      }),
    };
  } catch (error) {
    console.error('[Player Play Delete] Error:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
