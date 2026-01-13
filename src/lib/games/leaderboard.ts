// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — LEADERBOARD ENGINE
// 
// Handles ranking, leaderboard computation, caching, and seasonal resets.
// Designed for performance with indexed queries and materialized snapshots.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import type {
  LeaderboardEntry,
  LeaderboardScope,
  TimeWindow,
  LeaderboardSnapshot,
  FootballPosition,
} from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ───────────────────────────────────────────────────────────────────────────────────────────

export const LEADERBOARD_CONFIG = {
  /** Maximum entries to return per request */
  MAX_ENTRIES_PER_REQUEST: 100,
  
  /** Default entries to return */
  DEFAULT_ENTRIES: 25,
  
  /** How often to refresh cached leaderboards (ms) */
  CACHE_TTL_MS: {
    daily: 5 * 60 * 1000,      // 5 minutes
    weekly: 15 * 60 * 1000,    // 15 minutes
    season: 60 * 60 * 1000,    // 1 hour
    all_time: 6 * 60 * 60 * 1000, // 6 hours
  },
  
  /** Minimum games required to appear on leaderboard */
  MIN_GAMES_FOR_RANKING: 3,
  
  /** Position groups for position room leaderboards */
  POSITION_GROUPS: {
    'QB Room': ['QB'],
    'RB Room': ['RB', 'FB'],
    'WR Room': ['WR'],
    'TE Room': ['TE'],
    'O-Line': ['OT', 'OG', 'C'],
    'D-Line': ['DE', 'DT', 'NT'],
    'Linebackers': ['OLB', 'ILB', 'MLB'],
    'Secondary': ['CB', 'FS', 'SS'],
    'Special Teams': ['K', 'P', 'LS'],
  } as Record<string, FootballPosition[]>,
};

// ───────────────────────────────────────────────────────────────────────────────────────────
// TIME WINDOW UTILITIES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Get the start and end timestamps for a given time window
 */
export function getTimeWindowBounds(
  window: TimeWindow,
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);
  
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  switch (window) {
    case 'daily':
      // Today only
      return { start, end };

    case 'weekly':
      // Start of current week (Sunday)
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      // End is coming Saturday
      end.setDate(start.getDate() + 6);
      return { start, end };

    case 'season':
      // Assume season is the current calendar year
      // Can be customized per team
      start.setMonth(0, 1); // January 1
      end.setMonth(11, 31); // December 31
      return { start, end };

    case 'all_time':
      // From the beginning
      start.setFullYear(2020, 0, 1);
      end.setFullYear(2099, 11, 31);
      return { start, end };

    default:
      return { start, end };
  }
}

/**
 * Get the season identifier from a date
 */
export function getSeasonFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Football season spans calendar years (Aug - Feb)
  // Convention: Use the starting year (e.g., "2024" for Aug 2024 - Feb 2025)
  if (month >= 7) { // August onwards
    return `${year}`;
  } else { // Before August (Jan - July)
    return `${year - 1}`;
  }
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// RANKING ALGORITHMS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Ranking criteria with weights for tie-breaking
 * 
 * Primary: XP earned in time window
 * Secondary: Accuracy
 * Tertiary: Games played
 * Quaternary: Current streak
 */
export interface RankingCriteria {
  userId: string;
  xp: number;
  accuracy: number;
  gamesPlayed: number;
  streak: number;
  // Metadata for display
  displayName?: string;
  avatarUrl?: string;
  position?: FootballPosition;
}

/**
 * Compare two entries for ranking purposes
 * Returns negative if a should rank higher, positive if b should rank higher
 */
export function compareForRanking(a: RankingCriteria, b: RankingCriteria): number {
  // Primary: XP (higher is better)
  if (a.xp !== b.xp) {
    return b.xp - a.xp;
  }
  
  // Secondary: Accuracy (higher is better)
  if (a.accuracy !== b.accuracy) {
    return b.accuracy - a.accuracy;
  }
  
  // Tertiary: Games played (more is better, shows dedication)
  if (a.gamesPlayed !== b.gamesPlayed) {
    return b.gamesPlayed - a.gamesPlayed;
  }
  
  // Quaternary: Current streak (higher is better)
  return b.streak - a.streak;
}

/**
 * Assign ranks to a sorted array of entries
 * Handles ties (same rank for identical scores)
 */
