/**
 * POST /api/player-block-coverage-quiz/complete
 * Mark a block coverage quiz as completed
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';

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

    if (!quiz_id) {
      throw new ValidationError('Missing quiz_id');
    }

    console.log(`✅ Completing block coverage quiz ${quiz_id}`);

    // Verify quiz belongs to user
    const { data: quiz, error: quizError } = await supabase
      .from('player_block_coverage_quizzes')
      .select('*')
      .eq('id', quiz_id)
      .eq('user_id', user.userId)
      .single();

    if (quizError || !quiz) {
      throw new ValidationError('Quiz not found');
    }

    // Mark quiz as completed
    const { error: updateError } = await supabase
      .from('player_block_coverage_quizzes')
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq('id', quiz_id);

    if (updateError) {
      throw new Error(`Failed to complete quiz: ${updateError.message}`);
    }

    // Get attempts for stats
    const { data: attempts, error: attemptsError } = await supabase
      .from('player_block_coverage_attempts')
      .select('*')
      .eq('quiz_id', quiz_id);

    if (attemptsError) {
      console.error('Failed to fetch attempts:', attemptsError);
    }

    const correctCount = attempts?.filter(a => a.is_correct).length || 0;
    const totalQuestions = quiz.total_questions;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Calculate average reaction time
    const responseTimes = attempts?.map(a => a.response_time_ms).filter(Boolean) || [];
    const avgReactionTimeMs = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum: number, t: number) => sum + t, 0) / responseTimes.length)
      : null;

    console.log(`✅ Quiz completed: ${correctCount}/${totalQuestions} (${accuracy}%), avg reaction: ${avgReactionTimeMs}ms`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        quiz_id,
        correct_count: correctCount,
        total_questions: totalQuestions,
        accuracy,
        avg_reaction_time_ms: avgReactionTimeMs,
      }),
    };
  } catch (error) {
    console.error('Error completing block coverage quiz:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
