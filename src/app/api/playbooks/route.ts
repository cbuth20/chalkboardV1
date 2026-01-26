import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PlaybookMetadataInput } from '@/types/playbook-metadata';

// Initialize Supabase client with service role for server-side operations
// Service role bypasses RLS which is appropriate for server-side API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'Chalkboard Bucket';
const FOLDER_PATH = 'public'; // Store files in public folder within bucket

// Map frontend content types to database enum values
// Frontend types -> Database enum values
function mapContentTypeToDatabase(frontendType: string | null | undefined): string | null {
  if (!frontendType) return null;

  const mapping: Record<string, string> = {
    // Frontend type mappings
    'single_play': 'play',
    'notes': 'legend',
    'install_notes': 'legend',
    'full_playbook': 'index',
    'concept': 'reference',  // Generic concept sheets map to reference
    // Types that match database enum pass through: play, coverage, formation, legend, index, coaching_points, technique, terminology, reference, other
  };

  const mappedType = mapping[frontendType] || frontendType;

  // Validate the mapped type is valid for database (fallback to 'other' if not recognized)
  const validTypes = ['play', 'coverage', 'formation', 'legend', 'index', 'coaching_points', 'technique', 'terminology', 'reference', 'other'];

  if (!validTypes.includes(mappedType)) {
    console.warn(`[Content Type Mapping] Unknown type "${frontendType}" mapped to "${mappedType}", using "other" as fallback`);
    return 'other';
  }

  return mappedType;
}