export function assignRanks(entries: RankingCriteria[]): LeaderboardEntry[] {
  const ranked: LeaderboardEntry[] = [];
  let currentRank = 1;
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    // Check if this entry ties with the previous one
    if (i > 0 && compareForRanking(entries[i - 1], entry) === 0) {
      // Same rank as previous
      ranked.push({
        user_id: entry.userId,
        rank: ranked[i - 1].rank, // Same rank
        xp: entry.xp,
        games_played: entry.gamesPlayed,
        accuracy: entry.accuracy,
        streak: entry.streak,
        display_name: entry.displayName,
        avatar_url: entry.avatarUrl,
        position: entry.position,
      });
    } else {
      // New rank (accounts for ties - if ranks 1,1,3 not 1,1,2)
      ranked.push({
        user_id: entry.userId,
        rank: currentRank,
        xp: entry.xp,
        games_played: entry.gamesPlayed,
        accuracy: entry.accuracy,
        streak: entry.streak,
        display_name: entry.displayName,
        avatar_url: entry.avatarUrl,
        position: entry.position,
      });
    }
    currentRank++;
  }
  
  return ranked;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// LEADERBOARD COMPUTATION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * SQL query builder for leaderboard computation
 * 
 * This generates the SQL needed to compute a leaderboard.
 * In production, this would be executed against Supabase/Postgres.
 */
export function buildLeaderboardQuery(params: {
  teamId?: string;
  positionGroup?: string;
  timeWindow: TimeWindow;
  season?: string;
  limit?: number;
  offset?: number;
}): {
  query: string;
  params: unknown[];
} {
  const { start, end } = getTimeWindowBounds(params.timeWindow);
  const limit = Math.min(
    params.limit || LEADERBOARD_CONFIG.DEFAULT_ENTRIES,
    LEADERBOARD_CONFIG.MAX_ENTRIES_PER_REQUEST
  );
  const offset = params.offset || 0;

  // Get position filter if position group specified
  const positions = params.positionGroup 
    ? LEADERBOARD_CONFIG.POSITION_GROUPS[params.positionGroup] || []
    : [];

  let query = `
    WITH ranked_users AS (
      SELECT 
        u.id as user_id,
        COALESCE(u.display_name, u.first_name || ' ' || u.last_name) as display_name,
        u.avatar_url,
        tm.position,
        tm.position_group,
        COALESCE(SUM(xe.xp_amount), 0) as xp,
        COUNT(DISTINCT gs.id) as games_played,
        COALESCE(AVG(gs.accuracy), 0) as accuracy,
        COALESCE(us.current_streak, 0) as streak
      FROM users u
      JOIN team_members tm ON tm.user_id = u.id
      LEFT JOIN xp_events xe ON xe.user_id = u.id 
        AND xe.team_id = tm.team_id
        AND xe.created_at >= $1
        AND xe.created_at <= $2
      LEFT JOIN game_sessions gs ON gs.user_id = u.id 
        AND gs.team_id = tm.team_id
        AND gs.status = 'completed'
        AND gs.started_at >= $1
        AND gs.started_at <= $2
      LEFT JOIN user_streaks us ON us.user_id = u.id AND us.team_id = tm.team_id
      WHERE tm.is_active = TRUE
  `;

  const queryParams: unknown[] = [start.toISOString(), end.toISOString()];
  let paramIndex = 3;

  // Team filter
  if (params.teamId) {
    query += ` AND tm.team_id = $${paramIndex}`;
    queryParams.push(params.teamId);
    paramIndex++;
  }

  // Position group filter
  if (positions.length > 0) {
    query += ` AND tm.position = ANY($${paramIndex})`;
    queryParams.push(positions);
    paramIndex++;
  }

  query += `
      GROUP BY u.id, u.display_name, u.first_name, u.last_name, u.avatar_url, 
               tm.position, tm.position_group, us.current_streak
      HAVING COUNT(DISTINCT gs.id) >= $${paramIndex}
    )
    SELECT 
      *,
      RANK() OVER (ORDER BY xp DESC, accuracy DESC, games_played DESC, streak DESC) as rank
    FROM ranked_users
    ORDER BY rank
    LIMIT $${paramIndex + 1}
    OFFSET $${paramIndex + 2}
  `;
  
  queryParams.push(LEADERBOARD_CONFIG.MIN_GAMES_FOR_RANKING);
  queryParams.push(limit);
  queryParams.push(offset);

  return { query, params: queryParams };
}

/**
 * Build query to find a specific user's rank
 */
