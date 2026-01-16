import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key to bypass RLS for administrative operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { metadataId } = JSON.parse(event.body || '{}');

    if (!metadataId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'metadataId is required' }),
      };
    }

    let deletedCounts = {
      plays: 0,
      assignments: 0,
      flashcards: 0,
    };

    // Find all plays linked to this metadata
    const { data: plays, error: playsFetchError } = await supabase
      .from('plays')
      .select('id')
      .eq('playbook_metadata_id', metadataId);

    console.log('Clear content - metadataId:', metadataId);
    console.log('Clear content - found plays:', plays);

    // Also check what assignments exist for debugging
    if (plays && plays.length > 0) {
      const playIds = plays.map((p) => p.id);
      const { data: existingAssignments } = await supabase
        .from('play_assignments')
        .select('*')
        .in('play_id', playIds);
      console.log('Existing assignments before deletion:', existingAssignments);
    }

    if (playsFetchError) {
      console.error('Error fetching plays:', playsFetchError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch plays',
          message: playsFetchError.message,
        }),
      };
    }

    if (!plays || plays.length === 0) {
      console.log('No plays found for this metadata ID');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          deleted: deletedCounts,
          message: 'No generated content found to clear',
          warning: 'No plays found linked to this metadata',
        }),
      };
    }

    const playIds = plays.map((p) => p.id);
    console.log('Clear content - playIds to delete:', playIds);

    // Delete play_assignments
    const { data: deletedAssignments, error: assignmentsError } = await supabase
      .from('play_assignments')
      .delete()
      .in('play_id', playIds)
      .select();

    console.log('Deleted assignments:', deletedAssignments);

    if (assignmentsError) {
      console.error('Error deleting assignments:', assignmentsError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to delete assignments',
          message: assignmentsError.message,
          details: assignmentsError,
        }),
      };
    } else {
      deletedCounts.assignments = deletedAssignments?.length || 0;
    }

    // Delete flashcard_templates
    const { data: deletedFlashcards, error: flashcardsError } = await supabase
      .from('flashcard_templates')
      .delete()
      .in('play_id', playIds)
      .select();

    console.log('Deleted flashcards:', deletedFlashcards);

    if (flashcardsError) {
      console.error('Error deleting flashcards:', flashcardsError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to delete flashcards',
          message: flashcardsError.message,
          details: flashcardsError,
        }),
      };
    } else {
      deletedCounts.flashcards = deletedFlashcards?.length || 0;
    }

    // Delete plays
    const { data: deletedPlays, error: playsDeleteError } = await supabase
      .from('plays')
      .delete()
      .in('id', playIds)
      .select();

    console.log('Deleted plays:', deletedPlays);

    if (playsDeleteError) {
      console.error('Error deleting plays:', playsDeleteError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to delete plays',
          message: playsDeleteError.message,
          details: playsDeleteError,
        }),
      };
    } else {
      deletedCounts.plays = deletedPlays?.length || 0;
    }

    console.log('Cleared content successfully:', deletedCounts);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        deleted: deletedCounts,
        message: 'Generated content cleared successfully',
        playIds: playIds,
      }),
    };
  } catch (error: any) {
    console.error('Error clearing content:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to clear content',
        message: error.message,
      }),
    };
  }
};
