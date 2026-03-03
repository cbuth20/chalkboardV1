/**
 * Protection Analysis Worker
 * Extracted logic from process-protection-analysis-background.ts
 * Called by the BullMQ worker, NOT directly via HTTP
 */

import Anthropic from '@anthropic-ai/sdk';
import heicConvert from 'heic-convert';
import { ProtectionAnalysisJobData } from '../shared/queue';
import { getSupabaseAdmin } from '../shared/supabase';

// Claude API only accepts these image formats
const CLAUDE_SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

interface ProtectionScenario {
  coverage_name: string;
  coverage_type: string;
  protection_type: string;
  protection_concept: string;
  call_side: string;
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

export async function analyzeProtections(data: ProtectionAnalysisJobData): Promise<void> {
  const { analysisId, userId, orgId, pdfIds } = data;

  const startTime = Date.now();
  let tokenCount = 0;
  let allScenarios: ProtectionScenario[] = [];

  try {
    console.log(`Starting protection analysis ${analysisId}`);
    console.log(`Analyzing ${pdfIds.length} PDFs for protection scenarios`);

    const supabase = getSupabaseAdmin();

    // Skip stale jobs — if the analysis record is no longer 'processing', another
    // run already handled it or the stale check marked it failed
    const { data: analysisRecord } = await supabase
      .from('player_playbook_analysis')
      .select('status')
      .eq('id', analysisId)
      .single();
    if (!analysisRecord || analysisRecord.status !== 'processing') {
      console.log(`Skipping stale job: analysis ${analysisId} status is '${analysisRecord?.status || 'not found'}', not 'processing'`);
      return;
    }

    const anthropic = new Anthropic();

    // Helper to update progress message visible to frontend
    const updateProgress = async (message: string) => {
      console.log(`[Progress] ${message}`);
      await supabase
        .from('player_playbook_analysis')
        .update({ error_message: message })
        .eq('id', analysisId);
    };

    // Snapshot existing scenario IDs so we can delete them AFTER new ones are inserted
    const { data: existingRows } = await supabase
      .from('player_block_coverages')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', orgId);
    const oldScenarioIds = (existingRows || []).map(r => r.id);
    console.log(`Found ${oldScenarioIds.length} existing scenarios to replace after successful generation`);

    await updateProgress(`Preparing to analyze ${pdfIds.length} file${pdfIds.length === 1 ? '' : 's'}...`);

    // Fetch all PDF file paths
    const { data: pdfs, error: pdfsError } = await supabase
      .from('player_playbook_metadata')
      .select('id, file_paths, note_type, tags')
      .in('id', pdfIds);

    if (pdfsError || !pdfs) {
      throw new Error(`Failed to fetch PDFs: ${pdfsError?.message}`);
    }

    // Process each file (PDFs and images)
    const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']);
    const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']);

    for (let i = 0; i < pdfs.length; i++) {
      const pdf = pdfs[i];
      const filePath = pdf.file_paths[0];
      const ext = filePath.split('.').pop()?.toLowerCase() || '';

      console.log(`Processing file ${i + 1}/${pdfs.length}: ${filePath}`);
      const fileName = filePath.split('/').pop() || `File ${i + 1}`;
      await updateProgress(`Analyzing file ${i + 1} of ${pdfs.length}: ${fileName}`);

      try {
        const { data: urlData } = supabase.storage
          .from('Chalkboard Bucket')
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          console.error(`No public URL for ${filePath}, skipping`);
          continue;
        }

        const fileResponse = await fetch(urlData.publicUrl);
        if (!fileResponse.ok) {
          console.error(`Failed to fetch ${filePath} (HTTP ${fileResponse.status})`);
          continue;
        }

        const contentType = fileResponse.headers.get('content-type') || '';
        const arrayBuffer = await fileResponse.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        // Determine if this is a PDF or an image
        let fileType: 'pdf' | 'image' | null = null;
        let mediaType = contentType;

        if (contentType.includes('pdf') || ext === 'pdf') {
          const header = Buffer.from(arrayBuffer.slice(0, 4)).toString();
          if (!header.startsWith('%PDF')) {
            console.log(`File ${filePath} has pdf extension but no PDF signature, skipping`);
            continue;
          }
          fileType = 'pdf';
          mediaType = 'application/pdf';
        } else if (IMAGE_TYPES.has(contentType) || IMAGE_EXTENSIONS.has(ext)) {
          fileType = 'image';
          // Normalize media type from extension if content-type is generic
          if (!IMAGE_TYPES.has(contentType)) {
            const extToMime: Record<string, string> = {
              jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
              gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
            };
            mediaType = extToMime[ext] || 'image/jpeg';
          }
        } else if (contentType.includes('octet-stream')) {
          // Fallback: check PDF signature for octet-stream
          const header = Buffer.from(arrayBuffer.slice(0, 4)).toString();
          if (header.startsWith('%PDF')) {
            fileType = 'pdf';
            mediaType = 'application/pdf';
          } else if (IMAGE_EXTENSIONS.has(ext)) {
            fileType = 'image';
            const extToMime: Record<string, string> = {
              jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
              gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
            };
            mediaType = extToMime[ext] || 'image/jpeg';
          }
        }

        if (!fileType) {
          console.log(`File ${filePath} is not a supported type (${contentType}), skipping`);
          continue;
        }

        // Convert unsupported image formats (HEIC/HEIF) to JPEG for Claude
        let finalBase64 = base64Data;
        let finalMediaType = mediaType;
        if (fileType === 'image' && !CLAUDE_SUPPORTED_IMAGE_TYPES.has(mediaType)) {
          console.log(`Converting ${mediaType} to JPEG for Claude compatibility`);
          try {
            const inputBuffer = Buffer.from(base64Data, 'base64');
            const jpegBuffer = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: 0.9 });
            finalBase64 = Buffer.from(jpegBuffer).toString('base64');
            finalMediaType = 'image/jpeg';
          } catch (convErr) {
            console.error(`Failed to convert ${mediaType} to JPEG, skipping ${filePath}:`, convErr);
            continue;
          }
        }

        // Analyze with Claude
        const analysis = await analyzeProtectionFile(anthropic, finalBase64, fileType, finalMediaType);
        tokenCount += analysis.tokenCount;
        allScenarios.push(...analysis.scenarios);

        console.log(`Extracted ${analysis.scenarios.length} protection scenarios from ${filePath}`);

        if (i < pdfs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (pdfError) {
        console.error(`Error processing PDF ${filePath}:`, pdfError instanceof Error ? pdfError.message : 'Unknown error');
        continue;
      }
    }

    console.log(`Total protection scenarios extracted: ${allScenarios.length}`);
    await updateProgress(allScenarios.length > 0
      ? `Saving ${allScenarios.length} scenario${allScenarios.length === 1 ? '' : 's'}...`
      : 'No scenarios found in your files.');

    // Insert scenarios into database
    if (allScenarios.length > 0) {
      const scenariosToInsert = allScenarios.map(s => ({
        user_id: userId,
        org_id: orgId,
        coverage_name: s.coverage_name,
        coverage_type: s.coverage_type,
        protection_type: s.protection_type,
        protection_concept: s.protection_concept || 'unknown',
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
        rb_position: { x: 55, y: 42 },
      }));

      const { error: insertError } = await supabase
        .from('player_block_coverages')
        .insert(scenariosToInsert);

      if (insertError) {
        throw new Error(`Failed to insert scenarios: ${insertError.message}`);
      }

      console.log(`Saved ${allScenarios.length} protection scenarios to database`);

      // New scenarios inserted successfully — now safe to delete old ones
      if (oldScenarioIds.length > 0) {
        // Delete in batches to avoid query size limits
        const BATCH_SIZE = 100;
        for (let i = 0; i < oldScenarioIds.length; i += BATCH_SIZE) {
          const batch = oldScenarioIds.slice(i, i + BATCH_SIZE);
          const { error: deleteError } = await supabase
            .from('player_block_coverages')
            .delete()
            .in('id', batch);
          if (deleteError) {
            console.error(`Failed to delete old scenario batch: ${deleteError.message}`);
          }
        }
        console.log(`Deleted ${oldScenarioIds.length} old scenarios`);
      }
    }

    // Update analysis record
    const processingTime = Math.floor((Date.now() - startTime) / 1000);
    const didSucceed = allScenarios.length > 0;
    const { error: updateError } = await supabase
      .from('player_playbook_analysis')
      .update({
        status: didSucceed ? 'completed' : 'failed',
        formations_extracted: allScenarios.length,
        estimated_tokens: tokenCount,
        processing_time_seconds: processingTime,
        completed_at: new Date().toISOString(),
        error_message: didSucceed ? null : 'No protection scenarios could be extracted from your files. Make sure you uploaded playbook pages that contain pass protection schemes.',
      })
      .eq('id', analysisId);

    if (updateError) {
      console.error('Failed to update analysis record:', updateError);
    }

    console.log(`Protection analysis complete in ${processingTime}s`);
  } catch (error) {
    console.error('Fatal error in protection analysis:', error);

    // Update analysis record to failed
    try {
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
      console.error('Failed to update analysis to failed:', updateError);
    }

    throw error; // Re-throw so BullMQ knows the job failed and can retry
  }
}