export function buildUserRankQuery(params: {
  userId: string;
  teamId?: string;
  positionGroup?: string;
  timeWindow: TimeWindow;
}): {
  query: string;
  params: unknown[];
} {
  const { start, end } = getTimeWindowBounds(params.timeWindow);
  const positions = params.positionGroup 
    ? LEADERBOARD_CONFIG.POSITION_GROUPS[params.positionGroup] || []
    : [];

  let query = `
    WITH user_stats AS (
      SELECT 
        COALESCE(SUM(xe.xp_amount), 0) as xp,
        COUNT(DISTINCT gs.id) as games_played,
        COALESCE(AVG(gs.accuracy), 0) as accuracy,
        COALESCE(us.current_streak, 0) as streak
      FROM users u
      JOIN team_members tm ON tm.user_id = u.id
      LEFT JOIN xp_events xe ON xe.user_id = u.id 
        AND xe.team_id = tm.team_id
        AND xe.created_at >= $1
        AND xe.created_at <= $2
      LEFT JOIN game_sessions gs ON gs.user_id = u.id 
        AND gs.team_id = tm.team_id
        AND gs.status = 'completed'
        AND gs.started_at >= $1
        AND gs.started_at <= $2
      LEFT JOIN user_streaks us ON us.user_id = u.id AND us.team_id = tm.team_id
      WHERE u.id = $3
  `;

  const queryParams: unknown[] = [start.toISOString(), end.toISOString(), params.userId];
  let paramIndex = 4;

  if (params.teamId) {
    query += ` AND tm.team_id = $${paramIndex}`;
    queryParams.push(params.teamId);
    paramIndex++;
  }

  if (positions.length > 0) {
    query += ` AND tm.position = ANY($${paramIndex})`;
    queryParams.push(positions);
    paramIndex++;
  }

  query += `
      GROUP BY us.current_streak
    ),
    rank_count AS (
      SELECT COUNT(*) as rank
      FROM users u
      JOIN team_members tm ON tm.user_id = u.id
      LEFT JOIN xp_events xe ON xe.user_id = u.id 
        AND xe.team_id = tm.team_id
        AND xe.created_at >= $1
        AND xe.created_at <= $2
      LEFT JOIN game_sessions gs ON gs.user_id = u.id 
        AND gs.team_id = tm.team_id
        AND gs.status = 'completed'
        AND gs.started_at >= $1
        AND gs.started_at <= $2
      WHERE tm.is_active = TRUE
  `;

  // Re-add team filter for count
  if (params.teamId) {
    query += ` AND tm.team_id = $${paramIndex - (positions.length > 0 ? 2 : 1)}`;
  }

  if (positions.length > 0) {
    query += ` AND tm.position = ANY($${paramIndex - 1})`;
  }

  query += `
      GROUP BY u.id
      HAVING COALESCE(SUM(xe.xp_amount), 0) > (SELECT xp FROM user_stats)
         OR (COALESCE(SUM(xe.xp_amount), 0) = (SELECT xp FROM user_stats) 
             AND COALESCE(AVG(gs.accuracy), 0) > (SELECT accuracy FROM user_stats))
    )
    SELECT 
      (SELECT COUNT(*) FROM rank_count) + 1 as rank,
      (SELECT xp FROM user_stats) as xp,
      (SELECT games_played FROM user_stats) as games_played
  `;

  return { query, params: queryParams };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// CACHING & SNAPSHOTS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Check if a cached leaderboard snapshot is still valid
 */
export function isSnapshotValid(
  snapshot: LeaderboardSnapshot,
  timeWindow: TimeWindow
): boolean {
  const now = Date.now();
  const computedAt = new Date(snapshot.computed_at).getTime();
  const ttl = LEADERBOARD_CONFIG.CACHE_TTL_MS[timeWindow];
  
  return now - computedAt < ttl;
}

/**
 * Generate a cache key for a leaderboard configuration
 */
export function generateLeaderboardCacheKey(params: {
  teamId?: string;
  positionGroup?: string;
  timeWindow: TimeWindow;
}): string {
  const parts = [
    'leaderboard',
    params.teamId || 'global',
    params.positionGroup || 'all',
    params.timeWindow,
  ];
  
  const { start } = getTimeWindowBounds(params.timeWindow);
  parts.push(start.toISOString().split('T')[0]); // Date only
  
  return parts.join(':');
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// SEASONAL RESET
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Generate archive data for season end
 */
export function prepareSeasonArchive(params: {
  teamId: string;
  season: string;
  rankings: LeaderboardEntry[];
  totalGamesPlayed: number;
  totalXpEarned: number;
}): {
  team_id: string;
  season: string;
  final_rankings: LeaderboardEntry[];
  total_games_played: number;
  total_xp_earned: number;
  top_performers: {
    most_xp: LeaderboardEntry;
    highest_accuracy: LeaderboardEntry;
    most_games: LeaderboardEntry;
    longest_streak: LeaderboardEntry;
  };
  season_start: string;
  season_end: string;
} {
  const seasonYear = parseInt(params.season);
  const seasonStart = new Date(seasonYear, 7, 1); // August 1
  const seasonEnd = new Date(seasonYear + 1, 1, 28); // February 28

  // Find top performers
  const mostXP = [...params.rankings].sort((a, b) => b.xp - a.xp)[0];
  const highestAccuracy = [...params.rankings].sort((a, b) => b.accuracy - a.accuracy)[0];
  const mostGames = [...params.rankings].sort((a, b) => b.games_played - a.games_played)[0];
  const longestStreak = [...params.rankings].sort((a, b) => b.streak - a.streak)[0];

  return {
    team_id: params.teamId,
    season: params.season,
    final_rankings: params.rankings,
    total_games_played: params.totalGamesPlayed,
    total_xp_earned: params.totalXpEarned,
    top_performers: {
      most_xp: mostXP,
      highest_accuracy: highestAccuracy,
      most_games: mostGames,
      longest_streak: longestStreak,
    },
    season_start: seasonStart.toISOString(),
    season_end: seasonEnd.toISOString(),
  };
}

/**
 * SQL to create season archive (run at end of season)
 */
export function buildSeasonArchiveQuery(teamId: string, season: string): string {
  return `
    INSERT INTO season_archives (
      team_id,
      season,
      final_rankings,
      total_games_played,
      total_xp_earned,
      top_performers,
      position_leaders,
      season_start,
      season_end
    )
    SELECT 
      $1 as team_id,
      $2 as season,
      (
        -- Final rankings JSON
        SELECT jsonb_agg(
          jsonb_build_object(
            'user_id', user_id,
            'rank', rank,
            'xp', xp,
            'games_played', games_played,
            'accuracy', accuracy,
            'streak', streak
          )
        )
        FROM (
          SELECT 
            u.id as user_id,
            RANK() OVER (ORDER BY tm.team_xp DESC) as rank,
            tm.team_xp as xp,
            COUNT(DISTINCT gs.id) as games_played,
            COALESCE(AVG(gs.accuracy), 0) as accuracy,
            COALESCE(us.longest_streak, 0) as streak
          FROM team_members tm
          JOIN users u ON u.id = tm.user_id
          LEFT JOIN game_sessions gs ON gs.user_id = u.id AND gs.team_id = tm.team_id
          LEFT JOIN user_streaks us ON us.user_id = u.id AND us.team_id = tm.team_id
          WHERE tm.team_id = $1 AND tm.is_active = TRUE
          GROUP BY u.id, tm.team_xp, us.longest_streak
        ) ranked
      ) as final_rankings,
      (SELECT COUNT(*) FROM game_sessions WHERE team_id = $1 AND status = 'completed') as total_games_played,
      (SELECT COALESCE(SUM(xp_amount), 0) FROM xp_events WHERE team_id = $1) as total_xp_earned,
      NULL as top_performers,
      NULL as position_leaders,
      make_date($2::int, 8, 1) as season_start,
      make_date($2::int + 1, 2, 28) as season_end
    ON CONFLICT (team_id, season) DO NOTHING;
  `;
}

/**
 * SQL to reset team XP for new season (while preserving history)
 */
export function buildSeasonResetQuery(teamId: string): string {
  return `
    -- Archive current XP to season_archives first, then reset
    UPDATE team_members
    SET team_xp = 0
    WHERE team_id = $1;
    
    -- Reset streaks for new season
    UPDATE user_streaks
    SET 
      current_streak = 0,
      streak_start_date = NULL
    WHERE team_id = $1;
  `;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// ANTI-EXPLOIT MEASURES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Detect potential leaderboard manipulation
 * 
 * Signs of exploitation:
 * - Many very short sessions
 * - Playing significantly more than average
 * - Unusual patterns (playing at same time every day for exactly same duration)
 */
export function detectManipulation(userStats: {
  gamesThisPeriod: number;
  avgGameDuration: number;
  avgTeamGames: number;
  xpPerGame: number;
  avgTeamXpPerGame: number;
}): {
  isSuspicious: boolean;
  flags: string[];
  adjustmentFactor: number;
} {
  const flags: string[] = [];
  let adjustmentFactor = 1.0;

  // Playing 5x more games than team average is suspicious
  if (userStats.gamesThisPeriod > userStats.avgTeamGames * 5) {
    flags.push('Unusually high game count');
    adjustmentFactor *= 0.8; // 20% penalty
  }

  // Very short average game duration
  if (userStats.avgGameDuration < 30) {
    flags.push('Very short average game duration');
    adjustmentFactor *= 0.7; // 30% penalty
  }

  // XP per game significantly below average (grinding easy games)
  if (userStats.xpPerGame < userStats.avgTeamXpPerGame * 0.5) {
    flags.push('Low XP per game ratio');
    adjustmentFactor *= 0.9; // 10% penalty
  }

  return {
    isSuspicious: flags.length > 0,
    flags,
    adjustmentFactor,
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────────────────────────────────

export const LeaderboardEngine = {
  getTimeWindowBounds,
  getSeasonFromDate,
  compareForRanking,
  assignRanks,
  buildLeaderboardQuery,
  buildUserRankQuery,
  isSnapshotValid,
  generateLeaderboardCacheKey,
  prepareSeasonArchive,
  buildSeasonArchiveQuery,
  buildSeasonResetQuery,
  detectManipulation,
  LEADERBOARD_CONFIG,
};








