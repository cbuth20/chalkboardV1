/**
 * GET /api/player-games-list
 * List player's custom games
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse } from './shared/errors';

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    // Optional filters from query params
    const category = event.queryStringParameters?.category;
    const isActive = event.queryStringParameters?.isActive !== 'false'; // Default to true

    let query = supabase
      .from('player_games')
      .select('*')
      .eq('user_id', user.userId)
      .eq('org_id', user.orgId)
      .eq('is_active', isActive)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: games, error: gamesError } = await query;

    if (gamesError) {
      console.error('Failed to fetch games:', gamesError);
      throw new Error('Failed to fetch games');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        games: games || [],
        count: games?.length || 0,
      }),
    };
  } catch (error: any) {
    console.error('Error listing games:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
