/**
 * POST /api/player-formation-quiz/complete
 * Mark a quiz as completed
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError, ForbiddenError } from './shared/errors';
import { validateUUID } from './shared/validators';

interface CompleteQuizRequest {
  quiz_id: string;
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
    const body: CompleteQuizRequest = JSON.parse(event.body || '{}');
    const { quiz_id } = body;

    validateUUID(quiz_id, 'quiz_id');

    // Verify quiz belongs to user
    const { data: quiz, error: quizError } = await supabase
      .from('player_formation_quizzes')
      .select('id, user_id, correct_count, total_questions, completed_at')
      .eq('id', quiz_id)
      .single();

    if (quizError || !quiz) {
      throw new ValidationError('Quiz not found');
    }

    if (quiz.user_id !== user.userId) {
      throw new ForbiddenError('Access denied to this quiz');
    }

    if (quiz.completed_at) {
      throw new ValidationError('Quiz is already completed');
    }

    // Mark quiz as completed
    const { error: updateError } = await supabase
      .from('player_formation_quizzes')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', quiz_id);

    if (updateError) {
      throw new Error(`Failed to complete quiz: ${updateError.message}`);
    }

    // Fetch all attempts for this quiz
    const { data: attempts, error: attemptsError } = await supabase
      .from('player_formation_attempts')
      .select('id, is_correct, response_time_ms, question_type')
      .eq('quiz_id', quiz_id)
      .order('created_at', { ascending: true });

    if (attemptsError) {
      console.error('Failed to fetch attempts:', attemptsError);
    }

    // Calculate stats
    const totalAttempts = attempts?.length || 0;
    const correctCount = quiz.correct_count;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
    const avgResponseTime = attempts?.length
      ? Math.round(
          attempts.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / attempts.length
        )
      : 0;

    console.log(`✅ Quiz ${quiz_id} completed: ${correctCount}/${totalAttempts} correct (${accuracy}%)`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        quiz_id,
        results: {
          total_questions: totalAttempts,
          correct_count: correctCount,
          incorrect_count: totalAttempts - correctCount,
          accuracy,
          avg_response_time_ms: avgResponseTime,
        },
        attempts: attempts || [],
      }),
    };
  } catch (error) {
    console.error('Error completing quiz:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
