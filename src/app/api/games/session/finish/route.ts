// ═══════════════════════════════════════════════════════════════════════════════════════════
// POST /api/games/session/finish
// 
// Completes a game session, calculates final score and XP, updates user stats.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { ScoringEngine } from '@/lib/games/scoring';
import type {
  GameSession,
  XPEvent,
  FinishSessionPayload,
  FinishSessionResponse,
} from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// REQUEST HANDLER
// ───────────────────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as FinishSessionPayload;
    
    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    
    if (!body.session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION & FETCH SESSION (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: { user } } = await supabase.auth.getUser();
    // const { data: session } = await supabase
    //   .from('game_sessions')
    //   .select('*, game_attempts(*)')
    //   .eq('id', body.session_id)
    //   .eq('user_id', user.id)
    //   .eq('status', 'in_progress')
    //   .single();

    // Mock session data
    const mockSession = {
      id: body.session_id,
      user_id: 'user-demo-123',
      team_id: 'team-browns-123',
      game_id: 'game-coverage_recognition',
      mode: 'train' as const,
      difficulty: 'medium' as const,
      question_count: 25,
      started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      total_questions: 25,
      correct_answers: 22,
      incorrect_answers: 3,
      skipped_answers: 0,
      raw_score: 2850,
      longest_streak: 8,
      difficulty_multiplier: 1.5,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATE SESSION INTEGRITY
    // ─────────────────────────────────────────────────────────────────────────
    
    const startTime = new Date(mockSession.started_at).getTime();
    const totalTimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = mockSession.total_questions > 0
      ? (mockSession.correct_answers / mockSession.total_questions) * 100
      : 0;
    const avgResponseTimeMs = mockSession.total_questions > 0
      ? Math.floor((totalTimeSeconds * 1000) / mockSession.total_questions)
      : 0;

    // Anti-cheat validation
    const validation = ScoringEngine.validateSession(
      {
        totalTimeSeconds,
        accuracy,
        avgResponseTimeMs,
        correctAnswers: mockSession.correct_answers,
        totalQuestions: mockSession.total_questions,
      },
      [] // Would include actual attempts in production
    );

    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE FINAL SCORE
    // ─────────────────────────────────────────────────────────────────────────
    
    const finalScore = Math.round(mockSession.raw_score * mockSession.difficulty_multiplier);
    const timeBonus = totalTimeSeconds < 180 ? 100 : 0; // Bonus for finishing under 3 minutes
    const streakBonus = mockSession.longest_streak >= 5 ? mockSession.longest_streak * 10 : 0;

    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE XP
    // ─────────────────────────────────────────────────────────────────────────
    
    // Check if first play today (mock - always true for demo)
    const isFirstPlayToday = true;
    
    // Get user's current streak (mock)
    const currentDailyStreak = 7;

    const xpResult = ScoringEngine.calculateSessionXP(
      {
        finalScore: finalScore + timeBonus + streakBonus,
        accuracy,
        correctAnswers: mockSession.correct_answers,
        totalQuestions: mockSession.total_questions,
        mode: mockSession.mode,
      },
      {
        isFirstPlayToday,
        dailyStreakDays: currentDailyStreak,
        isDailyChallenge: false,
      }
    );

    // Apply anti-cheat multiplier
    const adjustedXP = Math.round(xpResult.totalXP * validation.adjustedXPMultiplier);

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK FOR LEVEL UP
    // ─────────────────────────────────────────────────────────────────────────
    
    // Mock user's current XP
    const currentUserXP = 8750;
    const newTotalXP = currentUserXP + adjustedXP;
    const levelUpResult = ScoringEngine.checkLevelUp(currentUserXP, newTotalXP);

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE XP EVENTS
    // ─────────────────────────────────────────────────────────────────────────
    
    const now = new Date().toISOString();
    const xpEvents: XPEvent[] = xpResult.events.map((event, idx) => ({
      id: `xp-${Date.now()}-${idx}`,
      user_id: mockSession.user_id,
      team_id: mockSession.team_id,
      event_type: event.type,
      xp_amount: Math.round(event.amount * validation.adjustedXPMultiplier),
      session_id: body.session_id,
      game_type: 'coverage_recognition',
      description: event.description,
      metadata: null,
      created_at: now,
    }));

    // Add level up event if applicable
    if (levelUpResult) {
      xpEvents.push({
        id: `xp-${Date.now()}-levelup`,
        user_id: mockSession.user_id,
        team_id: mockSession.team_id,
        event_type: 'level_up',
        xp_amount: 0, // No additional XP for leveling up
        session_id: body.session_id,
        game_type: 'coverage_recognition',
        description: `Reached Level ${levelUpResult.newLevel}: ${levelUpResult.newTitle}!`,
        metadata: {
          previousLevel: levelUpResult.previousLevel,
          newLevel: levelUpResult.newLevel,
          title: levelUpResult.newTitle,
        },
        created_at: now,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE SESSION (Mock final state)
    // ─────────────────────────────────────────────────────────────────────────
    
    const completedSession: GameSession = {
      id: body.session_id,
      user_id: mockSession.user_id,
      team_id: mockSession.team_id,
      game_id: mockSession.game_id,
      mode: mockSession.mode,
      difficulty: mockSession.difficulty,
      question_count: mockSession.question_count,
      time_limit_seconds: null,
      status: 'completed',
      started_at: mockSession.started_at,
      finished_at: now,
      total_questions: mockSession.total_questions,
      correct_answers: mockSession.correct_answers,
      incorrect_answers: mockSession.incorrect_answers,
      skipped_answers: mockSession.skipped_answers,
      raw_score: mockSession.raw_score,
      time_bonus: timeBonus,
      streak_bonus: streakBonus,
      difficulty_multiplier: mockSession.difficulty_multiplier,
      final_score: finalScore + timeBonus + streakBonus,
      total_time_seconds: totalTimeSeconds,
      accuracy,
      avg_response_time_ms: avgResponseTimeMs,
      longest_streak: mockSession.longest_streak,
      xp_earned: adjustedXP,
      client_version: '1.0.0',
      is_valid: validation.isValid,
      created_at: mockSession.started_at,
    };

    // In production, update database:
    // await supabase.from('game_sessions').update(completedSession).eq('id', body.session_id);
    // await supabase.from('xp_events').insert(xpEvents);
    // User XP is updated via trigger

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE STREAK (via trigger in production)
    // ─────────────────────────────────────────────────────────────────────────
    
    const newStreak = currentDailyStreak + 1;

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────────
    
    const response: FinishSessionResponse = {
      session: completedSession,
      xp_events: xpEvents,
      level_up: levelUpResult !== null,
      new_level: levelUpResult?.newLevel || null,
      streak_updated: isFirstPlayToday,
      new_streak: newStreak,
      achievements_unlocked: [], // Would check achievement conditions
    };

    // Log validation flags for monitoring
    if (validation.flags.length > 0) {
      console.warn(`Session ${body.session_id} flagged:`, validation.flags);
    }

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error finishing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








