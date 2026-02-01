/**
 * Player Playbooks Upload Handler
 * Handles file uploads to Supabase Storage for player library
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse } from './shared/errors';

const BUCKET_NAME = 'Chalkboard Bucket';
const FOLDER_PATH = 'player-uploads'; // Separate folder for player uploads

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

  // POST - Upload file to storage and create metadata
  if (httpMethod === 'POST') {
    try {
      const { fileData, fileName, metadata } = JSON.parse(event.body || '{}');

      if (!fileData || !fileName) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'fileData and fileName are required' }),
        };
      }

      console.log(`[Player Upload] Starting upload for ${fileName} by user ${user.userId}`);

      // Convert base64 to buffer
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Create unique file path for this user
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${FOLDER_PATH}/${user.userId}/${timestamp}-${sanitizedFileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
          contentType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('[Player Upload] Storage error:', uploadError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Failed to upload file to storage',
            message: uploadError.message,
          }),
        };
      }

      console.log(`[Player Upload] File uploaded to storage: ${storagePath}`);

      // Create player playbook metadata record
      const dbContentType = mapContentTypeToDatabase(metadata?.content_type);

      const { data: metadataRecord, error: metadataError } = await supabase
        .from('player_playbook_metadata')
        .insert({
          user_id: user.userId,
          org_id: user.orgId,
          file_paths: [storagePath],
          side_of_ball: metadata?.side_of_ball,
          content_type: dbContentType,
          position_relevance: metadata?.position_relevance || ['all'],
          level: metadata?.level,
          formation_name: metadata?.formation_name,
          concept_name: metadata?.concept_name,
          custom_notes: metadata?.custom_notes,
          tags: metadata?.tags || [],
          play_type: metadata?.play_type,
          unit: metadata?.unit,
          playbook_section: metadata?.playbook_section,
          primary_classification: metadata?.primary_classification,
          situation: metadata?.situation,
          is_private: true,
        })
        .select()
        .single();

      if (metadataError) {
        console.error('[Player Upload] Metadata creation error:', metadataError);
        // Try to clean up uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Failed to create metadata',
            message: metadataError.message,
          }),
        };
      }

      console.log(`[Player Upload] Metadata created: ${metadataRecord.id}`);

      // Auto-create a play record from the uploaded file
      const playName = metadata?.formation_name || metadata?.concept_name || fileName.replace(/\.[^/.]+$/, '');

      const { data: play, error: playError } = await supabase
        .from('player_plays')
        .insert({
          user_id: user.userId,
          org_id: user.orgId,
          player_playbook_metadata_id: metadataRecord.id,
          name: playName,
          short_name: playName.substring(0, 50),
          play_type: metadata?.play_type || 'PASS',
          concept: metadata?.concept_name,
          formation_name: metadata?.formation_name,
          ai_insights: null,
          content_status: 'draft', // Start as draft, can be processed later
          is_archived: false,
          created_by: user.userId,
          unit: metadata?.unit || null,
          playbook_section: metadata?.playbook_section || null,
          primary_classification: metadata?.primary_classification || null,
          situation: metadata?.situation || null,
          is_private: true,
        })
        .select()
        .single();

      if (playError) {
        console.error('[Player Upload] Play creation error:', playError);
        // Don't fail the whole upload, metadata was created successfully
        console.warn('[Player Upload] Continuing despite play creation error');
      } else {
        console.log(`[Player Upload] Play created: ${play.id}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          metadataId: metadataRecord.id,
          playId: play?.id || null,
          filePath: storagePath,
          url: urlData.publicUrl,
          message: 'File uploaded successfully to your library',
        }),
      };
    } catch (error: any) {
      console.error('[Player Upload] Error:', error);
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
