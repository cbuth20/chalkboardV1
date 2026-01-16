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

// GET - List all playbooks from Supabase Storage with metadata
export async function GET() {
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
      return NextResponse.json(
        {
          error: 'Failed to fetch playbooks from storage',
          message: error.message,
        },
        { status: 500 }
      );
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
      };
    });

    return NextResponse.json(playbooksWithMetadata);
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
    const { fileName, fileData, metadata, teamId } = body as {
      fileName: string;
      fileData: string;
      metadata?: PlaybookMetadataInput;
      teamId?: string;
    };

    if (!fileName || !fileData) {
      return NextResponse.json(
        { error: 'fileName and fileData are required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine content type from file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    const contentType = ext === 'pdf'
      ? 'application/pdf'
      : ext === 'png'
      ? 'image/png'
      : ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : 'application/octet-stream';

    // Upload to Supabase Storage
    const filePath = `${FOLDER_PATH}/${fileName}`;
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

    // Ensure team exists (create default team if using placeholder UUID)
    if (teamId === '00000000-0000-0000-0000-000000000000') {
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('id', teamId)
        .single();

      if (!existingTeam) {
        // Create default team
        await supabase.from('teams').insert({
          id: teamId,
          name: 'Default Team',
          slug: 'default-team',
          season: '2024',
        });
      }
    }

    // Save metadata if provided
    let savedMetadata = null;
    if (metadata && teamId) {
      const metadataToSave = {
        team_id: teamId,
        file_paths: metadata.file_paths || [filePath],
        side_of_ball: metadata.side_of_ball,
        content_type: metadata.content_type,
        position_relevance: metadata.position_relevance || ['all'],
        level: metadata.level,
        formation_name: metadata.formation_name,
        concept_name: metadata.concept_name,
        custom_notes: metadata.custom_notes,
      };

      const { data: metadataData, error: metadataError } = await supabase
        .from('playbook_metadata')
        .insert(metadataToSave)
        .select()
        .single();

      if (metadataError) {
        console.error('Failed to save metadata:', metadataError);
        console.error('Metadata error details:', {
          code: metadataError.code,
          message: metadataError.message,
          details: metadataError.details,
          hint: metadataError.hint,
        });
        // Continue without failing the upload
      } else {
        savedMetadata = metadataData;
      }
    } else if (metadata && !teamId) {
      console.warn('Metadata provided but teamId missing - skipping metadata save');
    }

    const newPlay = {
      id: fileName,
      name: fileName.replace(/\.[^/.]+$/, ''),
      fileName,
      type: ext === 'pdf' ? 'pdf' : 'image',
      uploadedAt: new Date().toISOString(),
      tags: [],
      playType: 'Unknown',
      url: urlData.publicUrl,
      metadata: savedMetadata,
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
