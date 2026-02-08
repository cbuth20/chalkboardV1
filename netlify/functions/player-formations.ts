/**
 * GET /api/player-formations
 * Fetch formations for the authenticated player
 * Auth: Player (only access own content)
 *
 * Query params:
 * - module: Filter by module (posse_2x2, posse_trips, etc.)
 * - position: Filter formations that have coaching notes for this position
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

    // Parse query params
    const params = new URLSearchParams(event.rawQuery || '');
    const moduleFilter = params.get('module');
    const positionFilter = params.get('position');

    // Build query
    let query = supabase
      .from('player_formations')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (moduleFilter) {
      query = query.eq('module', moduleFilter);
    }

    // Execute query
    const { data: formations, error: formationsError } = await query;

    if (formationsError) {
      throw new Error(`Failed to fetch formations: ${formationsError.message}`);
    }

    // Filter by position if specified (check if coaching_notes has the position)
    let filteredFormations = formations || [];
    if (positionFilter) {
      filteredFormations = filteredFormations.filter(f => {
        const notes = f.coaching_notes as Record<string, string>;
        return notes && notes[positionFilter];
      });
    }

    // Fetch latest analysis status
    const { data: latestAnalysis } = await supabase
      .from('player_playbook_analysis')
      .select('id, status, formations_extracted, estimated_tokens, processing_time_seconds, started_at, completed_at')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Group formations by module
    const formationsByModule = filteredFormations.reduce((acc, formation) => {
      const module = formation.module || 'other';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(formation);
      return acc;
    }, {} as Record<string, typeof formations>);

    console.log(`✅ Fetched ${filteredFormations.length} formations for user ${user.userId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formations: filteredFormations,
        formationsByModule,
        totalCount: filteredFormations.length,
        latestAnalysis: latestAnalysis || null,
      }),
    };
  } catch (error) {
    console.error('Error fetching formations:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
