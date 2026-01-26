import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verify environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Playbooks] CRITICAL: Missing Supabase credentials!', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUCKET_NAME = 'Chalkboard Bucket';
const FOLDER_PATH = 'public'; // Store files in public folder within bucket

export const handler: Handler = async (event, context) => {
  const { httpMethod } = event;

  // GET - List all playbooks from Supabase Storage
  if (httpMethod === 'GET') {
    try {
      // List all files in the public folder
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(FOLDER_PATH, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error('Supabase Storage error:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Failed to fetch playbooks from storage',
            message: error.message,
          }),
        };
      }

      // Filter for supported file types and map to playbook format
      const playbooks = (files || [])
        .filter(file => {
          const ext = file.name.split('.').pop()?.toLowerCase();
          return ext && ['pdf', 'png', 'jpg', 'jpeg'].includes(ext);
        })
        .map(file => {
          const ext = file.name.split('.').pop()?.toLowerCase();

          // Get public URL for the file
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(`${FOLDER_PATH}/${file.name}`);

          return {
            id: file.id || file.name,
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            fileName: file.name,
            type: ext === 'pdf' ? 'pdf' : 'image',
            uploadedAt: file.created_at || new Date().toISOString(),
            tags: [],
            playType: 'Unknown',
            url: urlData.publicUrl,
          };
        });

      // Fetch metadata for all files
      const filePaths = playbooks.map(p => `${FOLDER_PATH}/${p.fileName}`);
      const { data: metadataRecords, error: metadataError } = await supabase
        .from('playbook_metadata')
        .select('*')
        .overlaps('file_paths', filePaths);

      if (metadataError) {
        console.warn('Failed to fetch metadata:', metadataError);
        // Continue without metadata rather than failing
      }

      // Merge metadata with playbooks
      const playbooksWithMetadata = playbooks.map(playbook => {
        const filePath = `${FOLDER_PATH}/${playbook.fileName}`;
        const metadata = metadataRecords?.find(m => m.file_paths.includes(filePath));

        return {
          ...playbook,
          metadata: metadata || null,
          isBuiltPlay: metadata?.is_built_play || false,
        };
      });

      // Also fetch built plays (those with is_built_play = true but might not have files in storage)
      const { data: builtPlays, error: builtPlaysError } = await supabase
        .from('playbook_metadata')
        .select('*')
        .eq('is_built_play', true);

      if (builtPlaysError) {
        console.warn('Failed to fetch built plays:', builtPlaysError);
      }

      // Add built plays that aren't already in the list
      const builtPlayRecords = (builtPlays || [])
        .filter(bp => {
          // Only include if not already in playbooksWithMetadata
          const filePath = bp.file_paths?.[0] || '';
          return !playbooksWithMetadata.some(p => `${FOLDER_PATH}/${p.fileName}` === filePath);
        })
        .map(bp => ({
          id: bp.id,
          name: bp.formation_name || 'Built Play',
          fileName: `built-play-${bp.id}.json`,
          type: 'built-play',
          uploadedAt: bp.created_at || new Date().toISOString(),
          tags: [],
          playType: bp.play_data?.metadata?.playType || 'Unknown',
          url: '', // No URL for built plays
          metadata: bp,
          isBuiltPlay: true,
        }));

      const allPlaybooks = [...playbooksWithMetadata, ...builtPlayRecords];

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allPlaybooks),
      };
    } catch (error: any) {
      console.error('Error fetching playbooks:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch playbooks',
          message: error.message,
        }),
      };
    }
  }

  // POST - Upload new playbook to Supabase Storage with optional metadata
  if (httpMethod === 'POST') {
    try {
      const { fileName, fileData, playData, metadata, orgId, teamId, isBuiltPlay } = JSON.parse(event.body || '{}');

      // Validation: Either fileData (for uploads) or playData (for built plays) must be provided
      if (!fileName || (!fileData && !playData)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'fileName and either fileData or playData are required' }),
        };
      }

      let filePath: string;
      let publicUrl: string;
      let ext: string | undefined;

      // Handle built plays differently from file uploads
      if (isBuiltPlay && playData) {
        // For built plays, we don't upload a file to storage
        // Instead, we'll store the play data in metadata
        filePath = `${FOLDER_PATH}/${fileName}`;
        ext = 'json'; // Built plays are JSON
        publicUrl = ''; // No public URL for built plays

        console.log('[Built Play] Skipping file upload, will store play data in metadata');
      } else if (fileData) {
        // Standard file upload path
        // Convert base64 to buffer
        const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
        const buffer = Buffer.from(base64Data, 'base64');

        // Determine content type from file extension
        ext = fileName.split('.').pop()?.toLowerCase();
        const contentType = ext === 'pdf'
          ? 'application/pdf'
          : ext === 'png'
          ? 'image/png'
          : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : 'application/octet-stream';

        // Upload to Supabase Storage
        filePath = `${FOLDER_PATH}/${fileName}`;
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType,
            upsert: true, // Replace if file already exists
          });

        if (error) {
          console.error('Supabase upload error:', error);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Failed to upload to storage',
              message: error.message,
            }),
          };
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        publicUrl = urlData.publicUrl;
      } else {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid request: either fileData or playData must be provided' }),
        };
      }

      // Save metadata if provided
      let savedMetadata = null;
      if (metadata && orgId) {
        const metadataToSave = {
          org_id: orgId,
          team_id: teamId || null, // Optional team filter
          file_paths: metadata.file_paths || [filePath],
          side_of_ball: metadata.side_of_ball,
          content_type: metadata.content_type,
          position_relevance: metadata.position_relevance || ['all'],
          level: metadata.level,
          formation_name: metadata.formation_name,
          concept_name: metadata.concept_name,
          custom_notes: metadata.custom_notes,
          is_built_play: isBuiltPlay || false, // Mark if this is a built play
          play_data: isBuiltPlay && playData ? playData : null, // Store structured play data
        };

        const { data: metadataData, error: metadataError } = await supabase
          .from('playbook_metadata')
          .insert(metadataToSave)
          .select()
          .single();

        if (metadataError) {
          console.error('[Upload] Failed to save metadata:', metadataError);
          console.error('[Upload] Metadata error details:', {
            code: metadataError.code,
            message: metadataError.message,
            details: metadataError.details,
            hint: metadataError.hint,
          });
          // Continue without failing the upload
        } else {
          savedMetadata = metadataData;
        }
      } else if (metadata && !orgId) {
        console.warn('[Upload] Metadata provided but orgId missing - skipping metadata save');
      }

      const newPlay = {
        id: fileName,
        name: fileName.replace(/\.[^/.]+$/, ''),
        fileName,
        type: isBuiltPlay ? 'built-play' : (ext === 'pdf' ? 'pdf' : 'image'),
        uploadedAt: new Date().toISOString(),
        tags: [],
        playType: isBuiltPlay && playData ? playData.metadata.playType : 'Unknown',
        url: publicUrl,
        metadata: savedMetadata,
        isBuiltPlay: isBuiltPlay || false,
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlay),
      };
    } catch (error: any) {
      console.error('Error uploading playbook:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to upload playbook',
          message: error.message,
        }),
      };
    }
  }

  // DELETE - Remove a playbook (file, metadata, and associated play records)
  if (httpMethod === 'DELETE') {
    try {
      const { fileName, metadataId: providedMetadataId } = JSON.parse(event.body || '{}');

      if (!fileName && !providedMetadataId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'fileName or metadataId is required' }),
        };
      }

      console.log('[Delete Playbook] Request:', { fileName, metadataId: providedMetadataId });

      let metadataId = providedMetadataId;
      let metadata;

      // If we have metadataId, verify it exists
      if (metadataId) {
        console.log('[Delete Playbook] Fetching metadata by ID:', metadataId);
        const { data: metadataRecord, error: metadataFetchError } = await supabase
          .from('playbook_metadata')
          .select('id, file_paths, is_built_play')
          .eq('id', metadataId)
          .maybeSingle();

        if (metadataFetchError) {
          console.error('[Delete Playbook] Error fetching metadata:', metadataFetchError);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to fetch metadata', details: metadataFetchError.message }),
          };
        }

        if (!metadataRecord) {
          console.error('[Delete Playbook] Metadata not found:', metadataId);
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Metadata record not found' }),
          };
        }

        metadata = metadataRecord;
        console.log('[Delete Playbook] Found metadata:', metadata);
      } else if (fileName) {
        // Find metadata by file path
        const filePath = `${FOLDER_PATH}/${fileName}`;
        console.log('[Delete Playbook] Looking up metadata by file path:', filePath);

        const { data: metadataRecord, error: metadataFetchError } = await supabase
          .from('playbook_metadata')
          .select('id, file_paths, is_built_play')
          .overlaps('file_paths', [filePath])
          .maybeSingle();

        if (metadataFetchError) {
          console.error('[Delete Playbook] Error looking up metadata:', metadataFetchError);
        }

        if (metadataRecord) {
          metadata = metadataRecord;
          metadataId = metadataRecord.id;
          console.log('[Delete Playbook] Found metadata by file path:', metadataId);
        } else {
          console.log('[Delete Playbook] No metadata found for file, will only delete file from storage');
        }
      }

      // Step 1: Find and delete associated plays (and their children)
      if (metadataId) {
        console.log('[Delete Playbook] Finding associated plays for metadata:', metadataId);

        const { data: associatedPlays, error: playsError } = await supabase
          .from('plays')
          .select('id')
          .eq('playbook_metadata_id', metadataId);

        if (playsError) {
          console.error('[Delete Playbook] Error fetching plays:', playsError);
        }

        if (associatedPlays && associatedPlays.length > 0) {
          console.log('[Delete Playbook] Found', associatedPlays.length, 'associated plays, deleting...');

          for (const play of associatedPlays) {
            // Delete assignments for this play
            const { error: assignmentError } = await supabase
              .from('play_assignments')
              .delete()
              .eq('play_id', play.id);

            if (assignmentError) {
              console.error('[Delete Playbook] Error deleting assignments:', assignmentError);
            }

            // Delete flashcards for this play
            const { error: flashcardError } = await supabase
              .from('flashcard_templates')
              .delete()
              .eq('play_id', play.id);

            if (flashcardError) {
              console.error('[Delete Playbook] Error deleting flashcards:', flashcardError);
            }

            // Delete the play itself
            const { error: playDeleteError } = await supabase
              .from('plays')
              .delete()
              .eq('id', play.id);

            if (playDeleteError) {
              console.error('[Delete Playbook] Error deleting play:', playDeleteError);
            } else {
              console.log('[Delete Playbook] Deleted play and related data:', play.id);
            }
          }
        } else {
          console.log('[Delete Playbook] No associated plays found');
        }

        // Step 2: Delete the metadata record
        console.log('[Delete Playbook] Deleting metadata record:', metadataId);
        console.log('[Delete Playbook] Using service role key:', supabaseServiceKey ? 'YES (key exists)' : 'NO (MISSING!)');

        const { data: deletedMetadata, error: metadataDeleteError, count, status, statusText } = await supabase
          .from('playbook_metadata')
          .delete()
          .eq('id', metadataId)
          .select();

        console.log('[Delete Playbook] Delete response:', {
          error: metadataDeleteError,
          count,
          status,
          statusText,
          deletedCount: deletedMetadata?.length || 0,
        });

        if (metadataDeleteError) {
          console.error('[Delete Playbook] Error deleting metadata:', {
            message: metadataDeleteError.message,
            details: metadataDeleteError.details,
            hint: metadataDeleteError.hint,
            code: metadataDeleteError.code,
          });
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Failed to delete metadata',
              details: metadataDeleteError.message,
              hint: metadataDeleteError.hint,
              code: metadataDeleteError.code,
            }),
          };
        }

        if (!deletedMetadata || deletedMetadata.length === 0) {
          console.error('[Delete Playbook] Metadata was not deleted (no rows affected)');

          // Double-check if record still exists
          const { data: stillExists } = await supabase
            .from('playbook_metadata')
            .select('id')
            .eq('id', metadataId)
            .maybeSingle();

          console.error('[Delete Playbook] Record still exists after delete:', !!stillExists);

          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Failed to delete metadata',
              details: 'No rows were deleted. The record may be protected by RLS policies.',
              stillExists: !!stillExists,
            }),
          };
        }

        console.log('[Delete Playbook] Metadata deleted successfully. Rows deleted:', deletedMetadata.length);
      }

      // Step 3: Delete the file from storage (if not a built play)
      if (fileName && !fileName.startsWith('built-play-')) {
        const filePath = `${FOLDER_PATH}/${fileName}`;
        console.log('[Delete Playbook] Deleting file from storage:', filePath);

        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath]);

        if (storageError) {
          console.error('[Delete Playbook] Storage delete error:', storageError);
          // Continue - metadata was already deleted
        }
      }

      console.log('[Delete Playbook] Delete complete');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Playbook, metadata, and associated plays deleted successfully'
        }),
      };
    } catch (error: any) {
      console.error('[Delete Playbook] Unexpected error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to delete playbook',
          message: error.message,
        }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
