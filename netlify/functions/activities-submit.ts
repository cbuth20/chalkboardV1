/**
 * POST /activities-submit
 * Submit activity attempt results
 * Auth: All authenticated users
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError, ValidationError } from './shared/errors';
import { validateUUID } from './shared/validators';

interface QuestionResult {
  question_id: string;
  flashcard_id: string;
  correct: boolean;
  time_spent: number;
  answer_given: string;
  correct_answer: string;
}

interface SubmitActivityRequest {
  attemptId: string;
  questionResults: QuestionResult[];
  timeSpentSeconds: number;
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

    const {
      attemptId,
      questionResults,
      timeSpentSeconds,
    } = JSON.parse(event.body || '{}') as SubmitActivityRequest;

    validateUUID(attemptId, 'attemptId');

    if (!questionResults || !Array.isArray(questionResults)) {
      throw new ValidationError('Question results are required');
    }

    // Fetch attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('activity_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.userId)
      .single();

    if (attemptError || !attempt) {
      throw new NotFoundError('Attempt');
    }

    if (attempt.completed_at) {
      throw new ValidationError('This attempt has already been submitted');
    }

    // Fetch activity to get passing score
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('passing_score_percent')
      .eq('id', attempt.activity_id)
      .single();

    if (activityError || !activity) {
      throw new NotFoundError('Activity');
    }

    // Calculate score
    const totalQuestions = questionResults.length;
    const correctAnswers = questionResults.filter(r => r.correct).length;
    const scorePercent = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100 * 100) / 100
      : 0;
    const passed = scorePercent >= activity.passing_score_percent;

    // Update attempt with results
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('activity_attempts')
      .update({
        completed_at: new Date().toISOString(),
        time_spent_seconds: timeSpentSeconds,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score_percent: scorePercent,
        passed,
        question_results: questionResults,
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update attempt: ${updateError.message}`);
    }

    console.log(`✅ User ${user.userId} completed activity attempt ${attemptId}: ${scorePercent}% (${passed ? 'PASSED' : 'FAILED'})`);

    // Calculate breakdown by topic
    const topicBreakdown: Record<string, { correct: number; total: number }> = {};

    // Fetch flashcard details to get topics
    const flashcardIds = questionResults.map(r => r.flashcard_id);
    const { data: flashcards, error: flashcardsError } = await supabase
      .from('flashcard_templates')
      .select('id, topic')
      .in('id', flashcardIds);

    if (!flashcardsError && flashcards) {
      questionResults.forEach(result => {
        const flashcard = flashcards.find(f => f.id === result.flashcard_id);
        const topic = flashcard?.topic || 'unknown';

        if (!topicBreakdown[topic]) {
          topicBreakdown[topic] = { correct: 0, total: 0 };
        }

        topicBreakdown[topic].total++;
        if (result.correct) {
          topicBreakdown[topic].correct++;
        }
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        attempt: updatedAttempt,
        results: {
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          score_percent: scorePercent,
          passed,
          time_spent_seconds: timeSpentSeconds,
          topic_breakdown: topicBreakdown,
        },
      }),
    };

  } catch (error) {
    console.error('[Activities Submit] Error:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
