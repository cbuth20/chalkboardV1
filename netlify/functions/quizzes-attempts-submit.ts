/**
 * POST /api/quizzes/attempts/:id/submit
 * Submit quiz attempt answers for grading
 * Auth: Player (own attempts only)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError, NotFoundError, ForbiddenError, ConflictError } from './shared/errors';
import { validateUUID, validateNonEmptyArray } from './shared/validators';

interface SubmitAttemptRequest {
  answers: {
    flashcardId: string;
    userAnswer: string;
    responseTimeMs: number;
  }[];
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

    // Get attempt ID from path
    const pathParts = event.path.split('/');
    const attemptId = pathParts[pathParts.indexOf('attempts') + 1];
    validateUUID(attemptId, 'attemptId');

    // Parse request body
    const body: SubmitAttemptRequest = JSON.parse(event.body || '{}');
    const answers = validateNonEmptyArray(body.answers, 'answers');

    // Fetch attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*, quiz_assignments(*)')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      throw new NotFoundError('Quiz attempt');
    }

    // Verify attempt belongs to user
    if (attempt.user_id !== user.userId) {
      throw new ForbiddenError('This attempt does not belong to you');
    }

    // Verify attempt is not already completed
    if (attempt.completed_at) {
      throw new ConflictError('This attempt has already been submitted');
    }

    // Verify org access
    const assignment = attempt.quiz_assignments;
    if (assignment.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied');
    }

    // Fetch correct answers for all flashcards
    const flashcardIds = answers.map(a => a.flashcardId);
    const { data: flashcards, error: flashcardsError } = await supabase
      .from('flashcard_templates')
      .select('id, correct_answer')
      .in('id', flashcardIds);

    if (flashcardsError || !flashcards) {
      throw new Error(`Failed to fetch flashcards: ${flashcardsError?.message}`);
    }

    // Create lookup map for correct answers
    const correctAnswersMap = new Map(
      flashcards.map(fc => [fc.id, fc.correct_answer.toLowerCase().trim()])
    );

    // Grade each answer
    let correctCount = 0;
    const gradedAnswers = answers.map((answer, index) => {
      const correctAnswer = correctAnswersMap.get(answer.flashcardId);
      const userAnswerNormalized = answer.userAnswer.toLowerCase().trim();

      const isCorrect = correctAnswer === userAnswerNormalized;
      if (isCorrect) correctCount++;

      return {
        quiz_attempt_id: attemptId,
        flashcard_id: answer.flashcardId,
        question_number: index + 1,
        user_answer: answer.userAnswer,
        is_correct: isCorrect,
        response_time_ms: answer.responseTimeMs,
        answered_at: new Date().toISOString(),
      };
    });

    // Calculate score
    const totalQuestions = answers.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= assignment.passing_score;

    // Calculate time taken
    const startedAt = new Date(attempt.started_at);
    const completedAt = new Date();
    const timeTakenSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);

    // Insert answers
    const { error: answersError } = await supabase
      .from('quiz_attempt_answers')
      .insert(gradedAnswers);

    if (answersError) {
      throw new Error(`Failed to save answers: ${answersError.message}`);
    }

    // Update attempt with results
    const { error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        completed_at: completedAt.toISOString(),
        correct_answers: correctCount,
        score_percentage: scorePercentage,
        passed: passed,
        time_taken_seconds: timeTakenSeconds,
      })
      .eq('id', attemptId);

    if (updateError) {
      throw new Error(`Failed to update attempt: ${updateError.message}`);
    }

    // Award XP if passed
    let xpEarned = 0;
    if (passed) {
      // Base XP: 10 per correct answer
      xpEarned = correctCount * 10;

      // Bonus XP for perfect score
      if (scorePercentage === 100) {
        xpEarned += 50;
      }

      // Bonus XP for first attempt
      if (attempt.attempt_number === 1) {
        xpEarned += 25;
      }

      // Create XP event
      const { error: xpError } = await supabase
        .from('xp_events')
        .insert({
          user_id: user.userId,
          org_id: assignment.org_id,
          team_id: assignment.team_id,
          event_type: 'quiz_completion',
          xp_amount: xpEarned,
          description: `Completed quiz: ${assignment.title}`,
          metadata: {
            quizAssignmentId: assignment.id,
            attemptId: attemptId,
            score: scorePercentage,
            passed: passed,
          },
        });

      if (xpError) {
        console.warn('Failed to create XP event:', xpError);
        // Don't fail the request if XP creation fails
      }
    }

    // Update spaced repetition progress for each flashcard
    for (const answer of gradedAnswers) {
      await updateFlashcardProgress(
        supabase,
        user.userId,
        answer.flashcard_id,
        answer.is_correct
      );
    }

    console.log(`✅ Quiz attempt ${attemptId} submitted: ${scorePercentage}% (${passed ? 'PASSED' : 'FAILED'})`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId,
        scorePercentage,
        passed,
        correctAnswers: correctCount,
        totalQuestions,
        timeTakenSeconds,
        xpEarned,
        message: passed ? 'Congratulations! You passed!' : 'Keep practicing!',
        results: gradedAnswers.map(a => ({
          flashcardId: a.flashcard_id,
          isCorrect: a.is_correct,
          userAnswer: a.user_answer,
        })),
      }),
    };
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return formatErrorResponse(error);
  }
});

/**
 * Update flashcard progress using spaced repetition algorithm (SM-2)
 */
async function updateFlashcardProgress(
  supabase: any,
  userId: string,
  flashcardId: string,
  wasCorrect: boolean
): Promise<void> {
  try {
    // Fetch or create progress record
    const { data: progress } = await supabase
      .from('player_flashcard_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('flashcard_id', flashcardId)
      .single();

    if (!progress) {
      // Create new progress record
      await supabase
        .from('player_flashcard_progress')
        .insert({
          user_id: userId,
          flashcard_id: flashcardId,
          ease_factor: wasCorrect ? 2.6 : 2.5,
          interval_days: wasCorrect ? 1 : 0,
          due_date: wasCorrect
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          times_shown: 1,
          times_correct: wasCorrect ? 1 : 0,
          last_reviewed_at: new Date().toISOString(),
        });
    } else {
      // Update existing progress using SM-2 algorithm
      let newEaseFactor = progress.ease_factor;
      let newInterval = progress.interval_days;

      if (wasCorrect) {
        // Increase ease factor slightly
        newEaseFactor = Math.min(2.8, progress.ease_factor + 0.1);
        // Double the interval
        newInterval = progress.interval_days === 0 ? 1 : progress.interval_days * 2;
      } else {
        // Decrease ease factor
        newEaseFactor = Math.max(1.3, progress.ease_factor - 0.2);
        // Reset interval
        newInterval = 0;
      }

      const newDueDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      await supabase
        .from('player_flashcard_progress')
        .update({
          ease_factor: newEaseFactor,
          interval_days: newInterval,
          due_date: newDueDate,
          times_shown: progress.times_shown + 1,
          times_correct: progress.times_correct + (wasCorrect ? 1 : 0),
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('flashcard_id', flashcardId);
    }
  } catch (error) {
    console.error('Failed to update flashcard progress:', error);
    // Don't throw - this is a non-critical operation
  }
}

export { handler };
