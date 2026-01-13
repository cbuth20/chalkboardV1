// ═══════════════════════════════════════════════════════════════════════════════════════════
// GET /api/games/leaderboard
// 
// Returns leaderboard data for the specified scope and time window.
// Supports team, position room, and global leaderboards.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardEngine } from '@/lib/games/leaderboard';
import type {
  LeaderboardScope,
  TimeWindow,
  LeaderboardEntry,
  LeaderboardResponse,
  FootballPosition,
} from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// REQUEST HANDLER
// ───────────────────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const teamId = searchParams.get('team_id');
    const scope = (searchParams.get('scope') || 'team') as LeaderboardScope;
    const timeWindow = (searchParams.get('time_window') || 'weekly') as TimeWindow;
    const positionGroup = searchParams.get('position_group');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '25', 10),
      LeaderboardEngine.LEADERBOARD_CONFIG.MAX_ENTRIES_PER_REQUEST
    );
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    
    if (scope !== 'global' && !teamId) {
      return NextResponse.json(
        { error: 'team_id is required for team and position_room scopes' },
        { status: 400 }
      );
    }

    if (!['team', 'position_room', 'global'].includes(scope)) {
      return NextResponse.json(
        { error: 'Invalid scope. Must be team, position_room, or global' },
        { status: 400 }
      );
    }

    if (!['daily', 'weekly', 'season', 'all_time'].includes(timeWindow)) {
      return NextResponse.json(
        { error: 'Invalid time_window. Must be daily, weekly, season, or all_time' },
        { status: 400 }
      );
    }

    if (scope === 'position_room' && !positionGroup) {
      return NextResponse.json(
        { error: 'position_group is required for position_room scope' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Verify team membership:
    // const { data: membership } = await supabase
    //   .from('team_members')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .eq('team_id', teamId)
    //   .single();
    // if (!membership) return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });

    const mockUserId = 'user-demo-123';

    // ─────────────────────────────────────────────────────────────────────────
    // GET TIME WINDOW BOUNDS
    // ─────────────────────────────────────────────────────────────────────────
    
    const { start, end } = LeaderboardEngine.getTimeWindowBounds(timeWindow);

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH LEADERBOARD DATA (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production, use the query builder:
    // const { query, params } = LeaderboardEngine.buildLeaderboardQuery({
    //   teamId: teamId || undefined,
    //   positionGroup: positionGroup || undefined,
    //   timeWindow,
    //   limit,
    //   offset,
    // });
    // const { data: entries } = await supabase.rpc('execute_query', { query, params });

    // Mock leaderboard data
    const mockEntries: LeaderboardEntry[] = generateMockLeaderboard(
      limit,
      offset,
      positionGroup || undefined,
      mockUserId
    );

    // ─────────────────────────────────────────────────────────────────────────
    // GET USER'S RANK (Mock)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { query: rankQuery, params: rankParams } = LeaderboardEngine.buildUserRankQuery({
    //   userId: user.id,
    //   teamId: teamId || undefined,
    //   positionGroup: positionGroup || undefined,
    //   timeWindow,
    // });
    // const { data: userRank } = await supabase.rpc('execute_query', { query: rankQuery, params: rankParams });

    // Find user's rank in mock data
    const userEntry = mockEntries.find(e => e.user_id === mockUserId);
    const userRank = userEntry?.rank || 3;

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────────
    
    const response: LeaderboardResponse = {
      entries: mockEntries,
      user_rank: userRank,
      total_participants: 45, // Mock total
      time_window: timeWindow,
      window_start: start.toISOString(),
      window_end: end.toISOString(),
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────────────────────

function generateMockLeaderboard(
  limit: number,
  offset: number,
  positionGroup?: string,
  currentUserId?: string
): LeaderboardEntry[] {
  const mockPlayers = [
    { name: 'Marcus Williams', position: 'QB', xp: 12450, streak: 14 },
    { name: 'Jamal Adams', position: 'WR', xp: 11200, streak: 11 },
    { name: 'Demetric Felton', position: 'WR', xp: 8750, streak: 7, userId: 'user-demo-123' },
    { name: 'Tyler Boyd', position: 'WR', xp: 8120, streak: 5 },
    { name: 'Chris Olave', position: 'WR', xp: 7890, streak: 9 },
    { name: 'Garrett Wilson', position: 'WR', xp: 7650, streak: 3 },
    { name: 'Jaylen Waddle', position: 'WR', xp: 7400, streak: 8 },
    { name: 'DeVonta Smith', position: 'WR', xp: 7150, streak: 6 },
    { name: 'CeeDee Lamb', position: 'WR', xp: 6900, streak: 4 },
    { name: 'Justin Jefferson', position: 'WR', xp: 6700, streak: 10 },
    { name: 'Ja\'Marr Chase', position: 'WR', xp: 6500, streak: 2 },
    { name: 'Tyreek Hill', position: 'WR', xp: 6300, streak: 5 },
    { name: 'Davante Adams', position: 'WR', xp: 6100, streak: 7 },
    { name: 'Stefon Diggs', position: 'WR', xp: 5900, streak: 3 },
    { name: 'DK Metcalf', position: 'WR', xp: 5700, streak: 1 },
  ];

  // Filter by position group if specified
  let filteredPlayers = mockPlayers;
  if (positionGroup) {
    const positions = LeaderboardEngine.LEADERBOARD_CONFIG.POSITION_GROUPS[positionGroup];
    if (positions) {
      filteredPlayers = mockPlayers.filter(p => 
        positions.includes(p.position as FootballPosition)
      );
    }
  }

  // Apply pagination
  const paginatedPlayers = filteredPlayers.slice(offset, offset + limit);

  return paginatedPlayers.map((player, index) => ({
    user_id: player.userId || `user-${index}`,
    rank: offset + index + 1,
    xp: player.xp,
    games_played: Math.floor(Math.random() * 50) + 10,
    accuracy: Math.floor(Math.random() * 15) + 80,
    streak: player.streak,
    display_name: player.name,
    avatar_url: undefined,
    position: player.position as FootballPosition,
  }));
}








