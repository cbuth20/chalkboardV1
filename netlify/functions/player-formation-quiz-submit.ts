/**
 * POST /api/player-formation-quiz/submit
 * Submit an answer to a quiz question
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError, ForbiddenError } from './shared/errors';
import { validateUUID } from './shared/validators';

interface SubmitAnswerRequest {
  quiz_id: string;
  formation_id: string;
  question_type: 'identify' | 'position';
  question_text: string;
  target_position?: string; // For position questions
  user_answer: string;
  correct_answer: string;
  response_time_ms?: number;
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
    const {
      quiz_id,
      formation_id,
      question_type,
      question_text,
      target_position,
      user_answer,
      correct_answer,
      response_time_ms,
    } = body;

    // Validate required fields
    validateUUID(quiz_id, 'quiz_id');
    validateUUID(formation_id, 'formation_id');
    if (!user_answer || !correct_answer) {
      throw new ValidationError('user_answer and correct_answer are required');
    }

    // Verify quiz belongs to user
    const { data: quiz, error: quizError } = await supabase
      .from('player_formation_quizzes')
      .select('id, user_id, correct_count, completed_at')
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

    // Check if answer is correct
    const isCorrect = normalizeAnswer(user_answer) === normalizeAnswer(correct_answer);

    console.log(`📝 Answer check: "${user_answer}" vs "${correct_answer}" = ${isCorrect}`);

    // Record the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('player_formation_attempts')
      .insert({
        quiz_id,
        formation_id,
        user_id: user.userId,
        question_type,
        question_text,
        target_position,
        user_answer,
        correct_answer,
        is_correct: isCorrect,
        response_time_ms,
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      throw new Error(`Failed to record attempt: ${attemptError?.message}`);
    }

    // Update quiz correct count if answer is correct
    if (isCorrect) {
      const { error: updateError } = await supabase
        .from('player_formation_quizzes')
        .update({ correct_count: quiz.correct_count + 1 })
        .eq('id', quiz_id);

      if (updateError) {
        console.error('Failed to update quiz correct count:', updateError);
      }
    }

    // Fetch formation for coaching notes
    const { data: formation } = await supabase
      .from('player_formations')
      .select('formation_name, coaching_notes, positions')
      .eq('id', formation_id)
      .single();

    const coachingNote = formation?.coaching_notes?.[target_position || 'QB'] || null;

    console.log(`✅ Recorded attempt for quiz ${quiz_id}: ${isCorrect ? 'correct' : 'incorrect'}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        attempt_id: attempt.id,
        is_correct: isCorrect,
        correct_answer,
        coaching_note: coachingNote,
        formation_name: formation?.formation_name,
      }),
    };
  } catch (error) {
    console.error('Error submitting quiz answer:', error);
    return formatErrorResponse(error);
  }
});

// Normalize answers for comparison (trim, lowercase, remove extra spaces)
function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}

export { handler };
