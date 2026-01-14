import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    if (!metadata.file_paths || metadata.file_paths.length === 0) {
      return NextResponse.json(
        { error: 'file_paths is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('playbook_metadata')
      .insert({
        file_paths: metadata.file_paths,
        side_of_ball: metadata.side_of_ball,
        content_type: metadata.content_type,
        position_relevance: metadata.position_relevance || ['all'],
        level: metadata.level,
        formation_name: metadata.formation_name,
        concept_name: metadata.concept_name,
        custom_notes: metadata.custom_notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        {
          error: 'Failed to create metadata',
          message: error.message,
        },
        { status: 500 }
      );
    }

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

    const { data, error } = await supabase
      .from('playbook_metadata')
      .update({
        side_of_ball: updates.side_of_ball,
        content_type: updates.content_type,
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
