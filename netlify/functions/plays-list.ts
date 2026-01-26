/**
 * GET /api/plays
 * List plays with role-based filtering
 * Auth: Player+ (players see published only, coaches see all)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateUUID, validateEnum } from './shared/validators';

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
    const orgId = params.orgId || user.orgId;
    validateUUID(orgId, 'orgId');

    // Verify orgId matches user's org
    if (orgId !== user.orgId) {
      throw new ValidationError('orgId must match your organization');
    }

    const teamId = params.teamId;
    const status = params.status; // draft, generating, approved, rejected
    const playType = params.playType; // PASS, RUN, RPO, SCREEN
    const limit = params.limit ? parseInt(params.limit, 10) : 50;
    const offset = params.offset ? parseInt(params.offset, 10) : 0;

    // Validate filters
    if (teamId) validateUUID(teamId, 'teamId');
    if (status) validateEnum(status, ['draft', 'generating', 'approved', 'rejected'], 'status');
    if (playType) validateEnum(playType, ['PASS', 'RUN', 'RPO', 'SCREEN'], 'playType');

    // Build query
    let query = supabase
      .from('plays')
      .select(`
        id,
        name,
        short_name,
        formation_name,
        concept,
        play_type,
        content_status,
        is_published,
        created_at,
        updated_at,
        playbook_metadata:playbook_metadata_id (
          id,
          formation_name,
          concept_name,
          side_of_ball,
          content_type,
          level,
          position_relevance
        )
      `, { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (status) {
      query = query.eq('content_status', status);
    } else if (user.role === 'player') {
      // Players only see approved plays
      query = query.eq('content_status', 'approved');
    }

    if (playType) {
      query = query.eq('play_type', playType);
    }

    // Players only see published plays
    if (user.role === 'player') {
      query = query.eq('is_published', true);
    }

    const { data: plays, error: playsError, count } = await query;

    if (playsError) {
      throw new Error(`Failed to fetch plays: ${playsError.message}`);
    }

    console.log(`✅ Listed ${plays?.length || 0} plays for user ${user.userId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plays: plays || [],
        total: count || 0,
        limit,
        offset,
      }),
    };
  } catch (error) {
    console.error('Error listing plays:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
