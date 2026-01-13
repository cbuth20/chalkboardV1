import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET - List all playbooks in public/playbooks directory
export async function GET() {
  try {
    const playbooksDir = path.join(process.cwd(), 'public', 'playbooks');

    // Ensure directory exists
    if (!fs.existsSync(playbooksDir)) {
      fs.mkdirSync(playbooksDir, { recursive: true });
      return NextResponse.json([]);
    }

    // Read all files in directory
    const files = fs.readdirSync(playbooksDir);

    // Filter for supported file types and get file stats
    const playbooks = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.pdf', '.png', '.jpg', '.jpeg'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(playbooksDir, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();

        return {
          id: file,
          name: file.replace(/\.[^/.]+$/, ''), // Remove extension
          fileName: file,
          type: ext === '.pdf' ? 'pdf' : 'image',
          uploadedAt: stats.mtime.toISOString(),
          tags: [], // Could be enhanced later
          playType: 'Unknown', // Could be enhanced later
          url: `/playbooks/${file}`,
        };
      })
      .sort((a, b) => {
        // Sort by upload date, newest first
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      });

    return NextResponse.json(playbooks);
  } catch (error: any) {
    console.error('Error reading playbooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playbooks', message: error.message },
      { status: 500 }
    );
  }
}

// POST - Upload new playbook
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

    const playbooksDir = path.join(process.cwd(), 'public', 'playbooks');

    // Ensure directory exists
    if (!fs.existsSync(playbooksDir)) {
      fs.mkdirSync(playbooksDir, { recursive: true });
    }

    // Save the file (assuming base64 encoded data)
    const filePath = path.join(playbooksDir, fileName);
    const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const ext = path.extname(fileName).toLowerCase();
    const newPlay = {
      id: fileName,
      name: fileName.replace(/\.[^/.]+$/, ''),
      fileName,
      type: ext === '.pdf' ? 'pdf' : 'image',
      uploadedAt: new Date().toISOString(),
      tags: [],
      playType: 'Unknown',
      url: `/playbooks/${fileName}`,
    };

    return NextResponse.json(newPlay);
  } catch (error: any) {
    console.error('Error uploading playbook:', error);
    return NextResponse.json(
      { error: 'Failed to upload playbook', message: error.message },
      { status: 500 }
    );
  }
}
