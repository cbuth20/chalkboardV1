/**
 * Background function to analyze PDFs and extract RB protection scenarios
 * This is a long-running, expensive operation
 */

import { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import heicConvert from 'heic-convert';
import { getSupabaseAdmin } from './shared/supabase';

// Claude API only accepts these image formats
const CLAUDE_SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

interface AnalysisRequest {
  analysisId: string;
  userId: string;
  orgId: string;
  pdfIds: string[];
}

interface ProtectionScenario {
  coverage_name: string;       // defensive front name
  coverage_type: string;       // zone/man/blitz
  protection_type: string;     // team's actual protection name
  protection_concept: string;  // behavioral classification (full_slide, half_slide, etc.)
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

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const startTime = Date.now();
  let tokenCount = 0;
  let allScenarios: ProtectionScenario[] = [];

  try {
    const request: AnalysisRequest = JSON.parse(event.body || '{}');
    const { analysisId, userId, orgId, pdfIds } = request;

    console.log(`🛡️ Starting protection analysis ${analysisId}`);
    console.log(`📚 Analyzing ${pdfIds.length} PDFs for protection scenarios`);

    const supabase = getSupabaseAdmin();

    // Skip stale jobs — if the analysis record is no longer 'processing', skip it
    const { data: analysisRecord } = await supabase
      .from('player_playbook_analysis')
      .select('status')
      .eq('id', analysisId)
      .single();
    if (!analysisRecord || analysisRecord.status !== 'processing') {
      console.log(`Skipping stale job: analysis ${analysisId} status is '${analysisRecord?.status || 'not found'}', not 'processing'`);
      return { statusCode: 200, body: JSON.stringify({ skipped: true, reason: 'stale' }) };
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    // Process each PDF
    for (let i = 0; i < pdfs.length; i++) {
      const pdf = pdfs[i];
      const filePath = pdf.file_paths[0];

      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      console.log(`📄 Processing file ${i + 1}/${pdfs.length}: ${filePath}`);
      const fileName = filePath.split('/').pop() || `File ${i + 1}`;
      await updateProgress(`Analyzing file ${i + 1} of ${pdfs.length}: ${fileName}`);

      const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']);
      const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']);

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
        const arrayBuffer = await fileResponse.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        // Determine if this is a PDF or an image
        let fileType: 'pdf' | 'image' | null = null;
        let mediaType = contentType;

        if (contentType.includes('pdf') || ext === 'pdf') {
          const header = Buffer.from(arrayBuffer.slice(0, 4)).toString();
          if (!header.startsWith('%PDF')) {
            console.log(`⚠️  File ${filePath} has pdf extension but no PDF signature, skipping`);
            continue;
          }
          fileType = 'pdf';
          mediaType = 'application/pdf';
        } else if (IMAGE_TYPES.has(contentType) || IMAGE_EXTENSIONS.has(ext)) {
          fileType = 'image';
          if (!IMAGE_TYPES.has(contentType)) {
            const extToMime: Record<string, string> = {
              jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
              gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
            };
            mediaType = extToMime[ext] || 'image/jpeg';
          }
        } else if (contentType.includes('octet-stream')) {
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
          console.log(`⚠️  File ${filePath} is not a supported type (${contentType}), skipping`);
          continue;
        }

        // Convert unsupported image formats (HEIC/HEIF) to JPEG for Claude
        let finalBase64 = base64Data;
        let finalMediaType = mediaType;
        if (fileType === 'image' && !CLAUDE_SUPPORTED_IMAGE_TYPES.has(mediaType)) {
          console.log(`🔄 Converting ${mediaType} to JPEG for Claude compatibility`);
          try {
            const inputBuffer = Buffer.from(base64Data, 'base64');
            const jpegBuffer = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: 0.9 });
            finalBase64 = Buffer.from(jpegBuffer).toString('base64');
            finalMediaType = 'image/jpeg';
          } catch (convErr) {
            console.error(`❌ Failed to convert ${mediaType} to JPEG, skipping ${filePath}:`, convErr);
            continue;
          }
        }

        // Analyze with Claude
        const analysis = await analyzeProtectionFile(anthropic, finalBase64, fileType, finalMediaType);
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
        rb_position: { x: 55, y: 42 }, // Default RB position
      }));

      const { error: insertError } = await supabase
        .from('player_block_coverages')
        .insert(scenariosToInsert);

      if (insertError) {
        throw new Error(`Failed to insert scenarios: ${insertError.message}`);
      }

      console.log(`💾 Saved ${allScenarios.length} protection scenarios to database`);

      // New scenarios inserted successfully — now safe to delete old ones
      if (oldScenarioIds.length > 0) {
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

async function analyzeProtectionFile(
  anthropic: Anthropic,
  base64Data: string,
  fileType: 'pdf' | 'image',
  mediaType: string
): Promise<{ scenarios: ProtectionScenario[]; tokenCount: number }> {
  const systemPrompt = `You are an expert football coach analyzing playbook PDFs to extract RB (running back) protection assignments.

## Content gate — EVALUATE FIRST

Before generating anything, assess whether this page contains football pass protection content. Valid content includes: protection schemes, blocking assignments, play diagrams with offensive/defensive alignments, or formation/personnel info relevant to pass protection.

If the page is NOT valid football protection material (e.g., random notes, non-football content, illegible scans, roster lists, workout plans, run-game-only plays with no pass protection), return:
{ "scenarios": [], "skipped_reason": "Brief explanation of why this page was skipped" }

If the page IS valid, proceed with scenario generation below.

Your task is to identify the formation(s) in the playbook and generate training scenarios for running backs to practice their pass protection reads against common defensive fronts (OVER, UNDER, 4-3, 3-4, BEAR, NICKEL) with both base and blitz variations.

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
5. Which defenders are rushing, blitzing, walking up, or in coverage
5. The correct RB assignment: either block a specific defender (by label) or "RELEASE"
6. A coaching explanation of why this is the correct read

Defender position labels — use ONLY these labels (keys and label field). Do NOT invent other labels:
E (End), T (Tackle), N (Nose), M (Mike LB), W (Will LB), S (Sam LB), Q (Quarter/OLB), CB (Cornerback), SS (Strong Safety / Rover), FS (Free Safety)
If the playbook calls a defender "Rover", "R", "Robber", "Star", or "$" — map it to SS. If "Star" or "Stud" refers to a nickel LB, map to Q.

Defender coordinates use a percentage-based system for positioning on the field diagram:
- x: 0-100 (left to right). y: 0-100 (top=deep, bottom=offense). LOS at y:55, OL spans x:40-60 at y:65.

**Strict x-ranges by position (MUST follow — these align with the OL):**
- DEs (E): x: 33-37 (left) or x: 63-67 (right). They align ON or just outside the OT.
- DTs (T): x: 40-47 (left) or x: 53-60 (right). They align on the guards/tackles.
- NT (N): x: 48-52 (over center). Only in Odd/5-Down fronts.
- LBs (M, W, S): x: 35-65, y: 42-52. Inside the box.
- CBs: x: 10-22 (left) or x: 78-90 (right), y: 30-42. Wide, off the line.
- SS: x: 35-70, y: 25-38. In the box or over a slot.
- FS: x: 40-60, y: 15-28. Deep middle.
- Nickel/Q: x: 25-40 or x: 60-75, y: 38-48. Slot area.

DL at y: 53-58. Never place a DE wider than x:33 or x:67 — they must be near the offensive tackles, not out by the receivers.

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

## Block target logic (CRITICAL — get this right)

Read the playbook's blocking rules to determine who each OL blocks. The correct_block_target is whoever the OL CANNOT account for. Walk through it:
1. Assign each OL based on the scheme (man assignments, slide direction, center point, sort rules).
2. Is any rusher left without an OL blocker?
3. If yes → correct_block_target = that defender (set hot: true on them).
4. If all rushers are accounted for → correct_block_target = "RELEASE" (no hot defenders).

Per concept:
- **man_protect**: Each OL has a man. Check the center point — an uncovered C/G sorts to the declared LB (e.g., Will). That LB is then OL-accounted, NOT the RB's job. The RB only blocks a rusher the OL sort rules don't cover.
- **full_slide**: OL slides to call_side. Backside OT anchors vs backside DE. Extra backside rusher beyond that DE = RB's target.
- **half_slide**: Man side has 2 OL. ≤2 man-side rushers = check-release. 3+ = RB gets the extra. Use tb_read 1/2/3 for read progression.

## Important rules
- Mark "blitz": true if rushing from a non-traditional position (LB, DB)
- Mark "hot": true ONLY on the correct_block_target defender (the one the RB must block). If RELEASE, no one is hot.
- Mark "walked_up": true if they creep toward LOS pre-snap
- For half_slide, include "tb_read" numbers (1, 2, 3) on defenders the TB reads through
- ALWAYS include the full secondary (2 CBs, SS, FS). Mark "rushing": false if in coverage.
- When a secondary defender blitzes, explain the read change in the coaching explanation

Return ONLY the JSON object, no other text.`;

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-20250514',
      max_tokens: 16384,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            fileType === 'pdf'
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
                },
            {
              type: 'text',
              text: fileType === 'pdf'
                ? 'Analyze this playbook PDF and extract all RB protection scenarios. Focus on accuracy and include realistic defensive front variations. Return the response as valid JSON.'
                : 'Analyze this playbook image and extract all RB protection scenarios. Focus on accuracy and include realistic defensive front variations. Return the response as valid JSON.',
            },
          ],
        },
      ],
    });

    const response = await stream.finalMessage();

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');

    const tokenCount = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    // Extract JSON from response (may be wrapped in markdown code blocks)
    let jsonStr = textBlock.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Check if the page was skipped by the content gate
    if (parsed.skipped_reason) {
      console.log(`Page skipped by content gate: ${parsed.skipped_reason}`);
      return { scenarios: [], tokenCount };
    }

    const rawScenarios = parsed.scenarios || [];

    // Normalize and validate each scenario
    const VALID_LABELS = new Set(['E', 'T', 'N', 'M', 'W', 'S', 'Q', 'CB', 'SS', 'FS']);
    const LABEL_ALIASES: Record<string, string> = { 'R': 'SS', 'ROVER': 'SS', '$': 'SS', 'STAR': 'Q', 'STUD': 'Q', 'NB': 'Q' };
    const VALID_COVERAGE_TYPES = new Set(['base', 'blitz', 'zone']);

    const POSITION_X_RANGES: Record<string, [number, number]> = {
      'E': [32, 68], 'T': [38, 62], 'N': [46, 54],
      'M': [35, 65], 'W': [35, 65], 'S': [30, 70], 'Q': [22, 78],
      'CB': [8, 92], 'SS': [30, 72], 'FS': [35, 65],
    };
    const POSITION_Y_RANGES: Record<string, [number, number]> = {
      'E': [53, 58], 'T': [53, 58], 'N': [53, 58],
      'M': [42, 52], 'W': [42, 52], 'S': [42, 52], 'Q': [38, 50],
      'CB': [28, 45], 'SS': [22, 40], 'FS': [15, 30],
    };

    const scenarios = rawScenarios.map((s: any) => {
      if (!s.defensive_positions || typeof s.defensive_positions !== 'object') return null;
      if (!s.correct_block_target || typeof s.correct_block_target !== 'string') return null;
      if (!s.coverage_name || !s.protection_type) return null;

      // Normalize defender labels
      for (const [key, def] of Object.entries(s.defensive_positions as Record<string, any>)) {
        const upper = (def.label || '').toUpperCase();
        if (LABEL_ALIASES[upper]) def.label = LABEL_ALIASES[upper];
        if (!VALID_LABELS.has(def.label)) {
          console.warn(`Removing defender ${key} with invalid label "${def.label}"`);
          delete s.defensive_positions[key];
        }
      }

      // Normalize coverage_type
      if (!VALID_COVERAGE_TYPES.has(s.coverage_type)) {
        const lower = (s.coverage_type || '').toLowerCase();
        if (lower === 'exotic' || lower === 'pressure') s.coverage_type = 'blitz';
        else if (lower === 'standard' || lower === 'shell') s.coverage_type = 'base';
        else s.coverage_type = 'blitz';
      }

      if (s.correct_block_target !== 'RELEASE' && !s.defensive_positions[s.correct_block_target]) return null;

      // Clamp defender coordinates to realistic ranges
      for (const [key, def] of Object.entries(s.defensive_positions as Record<string, any>)) {
        const xRange = POSITION_X_RANGES[def.label];
        const yRange = POSITION_Y_RANGES[def.label];
        if (xRange) {
          const oldX = def.x;
          def.x = Math.max(xRange[0], Math.min(xRange[1], def.x));
          if (oldX !== def.x) console.warn(`Clamped ${key} (${def.label}) x: ${oldX} -> ${def.x}`);
        }
        if (yRange) {
          const oldY = def.y;
          def.y = Math.max(yRange[0], Math.min(yRange[1], def.y));
          if (oldY !== def.y) console.warn(`Clamped ${key} (${def.label}) y: ${oldY} -> ${def.y}`);
        }
      }

      // Block target consistency checks
      const defs = s.defensive_positions as Record<string, any>;
      if (s.correct_block_target === 'RELEASE') {
        for (const d of Object.values(defs)) { if ((d as any).hot) (d as any).hot = false; }
      } else {
        const target = defs[s.correct_block_target];
        if (target) {
          if (!target.rushing) {
            console.warn(`Block target ${s.correct_block_target} not rushing -> RELEASE`);
            s.correct_block_target = 'RELEASE';
            for (const d of Object.values(defs)) { if ((d as any).hot) (d as any).hot = false; }
          } else {
            for (const [k, d] of Object.entries(defs)) { (d as any).hot = (k === s.correct_block_target); }
          }
        }
      }

      // Check secondary completeness
      const labels = Object.values(defs).map((d: any) => d.label);
      if (!labels.includes('FS') || !labels.includes('SS') || !labels.includes('CB')) {
        console.warn(`Scenario "${s.coverage_name}" missing secondary, skipping`);
        return null;
      }

      return s;
    }).filter(Boolean);

    console.log(`Claude returned ${rawScenarios.length} scenarios, ${scenarios.length} valid (${tokenCount} tokens)`);
    scenarios.forEach((s: any, i: number) => {
      const defCount = Object.keys(s.defensive_positions).length;
      const blitzers = Object.values(s.defensive_positions as Record<string, any>).filter((d: any) => d.blitz).map((d: any) => d.label);
      console.log(`  ${i + 1}. ${s.protection_type} vs ${s.coverage_name} (${s.coverage_type}) -> ${s.correct_block_target} | ${defCount} defenders | blitzers: [${blitzers.join(', ')}] | formation: ${s.offensive_formation || 'none'}`);
    });

    return { scenarios, tokenCount };
  } catch (error) {
    console.error('Error calling Claude for protection analysis:', error);
    throw error;
  }
}

export { handler };
