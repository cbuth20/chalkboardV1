/**
 * POST /activities-create
 * Create a new learning activity
 * Auth: Coach/Admin
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';

interface CreateActivityRequest {
  title: string;
  description?: string;
  activity_type: string;
  play_ids: string[];
  question_filters?: {
    difficulty?: string[];
    topics?: string[];
    positions?: string[];
  };
  time_limit_seconds?: number | null;
  passing_score_percent?: number;
  question_count?: number | null;
  show_explanations?: boolean;
  allow_retakes?: boolean;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  assigned_to: {
    type: 'positions' | 'users' | 'team';
    values: string[];
  };
  due_date?: string | null;
  team_id?: string | null;
  status?: string;
}

const handler: Handler = withOrgAuth('coach')(async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    const body: CreateActivityRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.title || !body.title.trim()) {
      throw new ValidationError('Title is required');
    }

    if (!body.activity_type) {
      throw new ValidationError('Activity type is required');
    }

    const validActivityTypes = ['quick_quiz', 'true_false', 'scenario', 'coverage_id', 'route_id', 'mixed'];
    if (!validActivityTypes.includes(body.activity_type)) {
      throw new ValidationError(`Invalid activity type. Must be one of: ${validActivityTypes.join(', ')}`);
    }

    if (!body.play_ids || body.play_ids.length === 0) {
      throw new ValidationError('At least one play must be selected');
    }

    if (!body.assigned_to || !body.assigned_to.type) {
      throw new ValidationError('Assignment configuration is required');
    }

    // Verify plays exist and belong to org
    const { data: plays, error: playsError } = await supabase
      .from('plays')
      .select('id, org_id')
      .in('id', body.play_ids)
      .eq('org_id', user.orgId);

    if (playsError) {
      throw new Error(`Failed to verify plays: ${playsError.message}`);
    }

    if (plays.length !== body.play_ids.length) {
      throw new ValidationError('Some plays not found or do not belong to your organization');
    }

    // Insert activity
    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert({
        org_id: user.orgId,
        team_id: body.team_id || null,
        activity_type: body.activity_type,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        play_ids: body.play_ids,
        question_filters: body.question_filters || {},
        time_limit_seconds: body.time_limit_seconds || null,
        passing_score_percent: body.passing_score_percent || 80,
        question_count: body.question_count || null,
        show_explanations: body.show_explanations !== false, // default true
        allow_retakes: body.allow_retakes !== false, // default true
        randomize_questions: body.randomize_questions !== false, // default true
        randomize_options: body.randomize_options !== false, // default true
        created_by: user.userId,
        assigned_to: body.assigned_to,
        due_date: body.due_date || null,
        status: body.status || 'active',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Activities] Insert error:', insertError);
      throw new Error(`Failed to create activity: ${insertError.message}`);
    }

    console.log(`✅ Created activity ${activity.id}: "${activity.title}"`);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        activity,
      }),
    };
  } catch (error) {
    console.error('[Activities Create] Error:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
