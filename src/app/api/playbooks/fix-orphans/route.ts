import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'Chalkboard Bucket';
const FOLDER_PATH = 'public';

/**
 * POST endpoint to fix orphaned files in storage that don't have metadata records
 * This creates metadata entries for files that were uploaded but don't have associated metadata
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId = '00000000-0000-0000-0000-000000000000' } = body;

    console.log('[Fix Orphans] Starting orphan detection...');

    // Step 1: Get all files from storage
    const { data: files, error: filesError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(FOLDER_PATH, {
        limit: 1000,
        offset: 0,
      });

    if (filesError) {
      console.error('[Fix Orphans] Error listing files:', filesError);
      return NextResponse.json(
        { error: 'Failed to list files', message: filesError.message },
        { status: 500 }
      );
    }

    console.log('[Fix Orphans] Found', files?.length || 0, 'files in storage');

    // Step 2: Get all existing metadata records
    const { data: existingMetadata, error: metadataError } = await supabase
      .from('playbook_metadata')
      .select('file_paths');

    if (metadataError) {
      console.error('[Fix Orphans] Error fetching metadata:', metadataError);
      return NextResponse.json(
        { error: 'Failed to fetch metadata', message: metadataError.message },
        { status: 500 }
      );
    }

    // Create a Set of all file paths that have metadata
    const existingFilePaths = new Set<string>();
    existingMetadata?.forEach(meta => {
      meta.file_paths?.forEach((path: string) => existingFilePaths.add(path));
    });

    console.log('[Fix Orphans] Found', existingFilePaths.size, 'files with metadata');

    // Step 3: Find orphaned files (files in storage without metadata)
    const orphanedFiles = (files || []).filter(file => {
      const filePath = `${FOLDER_PATH}/${file.name}`;
      return !existingFilePaths.has(filePath);
    });

    console.log('[Fix Orphans] Found', orphanedFiles.length, 'orphaned files');

    if (orphanedFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orphaned files found',
        orphanedCount: 0,
        createdCount: 0,
      });
    }

    // Step 4: Create metadata for orphaned files
    const metadataRecords = orphanedFiles.map(file => {
      const filePath = `${FOLDER_PATH}/${file.name}`;
      const ext = file.name.split('.').pop()?.toLowerCase();

      return {
        team_id: teamId,
        file_paths: [filePath],
        side_of_ball: null,
        content_type: null,
        position_relevance: ['all'],
        level: null,
        formation_name: file.name.replace(/\.[^/.]+$/, ''), // Use filename without extension
        concept_name: null,
        custom_notes: 'Auto-created metadata for orphaned file',
        tags: [],
        is_built_play: false,
        play_data: null,
      };
    });

    // Insert metadata records
    const { data: insertedMetadata, error: insertError } = await supabase
      .from('playbook_metadata')
      .insert(metadataRecords)
      .select();

    if (insertError) {
      console.error('[Fix Orphans] Error inserting metadata:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to create metadata',
          message: insertError.message,
          orphanedFiles: orphanedFiles.map(f => f.name),
        },
        { status: 500 }
      );
    }

    console.log('[Fix Orphans] Created metadata for', insertedMetadata?.length || 0, 'files');

    return NextResponse.json({
      success: true,
      message: `Successfully created metadata for ${insertedMetadata?.length || 0} orphaned files`,
      orphanedCount: orphanedFiles.length,
      createdCount: insertedMetadata?.length || 0,
      files: orphanedFiles.map(f => f.name),
    });
  } catch (error: any) {
    console.error('[Fix Orphans] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fix orphaned files', message: error.message },
      { status: 500 }
    );
  }
}
