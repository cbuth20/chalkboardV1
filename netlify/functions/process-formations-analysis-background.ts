/**
 * Background function to analyze PDFs and extract formations
 * This is a long-running, expensive operation
 */

import { Handler } from '@netlify/functions';
import { getSupabaseAdmin } from './shared/supabase';
import Anthropic from '@anthropic-ai/sdk';

interface AnalysisRequest {
  analysisId: string;
  userId: string;
  orgId: string;
  pdfIds: string[];
  positions: string[];
  modules: string[];
}

interface Formation {
  formation_name: string;
  personnel?: string;
  description?: string;
  module: string;
  positions: Record<string, { x: number; y: number }>;
  coaching_notes: Record<string, string>;
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const startTime = Date.now();
  let tokenCount = 0;

  try {
    const request: AnalysisRequest = JSON.parse(event.body || '{}');
    const { analysisId, userId, orgId, pdfIds, positions, modules } = request;

    console.log(`🎯 Starting formations analysis ${analysisId}`);
    console.log(`📚 Analyzing ${pdfIds.length} PDFs`);
    console.log(`🎮 Target positions: ${positions.join(', ')}`);
    console.log(`📦 Target modules: ${modules.join(', ')}`);

    const supabase = getSupabaseAdmin();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Fetch all PDF file paths
    const { data: pdfs, error: pdfsError } = await supabase
      .from('player_playbook_metadata')
      .select('id, file_paths, note_type, tags')
      .in('id', pdfIds);

    if (pdfsError || !pdfs) {
      throw new Error(`Failed to fetch PDFs: ${pdfsError?.message}`);
    }

    const allFormations: Formation[] = [];

    // Process each PDF
    for (let i = 0; i < pdfs.length; i++) {
      const pdf = pdfs[i];
      const filePath = pdf.file_paths[0];

      console.log(`📄 Processing PDF ${i + 1}/${pdfs.length}: ${filePath}`);

      try {
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('Chalkboard Bucket')
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          console.error(`❌ No public URL for ${filePath}, skipping`);
          continue;
        }

        const fileUrl = urlData.publicUrl;
        console.log(`📥 Fetching file from: ${fileUrl}`);

        // Fetch the file using HTTP (same as working play processor)
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          console.error(`❌ Failed to fetch ${filePath} (HTTP ${fileResponse.status})`);
          console.log(`⚠️  This file might not exist in storage. Skipping.`);
          continue;
        }

        const contentType = fileResponse.headers.get('content-type') || '';
        console.log(`📄 Content type: ${contentType}`);

        // Verify it's actually a PDF by checking content type
        if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
          console.log(`⚠️  File ${filePath} is not a PDF (type: ${contentType}), skipping`);
          continue;
        }

        // Convert to base64
        const arrayBuffer = await fileResponse.arrayBuffer();
        const base64PDF = Buffer.from(arrayBuffer).toString('base64');

        // Verify it's a valid PDF by checking header
        const header = Buffer.from(arrayBuffer.slice(0, 4)).toString();
        if (!header.startsWith('%PDF')) {
          console.log(`⚠️  File ${filePath} does not have PDF signature (header: ${header}), skipping`);
          continue;
        }

        // Analyze with Claude Opus
        const analysis = await analyzePlaybookPDF(anthropic, base64PDF, {
          positions,
          modules,
          tags: pdf.tags || [],
        });

        // Track tokens
        tokenCount += analysis.tokenCount;

        // Add source PDF ID to each formation
        const formations = analysis.formations.map(f => ({
          ...f,
          source_pdf_id: pdf.id,
        }));

        allFormations.push(...formations);

        console.log(`✅ Extracted ${formations.length} formations from ${filePath}`);

        // Add small delay between PDFs to avoid rate limits
        if (i < pdfs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (pdfError) {
        console.error(`❌ Error processing PDF ${filePath}:`, pdfError instanceof Error ? pdfError.message : 'Unknown error');
        continue;
      }
    }

    console.log(`🎉 Total formations extracted: ${allFormations.length}`);

