import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PUT /api/coach/assignments/[id] - Update an assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const body = await request.json();

    // Build update object (only include provided fields)
    const updates: any = {};

    if (body.alignment !== undefined) updates.alignment = body.alignment;
    if (body.landmark !== undefined) updates.landmark = body.landmark;
    if (body.assignment !== undefined) updates.assignment = body.assignment;
    if (body.key_read !== undefined) updates.key_read = body.key_read;
    if (body.read_progression !== undefined) updates.read_progression = body.read_progression;
    if (body.route_id !== undefined) updates.route_id = body.route_id;
    if (body.route_depth !== undefined) updates.route_depth = body.route_depth;
    if (body.blocking_assignment !== undefined) updates.blocking_assignment = body.blocking_assignment;
    if (body.coverage_adjustments !== undefined) updates.coverage_adjustments = body.coverage_adjustments;
    if (body.visible_to_positions !== undefined) updates.visible_to_positions = body.visible_to_positions;

    // Ensure at least one field is being updated
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update assignment
    const { data, error } = await supabase
      .from('play_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      return NextResponse.json(
        { error: 'Failed to update assignment', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Assignment updated successfully',
      assignment: data
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/coach/assignments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/coach/assignments/[id] - Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;

    // Delete assignment
    const { error } = await supabase
      .from('play_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting assignment:', error);
      return NextResponse.json(
        { error: 'Failed to delete assignment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/coach/assignments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
