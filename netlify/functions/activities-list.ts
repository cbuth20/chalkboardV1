/**
 * GET /activities-list
 * List activities
 * - Coaches see all activities they created or for their org
 * - Players see activities assigned to them
 * Auth: All authenticated users
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse } from './shared/errors';

const handler: Handler = withOrgAuth()(async (event, context) => {
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

    const params = event.queryStringParameters || {};
    const status = params.status || 'active'; // active, draft, completed, archived
    const teamId = params.teamId;

    // Different queries for coach vs player
    if (user.role === 'coach' || user.role === 'admin') {
      // Coach sees all activities for their org
      let query = supabase
        .from('activities')
        .select(`
          *,
          created_by_user:users!activities_created_by_fkey(id, full_name, email)
        `)
        .eq('org_id', user.orgId)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data: activities, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }

      // Get attempt stats for each activity
      const activityIds = activities.map(a => a.id);

      const { data: attemptStats, error: statsError } = await supabase
        .from('activity_attempts')
        .select('activity_id, user_id, completed_at, passed')
        .in('activity_id', activityIds);

      if (statsError) {
        console.error('[Activities] Failed to fetch attempt stats:', statsError);
      }

      // Aggregate stats
      const stats = activities.map(activity => {
        const activityAttempts = attemptStats?.filter(a => a.activity_id === activity.id) || [];
        const uniqueUsers = new Set(activityAttempts.map(a => a.user_id)).size;
        const completedUsers = new Set(
          activityAttempts.filter(a => a.completed_at).map(a => a.user_id)
        ).size;
        const passedUsers = new Set(
          activityAttempts.filter(a => a.passed).map(a => a.user_id)
        ).size;

        return {
          ...activity,
          stats: {
            assigned_users: uniqueUsers,
            completed_users: completedUsers,
            passed_users: passedUsers,
            total_attempts: activityAttempts.length,
          },
        };
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          activities: stats,
        }),
      };

    } else {
      // Player sees activities assigned to them
      // Need to check assigned_to JSONB field

      // Get user's position(s)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('position')
        .eq('id', user.userId)
        .single();

      if (userError) {
        console.error('[Activities] Failed to fetch user data:', userError);
      }

      const userPosition = userData?.position;

      // Fetch all active activities for the org
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('org_id', user.orgId)
        .eq('is_active', true)
        .eq('status', 'active')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) {
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }

      // Filter activities based on assignment
      const assignedActivities = activities.filter(activity => {
        const assignedTo = activity.assigned_to as { type: string; values: string[] };

        if (assignedTo.type === 'team') {
          return true; // Assigned to whole team
        }

        if (assignedTo.type === 'users') {
          return assignedTo.values.includes(user.userId);
        }

        if (assignedTo.type === 'positions' && userPosition) {
          return assignedTo.values.includes(userPosition);
        }

        return false;
      });

      // Get user's attempt data for each activity
      const activityIds = assignedActivities.map(a => a.id);

      const { data: attempts, error: attemptsError } = await supabase
        .from('activity_attempts')
        .select('*')
        .eq('user_id', user.userId)
        .in('activity_id', activityIds)
        .order('created_at', { ascending: false });

      if (attemptsError) {
        console.error('[Activities] Failed to fetch attempts:', attemptsError);
      }

      // Merge activity with user's progress
      const activitiesWithProgress = assignedActivities.map(activity => {
        const userAttempts = attempts?.filter(a => a.activity_id === activity.id) || [];
        const bestAttempt = userAttempts.sort((a, b) =>
          (b.score_percent || 0) - (a.score_percent || 0)
        )[0];
        const latestAttempt = userAttempts[0];

        return {
          ...activity,
          user_progress: {
            attempts_count: userAttempts.length,
            best_score: bestAttempt?.score_percent || null,
            last_completed_at: latestAttempt?.completed_at || null,
            passed: bestAttempt?.passed || false,
            latest_attempt: latestAttempt || null,
          },
        };
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          activities: activitiesWithProgress,
        }),
      };
    }

  } catch (error) {
    console.error('[Activities List] Error:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
