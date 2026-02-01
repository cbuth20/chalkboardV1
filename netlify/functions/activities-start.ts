/**
 * POST /activities-start
 * Start an activity attempt - fetch questions and create attempt record
 * Auth: All authenticated users
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError, ValidationError } from './shared/errors';
import { validateUUID } from './shared/validators';

interface StartActivityRequest {
  activityId: string;
}

const handler: Handler = withOrgAuth()(async (event, context) => {
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

    const { activityId } = JSON.parse(event.body || '{}') as StartActivityRequest;

    validateUUID(activityId, 'activityId');

    // Fetch activity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .eq('org_id', user.orgId)
      .single();

    if (activityError || !activity) {
      throw new NotFoundError('Activity');
    }

    if (!activity.is_active || activity.status !== 'active') {
      throw new ValidationError('This activity is not available');
    }

    // Check if user is assigned to this activity
    const assignedTo = activity.assigned_to as { type: string; values: string[] };
    let isAssigned = false;

    if (assignedTo.type === 'team') {
      isAssigned = true;
    } else if (assignedTo.type === 'users') {
      isAssigned = assignedTo.values.includes(user.userId);
    } else if (assignedTo.type === 'positions') {
      // Get user's position
      const { data: userData } = await supabase
        .from('users')
        .select('position')
        .eq('id', user.userId)
        .single();

      if (userData?.position) {
        isAssigned = assignedTo.values.includes(userData.position);
      }
    }

    if (!isAssigned && user.role !== 'coach' && user.role !== 'admin') {
      throw new ForbiddenError('You are not assigned to this activity');
    }

    // Check if retakes are allowed
    const { data: previousAttempts, error: attemptsError } = await supabase
      .from('activity_attempts')
      .select('id, passed')
      .eq('activity_id', activityId)
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (attemptsError) {
      console.error('[Activities Start] Failed to check previous attempts:', attemptsError);
    }

    const hasPassed = previousAttempts?.some(a => a.passed);
    if (hasPassed && !activity.allow_retakes) {
      throw new ValidationError('You have already passed this activity and retakes are not allowed');
    }

    // Fetch questions based on activity criteria
    const playIds = activity.play_ids as string[];
    const questionFilters = activity.question_filters as {
      difficulty?: string[];
      topics?: string[];
      positions?: string[];
    };

    let query = supabase
      .from('flashcard_templates')
      .select('*')
      .in('play_id', playIds)
      .eq('org_id', user.orgId)
      .eq('is_active', true);

    // Apply filters based on activity type
    if (activity.activity_type === 'quick_quiz') {
      query = query.eq('question_type', 'multiple_choice');
    } else if (activity.activity_type === 'true_false') {
      query = query.eq('question_type', 'true_false');
    } else if (activity.activity_type === 'scenario') {
      query = query.eq('question_type', 'scenario');
    } else if (activity.activity_type === 'coverage_id') {
      query = query.eq('question_type', 'identification');
      if (!questionFilters.topics?.length) {
        query = query.in('topic', ['coverage_recognition', 'coverage_concepts']);
      }
    } else if (activity.activity_type === 'route_id') {
      query = query.eq('question_type', 'identification');
      if (!questionFilters.topics?.length) {
        query = query.in('topic', ['route_running', 'play_concepts']);
      }
    }
    // 'mixed' uses all question types

    // Apply user-defined filters
    if (questionFilters.difficulty?.length) {
      query = query.in('difficulty', questionFilters.difficulty);
    }

    if (questionFilters.topics?.length) {
      query = query.in('topic', questionFilters.topics);
    }

    if (questionFilters.positions?.length) {
      query = query.in('position', questionFilters.positions);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    if (!questions || questions.length === 0) {
      throw new ValidationError('No questions found matching activity criteria');
    }

    // Shuffle questions if randomize is enabled
    let selectedQuestions = [...questions];
    if (activity.randomize_questions) {
      selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
    }

    // Limit to question_count if specified
    if (activity.question_count && activity.question_count < selectedQuestions.length) {
      selectedQuestions = selectedQuestions.slice(0, activity.question_count);
    }

    // Randomize options for multiple choice if enabled
    if (activity.randomize_options) {
      selectedQuestions = selectedQuestions.map(q => {
        if (q.question_type === 'multiple_choice' && q.options) {
          const options = [...q.options];
          return {
            ...q,
            options: options.sort(() => Math.random() - 0.5),
          };
        }
        return q;
      });
    }

    // Create attempt record
    const attemptNumber = (previousAttempts?.length || 0) + 1;

    const { data: attempt, error: attemptError } = await supabase
      .from('activity_attempts')
      .insert({
        activity_id: activityId,
        user_id: user.userId,
        org_id: user.orgId,
        attempt_number: attemptNumber,
        total_questions: selectedQuestions.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) {
      throw new Error(`Failed to create attempt: ${attemptError.message}`);
    }

    console.log(`✅ User ${user.userId} started activity ${activityId}, attempt #${attemptNumber}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        attempt,
        activity,
        questions: selectedQuestions,
      }),
    };

  } catch (error) {
    console.error('[Activities Start] Error:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
