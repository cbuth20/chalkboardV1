/**
 * POST /api/player-games-submit
 * Submit game answers and calculate score
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired, validateUUID } from './shared/validators';

interface SubmitAnswersRequest {
  attemptId: string;
  responses: Array<{
    questionId: string;
    answer: string;
    timeSpent: number; // milliseconds
  }>;
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

    const body: SubmitAnswersRequest = JSON.parse(event.body || '{}');

    validateRequired(body.attemptId, 'attemptId');
    validateUUID(body.attemptId, 'attemptId');
    validateRequired(body.responses, 'responses');

    // Fetch attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('player_game_attempts')
      .select('*')
      .eq('id', body.attemptId)
      .eq('user_id', user.userId)
      .single();

    if (attemptError || !attempt) {
      throw new ValidationError('Game attempt not found or access denied');
    }

    if (attempt.completed_at) {
      throw new ValidationError('Game attempt already completed');
    }

    // Fetch all questions for this attempt
    const { data: questions, error: questionsError } = await supabase
      .from('player_flashcard_templates')
      .select('*')
      .in('id', attempt.question_ids);

    if (questionsError || !questions) {
      throw new Error('Failed to fetch questions');
    }

    // Create question lookup map
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Score each response
    let correctCount = 0;
    const scoredResponses = body.responses.map(response => {
      const question = questionMap.get(response.questionId);

      if (!question) {
        return {
          questionId: response.questionId,
          answer: response.answer,
          correct: false,
          correctAnswer: 'Unknown',
          explanation: 'Question not found',
          timeSpent: response.timeSpent,
        };
      }

      // Normalize answers for comparison (trim, lowercase)
      const normalizedUserAnswer = (response.answer || '').trim().toLowerCase();
      const normalizedCorrectAnswer = (question.correct_answer || '').trim().toLowerCase();

      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      if (isCorrect) {
        correctCount++;
      }

      return {
        questionId: response.questionId,
        answer: response.answer,
        correct: isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation || '',
        questionPrompt: question.question_prompt,
        position: question.position,
        topic: question.topic,
        difficulty: question.difficulty,
        timeSpent: response.timeSpent,
      };
    });

    // Calculate score percentage
    const scorePercentage = Math.round((correctCount / body.responses.length) * 100);

    // Update attempt with results
    const { error: updateError } = await supabase
      .from('player_game_attempts')
      .update({
        completed_at: new Date().toISOString(),
        questions_correct: correctCount,
        score_percentage: scorePercentage,
        responses: scoredResponses,
      })
      .eq('id', body.attemptId);

    if (updateError) {
      console.error('Failed to update attempt:', updateError);
      throw new Error('Failed to save game results');
    }

    // Update spaced repetition progress for each question
    // For now, we'll create simple progress records
    const progressUpdates = scoredResponses.map(response => ({
      user_id: user.userId,
      flashcard_id: response.questionId,
      ease_factor: response.correct ? 2.5 : 2.0,
      interval_days: response.correct ? 3 : 1,
      due_date: new Date(Date.now() + (response.correct ? 3 : 1) * 24 * 60 * 60 * 1000).toISOString(),
      times_shown: 1,
      times_correct: response.correct ? 1 : 0,
      last_reviewed_at: new Date().toISOString(),
    }));

    // Upsert progress records (insert or update)
    for (const progress of progressUpdates) {
      await supabase
        .from('player_flashcard_progress')
        .upsert(progress, {
          onConflict: 'user_id,flashcard_id',
        });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        score: scorePercentage,
        correct: correctCount,
        total: body.responses.length,
        breakdown: scoredResponses,
      }),
    };
  } catch (error: any) {
    console.error('Error submitting game:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
