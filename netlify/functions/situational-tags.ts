/**
 * Situational Tags API
 * GET: List situational tags (system + org custom)
 * POST: Create custom situational tag
 * PUT: Update custom situational tag
 * DELETE: Delete custom situational tag
 * Auth: Player/Coach
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired, validateUUID, validateEnum } from './shared/validators';

interface CreateSituationalTagRequest {
  name: string;
  category: 'down' | 'field_position' | 'game_situation' | 'custom';
  sideOfBall: 'offense' | 'defense' | 'both';
}

interface UpdateSituationalTagRequest {
  id: string;
  name?: string;
  category?: 'down' | 'field_position' | 'game_situation' | 'custom';
  sideOfBall?: 'offense' | 'defense' | 'both';
}

interface DeleteSituationalTagRequest {
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
    // GET: List situational tags
    if (event.httpMethod === 'GET') {
      const sideOfBall = event.queryStringParameters?.sideOfBall;
      const category = event.queryStringParameters?.category;

      let query = supabase
        .from('situational_tags')
        .select('*')
        .or(`is_system_defined.eq.true,org_id.eq.${user.orgId}`)
        .order('category')
        .order('name');

      if (sideOfBall) {
        query = query.or(`side_of_ball.eq.${sideOfBall},side_of_ball.eq.both`);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data: tags, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch situational tags: ${error.message}`);
      }

      // Transform snake_case to camelCase for frontend
      const transformedTags = tags.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        sideOfBall: t.side_of_ball,
        isSystemDefined: t.is_system_defined,
        orgId: t.org_id,
        createdAt: t.created_at,
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          tags: transformedTags,
        }),
      };
    }

    // POST: Create custom situational tag
    if (event.httpMethod === 'POST') {
      const body: CreateSituationalTagRequest = JSON.parse(event.body || '{}');

      validateRequired(body.name, 'name');
      validateRequired(body.category, 'category');
      validateRequired(body.sideOfBall, 'sideOfBall');
      validateEnum(body.category, ['down', 'field_position', 'game_situation', 'custom'], 'category');
      validateEnum(body.sideOfBall, ['offense', 'defense', 'both'], 'sideOfBall');

      // Check for duplicate name within org
      const { data: existing } = await supabase
        .from('situational_tags')
        .select('id')
        .eq('name', body.name)
        .eq('org_id', user.orgId)
        .single();

      if (existing) {
        throw new ValidationError('A situational tag with this name already exists in your organization');
      }

      const { data: tag, error } = await supabase
        .from('situational_tags')
        .insert({
          name: body.name,
          category: body.category,
          side_of_ball: body.sideOfBall,
          is_system_defined: false,
          org_id: user.orgId,
        })
        .select()
        .single();

      if (error || !tag) {
        throw new Error(`Failed to create situational tag: ${error?.message}`);
      }

      // Transform snake_case to camelCase for frontend
      const transformedTag = {
        id: tag.id,
        name: tag.name,
        category: tag.category,
        sideOfBall: tag.side_of_ball,
        isSystemDefined: tag.is_system_defined,
        orgId: tag.org_id,
        createdAt: tag.created_at,
      };

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          tag: transformedTag,
        }),
      };
    }

    // PUT: Update custom situational tag
    if (event.httpMethod === 'PUT') {
      const body: UpdateSituationalTagRequest = JSON.parse(event.body || '{}');

      validateRequired(body.id, 'id');
      validateUUID(body.id, 'id');

      // Fetch the tag to verify ownership and that it's not system-defined
      const { data: tag, error: fetchError } = await supabase
        .from('situational_tags')
        .select('*')
        .eq('id', body.id)
        .eq('org_id', user.orgId)
        .single();

      if (fetchError || !tag) {
        throw new ValidationError('Situational tag not found or you do not have permission to modify it');
      }

      if (tag.is_system_defined) {
        throw new ValidationError('Cannot modify system-defined tags');
      }

      // Build update object
      const updates: any = {};
      if (body.name) updates.name = body.name;
      if (body.category) updates.category = body.category;
      if (body.sideOfBall) updates.side_of_ball = body.sideOfBall;

      const { data: updatedTag, error: updateError } = await supabase
        .from('situational_tags')
        .update(updates)
        .eq('id', body.id)
        .eq('org_id', user.orgId)
        .select()
        .single();

      if (updateError || !updatedTag) {
        throw new Error(`Failed to update situational tag: ${updateError?.message}`);
      }

      // Transform snake_case to camelCase for frontend
      const transformedTag = {
        id: updatedTag.id,
        name: updatedTag.name,
        category: updatedTag.category,
        sideOfBall: updatedTag.side_of_ball,
        isSystemDefined: updatedTag.is_system_defined,
        orgId: updatedTag.org_id,
        createdAt: updatedTag.created_at,
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          tag: transformedTag,
        }),
      };
    }

    // DELETE: Delete custom situational tag
    if (event.httpMethod === 'DELETE') {
      const body: DeleteSituationalTagRequest = JSON.parse(event.body || '{}');

      validateRequired(body.id, 'id');
      validateUUID(body.id, 'id');

      // Fetch the tag to verify ownership and that it's not system-defined
      const { data: tag, error: fetchError } = await supabase
        .from('situational_tags')
        .select('*')
        .eq('id', body.id)
        .eq('org_id', user.orgId)
        .single();

      if (fetchError || !tag) {
        throw new ValidationError('Situational tag not found or you do not have permission to delete it');
      }

      if (tag.is_system_defined) {
        throw new ValidationError('Cannot delete system-defined tags');
      }

      const { error: deleteError } = await supabase
        .from('situational_tags')
        .delete()
        .eq('id', body.id)
        .eq('org_id', user.orgId);

      if (deleteError) {
        throw new Error(`Failed to delete situational tag: ${deleteError.message}`);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Situational tag deleted successfully',
        }),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error handling situational tags request:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
