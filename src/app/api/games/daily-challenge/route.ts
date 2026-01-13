// ═══════════════════════════════════════════════════════════════════════════════════════════
// GET /api/games/daily-challenge
// 
// Returns the current day's challenge and user's completion status.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import type {
  DailyChallenge,
  DailyChallengeCompletion,
  DailyChallengeResponse,
} from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// REQUEST HANDLER
// ───────────────────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mockUserId = 'user-demo-123';

    // ─────────────────────────────────────────────────────────────────────────
    // GET TODAY'S DATE
    // ─────────────────────────────────────────────────────────────────────────
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Calculate expiry (end of day in user's timezone)
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const timeRemainingSeconds = Math.max(
      0,
      Math.floor((endOfDay.getTime() - Date.now()) / 1000)
    );

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH DAILY CHALLENGE (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: challenge } = await supabase
    //   .from('daily_challenges')
    //   .select('*')
    //   .eq('available_date', todayStr)
    //   .or(`team_id.is.null,team_id.eq.${teamId}`)
    //   .order('team_id', { ascending: false }) // Prefer team-specific challenge
    //   .limit(1)
    //   .single();

    // Mock challenge - rotate through different challenges based on day of week
    const dayOfWeek = today.getDay();
    const challenges = [
      {
        title: 'COVERAGE GAUNTLET',
        description: 'Identify 15 coverage schemes in under 3 minutes. No mistakes allowed.',
        game_type: 'coverage_recognition' as const,
        question_count: 15,
        time_limit_seconds: 180,
        max_mistakes: 0,
        xp_reward: 500,
      },
      {
        title: 'BLITZ MASTER',
        description: 'Call 12 perfect protections against exotic blitzes.',
        game_type: 'blitz_id' as const,
        question_count: 12,
        time_limit_seconds: 240,
        max_mistakes: 2,
        xp_reward: 450,
      },
      {
        title: 'ROUTE RUNNER',
        description: 'Identify 20 route concepts at lightning speed.',
        game_type: 'route_matching' as const,
        question_count: 20,
        time_limit_seconds: 200,
        max_mistakes: 3,
        xp_reward: 400,
      },
      {
        title: 'FORMATION RECALL',
        description: 'Memorize and recreate 10 complex formations.',
        game_type: 'formation_memory' as const,
        question_count: 10,
        time_limit_seconds: 300,
        max_mistakes: 1,
        xp_reward: 550,
      },
      {
        title: 'KNOW YOUR JOB',
        description: 'Perfect assignment knowledge - 15 plays, zero errors.',
        game_type: 'play_responsibility' as const,
        question_count: 15,
        time_limit_seconds: 250,
        max_mistakes: 0,
        xp_reward: 500,
      },
      {
        title: 'RED ZONE PRECISION',
        description: 'Make the right call 12 times inside the 20.',
        game_type: 'red_zone_scenarios' as const,
        question_count: 12,
        time_limit_seconds: 200,
        max_mistakes: 2,
        xp_reward: 475,
      },
      {
        title: 'CLOCK COMMANDER',
        description: '8 critical two-minute decisions. Every second counts.',
        game_type: 'two_minute_drill' as const,
        question_count: 8,
        time_limit_seconds: 360,
        max_mistakes: 1,
        xp_reward: 600,
      },
    ];

    const todaysChallenge = challenges[dayOfWeek];

    const mockChallenge: DailyChallenge = {
      id: `challenge-${todayStr}`,
      title: todaysChallenge.title,
      description: todaysChallenge.description,
      game_type: todaysChallenge.game_type,
      difficulty: 'expert',
      question_count: todaysChallenge.question_count,
      time_limit_seconds: todaysChallenge.time_limit_seconds,
      required_accuracy: todaysChallenge.max_mistakes === 0 ? 100 : null,
      max_mistakes: todaysChallenge.max_mistakes,
      xp_reward: todaysChallenge.xp_reward,
      bonus_xp_for_perfect: 250,
      available_date: todayStr,
      team_id: teamId,
      created_at: today.toISOString(),
    };

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK USER COMPLETION (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: completion } = await supabase
    //   .from('daily_challenge_completions')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .eq('challenge_id', challenge.id)
    //   .single();

    // Mock: User hasn't completed today's challenge yet
    const mockCompletion: DailyChallengeCompletion | null = null;
    // If completed, would look like:
    // {
    //   id: 'completion-123',
    //   user_id: mockUserId,
    //   challenge_id: mockChallenge.id,
    //   session_id: 'session-456',
    //   completed_at: new Date().toISOString(),
    //   was_successful: true,
    //   was_perfect: false,
    //   xp_earned: 500,
    // };

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────────
    
    const response: DailyChallengeResponse = {
      challenge: mockChallenge,
      user_completion: mockCompletion,
      expires_at: endOfDay.toISOString(),
      time_remaining_seconds: timeRemainingSeconds,
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// POST /api/games/daily-challenge
// 
// Records a daily challenge completion.
// ═══════════════════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { challenge_id, session_id, was_successful, was_perfect, score, accuracy } = body;

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    
    if (!challenge_id || !session_id) {
      return NextResponse.json(
        { error: 'challenge_id and session_id are required' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    const mockUserId = 'user-demo-123';

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH CHALLENGE (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production, verify challenge exists and hasn't been completed
    const challengeXP = was_successful ? (was_perfect ? 750 : 500) : 0;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE COMPLETION RECORD (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    const completion: DailyChallengeCompletion = {
      id: `completion-${Date.now()}`,
      user_id: mockUserId,
      challenge_id,
      session_id,
      completed_at: new Date().toISOString(),
      was_successful,
      was_perfect: was_perfect || false,
      xp_earned: challengeXP,
    };

    // In production:
    // await supabase.from('daily_challenge_completions').insert(completion);

    return NextResponse.json({
      success: true,
      completion,
      xp_earned: challengeXP,
      message: was_perfect 
        ? '🏆 Perfect! You crushed the daily challenge!' 
        : was_successful 
          ? '✅ Daily challenge completed!'
          : '❌ Challenge failed. Try again tomorrow!',
    });
    
  } catch (error) {
    console.error('Error completing daily challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








