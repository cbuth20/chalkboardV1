/**
 * Background function to analyze PDFs and extract RB protection scenarios
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
}

interface ProtectionScenario {
  coverage_name: string;       // defensive front name
  coverage_type: string;       // zone/man/blitz
  protection_type: string;     // "360", "64", "350", etc.
  call_side: string;           // "left" or "right"
  solid_call: boolean;
  free_release: boolean;
  play_action: boolean;
  naked: boolean;
  hoss: boolean;
  scat_release: string | null;
  defensive_positions: Record<string, {
    x: number;
    y: number;
    label: string;
    rushing: boolean;
    blitz?: boolean;
    hot?: boolean;
    walked_up?: boolean;
    tb_read?: number;
  }>;
  correct_block_target: string;
  explanation: string;
  offensive_formation?: string;
  down_distance?: string;
}

let allScenarios: ProtectionScenario[] = [];

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const startTime = Date.now();
  let tokenCount = 0;
  allScenarios = [];

  try {
    const request: AnalysisRequest = JSON.parse(event.body || '{}');
    const { analysisId, userId, orgId, pdfIds } = request;

    console.log(`🛡️ Starting protection analysis ${analysisId}`);
    console.log(`📚 Analyzing ${pdfIds.length} PDFs for protection scenarios`);

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

    // Process each PDF
    for (let i = 0; i < pdfs.length; i++) {
      const pdf = pdfs[i];
      const filePath = pdf.file_paths[0];

      console.log(`📄 Processing PDF ${i + 1}/${pdfs.length}: ${filePath}`);

      try {
        const { data: urlData } = supabase.storage
          .from('Chalkboard Bucket')
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          console.error(`❌ No public URL for ${filePath}, skipping`);
          continue;
        }

        const fileResponse = await fetch(urlData.publicUrl);
        if (!fileResponse.ok) {
          console.error(`❌ Failed to fetch ${filePath} (HTTP ${fileResponse.status})`);
          continue;
        }

        const contentType = fileResponse.headers.get('content-type') || '';
        if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
          console.log(`⚠️  File ${filePath} is not a PDF, skipping`);
          continue;
        }

        const arrayBuffer = await fileResponse.arrayBuffer();
        const base64PDF = Buffer.from(arrayBuffer).toString('base64');

        const header = Buffer.from(arrayBuffer.slice(0, 4)).toString();
        if (!header.startsWith('%PDF')) {
          console.log(`⚠️  File ${filePath} does not have PDF signature, skipping`);
          continue;
        }

        // Analyze with Claude
        const analysis = await analyzeProtectionPDF(anthropic, base64PDF);
        tokenCount += analysis.tokenCount;
        allScenarios.push(...analysis.scenarios);

        console.log(`✅ Extracted ${analysis.scenarios.length} protection scenarios from ${filePath}`);

        if (i < pdfs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (pdfError) {
        console.error(`❌ Error processing PDF ${filePath}:`, pdfError instanceof Error ? pdfError.message : 'Unknown error');
        continue;
      }
    }

    console.log(`🎉 Total protection scenarios extracted: ${allScenarios.length}`);

    // Insert scenarios into database
    if (allScenarios.length > 0) {
      const scenariosToInsert = allScenarios.map(s => ({
        user_id: userId,
        org_id: orgId,
        coverage_name: s.coverage_name,
        coverage_type: s.coverage_type,
        protection_type: s.protection_type,
        call_side: s.call_side,
        solid_call: s.solid_call,
        free_release: s.free_release,
        play_action: s.play_action,
        naked: s.naked,
        hoss: s.hoss,
        scat_release: s.scat_release,
        defensive_positions: s.defensive_positions,
        correct_block_target: s.correct_block_target,
        explanation: s.explanation,
        offensive_formation: s.offensive_formation,
        down_distance: s.down_distance,
        rb_position: { x: 55, y: 42 }, // Default RB position
      }));

      const { error: insertError } = await supabase
        .from('player_block_coverages')
        .insert(scenariosToInsert);

      if (insertError) {
        throw new Error(`Failed to insert scenarios: ${insertError.message}`);
      }

      console.log(`💾 Saved ${allScenarios.length} protection scenarios to database`);
    }

    // Update analysis record
    const processingTime = Math.floor((Date.now() - startTime) / 1000);
    const { error: updateError } = await supabase
      .from('player_playbook_analysis')
      .update({
        status: 'completed',
        formations_extracted: allScenarios.length,
        estimated_tokens: tokenCount,
        processing_time_seconds: processingTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysisId);

    if (updateError) {
      console.error('Failed to update analysis record:', updateError);
    }

    console.log(`✅ Protection analysis complete in ${processingTime}s`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        analysisId,
        scenariosExtracted: allScenarios.length,
        processingTime,
        tokenCount,
      }),
    };
  } catch (error) {
    console.error('❌ Fatal error in protection analysis:', error);

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
          formations_extracted: allScenarios.length,
        })
        .eq('id', analysisId);
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

async function analyzeProtectionPDF(
  anthropic: Anthropic,
  base64PDF: string
): Promise<{ scenarios: ProtectionScenario[]; tokenCount: number }> {
  const systemPrompt = `You are an expert football coach analyzing playbook PDFs to extract RB (running back) protection assignments.

Your task is to identify protection schemes and generate training scenarios for running backs to practice their pass protection reads.

For each protection scheme found in the playbook, generate scenarios against common defensive fronts (OVER, UNDER, 4-3, 3-4, BEAR, etc.).

For each scenario, determine:
1. The protection scheme name and type (e.g., "360/361", "64/65", "350/351", "433/432", "50/51")
2. The defensive front name
3. Which defenders are rushing, blitzing, walking up, or in coverage
4. The correct RB assignment: either block a specific defender (by label) or "RELEASE"
5. A coaching explanation of why this is the correct read

Defender position labels: E (End), T (Tackle), N (Nose), M (Mike LB), W (Will LB), S (Sam LB), Q (Quarter/OLB), C (Corner), SS (Strong Safety), FS (Free Safety)

Defender coordinates use a percentage-based system: x: 0-100 (left to right), y: 0-100 (top=deep, bottom=LOS at ~65%)

Return a JSON array of scenarios:
{
  "scenarios": [
    {
      "coverage_name": "OVER",
      "coverage_type": "blitz",
      "protection_type": "360",
      "call_side": "right",
      "solid_call": false,
      "free_release": false,
      "play_action": false,
      "naked": false,
      "hoss": false,
      "scat_release": null,
      "defensive_positions": {
        "E1": {"x": 30, "y": 60, "label": "E", "rushing": true},
        "T1": {"x": 42, "y": 60, "label": "T", "rushing": true},
        "N": {"x": 55, "y": 60, "label": "N", "rushing": true},
        "E2": {"x": 68, "y": 60, "label": "E", "rushing": true},
        "M": {"x": 50, "y": 45, "label": "M", "rushing": false},
        "W": {"x": 35, "y": 45, "label": "W", "rushing": false},
        "S": {"x": 71, "y": 45, "label": "S", "rushing": true, "blitz": true, "hot": true}
      },
      "correct_block_target": "S",
      "explanation": "Sam is the first LB off the ball to the call side — block him.",
      "offensive_formation": "POSSE 2x2",
      "down_distance": "2nd & 7"
    }
  ]
}

Important rules:
- For protections where the TB has an assignment (360, 64, etc.), the correct answer is usually a specific defender
- For free release protections (350, 50, Scat, Scoot, Hoss), the correct answer is usually "RELEASE"
- For play action (433, 201), the TB typically fakes then releases or has late check responsibility
- Mark defenders as "blitz": true if they're blitzing from a non-traditional rush position
- Mark defenders as "hot": true if they're unblocked rushers the QB must deal with
- Mark defenders as "walked_up": true if they've walked up to the LOS from a LB position
- For 64/65 protections, include "tb_read" numbers (1, 2, 3) on the defenders the TB must read through`;

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
              text: 'Analyze this playbook PDF and extract all RB protection scenarios. Focus on accuracy and include realistic defensive front variations. Return the response as valid JSON.',
            },
          ],
        },
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const tokenCount = response.usage.input_tokens + response.usage.output_tokens;

    // Extract JSON from response
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
    const scenarios = parsed.scenarios || [];

    console.log(`📊 Claude returned ${scenarios.length} protection scenarios (${tokenCount} tokens)`);

    return { scenarios, tokenCount };
  } catch (error) {
    console.error('Error calling Claude for protection analysis:', error);
    throw error;
  }
}

export { handler };
