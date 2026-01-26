/**
 * POST /api/quizzes/attempts
 * Start a new quiz attempt
 * Auth: Player
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError, NotFoundError, ForbiddenError, ConflictError } from './shared/errors';
import { validateRequired, validateUUID } from './shared/validators';

interface StartAttemptRequest {
  quizAssignmentId: string;
}

const handler: Handler = withOrgAuth('player')(async (event, context) => {
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

    // Parse request body
    const body: StartAttemptRequest = JSON.parse(event.body || '{}');
    const quizAssignmentId = validateRequired(body.quizAssignmentId, 'quizAssignmentId');
    validateUUID(quizAssignmentId, 'quizAssignmentId');

    // Fetch quiz assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('quiz_assignments')
      .select('*')
      .eq('id', quizAssignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new NotFoundError('Quiz assignment');
    }

    // Verify access: assignment must belong to user's org
    if (assignment.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this quiz assignment');
    }

    // Verify assignment is active
    if (!assignment.is_active) {
      throw new ValidationError('This quiz is no longer active');
    }

    // Verify quiz is available (check dates)
    const now = new Date();
    if (assignment.available_from && new Date(assignment.available_from) > now) {
      throw new ValidationError('This quiz is not yet available');
    }
    if (assignment.available_until && new Date(assignment.available_until) < now) {
      throw new ValidationError('This quiz is no longer available');
    }

    // Verify user is assigned to this quiz
    const { data: membership } = await supabase
      .from('org_memberships')
      .select('position_code, segment_id, team_id')
      .eq('user_id', user.userId)
      .eq('org_id', user.orgId)
      .single();

    const isAssigned =
      assignment.assigned_to_user_id === user.userId ||
      assignment.assigned_to_position === membership?.position_code ||
      assignment.assigned_to_segment_id === membership?.segment_id ||
      assignment.assigned_to_team_id === membership?.team_id;

    if (!isAssigned) {
      throw new ForbiddenError('This quiz is not assigned to you');
    }

    // Check if user has reached max attempts
    const { data: existingAttempts, count: attemptCount } = await supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact' })
      .eq('quiz_assignment_id', quizAssignmentId)
      .eq('user_id', user.userId);

    if (assignment.max_attempts && attemptCount && attemptCount >= assignment.max_attempts) {
      throw new ConflictError(
        `You have reached the maximum number of attempts (${assignment.max_attempts})`
      );
    }

    // Check if user has an in-progress attempt
    const { data: inProgressAttempt } = await supabase
      .from('quiz_attempts')
      .select('id, started_at')
      .eq('quiz_assignment_id', quizAssignmentId)
      .eq('user_id', user.userId)
      .is('completed_at', null)
      .single();

    if (inProgressAttempt) {
      // Return existing in-progress attempt
      console.log(`⚠️  User has in-progress attempt: ${inProgressAttempt.id}`);

      // Fetch questions for this attempt
      const { data: questions } = await supabase
        .from('quiz_assignment_questions')
        .select(`
          id,
          flashcard_id,
          display_order,
          points,
          flashcard_templates (
            id,
            question_prompt,
            hints,
            difficulty,
            category
          )
        `)
        .eq('quiz_assignment_id', quizAssignmentId)
        .order('display_order', { ascending: true });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: inProgressAttempt.id,
          quizAssignmentId,
          attemptNumber: (attemptCount || 0) + 1,
          startedAt: inProgressAttempt.started_at,
          message: 'Resuming in-progress attempt',
          questions: formatQuestions(questions || [], assignment.randomize_questions),
        }),
      };
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_assignment_questions')
      .select(`
        id,
        flashcard_id,
        display_order,
        points,
        flashcard_templates (
          id,
          question_prompt,
          hints,
          difficulty,
          category
        )
      `)
      .eq('quiz_assignment_id', quizAssignmentId)
      .order('display_order', { ascending: true });

    if (questionsError || !questions || questions.length === 0) {
      throw new ValidationError('This quiz has no questions');
    }

    // Create new attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_assignment_id: quizAssignmentId,
        user_id: user.userId,
        attempt_number: (attemptCount || 0) + 1,
        started_at: new Date().toISOString(),
        total_questions: questions.length,
        correct_answers: 0,
        score_percentage: null,
        passed: null,
        time_taken_seconds: null,
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      throw new Error(`Failed to create attempt: ${attemptError?.message}`);
    }

    console.log(`✅ Started quiz attempt ${attempt.id} for user ${user.userId}`);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: attempt.id,
        quizAssignmentId,
        attemptNumber: attempt.attempt_number,
        startedAt: attempt.started_at,
        totalQuestions: questions.length,
        timeLimitSeconds: assignment.time_limit_seconds,
        questions: formatQuestions(questions, assignment.randomize_questions),
      }),
    };
  } catch (error) {
    console.error('Error starting quiz attempt:', error);
    return formatErrorResponse(error);
  }
});

// Helper: Format and optionally shuffle questions
function formatQuestions(questions: any[], randomize: boolean) {
  const formatted = questions.map((q, index) => ({
    questionNumber: index + 1,
    flashcardId: q.flashcard_id,
    question: q.flashcard_templates.question_prompt,
    hints: q.flashcard_templates.hints || [],
    difficulty: q.flashcard_templates.difficulty,
    category: q.flashcard_templates.category,
    points: q.points,
  }));

  if (randomize) {
    return shuffleArray(formatted);
  }

  return formatted;
}

// Helper: Shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export { handler };
