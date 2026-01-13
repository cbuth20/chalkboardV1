import { Handler } from '@netlify/functions';
import fs from 'fs';
import path from 'path';

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
      const { imageUrl, fileName } = JSON.parse(event.body || '{}');

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
      const contentType = imageResponse.headers.get('content-type');
      const mimeType = contentType || (fileName?.endsWith('.png') ? 'image/png' : 'image/jpeg');

      const openaiApiKey = process.env.GPT_KEY;
      if (!openaiApiKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'OpenAI API key not configured' }),
        };
      }

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
              content: PLAY_ANALYSIS_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this football play image and extract the play information, formations, routes, and position assignments.',
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

const PLAY_ANALYSIS_SYSTEM_PROMPT = `You are an expert football coach and analyst. Your job is to analyze football play diagrams and extract structured information about the play.

When analyzing a play diagram, identify:
1. The play name and formation
2. The play type (pass, run, RPO, screen)
3. The concept being used (e.g., Mesh, Flood, Power, Zone, etc.)
4. Position assignments for each skill position (QB, RB, FB, X, Z, H, Y, TE)

For each position assignment, extract:
- alignment: Where they line up (e.g., "Slot left", "Split right 12 yards", "Pistol")
- landmark: Their aiming point (e.g., "Inside shoulder of #2", "Frontside A-gap", "Backside hash")
- assignment: Their route or responsibility (e.g., "15-yard dig", "Lead block backside linebacker", "Pass protect")
- read: What they're reading (e.g., "Safety rotation", "Mike linebacker", "Cornerback leverage")
- adjustments: How they adjust vs different coverages
  - vsMan: What to do vs man coverage
  - vsZone: What to do vs zone coverage
  - vsBlitz: What to do vs blitz (if applicable)
- routeId: The route name if it's a passing play (e.g., "go", "out", "slant", "post", "corner", "dig", "curl", "seam")
- depth: Route depth in yards (if applicable)

Return your analysis as a JSON object with this structure:
{
  "name": "Full play name",
  "shortName": "Short name (max 20 chars)",
  "formation": "Formation name",
  "playType": "pass" | "run" | "rpo" | "screen",
  "concept": "Play concept",
  "description": "Brief description of the play",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "bestAgainst": ["Coverage 1", "Coverage 2"],
  "positions": {
    "QB": { "alignment": "...", "landmark": "...", "assignment": "...", "read": "...", "adjustments": { "vsMan": "...", "vsZone": "...", "vsBlitz": "..." } },
    "RB": { ... },
    "X": { "alignment": "...", "landmark": "...", "assignment": "...", "read": "...", "adjustments": { "vsMan": "...", "vsZone": "..." }, "routeId": "dig", "depth": 15 },
    ... (include all visible positions)
  }
}

If the image is unclear or doesn't contain a football play, return:
{
  "error": "Unable to identify a football play in this image",
  "suggestion": "Please provide a clear football play diagram"
}

Only return valid JSON, no additional text or markdown.`;