async function analyzeProtectionFile(
  anthropic: Anthropic,
  base64Data: string,
  fileType: 'pdf' | 'image',
  mediaType: string
): Promise<{ scenarios: ProtectionScenario[]; tokenCount: number }> {
  const systemPrompt = `You are an expert football coach analyzing playbook pages to extract RB (running back) protection assignments.

Your task is to identify the formation(s) in the playbook and generate training scenarios for running backs to practice their pass protection reads against common defensive fronts (OVER, UNDER, 4-3, 3-4, BEAR, NICKEL, DIME) with base rushes, single-blitzer pressures, and occasional exotic multi-blitzer packages.

Extract the team's ACTUAL protection names from the playbook. If they call it "Max", "Fox", "60 Protection", "Half Slide", "BOB", use THAT exact name as protection_type. Do NOT rename protections to standard numbered schemes — preserve the team's terminology.

Classify each protection into a protection_concept value from this taxonomy:
| Concept       | OL Behavior                      | Examples                                    |
|---------------|----------------------------------|---------------------------------------------|
| full_slide    | All 5 OL slide together          | 360, 350, 50, BOB, Slide                    |
| half_slide    | C+2 slide, 2 man-block           | 64, 65, Half Slide, Combo                   |
| man_protect   | Each OL mans a gap               | Man blocking schemes                        |
| max_protect   | 7+ blockers stay in              | Max Protect, 7-man                          |
| play_action   | PA blocking (aggressive)         | 433, 201, any PA scheme                     |
| sprint_out    | OL slides to sprint direction    | Boot, Sprint                                |
| screen        | Let rushers through              | Screen calls                                |
| draw          | Passive/draw blocking            | Draw calls                                  |
| unknown       | Fallback                         | Unrecognized schemes                        |

For each scenario, determine:
1. The protection name (use the team's actual name from the playbook)
2. The protection_concept (from the taxonomy above)
3. The defensive front name
4. The call_side: the direction the OL slides ("left" or "right"). This determines slide direction only — the TB's alignment depends on the formation.
4. Which defenders are rushing, blitzing, walking up, or in coverage
5. The correct RB assignment: either block a specific defender (by label) or "RELEASE"
6. A coaching explanation of why this is the correct read

Defender position labels — use ONLY these labels (keys and label field). Do NOT invent other labels:
E (End), T (Tackle), N (Nose), M (Mike LB), W (Will LB), S (Sam LB), Q (Quarter/OLB), CB (Cornerback), SS (Strong Safety / Rover), FS (Free Safety)
If the playbook calls a defender "Rover", "R", "Robber", "Star", or "$" — map it to SS. If "Star" or "Stud" refers to a nickel LB, map to Q.

Defender coordinates use a percentage-based system for positioning on the field diagram:
- x: 0-100 (left to right). DL should align over the offensive line (x: 35-65 range). Other defenders position naturally based on their alignment.
- y: 0-100 (top=deep, bottom=offense). LOS is at y: 55. DL should be at y: 53-58 (right at the LOS). Position all other defenders based on their actual depth relative to the LOS. The offensive line is rendered at y: 65.

Return a JSON object with a "scenarios" array. Each scenario should look like this:
{
  "scenarios": [
    {
      "coverage_name": "OVER",
      "coverage_type": "blitz",
      "protection_type": "60 Protection",
      "protection_concept": "full_slide",
      "call_side": "right",  // The direction the OL slides. "right" = OL slides right.
      "solid_call": false,
      "free_release": false,
      "play_action": false,
      "naked": false,
      "hoss": false,
      "scat_release": null,
      "defensive_positions": {
        "E1": {"x": 38, "y": 56, "label": "E", "rushing": true},
        "T1": {"x": 45, "y": 56, "label": "T", "rushing": true},
        "N": {"x": 52, "y": 56, "label": "N", "rushing": true},
        "E2": {"x": 62, "y": 56, "label": "E", "rushing": true},
        "M": {"x": 50, "y": 40, "label": "M", "rushing": false},
        "W": {"x": 40, "y": 40, "label": "W", "rushing": false},
        "S": {"x": 63, "y": 42, "label": "S", "rushing": true, "blitz": true, "hot": true},
        "CB1": {"x": 22, "y": 45, "label": "CB", "rushing": false},
        "CB2": {"x": 78, "y": 45, "label": "CB", "rushing": false},
        "SS": {"x": 58, "y": 30, "label": "SS", "rushing": false},
        "FS": {"x": 50, "y": 20, "label": "FS", "rushing": false}
      },
      "correct_block_target": "S",
      "explanation": "Sam is the first LB off the ball to the call side — block him.",
      "offensive_formation": "POSSE 2x2",
      "down_distance": "2nd & 7"
    }
  ]
}

Important rules:
- For protections where the TB has an assignment (full_slide, half_slide concepts), the correct answer is usually a specific defender
- For free release protections (free_release=true, hoss=true), the correct answer is usually "RELEASE"
- For play action (play_action concept), the TB typically fakes then releases or has late check responsibility
- Mark defenders as "blitz": true if they're blitzing from a non-traditional rush position
- Mark defenders as "hot": true ONLY if they are the actual unblocked free runner — the defender NO offensive player picks up. "hot" does NOT mean "first read" or "most dangerous" — it means literally unblocked. In a cross blitz where the center picks up one LB, the OTHER LB who comes free is "hot". The correct_block_target and "hot" defender are usually the same player (the TB blocks the free runner).
- Mark defenders as "walked_up": true if they've walked up to the LOS from a LB position
- For half_slide protections, include "tb_read" numbers (1, 2, 3) on the defenders the TB must read through
- ALWAYS include the full secondary (2 CBs, SS, FS) in every scenario so the field looks like a real defensive look. Mark their "rushing" as false if they are in coverage. Only mark "blitz": true, "rushing": true if they are actually blitzing.
- Secondary positioning depth ranges: SS at y: 25-35 (near box), FS at y: 15-25 (deep), CB at y: 42-50 (near LOS, wide at x: 20-30 or x: 70-80 for outside corners, x: 30-38 or x: 62-70 for nickel/slot corners)
- When a secondary defender blitzes, the TB's read changes — explain this clearly in the coaching explanation

Pressure package distribution — even thirds:
- ~1/3 of scenarios should be base 4-man rush with standard fronts
- ~1/3 of scenarios should include a single LB or DB blitz (5-man pressure)
- ~1/3 of scenarios should feature exotic pressure packages with multiple blitzers. Examples:
  - COVER 0: All-out man coverage, no deep safety, 6-7 man pressure. SS and/or FS blitz. Both safeties should be walked up near the box (y: 40-48). Mark all blitzing DBs with "blitz": true, "rushing": true, "walked_up": true.
  - CROSS DOG (Dawg): Two LBs cross-blitz through opposite gaps. E.g., Mike goes weak A-gap (x near 47) while Will loops strong B-gap (x near 57). Position them close together pre-snap (both near x: 48-52, y: 40-44) to show the cross action.
  - OVERLOAD: Bring an extra rusher to one side — e.g., Sam + SS both blitz off the same edge. Stack them vertically (same x, different y) so the overload is visible.
  - FIRE ZONE: 5-man pressure with 3-deep/3-under zone behind it. One LB or DB blitzes while a DL drops into coverage (mark that DL as "rushing": false). The dropping DL is unusual — explain it in coaching notes.
  - SAFETY BLITZ: SS or FS walks down and comes off the edge or through a gap. Mark "walked_up": true so the pre-snap animation shows the walk-up.
- For exotic pressures, there is almost always a "hot" unblocked rusher — make sure to mark at least one defender as "hot": true
- In the coaching explanation for pressure scenarios, describe WHO is coming, WHERE the free runner is, and what the TB's job is (block the most dangerous threat vs. release because OL has it handled)

Return ONLY the JSON object, no other text.`;

  try {
    // Build the file content block — PDFs use 'document', images use 'image'
    const fileBlock = fileType === 'pdf'
      ? {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType as 'application/pdf',
            data: base64Data,
          },
        }
      : {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64Data,
          },
        };

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-20250514',
      max_tokens: 16384,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            fileBlock,
            {
              type: 'text',
              text: 'Analyze this playbook page and extract all RB protection scenarios. Focus on accuracy and include realistic defensive front variations. Return the response as valid JSON.',
            },
          ],
        },
      ],
    });

    const response = await stream.finalMessage();

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');

    const tokenCount = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    let jsonStr = textBlock.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    const scenarios = parsed.scenarios || [];

    console.log(`Claude returned ${scenarios.length} protection scenarios (${tokenCount} tokens)`);

    return { scenarios, tokenCount };
  } catch (error) {
    console.error('Error calling Claude for protection analysis:', error);
    throw error;
  }
}
