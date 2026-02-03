/**
 * Concept Tags API
 * GET: List concept tags for org
 * POST: Create concept tag
 * PUT: Update concept tag
 * DELETE: Delete concept tag
 * Auth: Player/Coach
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired, validateUUID, validateEnum } from './shared/validators';

interface CreateConceptTagRequest {
  name: string;
  description?: string;
  sideOfBall: 'offense' | 'defense' | 'both';
}

interface UpdateConceptTagRequest {
  id: string;
  name?: string;
  description?: string;
  sideOfBall?: 'offense' | 'defense' | 'both';
}

interface DeleteConceptTagRequest {
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
    // GET: List concept tags
    if (event.httpMethod === 'GET') {
      const sideOfBall = event.queryStringParameters?.sideOfBall;

      let query = supabase
        .from('concept_tags')
        .select('*')
        .eq('org_id', user.orgId)
        .order('name');

      if (sideOfBall) {
        query = query.or(`side_of_ball.eq.${sideOfBall},side_of_ball.eq.both`);
      }

      const { data: tags, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch concept tags: ${error.message}`);
      }

      // Transform snake_case to camelCase for frontend
      const transformedTags = tags.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        sideOfBall: t.side_of_ball,
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

    // POST: Create concept tag
    if (event.httpMethod === 'POST') {
      const body: CreateConceptTagRequest = JSON.parse(event.body || '{}');

      validateRequired(body.name, 'name');
      validateRequired(body.sideOfBall, 'sideOfBall');
      validateEnum(body.sideOfBall, ['offense', 'defense', 'both'], 'sideOfBall');

      // Check for duplicate name within org
      const { data: existing } = await supabase
        .from('concept_tags')
        .select('id')
        .eq('name', body.name)
        .eq('org_id', user.orgId)
        .single();

      if (existing) {
        throw new ValidationError('A concept tag with this name already exists in your organization');
      }

      const { data: tag, error } = await supabase
        .from('concept_tags')
        .insert({
          name: body.name,
          description: body.description || null,
          side_of_ball: body.sideOfBall,
          org_id: user.orgId,
        })
        .select()
        .single();

      if (error || !tag) {
        throw new Error(`Failed to create concept tag: ${error?.message}`);
      }

      // Transform snake_case to camelCase for frontend
      const transformedTag = {
        id: tag.id,
        name: tag.name,
        description: tag.description,
        sideOfBall: tag.side_of_ball,
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

    // PUT: Update concept tag
    if (event.httpMethod === 'PUT') {
      const body: UpdateConceptTagRequest = JSON.parse(event.body || '{}');

      validateRequired(body.id, 'id');
      validateUUID(body.id, 'id');

      // Fetch the tag to verify ownership
      const { data: tag, error: fetchError } = await supabase
        .from('concept_tags')
        .select('*')
        .eq('id', body.id)
        .eq('org_id', user.orgId)
        .single();

      if (fetchError || !tag) {
        throw new ValidationError('Concept tag not found or you do not have permission to modify it');
      }

      // Build update object
      const updates: any = {};
      if (body.name) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.sideOfBall) updates.side_of_ball = body.sideOfBall;

      const { data: updatedTag, error: updateError } = await supabase
        .from('concept_tags')
        .update(updates)
        .eq('id', body.id)
        .eq('org_id', user.orgId)
        .select()
        .single();

      if (updateError || !updatedTag) {
        throw new Error(`Failed to update concept tag: ${updateError?.message}`);
      }

      // Transform snake_case to camelCase for frontend
      const transformedTag = {
        id: updatedTag.id,
        name: updatedTag.name,
        description: updatedTag.description,
        sideOfBall: updatedTag.side_of_ball,
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

    // DELETE: Delete concept tag
    if (event.httpMethod === 'DELETE') {
      const body: DeleteConceptTagRequest = JSON.parse(event.body || '{}');

      validateRequired(body.id, 'id');
      validateUUID(body.id, 'id');

      // Fetch the tag to verify ownership
      const { data: tag, error: fetchError } = await supabase
        .from('concept_tags')
        .select('*')
        .eq('id', body.id)
        .eq('org_id', user.orgId)
        .single();

      if (fetchError || !tag) {
        throw new ValidationError('Concept tag not found or you do not have permission to delete it');
      }

      const { error: deleteError } = await supabase
        .from('concept_tags')
        .delete()
        .eq('id', body.id)
        .eq('org_id', user.orgId);

      if (deleteError) {
        throw new Error(`Failed to delete concept tag: ${deleteError.message}`);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Concept tag deleted successfully',
        }),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error handling concept tags request:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
