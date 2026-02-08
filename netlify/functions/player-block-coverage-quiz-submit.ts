/**
 * POST /api/player-block-coverage-quiz/submit
 * Submit an answer to a block coverage quiz question
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';

interface SubmitAnswerRequest {
  quiz_id: string;
  coverage_id: string;
  user_answer: string;
  correct_answer: string;
  response_time_ms: number;
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
    const body: SubmitAnswerRequest = JSON.parse(event.body || '{}');
    const { quiz_id, coverage_id, user_answer, correct_answer, response_time_ms } = body;

    if (!quiz_id || !coverage_id || !user_answer || !correct_answer) {
      throw new ValidationError('Missing required fields');
    }

    console.log(`📝 Submitting answer for quiz ${quiz_id}: ${user_answer} (correct: ${correct_answer})`);

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

    // Check if answer is correct (case-insensitive, trim spaces)
    const isCorrect = user_answer.trim().toLowerCase() === correct_answer.trim().toLowerCase();

    // Record attempt
    const { error: attemptError } = await supabase
      .from('player_block_coverage_attempts')
      .insert({
        quiz_id,
        coverage_id,
        user_id: user.userId,
        user_answer,
        correct_answer,
        is_correct: isCorrect,
        response_time_ms,
      });

    if (attemptError) {
      throw new Error(`Failed to record attempt: ${attemptError.message}`);
    }

    // Update quiz correct count if answer is correct
    if (isCorrect) {
      const { error: updateError } = await supabase
        .from('player_block_coverage_quizzes')
        .update({
          correct_count: quiz.correct_count + 1,
        })
        .eq('id', quiz_id);

      if (updateError) {
        console.error('Failed to update quiz correct count:', updateError);
      }
    }

    console.log(`✅ Answer recorded: ${isCorrect ? 'correct' : 'incorrect'}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        is_correct: isCorrect,
        correct_answer,
      }),
    };
  } catch (error) {
    console.error('Error submitting block coverage answer:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
