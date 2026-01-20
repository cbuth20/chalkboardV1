import { Handler } from '@netlify/functions';
import fs from 'fs';
import path from 'path';
import { getSystemPrompt, getUserPrompt, buildMetadataContext } from './analysis-prompts';

export const handler: Handler = async (event, context) => {
  const { httpMethod } = event;

  // GET - List all plays available for analysis
  if (httpMethod === 'GET') {
    try {
      const playbooksDir = path.join(process.cwd(), 'public', 'playbooks');

      if (!fs.existsSync(playbooksDir)) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([]),
        };
      }

      const files = fs.readdirSync(playbooksDir);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.png', '.jpg', '.jpeg'].includes(ext);
      });

      const plays = imageFiles.map((file, index) => ({
        id: `play-${index}`,
        name: file.replace(/\.[^/.]+$/, ''),
        shortName: file.replace(/\.[^/.]+$/, '').substring(0, 20),
        fileName: file,
        imageUrl: `/playbooks/${file}`,
        analyzed: false,
        playType: 'pass' as const,
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plays),
      };
    } catch (error: any) {
      console.error('Error listing plays:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to list plays', message: error.message }),
      };
    }
  }

  // POST - Analyze a specific play image
  if (httpMethod === 'POST') {
    try {
      const { imageUrl, fileName, metadata } = JSON.parse(event.body || '{}');

      if (!imageUrl) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'imageUrl is required' }),
        };
      }

      // Fetch the image from the URL (Supabase Storage)
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Failed to fetch image from URL' }),
        };
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      // Determine mime type from file extension or content-type header
      const imageMimeType = imageResponse.headers.get('content-type');
      const mimeType = imageMimeType || (fileName?.endsWith('.png') ? 'image/png' : 'image/jpeg');

      const openaiApiKey = process.env.GPT_KEY;
      if (!openaiApiKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'OpenAI API key not configured' }),
        };
      }

      // Get content-type specific prompts
      const contentType = metadata?.content_type;
      const systemPrompt = getSystemPrompt(contentType);
      const baseUserPrompt = getUserPrompt(contentType);
      const metadataContext = buildMetadataContext(metadata);

      const userPrompt = `${baseUserPrompt}${metadataContext}`;

      console.log('[Analyze Plays Netlify] Using content type:', contentType || 'play (default)');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userPrompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to analyze image with GPT', details: error }),
        };
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;

      let playData;
      try {
        const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : analysisText;
        playData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse GPT response:', analysisText);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to parse analysis result', rawResponse: analysisText }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...playData,
          fileName,
          imageUrl,
          analyzedAt: new Date().toISOString(),
        }),
      };
    } catch (error: any) {
      console.error('Error analyzing play:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to analyze play', message: error.message }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};

// System prompts are now imported from shared library
// See netlify/functions/analysis-prompts.ts for prompt definitions
