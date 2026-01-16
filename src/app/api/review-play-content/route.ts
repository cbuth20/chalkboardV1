import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
// Service role bypasses RLS which is appropriate for server-side API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playId, action, coachId, updates, reviewNotes } = body;

    // Validation
    if (!playId || !action || !coachId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: playId, action, coachId',
        },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'update'].includes(action)) {
      return NextResponse.json(
        {
          error: 'Invalid action. Must be: approve, reject, or update',
        },
        { status: 400 }
      );
    }

    // Verify play exists
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select('*')
      .eq('id', playId)
      .single();

    if (playError || !play) {
      return NextResponse.json(
        { error: 'Play not found' },
        { status: 404 }
      );
    }

    // TODO: In development, skip permission check. In production, verify coach has permissions
    // Verify coach has permissions (should have role='coach' or 'admin' on the team)
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                         coachId === 'coach-user-id' ||
                         coachId === '00000000-0000-0000-0000-000000000001';

    if (!isDevelopment) {
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', coachId)
        .eq('team_id', play.team_id)
        .single();

      if (teamError || !teamMember || !['coach', 'admin'].includes(teamMember.role)) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions. Only coaches and admins can review content.',
          },
          { status: 403 }
        );
      }
    }

    // Handle different actions
    let newStatus = play.content_status;

    if (action === 'approve') {
      // Apply any final edits if provided
      if (updates) {
        await applyUpdates(playId, updates);
      }

      // Update play status to approved
      // Only set reviewed_by if coachId is a valid UUID (not the development placeholder)
      const updateData: any = {
        content_status: 'approved',
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
        is_published: true,
      };

      // Only set reviewed_by if it's a valid UUID
      if (coachId !== 'coach-user-id') {
        updateData.reviewed_by = coachId;
      }

      const { error: updateError } = await supabase
        .from('plays')
        .update(updateData)
        .eq('id', playId);

      if (updateError) {
        throw new Error(`Failed to approve play: ${updateError.message}`);
      }

      newStatus = 'approved';
    } else if (action === 'reject') {
      // Update play status to rejected
      const updateData: any = {
        content_status: 'rejected',
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
        is_published: false,
      };

      // Only set reviewed_by if it's a valid UUID
      if (coachId !== 'coach-user-id') {
        updateData.reviewed_by = coachId;
      }

      const { error: updateError } = await supabase
        .from('plays')
        .update(updateData)
        .eq('id', playId);

      if (updateError) {
        throw new Error(`Failed to reject play: ${updateError.message}`);
      }

      newStatus = 'rejected';
    } else if (action === 'update') {
      // Apply updates and keep as draft (or pending_review)
      if (updates) {
        await applyUpdates(playId, updates);
      }

      // Optionally update status to pending_review
      const { error: updateError } = await supabase
        .from('plays')
        .update({
          content_status: 'pending_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', playId);

      if (updateError) {
        console.error('Failed to update play status:', updateError);
      }

      newStatus = 'pending_review';
    }

    return NextResponse.json({
      success: true,
      playId,
      newStatus,
      message: `Play ${action}d successfully`,
    });
  } catch (error: any) {
    console.error('Error reviewing play content:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to review play content',
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      { status: 500 }
    );
  }
}

async function applyUpdates(playId: string, updates: any): Promise<void> {
  // Update insights if provided
  if (updates.insights !== undefined) {
    const { error } = await supabase
      .from('plays')
      .update({ ai_insights: updates.insights })
      .eq('id', playId);

    if (error) {
      console.error('Failed to update insights:', error);
      throw new Error(`Failed to update insights: ${error.message}`);
    }
  }

  // Update assignments if provided (only editable fields: alignment, assignment, key_read)
  if (updates.assignments && Array.isArray(updates.assignments)) {
    for (const assignment of updates.assignments) {
      if (!assignment.id) continue;

      const updateData: any = {};
      if (assignment.alignment !== undefined) updateData.alignment = assignment.alignment;
      if (assignment.assignment !== undefined) updateData.assignment = assignment.assignment;
      if (assignment.key_read !== undefined) updateData.key_read = assignment.key_read;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('play_assignments')
          .update(updateData)
          .eq('id', assignment.id);

        if (error) {
          console.error('Failed to update assignment:', error);
          // Continue with other updates even if one fails
        }
      }
    }
  }

  // Update knowledge cards if provided (only editable fields: question_prompt, correct_answer)
  if (updates.knowledgeCards && Array.isArray(updates.knowledgeCards)) {
    for (const card of updates.knowledgeCards) {
      if (!card.id) continue;

      const updateData: any = {};
      if (card.question_prompt !== undefined) updateData.question_prompt = card.question_prompt;
      if (card.correct_answer !== undefined) updateData.correct_answer = card.correct_answer;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('flashcard_templates')
          .update(updateData)
          .eq('id', card.id);

        if (error) {
          console.error('Failed to update flashcard:', error);
          // Continue with other updates even if one fails
        }
      }
    }
  }
}
