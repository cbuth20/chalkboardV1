/**
 * GET /api/player-plays-list
 * List player's own plays with filtering
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateEnum } from './shared/validators';

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
    const params = event.queryStringParameters || {};

    // Query parameters
    const status = params.status; // draft, generating, approved, rejected
    const playType = params.playType; // PASS, RUN, RPO, SCREEN
    const unit = params.unit; // O, D, ST
    const playbookSection = params.playbookSection;
    const search = params.search;
    const limit = params.limit ? parseInt(params.limit, 10) : 50;
    const offset = params.offset ? parseInt(params.offset, 10) : 0;

    // Validate filters
    if (status) validateEnum(status, ['draft', 'generating', 'approved', 'rejected'], 'status');
    if (playType) validateEnum(playType, ['PASS', 'RUN', 'RPO', 'SCREEN'], 'playType');
    if (unit) validateEnum(unit, ['O', 'D', 'ST'], 'unit');

    // Build query
    let query = supabase
      .from('player_plays')
      .select(`
        id,
        name,
        short_name,
        formation_name,
        concept,
        play_type,
        content_status,
        is_archived,
        created_at,
        updated_at,
        unit,
        playbook_section,
        primary_classification,
        situation,
        player_playbook_metadata:player_playbook_metadata_id (
          id,
          formation_name,
          concept_name,
          side_of_ball,
          content_type,
          level,
          position_relevance
        )
      `, { count: 'exact' })
      .eq('user_id', user.userId)
      .eq('org_id', user.orgId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('content_status', status);
    }

    if (playType) {
      query = query.eq('play_type', playType);
    }

    if (unit) {
      query = query.eq('unit', unit);
    }

    if (playbookSection) {
      query = query.eq('playbook_section', playbookSection);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,concept.ilike.%${search}%,formation_name.ilike.%${search}%`);
    }

    const { data: plays, error: playsError, count } = await query;

    if (playsError) {
      throw new Error(`Failed to fetch player plays: ${playsError.message}`);
    }

    console.log(`✅ Listed ${plays?.length || 0} player plays for user ${user.userId}`);

    // Transform snake_case to camelCase for frontend
    const transformedPlays = (plays || []).map(play => ({
      id: play.id,
      name: play.name,
      shortName: play.short_name,
      formationName: play.formation_name,
      concept: play.concept,
      playType: play.play_type,
      contentStatus: play.content_status,
      isArchived: play.is_archived,
      aiInsights: null, // Not fetched in list view
      createdAt: play.created_at,
      updatedAt: play.updated_at,
      unit: play.unit,
      playbookSection: play.playbook_section,
      primaryClassification: play.primary_classification,
      situation: play.situation,
      metadata: play.player_playbook_metadata,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plays: transformedPlays,
        total: count || 0,
        limit,
        offset,
      }),
    };
  } catch (error) {
    console.error('Error listing player plays:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
