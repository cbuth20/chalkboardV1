// ═══════════════════════════════════════════════════════════════════════════════════════════
// POST /api/games/session/submit-attempt
// 
// Submits a single answer attempt within an active game session.
// Returns whether the answer was correct and updates running score.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { ScoringEngine } from '@/lib/games/scoring';
import type {
  DifficultyLevel,
  GameAttempt,
  SubmitAttemptPayload,
  SubmitAttemptResponse,
} from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// IN-MEMORY SESSION STATE (Mock - in production use database)
// ───────────────────────────────────────────────────────────────────────────────────────────

// This would be stored in database in production
const sessionState = new Map<string, {
  currentQuestion: number;
  totalQuestions: number;
  currentScore: number;
  correctCount: number;
  currentStreak: number;
  longestStreak: number;
  difficulty: DifficultyLevel;
  attempts: GameAttempt[];
}>();

// Mock question answers (in production, fetched from DB)
const questionAnswers = new Map<string, { correctId: string; explanation: string }>();

// ───────────────────────────────────────────────────────────────────────────────────────────
// REQUEST HANDLER
// ───────────────────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SubmitAttemptPayload;
    
    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    
    if (!body.session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    if (!body.question_id) {
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      );
    }

    if (body.time_taken_ms === undefined || body.time_taken_ms < 0) {
      return NextResponse.json(
        { error: 'time_taken_ms is required and must be non-negative' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: { user } } = await supabase.auth.getUser();
    // Verify session belongs to user
    
    // ─────────────────────────────────────────────────────────────────────────
    // GET SESSION STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    // Initialize mock state if not exists
    if (!sessionState.has(body.session_id)) {
      sessionState.set(body.session_id, {
        currentQuestion: 0,
        totalQuestions: 25,
        currentScore: 0,
        correctCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        difficulty: 'medium',
        attempts: [],
      });
    }

    const state = sessionState.get(body.session_id)!;
    
    // In production, fetch from database:
    // const { data: session } = await supabase
    //   .from('game_sessions')
    //   .select('*')
    //   .eq('id', body.session_id)
    //   .eq('status', 'in_progress')
    //   .single();
    // if (!session) return NextResponse.json({ error: 'Session not found or already finished' }, { status: 404 });

    // ─────────────────────────────────────────────────────────────────────────
    // GET CORRECT ANSWER
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: question } = await supabase
    //   .from('questions')
    //   .select('correct_answer_id, explanation')
    //   .eq('id', body.question_id)
    //   .single();
    
    // Mock: Generate a "correct" answer based on question ID
    if (!questionAnswers.has(body.question_id)) {
      // Randomly assign a correct answer for mock purposes
      const correctIndex = Math.floor(Math.random() * 4);
      questionAnswers.set(body.question_id, {
        correctId: `opt-${correctIndex}`,
        explanation: 'This is the correct answer because of the defensive alignment and personnel grouping.',
      });
    }

    const answer = questionAnswers.get(body.question_id)!;
    const isCorrect = body.selected_answer_id === answer.correctId;

    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE SCORE
    // ─────────────────────────────────────────────────────────────────────────
    
    const scoreResult = ScoringEngine.calculateAttemptScore({
      isCorrect,
      timeTakenMs: body.time_taken_ms,
      difficulty: state.difficulty,
      currentStreak: state.currentStreak,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE ATTEMPT RECORD
    // ─────────────────────────────────────────────────────────────────────────
    
    const now = new Date().toISOString();
    const attempt: GameAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      session_id: body.session_id,
      question_id: body.question_id,
      attempt_number: state.currentQuestion + 1,
      selected_answer_id: body.selected_answer_id,
      is_correct: isCorrect,
      time_taken_ms: body.time_taken_ms,
      started_at: new Date(Date.now() - body.time_taken_ms).toISOString(),
      answered_at: now,
      base_points: scoreResult.basePoints,
      time_bonus: scoreResult.timeBonus,
      streak_multiplier: scoreResult.streakMultiplier,
      total_points: scoreResult.totalPoints,
      current_streak: scoreResult.newStreak,
      created_at: now,
      user_id: null, // Set from session in production
      difficulty: state.difficulty,
      concept_key: `GAME_CONCEPT_${state.currentQuestion}`,
      metadata: {
        concept_key: `GAME_CONCEPT_${state.currentQuestion}`,
        concept_family: 'situation' as const,
        difficulty: state.difficulty,
        question_category: 'situational' as const,
      },
    };

    // In production, insert into database:
    // await supabase.from('game_attempts').insert(attempt);

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE SESSION STATE
    // ─────────────────────────────────────────────────────────────────────────
    
    state.currentQuestion++;
    state.currentScore += scoreResult.totalPoints;
    state.currentStreak = scoreResult.newStreak;
    state.longestStreak = Math.max(state.longestStreak, scoreResult.newStreak);
    if (isCorrect) state.correctCount++;
    state.attempts.push(attempt);

    // In production, update session:
    // await supabase
    //   .from('game_sessions')
    //   .update({
    //     total_questions: state.currentQuestion,
    //     correct_answers: state.correctCount,
    //     incorrect_answers: state.currentQuestion - state.correctCount,
    //     raw_score: state.currentScore,
    //     longest_streak: state.longestStreak,
    //   })
    //   .eq('id', body.session_id);

    // Update question stats
    // await supabase
    //   .from('questions')
    //   .update({
    //     times_shown: question.times_shown + 1,
    //     times_correct: isCorrect ? question.times_correct + 1 : question.times_correct,
    //   })
    //   .eq('id', body.question_id);

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────────
    
    const response: SubmitAttemptResponse = {
      attempt,
      is_correct: isCorrect,
      correct_answer_id: answer.correctId,
      explanation: answer.explanation,
      points_earned: scoreResult.totalPoints,
      current_streak: scoreResult.newStreak,
      session_progress: {
        current_question: state.currentQuestion,
        total_questions: state.totalQuestions,
        current_score: state.currentScore,
        accuracy: state.currentQuestion > 0 
          ? Math.round((state.correctCount / state.currentQuestion) * 100)
          : 0,
      },
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