// GET - List all playbooks from Supabase Storage with metadata
export async function GET() {
  try {
    console.log('[Playbooks API] Attempting to list files...');
    console.log('[Playbooks API] Bucket:', BUCKET_NAME);
    console.log('[Playbooks API] Folder:', FOLDER_PATH);
    console.log('[Playbooks API] Supabase URL:', supabaseUrl);
    console.log('[Playbooks API] Has Service Key:', !!supabaseServiceKey);

    // List all files in the public folder
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(FOLDER_PATH, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('[Playbooks API] Supabase Storage error:', error);
      console.error('[Playbooks API] Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
        stack: error.stack,
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch playbooks from storage',
          message: error.message,
          details: {
            bucket: BUCKET_NAME,
            folder: FOLDER_PATH,
            errorName: error.name,
          },
        },
        { status: 500 }
      );
    }

    console.log('[Playbooks API] Successfully listed files:', files?.length || 0);

    // Filter for supported file types and map to playbook format
    const playbooks = (files || [])
      .filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext && ['pdf', 'png', 'jpg', 'jpeg', 'heic', 'heif'].includes(ext);
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
          type: ext === 'pdf' ? 'pdf' : 'image', // HEIC/HEIF are image types
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

    return NextResponse.json(allPlaybooks);
  } catch (error: any) {
    console.error('Error fetching playbooks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch playbooks',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Upload new playbook to Supabase Storage with optional metadata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileData, playData, metadata, orgId, teamId, isBuiltPlay } = body as {
      fileName: string;
      fileData?: string;
      playData?: any; // Structured play data from PlayBuilder
      metadata?: PlaybookMetadataInput;
      orgId?: string;
      teamId?: string;
      isBuiltPlay?: boolean;
    };

    // Validation: Either fileData (for uploads) or playData (for built plays) must be provided
    if (!fileName || (!fileData && !playData)) {
      return NextResponse.json(
        { error: 'fileName and either fileData or playData are required' },
        { status: 400 }
      );
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
        : ext === 'heic'
        ? 'image/heic'
        : ext === 'heif'
        ? 'image/heif'
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
        return NextResponse.json(
          {
            error: 'Failed to upload to storage',
            message: error.message,
          },
          { status: 500 }
        );
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      publicUrl = urlData.publicUrl;
    } else {
      return NextResponse.json(
        { error: 'Invalid request: either fileData or playData must be provided' },
        { status: 400 }
      );
    }

    // Save metadata - ALWAYS create metadata for uploaded files
    let savedMetadata = null;
    if (orgId) {
      // Map frontend content type to database enum value
      const dbContentType = mapContentTypeToDatabase(metadata?.content_type);

      const metadataToSave = {
        org_id: orgId,
        team_id: teamId || null, // Optional team filter
        file_paths: [filePath],
        side_of_ball: metadata?.side_of_ball || null,
        content_type: dbContentType,
        position_relevance: metadata?.position_relevance || ['all'],
        level: metadata?.level || null,
        formation_name: metadata?.formation_name || null,
        concept_name: metadata?.concept_name || null,
        custom_notes: metadata?.custom_notes || null,
        tags: metadata?.tags || [], // NEW: Include tags field
        is_built_play: isBuiltPlay || false,
        play_data: isBuiltPlay && playData ? playData : null,
      };

      console.log('[Metadata Mapping] Frontend content_type:', metadata?.content_type, '-> Database:', dbContentType);
      console.log('[Upload] Saving metadata:', metadataToSave);

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
        console.log('[Upload] Metadata saved successfully:', metadataData.id);
        savedMetadata = metadataData;
      }
    } else {
      console.warn('[Upload] No orgId provided - cannot save metadata');
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

    return NextResponse.json(newPlay);
  } catch (error: any) {
    console.error('Error uploading playbook:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload playbook',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove a playbook from Supabase Storage and database
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    const filePath = `${FOLDER_PATH}/${fileName}`;
    let deletedCounts = {
      plays: 0,
      assignments: 0,
      flashcards: 0,
      metadata: 0,
    };

    // Find playbook_metadata by file_path
    const { data: metadata, error: metadataFetchError } = await supabase
      .from('playbook_metadata')
      .select('id')
      .contains('file_paths', [filePath])
      .maybeSingle();

    if (metadataFetchError) {
      console.error('Error fetching metadata:', metadataFetchError);
    }

    if (metadata) {
      // Find all plays linked to this metadata
      const { data: plays, error: playsFetchError } = await supabase
        .from('plays')
        .select('id')
        .eq('playbook_metadata_id', metadata.id);

      if (playsFetchError) {
        console.error('Error fetching plays:', playsFetchError);
      }

      if (plays && plays.length > 0) {
        const playIds = plays.map(p => p.id);

        // Delete play_assignments (will cascade from play deletion, but doing explicitly)
        const { count: assignmentsCount } = await supabase
          .from('play_assignments')
          .delete()
          .in('play_id', playIds)
          .select('id', { count: 'exact', head: true });

        deletedCounts.assignments = assignmentsCount || 0;

        // Delete flashcard_templates
        const { count: flashcardsCount } = await supabase
          .from('flashcard_templates')
          .delete()
          .in('play_id', playIds)
          .select('id', { count: 'exact', head: true });

        deletedCounts.flashcards = flashcardsCount || 0;

        // Delete plays
        const { count: playsCount, error: playsDeleteError } = await supabase
          .from('plays')
          .delete()
          .in('id', playIds)
          .select('id', { count: 'exact', head: true });

        if (playsDeleteError) {
          console.error('Error deleting plays:', playsDeleteError);
        } else {
          deletedCounts.plays = playsCount || 0;
        }
      }

      // Delete playbook_metadata
      const { count: metadataCount, error: metadataDeleteError } = await supabase
        .from('playbook_metadata')
        .delete()
        .eq('id', metadata.id)
        .select('id', { count: 'exact', head: true });

      if (metadataDeleteError) {
        console.error('Error deleting metadata:', metadataDeleteError);
      } else {
        deletedCounts.metadata = metadataCount || 0;
      }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) {
      console.error('Supabase storage delete error:', storageError);
      return NextResponse.json(
        {
          error: 'Failed to delete from storage',
          message: storageError.message,
          partialSuccess: deletedCounts,
        },
        { status: 500 }
      );
    }

    console.log('Deleted:', deletedCounts);

    return NextResponse.json({
      success: true,
      message: 'Play and all related data deleted successfully',
      deleted: deletedCounts,
    });
  } catch (error: any) {
    console.error('Error deleting playbook:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete playbook',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
