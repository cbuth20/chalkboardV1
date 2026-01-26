/**
 * GET /api/quizzes/assignments/:id
 * Get quiz assignment details with questions
 * Auth: Player (if assigned), Coach/Admin (all)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError } from './shared/errors';
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

    // Get assignment ID from path
    const pathParts = event.path.split('/');
    const assignmentId = pathParts[pathParts.length - 1];
    validateUUID(assignmentId, 'assignmentId');

    // Fetch assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('quiz_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new NotFoundError('Quiz assignment');
    }

    // Verify access: assignment must belong to user's org
    if (assignment.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this quiz assignment');
    }

    // If player, verify they are assigned to this quiz
    if (user.role === 'player') {
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
          category,
          position
        )
      `)
      .eq('quiz_assignment_id', assignmentId)
      .order('display_order', { ascending: true });

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    // Get user's attempt history (if player)
    let attempts = [];
    if (user.role === 'player') {
      const { data: attemptData } = await supabase
        .from('quiz_attempts')
        .select('id, attempt_number, score_percentage, passed, completed_at')
        .eq('quiz_assignment_id', assignmentId)
        .eq('user_id', user.userId)
        .order('attempt_number', { ascending: false });

      attempts = attemptData || [];
    }

    // Format questions (hide correct answers)
    const formattedQuestions = questions?.map((q: any) => ({
      id: q.id,
      flashcardId: q.flashcard_id,
      displayOrder: q.display_order,
      points: q.points,
      question: q.flashcard_templates.question_prompt,
      hints: q.flashcard_templates.hints || [],
      difficulty: q.flashcard_templates.difficulty,
      category: q.flashcard_templates.category,
      position: q.flashcard_templates.position,
    })) || [];

    // Shuffle questions if randomizeQuestions is true
    const finalQuestions = assignment.randomize_questions
      ? shuffleArray(formattedQuestions)
      : formattedQuestions;

    console.log(`✅ Fetched quiz assignment ${assignmentId} with ${finalQuestions.length} questions`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.due_date,
          passingScore: assignment.passing_score,
          maxAttempts: assignment.max_attempts,
          timeLimitSeconds: assignment.time_limit_seconds,
          totalQuestions: finalQuestions.length,
          isActive: assignment.is_active,
        },
        questions: finalQuestions,
        ...(user.role === 'player' ? {
          attempts: attempts,
          canAttempt: !assignment.max_attempts || attempts.length < assignment.max_attempts,
        } : {}),
      }),
    };
  } catch (error) {
    console.error('Error fetching quiz assignment:', error);
    return formatErrorResponse(error);
  }
});

// Helper: Shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export { handler };
