/**
 * Formations API
 * GET: List formations (system + org custom)
 * POST: Create custom formation
 * PUT: Update custom formation
 * DELETE: Delete custom formation
 * Auth: Player/Coach
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired, validateUUID, validateEnum } from './shared/validators';

interface CreateFormationRequest {
  name: string;
  sideOfBall: 'offense' | 'defense';
  personnel?: string;
  playerPositions: any[]; // Array of {position, x, y, label, group}
  description?: string;
}

interface UpdateFormationRequest {
  id: string;
  name?: string;
  personnel?: string;
  playerPositions?: any[];
  description?: string;
}

interface DeleteFormationRequest {
  id: string;
}

const handler: Handler = withOrgAuth('player', false)(async (event, context) => {
  const supabase = getSupabaseAdmin();

  // Get authenticated user's auth ID
  const token = event.headers.authorization?.split(' ')[1] || event.headers.Authorization?.split(' ')[1];
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing authorization token' }),
    };
  }

  const supabaseClient = require('./shared/supabase').getSupabaseClient(token);
  const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !authUser) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid or expired token' }),
    };
  }

  // Get user's internal ID and org membership
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (userError || !userData) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'User not found' }),
    };
  }

  // Get user's first active org membership
  const { data: membership, error: membershipError } = await supabase
    .from('org_memberships')
    .select('org_id')
    .eq('user_id', userData.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'No active organization membership found' }),
    };
  }

  const user = { orgId: membership.org_id };

  try {
    // GET: List formations
    if (event.httpMethod === 'GET') {
      const sideOfBall = event.queryStringParameters?.sideOfBall;
      const personnel = event.queryStringParameters?.personnel;

      let query = supabase
        .from('formations')
        .select('*')
        .or(`is_system_defined.eq.true,org_id.eq.${user.orgId}`)
        .order('is_system_defined', { ascending: false })
        .order('name');

      if (sideOfBall) {
        query = query.eq('side_of_ball', sideOfBall);
      }

      if (personnel) {
        query = query.eq('personnel', personnel);
      }

      const { data: formations, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch formations: ${error.message}`);
      }

      // Transform snake_case to camelCase for frontend
      const transformedFormations = formations.map(f => ({
        id: f.id,
        name: f.name,
        sideOfBall: f.side_of_ball,
        personnel: f.personnel,
        playerPositions: f.player_positions,
        description: f.description,
        isSystemDefined: f.is_system_defined,
        orgId: f.org_id,
        createdAt: f.created_at,
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          formations: transformedFormations,
        }),
      };
    }

    // POST: Create custom formation
    if (event.httpMethod === 'POST') {
      const body: CreateFormationRequest = JSON.parse(event.body || '{}');

      validateRequired(body.name, 'name');
      validateRequired(body.sideOfBall, 'sideOfBall');
      validateRequired(body.playerPositions, 'playerPositions');
      validateEnum(body.sideOfBall, ['offense', 'defense'], 'sideOfBall');

      if (!Array.isArray(body.playerPositions) || body.playerPositions.length === 0) {
        throw new ValidationError('playerPositions must be a non-empty array');
      }

      // Validate player positions structure
      body.playerPositions.forEach((pos, index) => {
        if (!pos.position || typeof pos.x !== 'number' || typeof pos.y !== 'number' || !pos.label || !pos.group) {
          throw new ValidationError(`Invalid player position at index ${index}: must have position, x, y, label, and group`);
        }
      });

      // Check for duplicate name within org/side
      const { data: existing } = await supabase
        .from('formations')
        .select('id')
        .eq('name', body.name)
        .eq('side_of_ball', body.sideOfBall)
        .eq('org_id', user.orgId)
        .single();

      if (existing) {
        throw new ValidationError(`A ${body.sideOfBall} formation with this name already exists in your organization`);
      }

      const { data: formation, error } = await supabase
        .from('formations')
        .insert({
          name: body.name,
          side_of_ball: body.sideOfBall,
          personnel: body.personnel || null,
          player_positions: body.playerPositions,
          description: body.description || null,
          is_system_defined: false,
          org_id: user.orgId,
        })
        .select()
        .single();

      if (error || !formation) {
        throw new Error(`Failed to create formation: ${error?.message}`);
      }

      // Transform snake_case to camelCase for frontend
      const transformedFormation = {
        id: formation.id,
        name: formation.name,
        sideOfBall: formation.side_of_ball,
        personnel: formation.personnel,
        playerPositions: formation.player_positions,
        description: formation.description,
        isSystemDefined: formation.is_system_defined,
        orgId: formation.org_id,
        createdAt: formation.created_at,
      };

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          formation: transformedFormation,
        }),
      };
    }

    // PUT: Update custom formation
    if (event.httpMethod === 'PUT') {
      const body: UpdateFormationRequest = JSON.parse(event.body || '{}');

      validateRequired(body.id, 'id');
      validateUUID(body.id, 'id');

      // Fetch the formation to verify ownership and that it's not system-defined
      const { data: formation, error: fetchError } = await supabase
        .from('formations')
        .select('*')
        .eq('id', body.id)
        .eq('org_id', user.orgId)
        .single();

      if (fetchError || !formation) {
        throw new ValidationError('Formation not found or you do not have permission to modify it');
      }

      if (formation.is_system_defined) {
        throw new ValidationError('Cannot modify system-defined formations');
      }

      // Validate player positions if provided
      if (body.playerPositions) {
        if (!Array.isArray(body.playerPositions) || body.playerPositions.length === 0) {
          throw new ValidationError('playerPositions must be a non-empty array');
        }

        body.playerPositions.forEach((pos, index) => {
          if (!pos.position || typeof pos.x !== 'number' || typeof pos.y !== 'number' || !pos.label || !pos.group) {
            throw new ValidationError(`Invalid player position at index ${index}: must have position, x, y, label, and group`);
          }
        });
      }

      // Build update object
      const updates: any = {};
      if (body.name) updates.name = body.name;
      if (body.personnel !== undefined) updates.personnel = body.personnel;
      if (body.playerPositions) updates.player_positions = body.playerPositions;
      if (body.description !== undefined) updates.description = body.description;

      const { data: updatedFormation, error: updateError } = await supabase
        .from('formations')
        .update(updates)
        .eq('id', body.id)
        .eq('org_id', user.orgId)
        .select()
        .single();

      if (updateError || !updatedFormation) {
        throw new Error(`Failed to update formation: ${updateError?.message}`);
      }

      // Transform snake_case to camelCase for frontend
      const transformedFormation = {
        id: updatedFormation.id,
        name: updatedFormation.name,
        sideOfBall: updatedFormation.side_of_ball,
        personnel: updatedFormation.personnel,
        playerPositions: updatedFormation.player_positions,
        description: updatedFormation.description,
        isSystemDefined: updatedFormation.is_system_defined,
        orgId: updatedFormation.org_id,
        createdAt: updatedFormation.created_at,
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          formation: transformedFormation,
        }),
      };
    }

    // DELETE: Delete custom formation
    if (event.httpMethod === 'DELETE') {
      const body: DeleteFormationRequest = JSON.parse(event.body || '{}');

      validateRequired(body.id, 'id');
      validateUUID(body.id, 'id');

      // Fetch the formation to verify ownership and that it's not system-defined
      const { data: formation, error: fetchError } = await supabase
        .from('formations')
        .select('*')
        .eq('id', body.id)
        .eq('org_id', user.orgId)
        .single();

      if (fetchError || !formation) {
        throw new ValidationError('Formation not found or you do not have permission to delete it');
      }

      if (formation.is_system_defined) {
        throw new ValidationError('Cannot delete system-defined formations');
      }

      const { error: deleteError } = await supabase
        .from('formations')
        .delete()
        .eq('id', body.id)
        .eq('org_id', user.orgId);

      if (deleteError) {
        throw new Error(`Failed to delete formation: ${deleteError.message}`);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Formation deleted successfully',
        }),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error handling formations request:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
