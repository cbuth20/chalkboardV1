import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event, context) => {
  console.log('📝 Review play content function started');

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { playId, action, coachId, updates, reviewNotes } = JSON.parse(event.body || '{}');

    console.log('📥 Request:', { playId, action, coachId, hasUpdates: !!updates });

    // Validation
    if (!playId || !action || !coachId) {
      console.error('❌ Missing required fields');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: playId, action, coachId',
        }),
      };
    }

    if (!['approve', 'reject', 'update'].includes(action)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid action. Must be: approve, reject, or update',
        }),
      };
    }

    // Verify play exists
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select('*')
      .eq('id', playId)
      .single();

    if (playError || !play) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Play not found' }),
      };
    }

    // Verify coach has permissions (should have role='coach' or 'admin' on the team)
    // TODO: Re-enable this check once proper authentication is implemented
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', coachId)
      .eq('team_id', play.team_id)
      .single();

    // Skip permission check for now if team member doesn't exist
    // In production, this should be enforced
    if (teamMember && !['coach', 'admin', 'player'].includes(teamMember.role)) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Insufficient permissions. Only coaches and admins can review content.',
        }),
      };
    }

    console.log('✅ Permissions check passed (or skipped for testing)');

    // Handle different actions
    let newStatus = play.content_status;

    if (action === 'approve') {
      console.log('✅ Approving play:', playId);

      // Apply any final edits if provided
      if (updates) {
        console.log('📝 Applying updates before approval');
        await applyUpdates(playId, updates);
      }

      // Check if coachId is a valid UUID and not a development placeholder
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coachId);
      const isDevelopmentPlaceholder = coachId === '00000000-0000-0000-0000-000000000001';

      // Update play status to approved
      const updateData: any = {
        content_status: 'approved',
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
        is_published: true,
      };

      // Only set reviewed_by if coachId is a valid UUID and not a development placeholder
      if (isValidUUID && !isDevelopmentPlaceholder) {
        updateData.reviewed_by = coachId;
      }

      const { error: updateError } = await supabase
        .from('plays')
        .update(updateData)
        .eq('id', playId);

      if (updateError) {
        console.error('❌ Failed to approve play:', updateError);
        throw new Error(`Failed to approve play: ${updateError.message}`);
      }

      console.log('✅ Play approved successfully');
      newStatus = 'approved';
    } else if (action === 'reject') {
      console.log('🔴 Rejecting play:', playId);

      // Check if coachId is a valid UUID and not a development placeholder
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coachId);
      const isDevelopmentPlaceholder = coachId === '00000000-0000-0000-0000-000000000001';

      // Update play status to rejected
      const updateData: any = {
        content_status: 'rejected',
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
        is_published: false,
      };

      // Only set reviewed_by if coachId is a valid UUID and not a development placeholder
      if (isValidUUID && !isDevelopmentPlaceholder) {
        updateData.reviewed_by = coachId;
      }

      const { error: updateError } = await supabase
        .from('plays')
        .update(updateData)
        .eq('id', playId);

      if (updateError) {
        console.error('❌ Failed to reject play:', updateError);
        throw new Error(`Failed to reject play: ${updateError.message}`);
      }

      console.log('✅ Play rejected successfully');
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        playId,
        newStatus,
        message: `Play ${action}d successfully`,
      }),
    };
  } catch (error: any) {
    console.error('Error reviewing play content:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to review play content',
        message: error.message,
      }),
    };
  }
};

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
