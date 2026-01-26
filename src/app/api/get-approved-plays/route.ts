import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
// Service role bypasses RLS which is appropriate for server-side API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const orgId = searchParams.get('orgId');
    const playId = searchParams.get('playId');
    const type = searchParams.get('type') || 'all';
    const playType = searchParams.get('playType'); // PASS, RUN, RPO, etc.
    const formation = searchParams.get('formation');
    const position = searchParams.get('position'); // Filter by position visibility

    if (!teamId && !orgId) {
      return NextResponse.json(
        { error: 'teamId or orgId is required' },
        { status: 400 }
      );
    }

    // Fetch approved plays
    let playsQuery = supabase
      .from('plays')
      .select(`
        id,
        name,
        short_name,
        formation_name,
        concept,
        play_type,
        content_type,
        ai_insights,
        created_at,
        playbook_metadata:playbook_metadata_id (
          id,
          formation_name,
          concept_name,
          side_of_ball,
          content_type,
          level,
          position_relevance,
          custom_notes,
          file_paths
        )
      `);

    // Filter by org or team
    if (orgId) {
      playsQuery = playsQuery.eq('org_id', orgId);
    } else if (teamId) {
      playsQuery = playsQuery.eq('team_id', teamId);
    }

    playsQuery = playsQuery
      .eq('content_status', 'approved')
      .order('created_at', { ascending: false });

    // Filter by specific play if provided
    if (playId) {
      playsQuery = playsQuery.eq('id', playId);
    }

    // Filter by play type (PASS, RUN, RPO, etc.)
    if (playType) {
      playsQuery = playsQuery.eq('play_type', playType.toUpperCase());
    }

    // Filter by formation
    if (formation) {
      playsQuery = playsQuery.eq('formation_name', formation);
    }

    // Filter by position visibility
    // Only show plays where this position has an assignment or is in visible_to_positions
    if (position) {
      const { data: assignedPlays, error: assignmentError } = await supabase
        .from('play_assignments')
        .select('play_id')
        .or(`position.eq.${position.toUpperCase()},visible_to_positions.cs.["${position.toUpperCase()}"]`);

      if (assignmentError) {
        console.error('Error fetching position assignments:', assignmentError);
      } else if (assignedPlays && assignedPlays.length > 0) {
        const playIds = assignedPlays.map(a => a.play_id);
        playsQuery = playsQuery.in('id', playIds);
      } else {
        // No plays found for this position, return empty array
        return NextResponse.json({ plays: [] });
      }
    }

    const { data: plays, error: playsError } = await playsQuery;

    if (playsError) {
      console.error('Failed to fetch plays:', playsError);
      return NextResponse.json(
        {
          error: 'Failed to fetch plays',
          message: playsError.message,
        },
        { status: 500 }
      );
    }

    // If type is 'all' or 'insights', return plays with insights
    if (type === 'all' || type === 'insights') {
      return NextResponse.json({ plays: plays || [] });
    }

    // If type is 'assignments', fetch assignments for the play(s)
    if (type === 'assignments') {
      if (!playId) {
        return NextResponse.json(
          {
            error: 'playId is required when fetching assignments',
          },
          { status: 400 }
        );
      }

      const { data: assignments, error: assignmentsError } = await supabase
        .from('play_assignments')
        .select('*')
        .eq('play_id', playId)
        .order('position', { ascending: true });

      if (assignmentsError) {
        console.error('Failed to fetch assignments:', assignmentsError);
        return NextResponse.json(
          {
            error: 'Failed to fetch assignments',
            message: assignmentsError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        plays: plays || [],
        assignments: assignments || [],
      });
    }

    // If type is 'knowledge', fetch knowledge flashcards for the play(s)
    if (type === 'knowledge') {
      if (!playId) {
        return NextResponse.json(
          {
            error: 'playId is required when fetching knowledge cards',
          },
          { status: 400 }
        );
      }

      const { data: knowledgeCards, error: cardsError } = await supabase
        .from('flashcard_templates')
        .select('*')
        .eq('play_id', playId)
        .eq('card_type', 'knowledge')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (cardsError) {
        console.error('Failed to fetch knowledge cards:', cardsError);
        return NextResponse.json(
          {
            error: 'Failed to fetch knowledge cards',
            message: cardsError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        plays: plays || [],
        knowledgeCards: knowledgeCards || [],
      });
    }

    // If type is 'assignment-flashcards', fetch assignment-specific flashcards
    if (type === 'assignment-flashcards') {
      const position = searchParams.get('position');

      if (!playId) {
        return NextResponse.json(
          {
            error: 'playId is required when fetching assignment flashcards',
          },
          { status: 400 }
        );
      }

      let flashcardsQuery = supabase
        .from('flashcard_templates')
        .select('*')
        .eq('play_id', playId)
        .eq('card_type', 'assignment')
        .eq('is_active', true);

      // Filter by position if provided
      if (position) {
        flashcardsQuery = flashcardsQuery.eq('position', position.toUpperCase());
      }

      const { data: flashcards, error: flashcardsError } = await flashcardsQuery.order(
        'category',
        { ascending: true }
      );

      if (flashcardsError) {
        console.error('Failed to fetch flashcards:', flashcardsError);
        return NextResponse.json(
          {
            error: 'Failed to fetch flashcards',
            message: flashcardsError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        plays: plays || [],
        flashcards: flashcards || [],
      });
    }

    // Invalid type
    return NextResponse.json(
      {
        error: 'Invalid type parameter. Must be: all, insights, assignments, knowledge, or assignment-flashcards',
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching approved plays:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch approved plays',
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an approved play and all related data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playId = searchParams.get('playId');

    if (!playId) {
      return NextResponse.json(
        { error: 'playId is required' },
        { status: 400 }
      );
    }

    console.log('[Delete Play] Deleting play:', playId);

    // Delete in order: child tables first, then parent
    // 1. Delete assignments
    const { error: assignmentsError } = await supabase
      .from('play_assignments')
      .delete()
      .eq('play_id', playId);

    if (assignmentsError) {
      console.error('[Delete Play] Error deleting assignments:', assignmentsError);
      // Continue anyway - assignments might not exist
    }

    // 2. Delete flashcard templates
    const { error: flashcardsError } = await supabase
      .from('flashcard_templates')
      .delete()
      .eq('play_id', playId);

    if (flashcardsError) {
      console.error('[Delete Play] Error deleting flashcards:', flashcardsError);
      // Continue anyway
    }

    // 3. Delete the play itself
    const { error: playError } = await supabase
      .from('plays')
      .delete()
      .eq('id', playId);

    if (playError) {
      console.error('[Delete Play] Error deleting play:', playError);
      return NextResponse.json(
        { error: 'Failed to delete play', details: playError.message },
        { status: 500 }
      );
    }

    console.log('[Delete Play] Successfully deleted play:', playId);
    return NextResponse.json({ success: true, message: 'Play deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Play] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to delete play', message: error.message },
      { status: 500 }
    );
  }
}
