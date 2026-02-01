/**
 * Player Playbook Metadata API
 * Handles player-owned playbook metadata for uploaded files
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired, validateUUID } from './shared/validators';

// Map frontend content types to database enum values
function mapContentTypeToDatabase(frontendType: string | undefined): string | undefined {
  if (!frontendType) return undefined;

  const mapping: Record<string, string> = {
    'single_play': 'play',
    'notes': 'legend',
    'install_notes': 'legend',
    'full_playbook': 'index',
    'concept': 'reference',
  };

  const mappedType = mapping[frontendType] || frontendType;
  const validTypes = ['play', 'coverage', 'formation', 'legend', 'index', 'coaching_points', 'technique', 'terminology', 'reference', 'other'];

  if (!validTypes.includes(mappedType)) {
    console.warn(`[Content Type Mapping] Unknown type "${frontendType}" mapped to "${mappedType}", using "other" as fallback`);
    return 'other';
  }

  return mappedType;
}

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  const { httpMethod } = event;
  const user = getAuthenticatedUser(event);
  const supabase = getSupabaseAdmin();

  // GET - Fetch player's own metadata
  if (httpMethod === 'GET') {
    try {
      const { data: metadataRecords, error } = await supabase
        .from('player_playbook_metadata')
        .select('*')
        .eq('user_id', user.userId)
        .eq('org_id', user.orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch player playbook metadata: ${error.message}`);
      }

      // Transform metadata into a play-list format
      const plays = (metadataRecords || []).map(metadata => {
        const fileName = metadata.file_paths && metadata.file_paths.length > 0
          ? metadata.file_paths[0].split('/').pop()
          : 'Untitled Play';

        return {
          id: metadata.id,
          name: metadata.formation_name || metadata.concept_name || fileName || 'Untitled Play',
          formation: metadata.formation_name || 'Unknown Formation',
          concept: metadata.concept_name || 'Unknown Concept',
          side_of_ball: metadata.side_of_ball,
          content_type: metadata.content_type,
          position_relevance: metadata.position_relevance || ['all'],
          level: metadata.level,
          custom_notes: metadata.custom_notes,
          file_paths: metadata.file_paths || [],
          created_at: metadata.created_at,
          updated_at: metadata.updated_at,
        };
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plays),
      };
    } catch (error: any) {
      console.error('Error fetching player playbook metadata:', error);
      return formatErrorResponse(error);
    }
  }

  // POST - Create new metadata record
  if (httpMethod === 'POST') {
    try {
      const metadata = JSON.parse(event.body || '{}');

      if (!metadata.file_paths || metadata.file_paths.length === 0) {
        throw new ValidationError('file_paths is required');
      }

      // Map frontend content type to database enum value
      const dbContentType = mapContentTypeToDatabase(metadata.content_type);

      const insertData = {
        user_id: user.userId,
        org_id: user.orgId,
        file_paths: metadata.file_paths,
        side_of_ball: metadata.side_of_ball,
        content_type: dbContentType,
        position_relevance: metadata.position_relevance || ['all'],
        level: metadata.level,
        formation_name: metadata.formation_name,
        concept_name: metadata.concept_name,
        custom_notes: metadata.custom_notes,
        tags: metadata.tags || [],
        play_type: metadata.play_type,
        unit: metadata.unit,
        playbook_section: metadata.playbook_section,
        primary_classification: metadata.primary_classification,
        situation: metadata.situation,
        is_private: metadata.is_private !== undefined ? metadata.is_private : true,
      };

      const { data, error } = await supabase
        .from('player_playbook_metadata')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Failed to create metadata: ${error.message}`);
      }

      console.log(`✅ Player metadata created: ${data.id} by user ${user.userId}`);

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    } catch (error: any) {
      console.error('Error creating player metadata:', error);
      return formatErrorResponse(error);
    }
  }

  // PUT - Update metadata record
  if (httpMethod === 'PUT') {
    try {
      const { id, ...updates } = JSON.parse(event.body || '{}');

      if (!id) {
        throw new ValidationError('id is required');
      }

      validateUUID(id, 'id');

      // Map frontend content type to database enum value
      const dbContentType = mapContentTypeToDatabase(updates.content_type);

      const { data, error } = await supabase
        .from('player_playbook_metadata')
        .update({
          side_of_ball: updates.side_of_ball,
          content_type: dbContentType,
          position_relevance: updates.position_relevance,
          level: updates.level,
          formation_name: updates.formation_name,
          concept_name: updates.concept_name,
          custom_notes: updates.custom_notes,
          tags: updates.tags,
          play_type: updates.play_type,
          unit: updates.unit,
          playbook_section: updates.playbook_section,
          primary_classification: updates.primary_classification,
          situation: updates.situation,
          is_private: updates.is_private,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.userId) // Ensure user owns this metadata
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Failed to update metadata: ${error.message}`);
      }

      if (!data) {
        throw new ValidationError('Metadata not found or you do not have permission to update it');
      }

      console.log(`✅ Player metadata updated: ${id} by user ${user.userId}`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    } catch (error: any) {
      console.error('Error updating player metadata:', error);
      return formatErrorResponse(error);
    }
  }

  // DELETE - Delete metadata record
  if (httpMethod === 'DELETE') {
    try {
      const { id } = JSON.parse(event.body || '{}');

      if (!id) {
        throw new ValidationError('id is required');
      }

      validateUUID(id, 'id');

      const { error } = await supabase
        .from('player_playbook_metadata')
        .delete()
        .eq('id', id)
        .eq('user_id', user.userId); // Ensure user owns this metadata

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete metadata: ${error.message}`);
      }

      console.log(`✅ Player metadata deleted: ${id} by user ${user.userId}`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    } catch (error: any) {
      console.error('Error deleting player metadata:', error);
      return formatErrorResponse(error);
    }
  }

  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
});

export { handler };
