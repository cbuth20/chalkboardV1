import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/coach/assignments - Fetch all assignments for an organization (with optional team filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const teamId = searchParams.get('teamId'); // Optional filter
    const playId = searchParams.get('playId');
    const position = searchParams.get('position');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    console.log('[API Coach Assignments] Fetching assignments for orgId:', orgId, 'teamId filter:', teamId);

    // Build query with explicit foreign key reference
    // Using 'play:plays!play_id' to alias the join as 'play' (singular) to match frontend expectations
    let query = supabase
      .from('play_assignments')
      .select(`
        *,
        play:plays!play_id(
          id,
          name,
          formation_name,
          concept,
          play_type,
          ai_insights,
          org_id,
          team_id,
          playbook_metadata!plays_playbook_metadata_id_fkey(
            id,
            formation_name,
            concept_name,
            side_of_ball,
            content_type,
            level,
            position_relevance,
            custom_notes
          )
        )
      `)
      .eq('play.org_id', orgId);

    // Apply optional team filter
    if (teamId && teamId !== 'all') {
      console.log('[API Coach Assignments] Filtering by teamId:', teamId);
      query = query.eq('play.team_id', teamId);
    }

    // Apply other filters
    if (playId) {
      console.log('[API Coach Assignments] Filtering by playId:', playId);
      query = query.eq('play_id', playId);
    }

    if (position) {
      console.log('[API Coach Assignments] Filtering by position:', position);
      query = query.eq('position', position);
    }

    const { data, error } = await query.order('play(name)', { ascending: true });

    if (error) {
      console.error('[API Coach Assignments] Error fetching assignments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assignments', details: error.message },
        { status: 500 }
      );
    }

    console.log('[API Coach Assignments] Found assignments:', data?.length || 0);
    console.log('[API Coach Assignments] Sample assignment:', data?.[0]);

    return NextResponse.json({
      assignments: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/coach/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/coach/assignments - Create a new assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      play_id,
      position,
      alignment,
      landmark,
      assignment,
      key_read,
      read_progression,
      route_id,
      route_depth,
      blocking_assignment,
      coverage_adjustments,
      visible_to_positions,
    } = body;

    // Validate required fields
    if (!play_id || !position || !alignment || !landmark || !assignment || !key_read) {
      return NextResponse.json(
        { error: 'Missing required fields: play_id, position, alignment, landmark, assignment, key_read' },
        { status: 400 }
      );
    }

    // Check for duplicate (play_id, position) pair
    const { data: existing, error: checkError } = await supabase
      .from('play_assignments')
      .select('id')
      .eq('play_id', play_id)
      .eq('position', position)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing assignment:', checkError);
      return NextResponse.json(
        { error: 'Failed to check for existing assignment' },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'An assignment for this play and position already exists' },
        { status: 409 }
      );
    }

    // Create assignment
    const { data, error } = await supabase
      .from('play_assignments')
      .insert({
        play_id,
        position,
        alignment,
        landmark,
        assignment,
        key_read,
        read_progression: read_progression || null,
        route_id: route_id || null,
        route_depth: route_depth || null,
        blocking_assignment: blocking_assignment || null,
        coverage_adjustments: coverage_adjustments || {},
        visible_to_positions: visible_to_positions || [position], // Default to showing only to this position
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return NextResponse.json(
        { error: 'Failed to create assignment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Assignment created successfully',
      assignment: data
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/coach/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
