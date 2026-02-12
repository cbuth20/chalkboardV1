/**
 * GET /api/player-block-coverages
 * Fetch all block coverage scenarios for the authenticated player
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

    const { data: coverages, error } = await supabase
      .from('player_block_coverages')
      .select('*')
      .eq('user_id', user.userId);

    if (error) {
      throw new Error(`Failed to fetch coverages: ${error.message}`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        scenarios: coverages || [],
        total: coverages?.length || 0,
      }),
    };
  } catch (error) {
    console.error('Error fetching block coverages:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
