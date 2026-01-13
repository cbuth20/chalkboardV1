// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — COACH DASHBOARD API
// 
// GET /api/analytics/team/:teamId/dashboard
// 
// Returns comprehensive dashboard data for coaches including:
// - Top-line KPIs (this week vs last week)
// - Player rankings by Football IQ
// - IQ comparison chart data
// - Most improved player
// - Players at risk
// ═══════════════════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import type {
  CoachDashboardResponse,
  TeamKPIs,
  PlayerRankingSummary,
  MostImprovedPlayer,
  PlayerAtRisk,
  IQComparisonData,
  PositionRoomSummary,
} from '@/lib/analytics/types';

// ───────────────────────────────────────────────────────────────────────────────────────────
// MOCK DATA GENERATOR
// For demonstration - in production, this queries Supabase
// ───────────────────────────────────────────────────────────────────────────────────────────

function generateMockDashboardData(teamId: string): CoachDashboardResponse {
  // Generate mock KPIs
  const kpis: TeamKPIs = {
    thisWeek: {
      totalSessions: 187,
      totalXPEarned: 45230,
      averageAccuracy: 78.4,
      activePlayers: 42,
      averageFootballIQ: 72,
    },
    lastWeek: {
      totalSessions: 156,
      totalXPEarned: 38420,
      averageAccuracy: 74.2,
      activePlayers: 38,
      averageFootballIQ: 69,
    },
    deltas: {
      sessions: 31,
      sessionsPercent: 19.9,
      xp: 6810,
      xpPercent: 17.7,
      accuracy: 4.2,
      accuracyPercent: 5.7,
      activePlayers: 4,
      activePlayersPercent: 10.5,
      footballIQ: 3,
      footballIQPercent: 4.3,
    },
  };

  // Generate mock player rankings
  const playerRankings: PlayerRankingSummary[] = [
    {
      userId: 'p1',
      displayName: 'Marcus Williams',
      firstName: 'Marcus',
      lastName: 'Williams',
      avatarUrl: null,
      position: 'QB',
      positionGroup: 'QB Room',
      jerseyNumber: 7,
      footballIQ: 94,
      coverageIQ: 96,
      blitzIQ: 92,
      accuracy: 91.2,
      gamesThisWeek: 14,
      xpThisWeek: 4250,
      currentStreak: 12,
      level: 28,
      rank: 1,
      previousRank: 2,
      rankChange: 1,
      lastActiveAt: new Date().toISOString(),
      daysActiveLast14: 12,
    },
    {
      userId: 'p2',
      displayName: 'Demetric Felton',
      firstName: 'Demetric',
      lastName: 'Felton',
      avatarUrl: null,
      position: 'WR',
      positionGroup: 'WR Room',
      jerseyNumber: 25,
      footballIQ: 91,
      coverageIQ: 88,
      blitzIQ: 79,
      accuracy: 89.5,
      gamesThisWeek: 18,
      xpThisWeek: 3890,
      currentStreak: 7,
      level: 24,
      rank: 2,
      previousRank: 1,
      rankChange: -1,
      lastActiveAt: new Date().toISOString(),
      daysActiveLast14: 14,
    },
    {
      userId: 'p3',
      displayName: 'Jamal Adams',
      firstName: 'Jamal',
      lastName: 'Adams',
      avatarUrl: null,
      position: 'SS',
      positionGroup: 'Secondary',
      jerseyNumber: 33,
      footballIQ: 88,
      coverageIQ: 92,
      blitzIQ: 95,
      accuracy: 86.8,
      gamesThisWeek: 12,
      xpThisWeek: 3540,
      currentStreak: 5,
      level: 22,
      rank: 3,
      previousRank: 3,
      rankChange: 0,
      lastActiveAt: new Date().toISOString(),
      daysActiveLast14: 10,
    },
    {
      userId: 'p4',
      displayName: 'Tyler Boyd',
      firstName: 'Tyler',
      lastName: 'Boyd',
      avatarUrl: null,
      position: 'WR',
      positionGroup: 'WR Room',
      jerseyNumber: 83,
      footballIQ: 85,
      coverageIQ: 82,
      blitzIQ: 71,
      accuracy: 84.2,
      gamesThisWeek: 9,
      xpThisWeek: 2890,
      currentStreak: 3,
      level: 19,
      rank: 4,
      previousRank: 6,
      rankChange: 2,
      lastActiveAt: new Date().toISOString(),
      daysActiveLast14: 9,
    },
    {
      userId: 'p5',
      displayName: 'Chris Olave',
      firstName: 'Chris',
      lastName: 'Olave',
      avatarUrl: null,
      position: 'WR',
      positionGroup: 'WR Room',
      jerseyNumber: 12,
      footballIQ: 83,
      coverageIQ: 85,
      blitzIQ: 68,
      accuracy: 82.1,
      gamesThisWeek: 11,
      xpThisWeek: 2650,
      currentStreak: 4,
      level: 18,
      rank: 5,
      previousRank: 4,
      rankChange: -1,
      lastActiveAt: new Date().toISOString(),
      daysActiveLast14: 8,
    },
    {
      userId: 'p6',
      displayName: 'Jerome Ford',
      firstName: 'Jerome',
      lastName: 'Ford',
      avatarUrl: null,
      position: 'RB',
      positionGroup: 'RB Room',
      jerseyNumber: 34,
      footballIQ: 81,
      coverageIQ: 72,
      blitzIQ: 88,
      accuracy: 80.5,
      gamesThisWeek: 8,
      xpThisWeek: 2340,
      currentStreak: 2,
      level: 17,
      rank: 6,
      previousRank: 5,
      rankChange: -1,
      lastActiveAt: new Date().toISOString(),
      daysActiveLast14: 7,
    },
    {
      userId: 'p7',
      displayName: 'Garrett Wilson',
      firstName: 'Garrett',
      lastName: 'Wilson',
      avatarUrl: null,
      position: 'WR',
      positionGroup: 'WR Room',
      jerseyNumber: 5,
      footballIQ: 79,
      coverageIQ: 81,
      blitzIQ: 65,
      accuracy: 78.9,
      gamesThisWeek: 7,
      xpThisWeek: 2120,
      currentStreak: 0,
      level: 16,
      rank: 7,
      previousRank: 7,
      rankChange: 0,
      lastActiveAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      daysActiveLast14: 6,
    },
    {
      userId: 'p8',
      displayName: 'Denzel Ward',
      firstName: 'Denzel',
      lastName: 'Ward',
      avatarUrl: null,
      position: 'CB',
      positionGroup: 'Secondary',
      jerseyNumber: 21,
      footballIQ: 77,
      coverageIQ: 89,
      blitzIQ: 62,
      accuracy: 77.3,
      gamesThisWeek: 6,
      xpThisWeek: 1890,
      currentStreak: 1,
      level: 15,
      rank: 8,
      previousRank: 9,
      rankChange: 1,
      lastActiveAt: new Date().toISOString(),
      daysActiveLast14: 5,
    },
    {
      userId: 'p9',
      displayName: 'Joel Bitonio',
      firstName: 'Joel',
      lastName: 'Bitonio',
      avatarUrl: null,
      position: 'OG',
      positionGroup: 'O-Line',
      jerseyNumber: 75,
      footballIQ: 75,
      coverageIQ: 58,
      blitzIQ: 91,
      accuracy: 75.8,
      gamesThisWeek: 5,
      xpThisWeek: 1650,
      currentStreak: 0,
      level: 14,
      rank: 9,
      previousRank: 8,
      rankChange: -1,
      lastActiveAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      daysActiveLast14: 4,
    },
    {
      userId: 'p10',
      displayName: 'Mike Williams',
      firstName: 'Mike',
      lastName: 'Williams',
      avatarUrl: null,
      position: 'WR',
      positionGroup: 'WR Room',
      jerseyNumber: 18,
      footballIQ: 72,
      coverageIQ: 74,
      blitzIQ: 61,
      accuracy: 71.2,
      gamesThisWeek: 3,
      xpThisWeek: 980,
      currentStreak: 0,
      level: 12,
      rank: 10,
      previousRank: 10,
      rankChange: 0,
      lastActiveAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      daysActiveLast14: 2,
    },
  ];

  // IQ Comparison Data (for bar chart: Coverage vs Blitz by position group)
  const iqComparison: IQComparisonData = {
    labels: ['QB Room', 'WR Room', 'RB Room', 'Secondary', 'O-Line', 'D-Line', 'Linebackers'],
    datasets: [
      {
        label: 'Coverage IQ',
        data: [96, 82, 72, 90, 58, 65, 78],
        backgroundColor: 'rgba(0, 246, 229, 0.8)',
        borderColor: '#00F6E5',
      },
      {
        label: 'Blitz IQ',
        data: [92, 71, 88, 78, 91, 86, 84],
        backgroundColor: 'rgba(255, 106, 61, 0.8)',
        borderColor: '#FF6A3D',
      },
    ],
  };

  // Most improved player
  const mostImproved: MostImprovedPlayer = {
    userId: 'p4',
    displayName: 'Tyler Boyd',
    position: 'WR',
    avatarUrl: null,
    footballIQGain: 8,
    accuracyGain: 6.5,
    xpGained: 2890,
    gamesPlayedThisWeek: 9,
    mostImprovedCategory: {
      category: 'Coverage Recognition',
      previousScore: 72,
      currentScore: 82,
      gain: 10,
    },
  };

  // Players at risk
  const playersAtRisk: PlayerAtRisk[] = [
    {
      userId: 'p10',
      displayName: 'Mike Williams',
      position: 'WR',
      avatarUrl: null,
      riskLevel: 'high',
      riskReasons: [
        {
          type: 'inactivity',
          severity: 'alert',
          message: 'No activity in 5 days',
        },
        {
          type: 'low_reps',
          severity: 'alert',
          message: 'Only 3 games this week (target: 5+)',
        },
        {
          type: 'declining_accuracy',
          severity: 'warning',
          message: 'Accuracy down 8.2% from last week',
        },
      ],
      daysInactive: 5,
      accuracyTrend: 'declining',
      accuracyDropPercent: 8.2,
      currentAccuracy: 71.2,
      gamesLastWeek: 7,
      gamesThisWeek: 3,
      suggestedAction: 'Check in with player and review fundamentals',
    },
    {
      userId: 'p9',
      displayName: 'Joel Bitonio',
      position: 'OG',
      avatarUrl: null,
      riskLevel: 'medium',
      riskReasons: [
        {
          type: 'inactivity',
          severity: 'warning',
          message: 'Inactive for 3 days',
        },
        {
          type: 'no_streak',
          severity: 'warning',
          message: 'No active streak – needs consistent daily practice',
        },
      ],
      daysInactive: 3,
      accuracyTrend: 'stable',
      accuracyDropPercent: null,
      currentAccuracy: 75.8,
      gamesLastWeek: 6,
      gamesThisWeek: 5,
      suggestedAction: 'Encourage daily practice routine',
    },
  ];

  // Position room summaries
  const positionRooms: PositionRoomSummary[] = [
    {
      positionGroup: 'WR Room',
      displayName: 'WR Room',
      playerCount: 6,
      activePlayerCount: 5,
      averageFootballIQ: 82,
      averageAccuracy: 81.2,
      totalGamesThisWeek: 48,
      totalXPThisWeek: 12530,
      footballIQvsTeam: 10,
      topPlayer: {
        userId: 'p2',
        displayName: 'Demetric Felton',
        footballIQ: 91,
      },
      weakestCategories: [
        { category: 'Blitz ID', averageScore: 71, teamAverageScore: 78 },
      ],
    },
    {
      positionGroup: 'Secondary',
      displayName: 'Secondary',
      playerCount: 5,
      activePlayerCount: 4,
      averageFootballIQ: 80,
      averageAccuracy: 79.5,
      totalGamesThisWeek: 32,
      totalXPThisWeek: 8640,
      footballIQvsTeam: 8,
      topPlayer: {
        userId: 'p3',
        displayName: 'Jamal Adams',
        footballIQ: 88,
      },
      weakestCategories: [
        { category: 'Route Concepts', averageScore: 68, teamAverageScore: 75 },
      ],
    },
    {
      positionGroup: 'QB Room',
      displayName: 'QB Room',
      playerCount: 3,
      activePlayerCount: 3,
      averageFootballIQ: 88,
      averageAccuracy: 86.4,
      totalGamesThisWeek: 28,
      totalXPThisWeek: 7820,
      footballIQvsTeam: 16,
      topPlayer: {
        userId: 'p1',
        displayName: 'Marcus Williams',
        footballIQ: 94,
      },
      weakestCategories: [],
    },
    {
      positionGroup: 'RB Room',
      displayName: 'RB Room',
      playerCount: 4,
      activePlayerCount: 3,
      averageFootballIQ: 76,
      averageAccuracy: 77.8,
      totalGamesThisWeek: 22,
      totalXPThisWeek: 5890,
      footballIQvsTeam: 4,
      topPlayer: {
        userId: 'p6',
        displayName: 'Jerome Ford',
        footballIQ: 81,
      },
      weakestCategories: [
        { category: 'Coverage ID', averageScore: 72, teamAverageScore: 80 },
      ],
    },
    {
      positionGroup: 'O-Line',
      displayName: 'Offensive Line',
      playerCount: 7,
      activePlayerCount: 5,
      averageFootballIQ: 71,
      averageAccuracy: 73.2,
      totalGamesThisWeek: 25,
      totalXPThisWeek: 6120,
      footballIQvsTeam: -1,
      topPlayer: {
        userId: 'p9',
        displayName: 'Joel Bitonio',
        footballIQ: 75,
      },
      weakestCategories: [
        { category: 'Coverage ID', averageScore: 58, teamAverageScore: 80 },
        { category: 'Route Concepts', averageScore: 52, teamAverageScore: 75 },
      ],
    },
  ];

  return {
    teamId,
    teamName: 'Cleveland Browns',
    generatedAt: new Date().toISOString(),
    kpis,
    playerRankings,
    iqComparison,
    mostImproved,
    playersAtRisk,
    positionRooms,
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// SQL QUERIES (For Production - Documented)
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * QUERY: Get Team KPIs for This Week
 * 
 * ```sql
 * WITH this_week AS (
 *   SELECT
 *     COUNT(gs.id) as total_sessions,
 *     COALESCE(SUM(gs.xp_earned), 0) as total_xp,
 *     COALESCE(AVG(gs.accuracy), 0) as avg_accuracy,
 *     COUNT(DISTINCT gs.user_id) as active_players
 *   FROM game_sessions gs
 *   JOIN team_members tm ON gs.user_id = tm.user_id AND gs.team_id = tm.team_id
 *   WHERE gs.team_id = $1
 *     AND gs.status = 'completed'
 *     AND gs.started_at >= date_trunc('week', CURRENT_DATE)
 * ),
 * last_week AS (
 *   SELECT
 *     COUNT(gs.id) as total_sessions,
 *     COALESCE(SUM(gs.xp_earned), 0) as total_xp,
 *     COALESCE(AVG(gs.accuracy), 0) as avg_accuracy,
 *     COUNT(DISTINCT gs.user_id) as active_players
 *   FROM game_sessions gs
 *   JOIN team_members tm ON gs.user_id = tm.user_id AND gs.team_id = tm.team_id
 *   WHERE gs.team_id = $1
 *     AND gs.status = 'completed'
 *     AND gs.started_at >= date_trunc('week', CURRENT_DATE) - interval '7 days'
 *     AND gs.started_at < date_trunc('week', CURRENT_DATE)
 * )
 * SELECT 
 *   tw.*, 
 *   lw.total_sessions as last_week_sessions,
 *   lw.total_xp as last_week_xp,
 *   lw.avg_accuracy as last_week_accuracy,
 *   lw.active_players as last_week_active
 * FROM this_week tw, last_week lw;
 * ```
 */

/**
 * QUERY: Get Player Rankings by Football IQ
 * 
 * ```sql
 * WITH player_stats AS (
 *   SELECT
 *     u.id as user_id,
 *     COALESCE(u.display_name, u.first_name || ' ' || u.last_name) as display_name,
 *     u.first_name,
 *     u.last_name,
 *     u.avatar_url,
 *     tm.position,
 *     tm.position_group,
 *     u.jersey_number,
 *     u.current_level,
 *     COALESCE(us.current_streak, 0) as current_streak,
 *     
 *     -- Calculate Football IQ components
 *     AVG(gs.accuracy) as avg_accuracy,
 *     AVG(gs.avg_response_time_ms) as avg_response_time,
 *     COUNT(gs.id) as games_this_week,
 *     SUM(gs.xp_earned) as xp_this_week,
 *     
 *     -- Category-specific accuracy
 *     AVG(CASE WHEN g.type = 'coverage_recognition' THEN gs.accuracy END) as coverage_accuracy,
 *     AVG(CASE WHEN g.type = 'blitz_id' THEN gs.accuracy END) as blitz_accuracy
 *     
 *   FROM users u
 *   JOIN team_members tm ON tm.user_id = u.id
 *   LEFT JOIN game_sessions gs ON gs.user_id = u.id 
 *     AND gs.team_id = tm.team_id
 *     AND gs.status = 'completed'
 *     AND gs.started_at >= date_trunc('week', CURRENT_DATE)
 *   LEFT JOIN games g ON gs.game_id = g.id
 *   LEFT JOIN user_streaks us ON us.user_id = u.id AND us.team_id = tm.team_id
 *   WHERE tm.team_id = $1 AND tm.is_active = TRUE
 *   GROUP BY u.id, tm.position, tm.position_group, us.current_streak
 * )
 * SELECT 
 *   *,
 *   -- Football IQ calculation (simplified)
 *   ROUND(
 *     (COALESCE(avg_accuracy, 50) * 0.5) + 
 *     (CASE WHEN avg_response_time < 5000 THEN 30 ELSE 15 END) +
 *     (LEAST(games_this_week, 10) * 2)
 *   ) as football_iq,
 *   RANK() OVER (ORDER BY avg_accuracy DESC NULLS LAST) as rank
 * FROM player_stats
 * ORDER BY football_iq DESC;
 * ```
 */

// ───────────────────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ───────────────────────────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const positionFilter = searchParams.get('positionGroup');
    const dateStart = searchParams.get('startDate');
    const dateEnd = searchParams.get('endDate');

    // In production, this would:
    // 1. Validate the user has access to this team (coach role)
    // 2. Query Supabase with the documented SQL
    // 3. Calculate Football IQ scores
    // 4. Return real data

    // For now, return mock data
    const dashboardData = generateMockDashboardData(teamId);

    // Apply position filter if specified
    if (positionFilter) {
      dashboardData.playerRankings = dashboardData.playerRankings.filter(
        p => p.positionGroup === positionFilter
      );
    }

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching coach dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

/**
 * Response JSON Shape Example:
 * 
 * {
 *   "teamId": "team-123",
 *   "teamName": "Cleveland Browns",
 *   "generatedAt": "2024-11-28T10:30:00Z",
 *   "kpis": {
 *     "thisWeek": {
 *       "totalSessions": 187,
 *       "totalXPEarned": 45230,
 *       "averageAccuracy": 78.4,
 *       "activePlayers": 42,
 *       "averageFootballIQ": 72
 *     },
 *     "lastWeek": { ... },
 *     "deltas": {
 *       "sessions": 31,
 *       "sessionsPercent": 19.9,
 *       ...
 *     }
 *   },
 *   "playerRankings": [
 *     {
 *       "userId": "p1",
 *       "displayName": "Marcus Williams",
 *       "position": "QB",
 *       "footballIQ": 94,
 *       "coverageIQ": 96,
 *       "blitzIQ": 92,
 *       "accuracy": 91.2,
 *       "rank": 1,
 *       "rankChange": 1,
 *       ...
 *     },
 *     ...
 *   ],
 *   "iqComparison": {
 *     "labels": ["QB Room", "WR Room", ...],
 *     "datasets": [
 *       { "label": "Coverage IQ", "data": [96, 82, ...] },
 *       { "label": "Blitz IQ", "data": [92, 71, ...] }
 *     ]
 *   },
 *   "mostImproved": {
 *     "displayName": "Tyler Boyd",
 *     "footballIQGain": 8,
 *     ...
 *   },
 *   "playersAtRisk": [
 *     {
 *       "displayName": "Mike Williams",
 *       "riskLevel": "high",
 *       "riskReasons": [...],
 *       "suggestedAction": "Check in with player"
 *     }
 *   ],
 *   "positionRooms": [...]
 * }
 */








