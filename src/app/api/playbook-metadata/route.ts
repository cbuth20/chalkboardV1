import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
// Service role bypasses RLS which is appropriate for server-side API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    'concept': 'reference',
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

// GET - Fetch all playbook metadata
export async function GET() {
  try {
    // Fetch all metadata records
    const { data: metadataRecords, error } = await supabase
      .from('playbook_metadata')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch playbook metadata',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Transform metadata into a play-list format
    const plays = (metadataRecords || []).map(metadata => {
      // Extract file name from first file path for display
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

    return NextResponse.json(plays);
  } catch (error: any) {
    console.error('Error fetching playbook metadata:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch playbook metadata',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create new metadata record
export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json();

    console.log('POST /api/playbook-metadata - Received metadata:', metadata);
    console.log('Using service role key:', supabaseServiceKey ? 'YES (key present)' : 'NO (key missing!)');

    if (!metadata.file_paths || metadata.file_paths.length === 0) {
      return NextResponse.json(
        { error: 'file_paths is required' },
        { status: 400 }
      );
    }

    if (!metadata.team_id) {
      return NextResponse.json(
        { error: 'team_id is required' },
        { status: 400 }
      );
    }

    // Map frontend content type to database enum value
    const dbContentType = mapContentTypeToDatabase(metadata.content_type);

    const insertData = {
      team_id: metadata.team_id,
      file_paths: metadata.file_paths,
      side_of_ball: metadata.side_of_ball,
      content_type: dbContentType,
      position_relevance: metadata.position_relevance || ['all'],
      level: metadata.level,
      formation_name: metadata.formation_name,
      concept_name: metadata.concept_name,
      custom_notes: metadata.custom_notes,
    };

    console.log('[Metadata Mapping] Frontend content_type:', metadata.content_type, '-> Database:', dbContentType);
    console.log('Inserting metadata with data:', insertData);

    const { data, error } = await supabase
      .from('playbook_metadata')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        {
          error: 'Failed to create metadata',
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    console.log('Successfully created metadata:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating metadata:', error);
    return NextResponse.json(
      {
        error: 'Failed to create metadata',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update metadata record
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Map frontend content type to database enum value
    const dbContentType = mapContentTypeToDatabase(updates.content_type);

    const { data, error } = await supabase
      .from('playbook_metadata')
      .update({
        side_of_ball: updates.side_of_ball,
        content_type: dbContentType,
        position_relevance: updates.position_relevance,
        level: updates.level,
        formation_name: updates.formation_name,
        concept_name: updates.concept_name,
        custom_notes: updates.custom_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    console.log('[Metadata Mapping] UPDATE - Frontend content_type:', updates.content_type, '-> Database:', dbContentType);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        {
          error: 'Failed to update metadata',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating metadata:', error);
    return NextResponse.json(
      {
        error: 'Failed to update metadata',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete metadata record
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('playbook_metadata')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        {
          error: 'Failed to delete metadata',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting metadata:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete metadata',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
