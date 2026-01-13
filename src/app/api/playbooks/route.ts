import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'Chalkboard Bucket';
const FOLDER_PATH = 'public'; // Store files in public folder within bucket

// GET - List all playbooks from Supabase Storage
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

    return NextResponse.json(playbooks);
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

// POST - Upload new playbook to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileData } = body;

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

    const newPlay = {
      id: fileName,
      name: fileName.replace(/\.[^/.]+$/, ''),
      fileName,
      type: ext === 'pdf' ? 'pdf' : 'image',
      uploadedAt: new Date().toISOString(),
      tags: [],
      playType: 'Unknown',
      url: urlData.publicUrl,
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

// DELETE - Remove a playbook from Supabase Storage
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
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        {
          error: 'Failed to delete from storage',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
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
