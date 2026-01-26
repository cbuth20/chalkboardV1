/**
 * POST /api/plays
 * Create a new play record
 * Auth: Coach/Admin
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired, validateUUID, validateEnum } from './shared/validators';

interface CreatePlayRequest {
  orgId: string;
  teamId?: string;
  playbookMetadataId: string;
  name?: string;
  playType?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  formationName?: string;
  concept?: string;
  triggerProcessing?: boolean; // Whether to trigger background AI processing
}

const handler: Handler = withOrgAuth('coach')(async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    // Parse request body
    const body: CreatePlayRequest = JSON.parse(event.body || '{}');
    const orgId = validateRequired(body.orgId, 'orgId');
    validateUUID(orgId, 'orgId');
    const playbookMetadataId = validateRequired(body.playbookMetadataId, 'playbookMetadataId');
    validateUUID(playbookMetadataId, 'playbookMetadataId');

    // Verify orgId matches user's org
    if (orgId !== user.orgId) {
      throw new ValidationError('orgId must match your organization');
    }

    // Validate playType if provided
    if (body.playType) {
      validateEnum(body.playType, ['PASS', 'RUN', 'RPO', 'SCREEN'], 'playType');
    }

    // Fetch playbook metadata to verify it exists and belongs to org
    const { data: metadata, error: metadataError } = await supabase
      .from('playbook_metadata')
      .select('*')
      .eq('id', playbookMetadataId)
      .eq('org_id', orgId)
      .single();

    if (metadataError || !metadata) {
      throw new ValidationError('Playbook metadata not found or does not belong to your organization');
    }

    // Validate teamId if provided
    if (body.teamId) {
      validateUUID(body.teamId, 'teamId');

      // Verify team belongs to org
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', body.teamId)
        .eq('org_id', orgId)
        .single();

      if (teamError || !team) {
        throw new ValidationError('Team not found or does not belong to your organization');
      }
    }

    // Create play record
    const { data: play, error: playError } = await supabase
      .from('plays')
      .insert({
        org_id: orgId,
        team_id: body.teamId || null,
        playbook_metadata_id: playbookMetadataId,
        name: body.name || metadata.formation_name || 'Untitled Play',
        short_name: (body.name || metadata.formation_name || 'Untitled').substring(0, 50),
        play_type: body.playType || 'PASS',
        concept: body.concept || metadata.concept_name,
        formation_name: body.formationName || metadata.formation_name,
        ai_insights: null,
        content_status: body.triggerProcessing ? 'generating' : 'draft',
        is_published: false,
        created_by: user.userId,
      })
      .select()
      .single();

    if (playError || !play) {
      throw new Error(`Failed to create play: ${playError?.message}`);
    }

    console.log(`✅ Play created: ${play.id} by user ${user.userId}`);

    // If triggerProcessing is true, trigger background processing
    if (body.triggerProcessing) {
      const filePath = metadata.file_paths?.[0];

      if (filePath) {
        // Get the full public URL from Supabase Storage
        const { data: urlData } = supabase.storage
          .from('Chalkboard Bucket')
          .getPublicUrl(filePath);

        const imageUrl = urlData.publicUrl;

        const backgroundFunctionUrl = `${event.headers.host?.includes('localhost') ? 'http' : 'https'}://${event.headers.host}/.netlify/functions/process-play-content-background`;

        console.log(`🚀 Triggering background processing for play ${play.id}`);
        console.log(`📷 Image URL: ${imageUrl}`);

        // Fire-and-forget call to background function
        fetch(backgroundFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playId: play.id,
            imageUrl,
            generateInsights: true,
            generateAssignments: true,
            generateKnowledge: true,
          }),
        }).catch((error) => {
          console.error('Failed to trigger background function:', error);
          // Don't throw - we already created the play
        });

        console.log(`✅ Background processing triggered for play ${play.id}`);
      } else {
        console.warn(`⚠️ No image URL found for play ${play.id}, skipping processing`);
      }
    }

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        playId: play.id,
        status: play.content_status,
        message: body.triggerProcessing
          ? 'Play created and processing started'
          : 'Play created as draft',
      }),
    };
  } catch (error) {
    console.error('Error creating play:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
