/**
 * Player Notes Delete Handler
 * Deletes a note file, metadata, play, and associated flashcards
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse } from './shared/errors';

const BUCKET_NAME = 'Chalkboard Bucket';

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  const { httpMethod, path } = event;
  const user = getAuthenticatedUser(event);
  const supabase = getSupabaseAdmin();

  // Extract note ID from path
  const pathParts = path.split('/');
  const noteId = pathParts[pathParts.length - 1];

  // DELETE - Delete note and all associated data
  if (httpMethod === 'DELETE') {
    try {
      if (!noteId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Note ID is required' }),
        };
      }

      console.log(`[Player Notes Delete] Deleting note ${noteId} for user ${user.userId}`);

      // Get metadata record (noteId is the metadata ID)
      const { data: metadata, error: metadataError } = await supabase
        .from('player_playbook_metadata')
        .select('id, user_id, file_paths')
        .eq('id', noteId)
        .single();

      if (metadataError || !metadata) {
        console.error('[Player Notes Delete] Metadata not found:', metadataError);
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Note not found' }),
        };
      }

      // Verify ownership
      if (metadata.user_id !== user.userId) {
        console.error('[Player Notes Delete] Unauthorized access attempt');
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      // Find all associated plays
      const { data: plays, error: playsError } = await supabase
        .from('player_plays')
        .select('id')
        .eq('player_playbook_metadata_id', metadata.id);

      if (playsError) {
        console.error('[Player Notes Delete] Error fetching plays:', playsError);
      }

      const playIds = plays?.map(p => p.id) || [];
      console.log(`[Player Notes Delete] Found ${playIds.length} associated plays`);

      // Delete all flashcards for these plays
      if (playIds.length > 0) {
        const { error: flashcardsError } = await supabase
          .from('player_flashcard_templates')
          .delete()
          .in('player_play_id', playIds);

        if (flashcardsError) {
          console.error('[Player Notes Delete] Error deleting flashcards:', flashcardsError);
        } else {
          console.log(`[Player Notes Delete] Deleted flashcards for ${playIds.length} plays`);
        }
      }

      // Delete all play records
      if (playIds.length > 0) {
        const { error: deletePlayError } = await supabase
          .from('player_plays')
          .delete()
          .in('id', playIds);

        if (deletePlayError) {
          console.error('[Player Notes Delete] Error deleting plays:', deletePlayError);
        } else {
          console.log(`[Player Notes Delete] Deleted ${playIds.length} play records`);
        }
      }

      // Delete files from storage
      if (metadata.file_paths && metadata.file_paths.length > 0) {
        console.log(`[Player Notes Delete] Deleting ${metadata.file_paths.length} files from storage`);
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(metadata.file_paths);

        if (storageError) {
          console.error('[Player Notes Delete] Error deleting files from storage:', storageError);
          // Don't fail the request, file deletion is not critical
        } else {
          console.log(`[Player Notes Delete] Successfully deleted files from storage`);
        }
      }

      // Finally, delete the metadata record
      const { error: deleteMetadataError } = await supabase
        .from('player_playbook_metadata')
        .delete()
        .eq('id', metadata.id);

      if (deleteMetadataError) {
        console.error('[Player Notes Delete] Error deleting metadata:', deleteMetadataError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Failed to delete note metadata',
            message: deleteMetadataError.message,
          }),
        };
      }

      console.log(`[Player Notes Delete] Successfully deleted note ${noteId} and all associated data`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Note and all associated data deleted successfully',
          deleted: {
            plays: playIds.length,
            files: metadata.file_paths?.length || 0,
          },
        }),
      };
    } catch (error: any) {
      console.error('[Player Notes Delete] Error:', error);
      return formatErrorResponse(error);
    }
  }

  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
});

export { handler };
