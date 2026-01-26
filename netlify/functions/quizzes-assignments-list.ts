/**
 * GET /api/quizzes/assignments
 * List quiz assignments
 * Auth: Player (sees assigned), Coach/Admin (sees all in org)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse } from './shared/errors';
import { validateUUID } from './shared/validators';

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const orgId = params.orgId;
    const teamId = params.teamId;
    const status = params.status; // active, completed, overdue
    const assignedToMe = params.assignedToMe === 'true';

    // Validate orgId
    if (orgId) {
      validateUUID(orgId, 'orgId');
      if (user.orgId !== orgId) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Access denied to this organization' }),
        };
      }
    }

    // Build base query
    let query = supabase
      .from('quiz_assignments')
      .select(`
        id,
        title,
        description,
        due_date,
        available_from,
        available_until,
        passing_score,
        max_attempts,
        time_limit_seconds,
        is_active,
        assigned_to_user_id,
        assigned_to_position,
        assigned_to_segment_id,
        assigned_to_team_id,
        created_at
      `)
      .eq('org_id', user.orgId)
      .order('created_at', { ascending: false });

    // Filter by team if specified
    if (teamId) {
      validateUUID(teamId, 'teamId');
      query = query.eq('team_id', teamId);
    }

    // For players: only show assignments assigned to them
    if (user.role === 'player' || assignedToMe) {
      // Get user's org membership to check position and segment
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('position_code, segment_id, team_id')
        .eq('user_id', user.userId)
        .eq('org_id', user.orgId)
        .single();

      // Filter by assignments that match the user
      query = query.or(
        `assigned_to_user_id.eq.${user.userId},` +
        `assigned_to_position.eq.${membership?.position_code || 'NONE'},` +
        `assigned_to_segment_id.eq.${membership?.segment_id || 'NONE'},` +
        `assigned_to_team_id.eq.${membership?.team_id || 'NONE'}`
      );
    }

    // Fetch assignments
    const { data: assignments, error: assignmentsError } = await query;

    if (assignmentsError) {
      throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
    }

    // For each assignment, get question count and user's attempt stats
    const enrichedAssignments = await Promise.all(
      (assignments || []).map(async (assignment) => {
        // Get question count
        const { count: questionCount } = await supabase
          .from('quiz_assignment_questions')
          .select('id', { count: 'exact', head: true })
          .eq('quiz_assignment_id', assignment.id);

        // Get user's attempts (if player)
        let userAttempts = 0;
        let bestScore = null;
        let lastAttempt = null;

        if (user.role === 'player' || assignedToMe) {
          const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select('score_percentage, completed_at')
            .eq('quiz_assignment_id', assignment.id)
            .eq('user_id', user.userId)
            .order('score_percentage', { ascending: false });

          if (attempts && attempts.length > 0) {
            userAttempts = attempts.length;
            bestScore = attempts[0].score_percentage;
            lastAttempt = attempts[attempts.length - 1].completed_at;
          }
        }

        // Determine status
        let assignmentStatus = 'active';
        const now = new Date();
        const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;

        if (dueDate && dueDate < now) {
          assignmentStatus = 'overdue';
        }
        if (bestScore && bestScore >= assignment.passing_score) {
          assignmentStatus = 'completed';
        }

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.due_date,
          passingScore: assignment.passing_score,
          maxAttempts: assignment.max_attempts,
          timeLimitSeconds: assignment.time_limit_seconds,
          totalQuestions: questionCount || 0,
          status: assignmentStatus,
          isActive: assignment.is_active,
          createdAt: assignment.created_at,
          // Player-specific fields
          ...(user.role === 'player' || assignedToMe ? {
            myAttempts: userAttempts,
            bestScore: bestScore,
            lastAttempt: lastAttempt,
            canAttempt: !assignment.max_attempts || userAttempts < assignment.max_attempts,
          } : {}),
        };
      })
    );

    // Filter by status if specified
    let filteredAssignments = enrichedAssignments;
    if (status) {
      filteredAssignments = enrichedAssignments.filter(
        (a) => a.status === status
      );
    }

    console.log(`✅ Listed ${filteredAssignments.length} quiz assignments for user ${user.userId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments: filteredAssignments,
        total: filteredAssignments.length,
      }),
    };
  } catch (error) {
    console.error('Error listing quiz assignments:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
