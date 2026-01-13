import { Handler } from '@netlify/functions';
import fs from 'fs';
import path from 'path';

export const handler: Handler = async (event, context) => {
  const { httpMethod } = event;

  // Get playbooks list - scan directory for files
  if (httpMethod === 'GET') {
    try {
      const playbooksDir = path.join(process.cwd(), 'public', 'playbooks');

      // Ensure directory exists
      if (!fs.existsSync(playbooksDir)) {
        fs.mkdirSync(playbooksDir, { recursive: true });
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([]),
        };
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
            tags: [],
            playType: 'Unknown',
            url: `/playbooks/${file}`,
          };
        })
        .sort((a, b) => {
          // Sort by upload date, newest first
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playbooks),
      };
    } catch (error: any) {
      console.error('Error reading playbooks:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to fetch playbooks',
          message: error.message,
        }),
      };
    }
  }

  // Upload new playbook
  if (httpMethod === 'POST') {
    try {
      const { fileName, fileData } = JSON.parse(event.body || '{}');

      if (!fileName || !fileData) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'fileName and fileData are required' }),
        };
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

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlay),
      };
    } catch (error: any) {
      console.error('Error uploading playbook:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to upload playbook',
          message: error.message,
        }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
