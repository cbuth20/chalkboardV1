// ═══════════════════════════════════════════════════════════════════════════════════════════
// GET /api/games/summary
// 
// Returns comprehensive stats and summary for the current user's games.
// Includes level progress, streaks, per-game stats, and recent activity.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { ScoringEngine } from '@/lib/games/scoring';
import type {
  GameType,
  PlayerSummary,
  UserTeamStats,
  User,
  UserStreak,
  GameSession,
} from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// REQUEST HANDLER
// ───────────────────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');

    if (!teamId) {
      return NextResponse.json(
        { error: 'team_id query parameter is required' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mockUserId = 'user-demo-123';

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH USER DATA (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: user } = await supabase
    //   .from('users')
    //   .select('*')
    //   .eq('id', mockUserId)
    //   .single();

    const mockUser: User = {
      id: mockUserId,
      auth_id: 'auth-123',
      email: 'demetric@chalkboard.io',
      first_name: 'Demetric',
      last_name: 'Felton',
      display_name: null,
      avatar_url: null,
      jersey_number: 25,
      total_xp: 8750,
      current_level: 24,
      football_iq_rating: 142.5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH TEAM STATS (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: teamStats } = await supabase
    //   .from('user_team_stats')
    //   .select('*')
    //   .eq('user_id', mockUserId)
    //   .eq('team_id', teamId)
    //   .single();

    const mockTeamStats: UserTeamStats = {
      user_id: mockUserId,
      team_id: teamId,
      first_name: 'Demetric',
      last_name: 'Felton',
      display_name: null,
      avatar_url: null,
      position: 'WR',
      position_group: 'WR Room',
      role: 'player',
      current_level: 24,
      team_xp: 8750,
      current_streak: 7,
      longest_streak: 14,
      total_games: 156,
      avg_accuracy: 94.2,
      total_score: 28500,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH STREAK (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    const mockStreak: UserStreak = {
      id: 'streak-123',
      user_id: mockUserId,
      team_id: teamId,
      current_streak: 7,
      longest_streak: 14,
      last_play_date: new Date().toISOString().split('T')[0],
      streak_start_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      freeze_tokens: 2,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH RECENT SESSIONS (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: recentSessions } = await supabase
    //   .from('game_sessions')
    //   .select('*')
    //   .eq('user_id', mockUserId)
    //   .eq('team_id', teamId)
    //   .eq('status', 'completed')
    //   .order('finished_at', { ascending: false })
    //   .limit(10);

    const mockRecentSessions: GameSession[] = [
      {
        id: 'session-1',
        user_id: mockUserId,
        team_id: teamId,
        game_id: 'game-coverage_recognition',
        mode: 'train',
        difficulty: 'medium',
        question_count: 25,
        time_limit_seconds: null,
        status: 'completed',
        started_at: new Date(Date.now() - 3600000).toISOString(),
        finished_at: new Date(Date.now() - 3300000).toISOString(),
        total_questions: 25,
        correct_answers: 23,
        incorrect_answers: 2,
        skipped_answers: 0,
        raw_score: 2750,
        time_bonus: 100,
        streak_bonus: 80,
        difficulty_multiplier: 1.5,
        final_score: 4225,
        total_time_seconds: 300,
        accuracy: 92,
        avg_response_time_ms: 12000,
        longest_streak: 10,
        xp_earned: 475,
        client_version: '1.0.0',
        is_valid: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'session-2',
        user_id: mockUserId,
        team_id: teamId,
        game_id: 'game-blitz_id',
        mode: 'compete',
        difficulty: 'hard',
        question_count: 20,
        time_limit_seconds: null,
        status: 'completed',
        started_at: new Date(Date.now() - 7200000).toISOString(),
        finished_at: new Date(Date.now() - 6900000).toISOString(),
        total_questions: 20,
        correct_answers: 18,
        incorrect_answers: 2,
        skipped_answers: 0,
        raw_score: 3200,
        time_bonus: 150,
        streak_bonus: 120,
        difficulty_multiplier: 2.0,
        final_score: 6940,
        total_time_seconds: 300,
        accuracy: 90,
        avg_response_time_ms: 15000,
        longest_streak: 7,
        xp_earned: 750,
        client_version: '1.0.0',
        is_valid: true,
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE LEVEL PROGRESS
    // ─────────────────────────────────────────────────────────────────────────
    
    const levelProgress = ScoringEngine.calculateLevelFromXP(mockUser.total_xp);

    // ─────────────────────────────────────────────────────────────────────────
    // AGGREGATE PER-GAME STATS (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: gameStats } = await supabase
    //   .from('game_sessions')
    //   .select('game_id, final_score, accuracy, longest_streak')
    //   .eq('user_id', mockUserId)
    //   .eq('team_id', teamId)
    //   .eq('status', 'completed');
    // Then aggregate by game_id

    const gameTypes: GameType[] = [
      'coverage_recognition',
      'blitz_id',
      'route_matching',
      'formation_memory',
      'play_responsibility',
      'red_zone_scenarios',
      'two_minute_drill',
      'film_reaction',
    ];

    const mockGameStats = gameTypes.map(gameType => ({
      game_type: gameType,
      games_played: Math.floor(Math.random() * 30) + 5,
      best_score: Math.floor(Math.random() * 5000) + 3000,
      avg_accuracy: Math.floor(Math.random() * 20) + 75,
      best_streak: Math.floor(Math.random() * 12) + 3,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────────
    
    const response: PlayerSummary = {
      user: mockUser,
      team_stats: mockTeamStats,
      streak: mockStreak,
      recent_sessions: mockRecentSessions,
      level_progress: {
        current_level: levelProgress.level,
        current_xp: mockUser.total_xp,
        xp_for_level: levelProgress.xpRequiredForLevel,
        xp_to_next: levelProgress.xpToNextLevel,
        progress_percent: levelProgress.progressPercent,
      },
      game_stats: mockGameStats,
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching player summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








