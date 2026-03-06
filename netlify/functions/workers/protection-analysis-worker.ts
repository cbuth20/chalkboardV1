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
  front_family: string;
  protection_type: string;
  protection_concept: string;
  call_side: string;
  solid_call: boolean;
  free_release: boolean;
  play_action: boolean;
  boot: boolean;
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
        front_family: s.front_family || null,
        protection_type: s.protection_type,
        protection_concept: s.protection_concept || 'unknown',
        call_side: s.call_side,
        solid_call: s.solid_call,
        free_release: s.free_release,
        play_action: s.play_action,
        boot: s.boot ?? false,
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
            throw new Error(`Failed to delete old scenario batch: ${deleteError.message}`);
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
      throw new Error(`Failed to update analysis record: ${updateError.message}`);
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
  const systemPrompt = `You are an expert football coach analyzing playbook pages to extract RB pass protection training scenarios.

## Content gate — EVALUATE FIRST

Before generating anything, assess whether this page contains football pass protection content. Valid content includes: protection schemes, blocking assignments, play diagrams with offensive/defensive alignments, or formation/personnel info relevant to pass protection.

If the page is NOT valid football protection material (e.g., random notes, non-football content, illegible scans, roster lists, workout plans, run-game-only plays with no pass protection), return:
{ "scenarios": [], "skipped_reason": "Brief explanation of why this page was skipped" }

If the page IS valid, proceed with scenario generation below.

## Schema

Identify the team's protections from the playbook and generate scenarios pairing each protection against varied defensive looks.

Return JSON: { "scenarios": [ ... ] }. Each scenario:
{
  "coverage_name": "OVER",           // defensive front name
  "coverage_type": "blitz",          // "base", "blitz", or "zone"
  "front_family": "Even",            // "Odd" (center covered), "Even" (center uncovered), or "5 Down" (center + both guards covered)
  "protection_type": "60 Protection",// team's ACTUAL name from the playbook — preserve their terminology
  "protection_concept": "full_slide",// see taxonomy below
  "call_side": "right",              // OL slide direction — vary left/right roughly evenly
  "solid_call": false,
  "free_release": false,
  "play_action": false,
  "boot": false,                     // true if QB rolls out (bootleg); play_action without boot = pocket PA
  "naked": false,
  "hoss": false,
  "scat_release": null,
  "defensive_positions": {
    "E1": {"x": 35, "y": 56, "label": "E", "rushing": true},
    "T1": {"x": 43, "y": 57, "label": "T", "rushing": true},
    "T2": {"x": 57, "y": 57, "label": "T", "rushing": true},
    "E2": {"x": 65, "y": 56, "label": "E", "rushing": true},
    "M":  {"x": 50, "y": 48, "label": "M", "rushing": false},
    "W":  {"x": 58, "y": 48, "label": "W", "rushing": false},
    "S":  {"x": 63, "y": 42, "label": "S", "rushing": true, "blitz": true, "hot": true},
    "SS": {"x": 58, "y": 30, "label": "SS", "rushing": false},
    "FS": {"x": 50, "y": 22, "label": "FS", "rushing": false},
    "CB1": {"x": 15, "y": 35, "label": "CB", "rushing": false},
    "CB2": {"x": 85, "y": 35, "label": "CB", "rushing": false}
  },
  "correct_block_target": "S",       // defender key or "RELEASE"
  "explanation": "2-4 sentence coaching explanation",
  "offensive_formation": "POSSE 2x2",
  "down_distance": "2nd & 7"
}

Protection concepts: full_slide | half_slide | man_protect | max_protect | play_action | sprint_out | screen | draw | unknown

The RB's read changes by concept — reflect this in explanations:
- **full_slide**: RB reads opposite edge for leakers
- **half_slide**: RB reads the man side, use tb_read 1/2/3 for read progression
- **man_protect**: RB picks up the free runner inside-out

## Defender flags

- "rushing": true if they rush the passer
- "blitz": true if rushing from a non-traditional position (LB, DB)
- "hot": true ONLY for the literal unblocked free runner — the one NO offensive player picks up. Usually the same as correct_block_target.
- "walked_up": true if they creep toward the LOS pre-snap (any position). Combined with "rushing": false = mug/simulated pressure (they bail out post-snap).
- "tb_read": 1/2/3 for half_slide read progression

Labels (use ONLY these): E, T, N, M, W, S, Q, CB, SS, FS. NEVER use "R", "Rover", "$", "NB" — map Rover/$→SS, Star/Stud/Nickel→Q.

## Coordinates

x: 0-100 (left to right). y: 0-100 (top=deep, bottom=offense). LOS at y:55, OL spans x:40-60 at y:65.

**Strict x-ranges by position (MUST follow — these align with the OL):**
- DEs (E): x: 33-37 (left) or x: 63-67 (right). They align ON or just outside the OT.
- DTs (T): x: 40-47 (left) or x: 53-60 (right). They align on the guards/tackles.
- NT (N): x: 48-52 (over center). Only in Odd/5-Down fronts.
- LBs (M, W, S): x: 35-65, y: 42-52. Inside the box.
- CBs: x: 10-22 (left) or x: 78-90 (right), y: 30-42. Wide, off the line.
- SS: x: 35-70, y: 25-38. In the box or over a slot.
- FS: x: 40-60, y: 15-28. Deep middle.
- Nickel/Q: x: 25-40 or x: 60-75, y: 38-48. Slot area.

DL at y: 53-58. Always include full secondary (2 CBs, SS, FS). Never place a DE wider than x:33 or x:67 — they must be near the offensive tackles, not out by the receivers.

## Front family rules

- Odd: center covered (0-tech). Examples: 3-4, 3-3-5.
- Even: center uncovered, guards covered. Examples: OVER, UNDER, 4-3, NICKEL.
- 5 Down: center + both guards covered. Examples: BEAR, 46, GOAL LINE.
- A walked-up OLB with hand in dirt changes the front family (e.g., 3-4 with walked-up OLB → Even).

## Scenario distribution

Weight the mix toward what the playbook emphasizes. If the playbook is heavy on half-slide protections, generate more single-blitz and exotic looks that test half-slide reads. Use these categories as a guide, not rigid quotas:

1. **Base rush** — 4-man DL rush, standard fronts. TB usually releases or has a late check.

2. **Single blitz** — One extra rusher (LB or DB). 5-man pressure. TB blocks the free runner.

3. **Exotic pressure** — Multiple blitzers, 6+ rushers. Use your football knowledge — examples include cover 0, cross dogs, overloads, fire zones (DL drops to coverage — mark rushing: false), delayed blitzes, green dogs, zone dogs, nickel/dime pressures. Be creative and varied. Mark the unblocked free runner as "hot": true.

4. **Simulated pressure / mug** — Defenders show blitz pre-snap but bail at the snap. Use walked_up: true + rushing: false. Any position can mug — ILBs in A-gaps, safeties crowding the box, edge players showing rush. Can combine with a real blitz from elsewhere (e.g., LB mugs while CB comes free). Position mugging defenders at y:46-52. Correct answer is usually RELEASE or block the real blitzer if one exists.

## Explanation quality

Write 2-4 sentences per scenario covering: (a) what the OL slide handles, (b) why this defender is or isn't the TB's job, (c) the pre-snap key to read — e.g., "count the box", "read inside-out from the A-gap", "watch his feet not his alignment."

Return ONLY the JSON object.`;

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

    const scenarios = rawScenarios
      .map((s: any) => {
        if (!s.defensive_positions || typeof s.defensive_positions !== 'object') return null;
        if (!s.correct_block_target || typeof s.correct_block_target !== 'string') return null;
        if (!s.coverage_name || !s.protection_type) return null;

        // Normalize defender labels (R → SS, $ → SS, etc.)
        for (const [key, def] of Object.entries(s.defensive_positions as Record<string, any>)) {
          const upper = (def.label || '').toUpperCase();
          if (LABEL_ALIASES[upper]) {
            def.label = LABEL_ALIASES[upper];
          }
          if (!VALID_LABELS.has(def.label)) {
            console.warn(`Removing defender ${key} with invalid label "${def.label}"`);
            delete s.defensive_positions[key];
          }
        }

        // Normalize coverage_type
        if (!VALID_COVERAGE_TYPES.has(s.coverage_type)) {
          // Map common AI-generated variants
          const lower = (s.coverage_type || '').toLowerCase();
          if (lower === 'exotic' || lower === 'pressure') s.coverage_type = 'blitz';
          else if (lower === 'standard' || lower === 'shell') s.coverage_type = 'base';
          else s.coverage_type = 'blitz';
        }

        // Verify correct_block_target still valid after normalization
        if (s.correct_block_target !== 'RELEASE' && !s.defensive_positions[s.correct_block_target]) return null;

        // Clamp defender coordinates to realistic ranges per position
        // OL spans x:40-60. DEs must be near the tackles, not out by receivers.
        const POSITION_X_RANGES: Record<string, [number, number]> = {
          'E':  [32, 68],
          'T':  [38, 62],
          'N':  [46, 54],
          'M':  [35, 65],
          'W':  [35, 65],
          'S':  [30, 70],
          'Q':  [22, 78],
          'CB': [8, 92],
          'SS': [30, 72],
          'FS': [35, 65],
        };
        const POSITION_Y_RANGES: Record<string, [number, number]> = {
          'E':  [53, 58],
          'T':  [53, 58],
          'N':  [53, 58],
          'M':  [42, 52],
          'W':  [42, 52],
          'S':  [42, 52],
          'Q':  [38, 50],
          'CB': [28, 45],
          'SS': [22, 40],
          'FS': [15, 30],
        };

        for (const [key, def] of Object.entries(s.defensive_positions as Record<string, any>)) {
          const xRange = POSITION_X_RANGES[def.label];
          const yRange = POSITION_Y_RANGES[def.label];
          if (xRange) {
            const oldX = def.x;
            def.x = Math.max(xRange[0], Math.min(xRange[1], def.x));
            if (oldX !== def.x) {
              console.warn(`Clamped ${key} (${def.label}) x: ${oldX} → ${def.x}`);
            }
          }
          if (yRange) {
            const oldY = def.y;
            def.y = Math.max(yRange[0], Math.min(yRange[1], def.y));
            if (oldY !== def.y) {
              console.warn(`Clamped ${key} (${def.label}) y: ${oldY} → ${def.y}`);
            }
          }
        }

        // Check secondary completeness — must have at least FS + SS + 1 CB
        const labels = Object.values(s.defensive_positions as Record<string, any>).map((d: any) => d.label);
        if (!labels.includes('FS') || !labels.includes('SS') || !labels.includes('CB')) {
          console.warn(`Scenario "${s.coverage_name}" missing secondary (labels: ${labels.join(',')}), skipping`);
          return null;
        }

        return s;
      })
      .filter(Boolean);

    console.log(`Claude returned ${rawScenarios.length} scenarios, ${scenarios.length} valid (${tokenCount} tokens)`);

    return { scenarios, tokenCount };
  } catch (error) {
    console.error('Error calling Claude for protection analysis:', error);
    throw error;
  }
}
