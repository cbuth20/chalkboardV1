/**
 * POST /api/quizzes/assignments
 * Create a new quiz assignment
 * Auth: Coach or Admin
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError, NotFoundError } from './shared/errors';
import {
  validateRequired,
  validateUUID,
  validateNonEmptyArray,
  validateQuizTarget,
  validatePositiveNumber,
  validateRange,
  sanitizeString,
} from './shared/validators';

interface CreateQuizAssignmentRequest {
  orgId: string;
  teamId?: string;
  title: string;
  description?: string;

  // Target (only one should be set)
  assignedToUserId?: string;
  assignedToPosition?: string;
  assignedToSegmentId?: string;
  assignedToTeamId?: string;

  // Timing
  dueDate?: string;
  availableFrom?: string;
  availableUntil?: string;

  // Settings
  passingScore?: number;
  maxAttempts?: number;
  timeLimitSeconds?: number;
  randomizeQuestions?: boolean;

  // Questions
  flashcardIds: string[];
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

    // Parse and validate request body
    const body: CreateQuizAssignmentRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    const orgId = validateRequired(body.orgId, 'orgId');
    validateUUID(orgId, 'orgId');

    const title = validateRequired(body.title, 'title');
    const flashcardIds = validateNonEmptyArray(body.flashcardIds, 'flashcardIds');

    // Validate flashcard IDs are UUIDs
    flashcardIds.forEach((id, index) => {
      validateUUID(id, `flashcardIds[${index}]`);
    });

    // Validate target (only one should be set)
    validateQuizTarget({
      assignedToUserId: body.assignedToUserId,
      assignedToPosition: body.assignedToPosition,
      assignedToSegmentId: body.assignedToSegmentId,
      assignedToTeamId: body.assignedToTeamId,
    });

    // Validate settings
    const passingScore = body.passingScore
      ? validateRange(body.passingScore, 0, 100, 'passingScore')
      : 80;

    const maxAttempts = body.maxAttempts
      ? validatePositiveNumber(body.maxAttempts, 'maxAttempts')
      : undefined;

    const timeLimitSeconds = body.timeLimitSeconds
      ? validatePositiveNumber(body.timeLimitSeconds, 'timeLimitSeconds')
      : undefined;

    // Verify user has access to this org
    if (user.orgId !== orgId) {
      throw new ValidationError('orgId must match your authenticated organization');
    }

    // Verify flashcards exist and belong to this org
    const { data: flashcards, error: flashcardsError } = await supabase
      .from('flashcard_templates')
      .select('id, play_id, plays!inner(org_id)')
      .in('id', flashcardIds)
      .eq('is_active', true);

    if (flashcardsError) {
      throw new Error(`Failed to fetch flashcards: ${flashcardsError.message}`);
    }

    if (!flashcards || flashcards.length !== flashcardIds.length) {
      throw new NotFoundError('One or more flashcards not found or inactive');
    }

    // Verify all flashcards belong to this org
    const invalidFlashcards = flashcards.filter(
      (fc: any) => fc.plays?.org_id !== orgId
    );
    if (invalidFlashcards.length > 0) {
      throw new ValidationError(
        'One or more flashcards do not belong to this organization'
      );
    }

    // Create quiz assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('quiz_assignments')
      .insert({
        org_id: orgId,
        team_id: body.teamId || null,
        title: sanitizeString(title, 255),
        description: body.description ? sanitizeString(body.description, 1000) : null,
        assigned_to_user_id: body.assignedToUserId || null,
        assigned_to_position: body.assignedToPosition || null,
        assigned_to_segment_id: body.assignedToSegmentId || null,
        assigned_to_team_id: body.assignedToTeamId || null,
        due_date: body.dueDate || null,
        available_from: body.availableFrom || new Date().toISOString(),
        available_until: body.availableUntil || null,
        passing_score: passingScore,
        max_attempts: maxAttempts || null,
        time_limit_seconds: timeLimitSeconds || null,
        randomize_questions: body.randomizeQuestions ?? true,
        is_active: true,
        assigned_by: user.userId,
      })
      .select()
      .single();

    if (assignmentError || !assignment) {
      throw new Error(`Failed to create quiz assignment: ${assignmentError?.message}`);
    }

    // Create quiz assignment questions
    const questions = flashcardIds.map((flashcardId, index) => ({
      quiz_assignment_id: assignment.id,
      flashcard_id: flashcardId,
      display_order: index,
      points: 1,
    }));

    const { error: questionsError } = await supabase
      .from('quiz_assignment_questions')
      .insert(questions);

    if (questionsError) {
      // Rollback: delete the assignment
      await supabase.from('quiz_assignments').delete().eq('id', assignment.id);
      throw new Error(`Failed to create quiz questions: ${questionsError.message}`);
    }

    // Calculate how many users this targets
    let targetCount = 0;
    if (body.assignedToUserId) {
      targetCount = 1;
    } else if (body.assignedToPosition || body.assignedToSegmentId || body.assignedToTeamId) {
      // Count matching org memberships
      let query = supabase
        .from('org_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('is_active', true);

      if (body.assignedToPosition) {
        query = query.eq('position_code', body.assignedToPosition);
      }
      if (body.assignedToSegmentId) {
        query = query.eq('segment_id', body.assignedToSegmentId);
      }
      if (body.assignedToTeamId) {
        query = query.eq('team_id', body.assignedToTeamId);
      }

      const { count } = await query;
      targetCount = count || 0;
    }

    console.log(`✅ Quiz assignment created: ${assignment.id} for ${targetCount} users`);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        quizAssignmentId: assignment.id,
        message: `Quiz assigned to ${targetCount} user(s)`,
        assignment: {
          id: assignment.id,
          title: assignment.title,
          totalQuestions: flashcardIds.length,
          dueDate: assignment.due_date,
          targetCount,
        },
      }),
    };
  } catch (error) {
    console.error('Error creating quiz assignment:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