    // Insert formations into database
    if (allFormations.length > 0) {
      const formationsToInsert = allFormations.map(f => ({
        user_id: userId,
        org_id: orgId,
        formation_name: f.formation_name,
        personnel: f.personnel,
        description: f.description,
        module: f.module,
        positions: f.positions,
        coaching_notes: f.coaching_notes,
        source_pdf_ids: [f.source_pdf_id],
        last_analyzed_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('player_formations')
        .insert(formationsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert formations: ${insertError.message}`);
      }

      console.log(`💾 Saved ${allFormations.length} formations to database`);
    }

    // Update analysis record
    const processingTime = Math.floor((Date.now() - startTime) / 1000);
    const { error: updateError } = await supabase
      .from('player_playbook_analysis')
      .update({
        status: 'completed',
        formations_extracted: allFormations.length,
        estimated_tokens: tokenCount,
        processing_time_seconds: processingTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysisId);

    if (updateError) {
      console.error('Failed to update analysis record:', updateError);
    }

    console.log(`✅ Analysis complete in ${processingTime}s`);
    console.log(`💰 Estimated tokens used: ${tokenCount}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        analysisId,
        formationsExtracted: allFormations.length,
        processingTime,
        tokenCount,
      }),
    };
  } catch (error) {
    console.error('❌ Fatal error in formations analysis:', error);

    // Always try to update analysis record to failed
    let analysisId = null;
    try {
      const request: AnalysisRequest = JSON.parse(event.body || '{}');
      analysisId = request.analysisId;
      const supabase = getSupabaseAdmin();

      const processingTime = Math.floor((Date.now() - startTime) / 1000);
      await supabase
        .from('player_playbook_analysis')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
          processing_time_seconds: processingTime,
          formations_extracted: allFormations.length, // Save any formations that were extracted before failure
        })
        .eq('id', analysisId);

      console.log(`✅ Marked analysis ${analysisId} as failed`);
    } catch (updateError) {
      console.error('❌ Failed to update analysis to failed:', updateError);
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        analysisId,
      }),
    };
  }
};

async function analyzePlaybookPDF(
  anthropic: Anthropic,
  base64PDF: string,
  context: { positions: string[]; modules: string[]; tags: string[] }
): Promise<{ formations: Formation[]; tokenCount: number }> {
  const systemPrompt = `You are an expert football coach analyzing playbook PDFs to extract formation information.

Your task is to identify and extract formations from the playbook, focusing on these positions: ${context.positions.join(', ')}.

Organize formations into these modules:
- posse_2x2: 2x2 formations (2 receivers on each side)
- posse_trips: Trips formations (3 receivers on one side)
- quads: Quad formations (4 receivers on one side)
- ranger: Ranger formations (spread with running back)
- zombie: Zombie formations (empty backfield variations)
- empty: Empty formations (no running back)
- special: Special formations (goal line, short yardage, etc.)

For each formation, extract:
1. Formation name (as written in playbook)
2. Personnel grouping (e.g., "3WR, 1TB, 1TE" or "POSSE")
3. Brief description
4. Module classification
5. Position coordinates on a 100x50 field (x: 0-100 horizontal, y: 0-50 vertical, center is 50,25)
6. Coaching notes for each position (QB, RB, WR, OT)

Position abbreviations:
- Q: Quarterback
- T: Tight End / Tailback
- X, Y, Z: Wide Receivers
- H: H-Back
- F: Fullback

Return a JSON array of formations with this structure:
{
  "formations": [
    {
      "formation_name": "Posse Right 2x2",
      "personnel": "POSSE (3WR, 1TB, 1TE)",
      "description": "Balanced formation with receivers split 2x2",
      "module": "posse_2x2",
      "positions": {
        "Q": {"x": 50, "y": 40},
        "T": {"x": 50, "y": 35},
        "X": {"x": 20, "y": 45},
        "Y": {"x": 80, "y": 45},
        "Z": {"x": 85, "y": 45}
      },
      "coaching_notes": {
        "QB": "Read safety rotation, check protection",
        "RB": "Pass pro first, check for blitz",
        "WR": "Outside leverage, vertical stem",
        "OT": "Set inside, mirror rusher"
      }
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64PDF,
              },
            },
            {
              type: 'text',
              text: 'Analyze this playbook PDF and extract all formations. Focus on clarity and accuracy. Return the response as valid JSON.',
            },
          ],
        },
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const tokenCount = response.usage.input_tokens + response.usage.output_tokens;

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    } else {
      const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonContent = codeMatch[1];
      }
    }

    const parsed = JSON.parse(jsonContent);
    const formations = parsed.formations || [];

    console.log(`📊 Claude Opus returned ${formations.length} formations (${tokenCount} tokens)`);

    return { formations, tokenCount };
  } catch (error) {
    console.error('Error calling Claude Opus:', error);
    throw error;
  }
}

export { handler };
