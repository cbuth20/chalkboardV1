/**
 * POST /api/player-plays-create
 * Create a new player play record
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired, validateUUID, validateEnum } from './shared/validators';

interface CreatePlayerPlayRequest {
  playerPlaybookMetadataId?: string;
  name?: string;
  playType?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  formationName?: string;
  concept?: string;
  triggerProcessing?: boolean;
  unit?: 'O' | 'D' | 'ST';
  playbookSection?: string;
  primaryClassification?: string;
  situation?: string;
  diagramData?: any; // For PlayBuilder-created plays
}

const handler: Handler = withOrgAuth('player')(async (event, context) => {
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
    const body: CreatePlayerPlayRequest = JSON.parse(event.body || '{}');

    // Validate playType if provided
    if (body.playType) {
      validateEnum(body.playType, ['PASS', 'RUN', 'RPO', 'SCREEN'], 'playType');
    }

    let metadata = null;

    // Fetch playbook metadata if provided (for upload-based plays)
    if (body.playerPlaybookMetadataId) {
      validateUUID(body.playerPlaybookMetadataId, 'playerPlaybookMetadataId');

      const { data: metadataData, error: metadataError } = await supabase
        .from('player_playbook_metadata')
        .select('*')
        .eq('id', body.playerPlaybookMetadataId)
        .eq('user_id', user.userId)
        .single();

      if (metadataError || !metadataData) {
        throw new ValidationError('Playbook metadata not found or you do not have permission to access it');
      }

      metadata = metadataData;
    }

    // Determine play name
    const playName = body.name || metadata?.formation_name || 'Untitled Play';

    // Create play record
    const { data: play, error: playError } = await supabase
      .from('player_plays')
      .insert({
        user_id: user.userId,
        org_id: user.orgId,
        player_playbook_metadata_id: body.playerPlaybookMetadataId || null,
        name: playName,
        short_name: playName.substring(0, 50),
        play_type: body.playType || 'PASS',
        concept: body.concept || metadata?.concept_name,
        formation_name: body.formationName || metadata?.formation_name,
        diagram_data: body.diagramData || null,
        ai_insights: null,
        content_status: body.triggerProcessing ? 'generating' : 'draft',
        is_archived: false,
        created_by: user.userId,
        unit: body.unit || metadata?.unit || null,
        playbook_section: body.playbookSection || metadata?.playbook_section || null,
        primary_classification: body.primaryClassification || metadata?.primary_classification || null,
        situation: body.situation || metadata?.situation || null,
        is_private: true, // All player plays are private by default
      })
      .select()
      .single();

    if (playError || !play) {
      throw new Error(`Failed to create player play: ${playError?.message}`);
    }

    console.log(`✅ Player play created: ${play.id} by user ${user.userId}`);

    // If triggerProcessing is true, trigger background processing
    if (body.triggerProcessing && metadata) {
      const filePath = metadata.file_paths?.[0];

      if (filePath) {
        // Get the full public URL from Supabase Storage
        const { data: urlData } = supabase.storage
          .from('Chalkboard Bucket')
          .getPublicUrl(filePath);

        const imageUrl = urlData.publicUrl;

        const backgroundFunctionUrl = `${event.headers.host?.includes('localhost') ? 'http' : 'https'}://${event.headers.host}/.netlify/functions/process-player-play-content-background`;

        console.log(`🚀 Triggering background processing for player play ${play.id}`);
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

        console.log(`✅ Background processing triggered for player play ${play.id}`);
      } else {
        console.warn(`⚠️ No image URL found for player play ${play.id}, skipping processing`);
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
          ? 'Player play created and processing started'
          : 'Player play created as draft',
      }),
    };
  } catch (error) {
    console.error('Error creating player play:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
