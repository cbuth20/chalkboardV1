import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key to bypass RLS for administrative operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Clear generated content (plays, assignments, flashcards) for a playbook metadata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metadataId } = body;

    if (!metadataId) {
      return NextResponse.json(
        { error: 'metadataId is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: 'Failed to fetch plays',
          message: playsFetchError.message,
        },
        { status: 500 }
      );
    }

    if (!plays || plays.length === 0) {
      console.log('No plays found for this metadata ID');
      return NextResponse.json({
        success: true,
        deleted: deletedCounts,
        message: 'No generated content found to clear',
        warning: 'No plays found linked to this metadata',
      });
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
      return NextResponse.json(
        {
          error: 'Failed to delete assignments',
          message: assignmentsError.message,
          details: assignmentsError,
        },
        { status: 500 }
      );
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
      return NextResponse.json(
        {
          error: 'Failed to delete flashcards',
          message: flashcardsError.message,
          details: flashcardsError,
        },
        { status: 500 }
      );
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
      return NextResponse.json(
        {
          error: 'Failed to delete plays',
          message: playsDeleteError.message,
          details: playsDeleteError,
        },
        { status: 500 }
      );
    } else {
      deletedCounts.plays = deletedPlays?.length || 0;
    }

    console.log('Cleared content successfully:', deletedCounts);

    return NextResponse.json({
      success: true,
      deleted: deletedCounts,
      message: 'Generated content cleared successfully',
      playIds: playIds,
    });
  } catch (error: any) {
    console.error('Error clearing content:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear content',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
