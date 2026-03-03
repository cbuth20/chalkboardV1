/**
 * Player Notes Handler
 * Lists notes (files with content_type != 'play')
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse } from './shared/errors';

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  const { httpMethod, queryStringParameters } = event;
  const user = getAuthenticatedUser(event);
  const supabase = getSupabaseAdmin();

  // GET - List notes for the user
  if (httpMethod === 'GET') {
    try {
      const { category, search, tags } = queryStringParameters || {};

      // Build query to get player_playbook_metadata records where content_type != 'play'
      let query = supabase
        .from('player_playbook_metadata')
        .select(`
          id,
          file_paths,
          content_type,
          note_type,
          file_category,
          tags,
          created_at,
          updated_at
        `)
        .eq('user_id', user.userId)
        .neq('content_type', 'play') // Exclude plays (those are in Learning Center)
        .order('created_at', { ascending: false });

      // Apply filters
      if (category) {
        query = query.eq('file_category', category);
      }

      if (tags) {
        const tagArray = tags.split(',');
        query = query.overlaps('tags', tagArray);
      }

      const { data: metadataRecords, error: metadataError } = await query;

      if (metadataError) {
        console.error('[Player Notes] Error fetching metadata:', metadataError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Failed to fetch notes',
            message: metadataError.message,
          }),
        };
      }

      // Get associated player_plays records to check processing status and flashcard counts
      const metadataIds = metadataRecords.map(m => m.id);

      const { data: plays, error: playsError } = await supabase
        .from('player_plays')
        .select(`
          id,
          player_playbook_metadata_id,
          name,
          content_status,
          created_at
        `)
        .in('player_playbook_metadata_id', metadataIds);

      if (playsError) {
        console.error('[Player Notes] Error fetching plays:', playsError);
        // Don't fail the request, just continue without play data
      }

      // Get flashcard counts
      const playIds = plays?.map(p => p.id) || [];
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('player_flashcard_templates')
        .select('player_play_id')
        .in('player_play_id', playIds);

      if (flashcardsError) {
        console.error('[Player Notes] Error fetching flashcards:', flashcardsError);
      }

      // Build flashcard count map
      const flashcardCounts: Record<string, number> = {};
      flashcards?.forEach(fc => {
        flashcardCounts[fc.player_play_id] = (flashcardCounts[fc.player_play_id] || 0) + 1;
      });

      // Build play map for quick lookup
      const playMap: Record<string, any> = {};
      plays?.forEach(p => {
        playMap[p.player_playbook_metadata_id] = p;
      });

      // Transform metadata records into note objects
      const notes = metadataRecords.map(meta => {
        const play = playMap[meta.id];
        const fileName = meta.file_paths?.[0]?.split('/').pop() || 'Unknown';
        const fileType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

        return {
          id: play?.id || meta.id, // Use play ID if available, otherwise metadata ID
          metadataId: meta.id,
          fileName: fileName,
          fileType: fileType,
          filePath: meta.file_paths?.[0] || '',
          noteType: meta.note_type,
          fileCategory: meta.file_category,
          tags: meta.tags || [],
          uploadedAt: meta.created_at,
          processedAt: play?.content_status === 'approved' ? meta.updated_at : null,
          flashcardCount: play ? (flashcardCounts[play.id] || 0) : 0,
          contentStatus: play?.content_status || 'draft',
        };
      });

      // Apply search filter if provided
      let filteredNotes = notes;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredNotes = notes.filter(note =>
          note.fileName.toLowerCase().includes(searchLower) ||
          note.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: filteredNotes,
          total: filteredNotes.length,
        }),
      };
    } catch (error: any) {
      console.error('[Player Notes] Error:', error);
      return formatErrorResponse(error);
    }
  }

  // DELETE - Delete note and all associated data
  if (httpMethod === 'DELETE') {
    try {
      // Extract note ID from path (last segment)
      const pathParts = event.path.split('/');
      const noteId = pathParts[pathParts.length - 1];

      if (!noteId || noteId === 'player-notes') {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Note ID is required' }),
        };
      }

      console.log(`[Player Notes] Deleting note ${noteId} for user ${user.userId}`);

      // Look up metadata record by ID
      const { data: metadata, error: metadataError } = await supabase
        .from('player_playbook_metadata')
        .select('id, user_id, file_paths')
        .eq('id', noteId)
        .single();

      if (metadataError || !metadata) {
        console.error('[Player Notes] Metadata not found:', metadataError);
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Note not found' }),
        };
      }

      // Verify ownership
      if (metadata.user_id !== user.userId) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      // Find all associated plays
      const { data: plays } = await supabase
        .from('player_plays')
        .select('id')
        .eq('player_playbook_metadata_id', metadata.id);

      const playIds = plays?.map(p => p.id) || [];

      // Delete flashcards for these plays
      if (playIds.length > 0) {
        await supabase
          .from('player_flashcard_templates')
          .delete()
          .in('player_play_id', playIds);

        // Delete play records
        await supabase
          .from('player_plays')
          .delete()
          .in('id', playIds);
      }

      // Delete files from storage
      if (metadata.file_paths && metadata.file_paths.length > 0) {
        await supabase.storage
          .from('Chalkboard Bucket')
          .remove(metadata.file_paths);
      }

      // Delete the metadata record
      const { error: deleteError } = await supabase
        .from('player_playbook_metadata')
        .delete()
        .eq('id', metadata.id);

      if (deleteError) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Failed to delete note', message: deleteError.message }),
        };
      }

      console.log(`[Player Notes] Deleted note ${noteId} (${playIds.length} plays, ${metadata.file_paths?.length || 0} files)`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    } catch (error: any) {
      console.error('[Player Notes] Delete error:', error);
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
