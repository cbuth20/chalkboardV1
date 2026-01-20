import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import convert from 'heic-convert';
import { PlaybookMetadata } from '@/types/playbook-metadata';
import { getSystemPrompt, getUserPrompt, buildMetadataContext } from '@/lib/analysis-prompts';

// This endpoint analyzes playbook files and generates dynamic content for the assignment tracker
export async function GET() {
  try {
    const playbooksDir = path.join(process.cwd(), 'public', 'playbooks');

    if (!fs.existsSync(playbooksDir)) {
      return NextResponse.json([]);
    }

    // Get all image files
    const files = fs.readdirSync(playbooksDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.heic', '.heif', '.gif', '.webp'].includes(ext);
    });

    // For now, return placeholder data structure
    // We'll implement actual GPT Vision analysis in the next step
    const plays = imageFiles.map((file, index) => ({
      id: `play-${index}`,
      name: file.replace(/\.[^/.]+$/, ''),
      shortName: file.replace(/\.[^/.]+$/, '').substring(0, 20),
      fileName: file,
      imageUrl: `/playbooks/${file}`,
      analyzed: false,
      playType: 'pass' as const,
    }));

    return NextResponse.json(plays);
  } catch (error: any) {
    console.error('Error analyzing plays:', error);
    return NextResponse.json(
      { error: 'Failed to analyze plays', message: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint to analyze a specific play image
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, fileName, metadata } = await request.json() as {
      imageUrl: string;
      fileName?: string;
      metadata?: PlaybookMetadata;
    };

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    // Fetch the image from the URL (Supabase Storage)
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from URL' },
        { status: 404 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageMimeType = imageResponse.headers.get('content-type');

    // Check if image is HEIC/HEIF format
    const isHeic = imageMimeType?.includes('heic') ||
                   imageMimeType?.includes('heif') ||
                   fileName?.toLowerCase().endsWith('.heic') ||
                   fileName?.toLowerCase().endsWith('.heif');

    let base64Image: string;
    let mimeType: string;

    if (isHeic) {
      console.log('[Analyze Plays] Detected HEIC/HEIF format, converting to JPEG...');
      try {
        // Convert HEIC to JPEG using heic-convert
        const jpegBuffer = await convert({
          buffer: Buffer.from(imageBuffer),
          format: 'JPEG',
          quality: 0.9, // 90% quality
        });

        base64Image = Buffer.from(jpegBuffer).toString('base64');
        mimeType = 'image/jpeg';
        console.log('[Analyze Plays] Successfully converted HEIC to JPEG');
      } catch (conversionError: any) {
        console.error('[Analyze Plays] Failed to convert HEIC:', conversionError);
        return NextResponse.json(
          {
            error: 'Failed to convert HEIC image',
            message: conversionError.message,
            details: 'HEIC format detected but conversion failed. Please try converting to JPG or PNG manually.'
          },
          { status: 500 }
        );
      }
    } else {
      // Standard image formats (PNG, JPEG, etc.)
      base64Image = Buffer.from(imageBuffer).toString('base64');
      mimeType = imageMimeType || (fileName?.endsWith('.png') ? 'image/png' : 'image/jpeg');
    }

    // Call ChatGPT Vision API
    const openaiApiKey = process.env.GPT_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get content-type specific prompts
    const contentType = metadata?.content_type;
    const systemPrompt = getSystemPrompt(contentType);
    const baseUserPrompt = getUserPrompt(contentType);
    const metadataContext = buildMetadataContext(metadata);

    const userPrompt = `${baseUserPrompt}${metadataContext}`;

    console.log('[Analyze Plays] Using content type:', contentType || 'play (default)');

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
      return NextResponse.json(
        { error: 'Failed to analyze image with GPT', details: error },
        { status: 500 }
      );
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    // Parse the JSON response from GPT
    let playData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : analysisText;
      playData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse GPT response:', analysisText);
      return NextResponse.json(
        { error: 'Failed to parse analysis result', rawResponse: analysisText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...playData,
      fileName,
      imageUrl,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error analyzing play:', error);
    return NextResponse.json(
      { error: 'Failed to analyze play', message: error.message },
      { status: 500 }
    );
  }
}

// System prompts are now imported from shared library
// See src/lib/analysis-prompts.ts for prompt definitions
