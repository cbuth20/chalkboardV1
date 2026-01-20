import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GLOSSARY_CONTEXT } from '@/lib/football-glossary';
import { playDataToText } from '@/lib/playDataToText';
import convert from 'heic-convert';
import {
  getInsightsPrompt,
  getKnowledgeCardsPrompt,
  buildInsightsContext,
  fillPromptTemplate,
  type ContentType,
} from '@/lib/content-generation-prompts';

// Initialize Supabase client with service role for server-side operations
// Service role bypasses RLS which is appropriate for server-side API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openaiApiKey = process.env.GPT_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      playbookMetadataId,
      playbookMetadataIds, // NEW: Support for multiple metadata IDs
      imageUrl,
      playData, // Structured play data from Play Builder
      fileName,
      teamId,
      generateInsights = true,
      generateAssignments = true,
      generateKnowledge = true,
      additionalContext = '', // NEW: User-provided context for multi-file generation
    } = body;

    // Support both single and multiple metadata IDs
    const metadataIdsArray = playbookMetadataIds || (playbookMetadataId ? [playbookMetadataId] : []);

    // Validation: Either imageUrl (for uploads) or playData (for built plays) must be provided
    if ((!imageUrl && !playData) || !teamId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: (imageUrl or playData), teamId',
        },
        { status: 400 }
      );
    }

    let metadataRecords: any[] = [];

    // Fetch playbook metadata for context (fetch all if multiple)
    if (metadataIdsArray.length > 0) {
      const { data, error: metadataError } = await supabase
        .from('playbook_metadata')
        .select('*')
        .in('id', metadataIdsArray);

      if (!metadataError && data && data.length > 0) {
        metadataRecords = data;
      }
    }

    // If no metadata found but we have fileName, create metadata on the fly
    if (metadataRecords.length === 0 && fileName) {
      console.log('[Auto-create] Creating metadata for file without metadata:', fileName);

      // Determine file path
      const FOLDER_PATH = 'public';
      const filePath = `${FOLDER_PATH}/${fileName}`;

      // Create minimal metadata
      const { data: newMetadata, error: createError } = await supabase
        .from('playbook_metadata')
        .insert({
          team_id: teamId,
          file_paths: [filePath],
          formation_name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          custom_notes: 'Auto-created during AI generation',
          position_relevance: ['all'],
          tags: [],
          is_built_play: false,
          play_data: null,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Auto-create] Failed to create metadata:', createError);
        return NextResponse.json(
          { error: 'Failed to create metadata for file', details: createError.message },
          { status: 500 }
        );
      }

      console.log('[Auto-create] Metadata created successfully:', newMetadata.id);
      metadataRecords = [newMetadata];
    }

    // Final validation - we must have at least one metadata record
    if (metadataRecords.length === 0) {
      return NextResponse.json(
        { error: 'Unable to create or find playbook metadata' },
        { status: 404 }
      );
    }

    // Use first metadata as primary (for play record creation)
    const primaryMetadata = metadataRecords[0];
    const metadata = primaryMetadata; // backwards compatibility

    // Build combined metadata context for AI (includes all files' context)
    let metadataContext = buildCombinedMetadataContext(metadataRecords);

    // Add user's additional context if provided
    if (additionalContext && additionalContext.trim()) {
      metadataContext += `\n\n--- USER'S PLAY DESCRIPTION ---\n${additionalContext.trim()}`;
    }

    // --- AI Generation Phase ---
    let playAnalysis: any = null;
    let insights: string | null = null;
    let knowledgeCards: any[] = [];

    // Determine whether we're analyzing an image or structured play data
    if (generateAssignments) {
      if (playData) {
        // Built play: Convert structured data to text and analyze
        console.log('Analyzing built play with structured data...');
        const playDescription = playDataToText(playData);
        playAnalysis = await analyzePlayWithText(playDescription, metadataContext, playData);
      } else if (imageUrl) {
        // Uploaded image: Fetch and analyze with vision
        console.log('Generating assignments via GPT-4o Vision...');

        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch image from URL' },
            { status: 404 }
          );
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type');

        // Check if image is HEIC/HEIF format
        const isHeic = contentType?.includes('heic') ||
                       contentType?.includes('heif') ||
                       fileName?.toLowerCase().endsWith('.heic') ||
                       fileName?.toLowerCase().endsWith('.heif');

        let base64Image: string;
        let mimeType: string;

        if (isHeic) {
          console.log('[Image Conversion] Detected HEIC/HEIF format, converting to JPEG...');
          try {
            // Convert HEIC to JPEG using heic-convert
            const jpegBuffer = await convert({
              buffer: Buffer.from(imageBuffer),
              format: 'JPEG',
              quality: 0.9, // 90% quality
            });

            base64Image = Buffer.from(jpegBuffer).toString('base64');
            mimeType = 'image/jpeg';
            console.log('[Image Conversion] Successfully converted HEIC to JPEG');
          } catch (conversionError: any) {
            console.error('[Image Conversion] Failed to convert HEIC:', conversionError);
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
          mimeType = contentType || (fileName?.endsWith('.png') ? 'image/png' : 'image/jpeg');
        }

        playAnalysis = await analyzePlayWithVision(base64Image, mimeType, metadataContext);
      }
    }

    // 2. Generate insights via GPT-4
    if (generateInsights && playAnalysis) {
      console.log('Generating insights via GPT-4...');
      insights = await generatePlayInsights(metadata, playAnalysis);
    }

    // 3. Generate knowledge cards via GPT-4
    if (generateKnowledge && playAnalysis) {
      console.log('Generating knowledge cards via GPT-4...');
      knowledgeCards = await generateKnowledgeCards(playAnalysis, metadata);
    }

    // --- Database Insertion Phase ---

    // Validate and normalize play_type to match database enum
    const validPlayTypes = ['PASS', 'RUN', 'RPO', 'SCREEN'];
    let playType = playAnalysis?.playType?.toUpperCase() || 'PASS';

    // If AI returned an invalid type (e.g., 'COVERAGE', 'DEFENSE', 'INSTRUCTION'), default to PASS
    if (!validPlayTypes.includes(playType)) {
      console.log(`[Play Type] Invalid play_type "${playType}" returned by AI. Defaulting to PASS.`);
      playType = 'PASS';
    }

    // Insert into plays table
    const { data: play, error: playError } = await supabase
      .from('plays')
      .insert({
        team_id: teamId,
        playbook_metadata_id: playbookMetadataId,
        name: playAnalysis?.name || metadata.formation_name || 'Untitled Play',
        short_name: playAnalysis?.shortName || playAnalysis?.name?.substring(0, 50) || 'Untitled',
        play_type: playType,
        concept: playAnalysis?.concept || metadata.concept_name,
        formation_name: playAnalysis?.formation || metadata.formation_name,
        ai_insights: insights,
        content_status: 'draft',
        is_published: false,
      })
      .select()
      .single();

    if (playError || !play) {
      console.error('Failed to insert play:', playError);
      return NextResponse.json(
        {
          error: 'Failed to create play record',
          details: playError?.message,
        },
        { status: 500 }
      );
    }

    const playId = play.id;
    console.log('Created play:', playId);

    // Insert play_assignments
    const assignments: any[] = [];
    if (playAnalysis?.positions && generateAssignments) {
      // Valid position enum values from database - ALL positions (offense, defense, special teams)
      const VALID_POSITIONS = new Set([
        // Offense - Skill Positions
        'QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE',
        // Offense - Offensive Line
        'LT', 'LG', 'C', 'RG', 'RT',
        // Defense - Defensive Line
        'DE', 'DT', 'NT',
        // Defense - Linebackers
        'MLB', 'OLB', 'ILB', 'WILL', 'MIKE', 'SAM',
        // Defense - Secondary
        'CB', 'FS', 'SS', 'S', 'NB',
        // Special Teams
        'K', 'P', 'LS', 'KR', 'PR'
      ]);

      // Map position names to valid enum values
      const positionMap: Record<string, string> = {
        'F': 'FB',   // F -> Fullback
        'HB': 'RB',  // Halfback -> Running Back
        'TB': 'RB',  // Tailback -> Running Back
        'WR': 'X',   // Generic WR -> X receiver
        'FULLBACK': 'FB',
        'HALFBACK': 'RB',
        'SLOT': 'H',
        'TIGHTEND': 'TE',
      };

      const assignmentRecords = Object.entries(playAnalysis.positions)
        .map(([position, posData]: [string, any]) => {
          const normalizedPosition = position.toUpperCase().trim();
          const mappedPosition = positionMap[normalizedPosition] || normalizedPosition;

          // Validate against enum
          if (!VALID_POSITIONS.has(mappedPosition)) {
            console.warn(`Invalid position detected: "${position}" (mapped to "${mappedPosition}") - skipping`);
            return null;
          }

          // Parse route_depth to ensure it's a number
          let routeDepth = null;
          if (posData.depth) {
            // Try to parse as integer, handle strings like "15 yards" or "Deep"
            const depthNum = parseInt(String(posData.depth).replace(/\D/g, ''));
            routeDepth = !isNaN(depthNum) ? depthNum : null;
          }

          // Determine category (default to 'general' if not provided)
          const category = posData.category || 'general';

          return {
            play_id: playId,
            position: mappedPosition,
            alignment: posData.alignment || '',
            landmark: posData.landmark || '',
            assignment: posData.assignment || '',
            key_read: posData.read || '',
            route_id: posData.routeId || null,
            route_depth: routeDepth,
            category: category,
            source_metadata_ids: metadataIdsArray,
            display_order: posData.display_order || 0,
            coverage_adjustments: {
              vs_man: posData.adjustments?.vsMan || '',
              vs_zone: posData.adjustments?.vsZone || '',
              vs_blitz: posData.adjustments?.vsBlitz || '',
            },
          };
        })
        .filter((record) => record !== null); // Remove null entries

      if (assignmentRecords.length > 0) {
        const { data: insertedAssignments, error: assignmentError } = await supabase
          .from('play_assignments')
          .insert(assignmentRecords)
          .select();

        if (assignmentError) {
          console.error('Failed to insert assignments:', assignmentError);
        } else {
          assignments.push(...(insertedAssignments || []));
          console.log(`Inserted ${assignments.length} assignments`);
        }
      } else {
        console.warn('No valid position assignments to insert');
      }
    }

    // Insert flashcard_templates (knowledge cards)
    const flashcards: any[] = [];
    if (knowledgeCards.length > 0 && generateKnowledge) {
      const flashcardRecords = knowledgeCards.map((card, index) => ({
        play_id: playId,
        position: 'QB', // Knowledge cards aren't position-specific, but field is required
        category: card.category || 'play_concept',
        question_prompt: card.question,
        correct_answer: card.correct_answer,
        difficulty: 'intermediate',
        is_auto_generated: true,
        is_active: true,
      }));

      const { data: insertedFlashcards, error: flashcardError } = await supabase
        .from('flashcard_templates')
        .insert(flashcardRecords)
        .select();

      if (flashcardError) {
        console.error('Failed to insert flashcards:', flashcardError);
      } else {
        flashcards.push(...(insertedFlashcards || []));
        console.log(`Inserted ${flashcards.length} knowledge cards`);
      }
    }

    // Generate assignment flashcards (position-specific multiple choice questions)
    if (playAnalysis?.positions && generateAssignments && assignments.length > 0) {
      console.log('Generating assignment flashcards...');
      const assignmentFlashcards = await generateAssignmentFlashcards(
        playAnalysis,
        assignments,
        playId
      );

      if (assignmentFlashcards.length > 0) {
        const { data: insertedAssignmentCards, error: assignmentCardsError } = await supabase
          .from('flashcard_templates')
          .insert(assignmentFlashcards)
          .select();

        if (assignmentCardsError) {
          console.error('Failed to insert assignment flashcards:', assignmentCardsError);
        } else {
          flashcards.push(...(insertedAssignmentCards || []));
          console.log(`Inserted ${insertedAssignmentCards?.length || 0} assignment flashcards`);
        }
      }
    }

    // Return generated content
    return NextResponse.json({
      playId,
      insights,
      assignments,
      knowledgeCards: flashcards,
      playAnalysis,
      status: 'draft',
    });
  } catch (error: any) {
    console.error('Error generating play content:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to generate play content',
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      { status: 500 }
    );
  }
}

// --- Helper Functions ---

function buildMetadataContext(metadata: any): string {
  const contextParts = [];
  if (metadata.side_of_ball) contextParts.push(`Side of ball: ${metadata.side_of_ball}`);
  if (metadata.content_type) contextParts.push(`Content type: ${metadata.content_type}`);
  if (metadata.level) contextParts.push(`Level: ${metadata.level}`);
  if (metadata.formation_name) contextParts.push(`Formation: ${metadata.formation_name}`);
  if (metadata.concept_name) contextParts.push(`Concept: ${metadata.concept_name}`);
  if (metadata.position_relevance && metadata.position_relevance.length > 0) {
    const positions = metadata.position_relevance.includes('all')
      ? 'all positions'
      : metadata.position_relevance.join(', ');
    contextParts.push(`Position relevance: ${positions}`);

    // Add explicit instruction for filtering
    if (!metadata.position_relevance.includes('all')) {
      contextParts.push(`⚠️ IMPORTANT: ONLY generate assignments for these positions: ${metadata.position_relevance.join(', ')}. Do NOT include assignments for any other positions.`);
    }
  }
  if (metadata.custom_notes) {
    contextParts.push(`\nCoach's additional information:\n${metadata.custom_notes}`);
  }

  return contextParts.length > 0
    ? `\n\nAdditional context:\n${contextParts.join('\n')}`
    : '';
}

// NEW: Build combined context from multiple metadata records
function buildCombinedMetadataContext(metadataRecords: any[]): string {
  if (metadataRecords.length === 1) {
    return buildMetadataContext(metadataRecords[0]);
  }

  // Group metadata by tags for better organization
  const taggedContext: Record<string, any[]> = {};
  const untaggedRecords: any[] = [];

  metadataRecords.forEach((metadata) => {
    if (metadata.tags && metadata.tags.length > 0) {
      metadata.tags.forEach((tag: string) => {
        if (!taggedContext[tag]) taggedContext[tag] = [];
        if (!taggedContext[tag].includes(metadata)) {
          taggedContext[tag].push(metadata);
        }
      });
    } else {
      untaggedRecords.push(metadata);
    }
  });

  const contextParts = ['\n\nMulti-File Context (synthesize ALL information below):'];

  // Add tagged context
  Object.entries(taggedContext).forEach(([tag, records]) => {
    contextParts.push(`\n--- ${tag.toUpperCase()} FILES ---`);
    records.forEach((metadata, idx) => {
      contextParts.push(`${tag} File ${idx + 1}:`);
      if (metadata.formation_name) contextParts.push(`  Formation: ${metadata.formation_name}`);
      if (metadata.concept_name) contextParts.push(`  Concept: ${metadata.concept_name}`);
      if (metadata.custom_notes) contextParts.push(`  Details: ${metadata.custom_notes}`);
    });
  });

  // Add untagged context
  if (untaggedRecords.length > 0) {
    contextParts.push(`\n--- ADDITIONAL FILES ---`);
    untaggedRecords.forEach((metadata, idx) => {
      contextParts.push(`File ${idx + 1}:`);
      if (metadata.formation_name) contextParts.push(`  Formation: ${metadata.formation_name}`);
      if (metadata.concept_name) contextParts.push(`  Concept: ${metadata.concept_name}`);
      if (metadata.custom_notes) contextParts.push(`  Details: ${metadata.custom_notes}`);
    });
  }

  // Add general context from primary file
  const primary = metadataRecords[0];
  if (primary.side_of_ball) contextParts.push(`\nSide of ball: ${primary.side_of_ball}`);
  if (primary.level) contextParts.push(`Level: ${primary.level}`);

  // Add position filtering instruction
  if (primary.position_relevance && primary.position_relevance.length > 0) {
    const positions = primary.position_relevance.includes('all')
      ? 'all positions'
      : primary.position_relevance.join(', ');
    contextParts.push(`Position relevance: ${positions}`);

    // Add explicit instruction for filtering
    if (!primary.position_relevance.includes('all')) {
      contextParts.push(`\n⚠️ IMPORTANT: ONLY generate assignments for these positions: ${primary.position_relevance.join(', ')}. Do NOT include assignments for any other positions.`);
    }
  }

  return contextParts.join('\n');
}

async function analyzePlayWithVision(
  base64Image: string,
  mimeType: string,
  metadataContext: string
): Promise<any> {
  const userPrompt = `Analyze this football play image and extract the play information, formations, routes, and position assignments.${metadataContext}

${GLOSSARY_CONTEXT}`;

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
    throw new Error(`GPT-4o Vision API error: ${error}`);
  }

  const data = await response.json();
  const analysisText = data.choices[0].message.content;

  try {
    const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : analysisText;
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error('Failed to parse GPT Vision response:', analysisText);
    throw new Error('Failed to parse play analysis');
  }
}

async function analyzePlayWithText(
  playDescription: string,
  metadataContext: string,
  playData: any
): Promise<any> {
  const userPrompt = `Analyze this football play based on the structured play data provided below. Extract position assignments, reads, and adjustments.${metadataContext}

${playDescription}

${GLOSSARY_CONTEXT}`;

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
          content: userPrompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT-4 Text API error: ${error}`);
  }

  const data = await response.json();
  const analysisText = data.choices[0].message.content;

  try {
    const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : analysisText;
    const parsedAnalysis = JSON.parse(jsonString);

    // Merge with metadata from playData to ensure we have all required fields
    return {
      ...parsedAnalysis,
      name: parsedAnalysis.name || playData.metadata.name,
      formation: parsedAnalysis.formation || playData.metadata.formation,
      concept: parsedAnalysis.concept || playData.metadata.concept,
      playType: parsedAnalysis.playType || playData.metadata.playType,
    };
  } catch (parseError) {
    console.error('Failed to parse GPT Text response:', analysisText);
    throw new Error('Failed to parse play analysis');
  }
}

async function generatePlayInsights(metadata: any, playAnalysis: any): Promise<string> {
  // Determine content type from metadata (default to 'play' if not specified)
  const contentType: ContentType = (metadata.content_type as ContentType) || 'play';

  // Get dynamic prompts based on content type
  const promptConfig = getInsightsPrompt(contentType);

  // Build context from metadata and analysis
  const context = buildInsightsContext(metadata, playAnalysis);

  // Fill template with context
  const userPrompt = fillPromptTemplate(promptConfig.userPromptTemplate, {
    CONTEXT: context,
  });

  console.log(`[Insights] Generating insights for content type: ${contentType}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: promptConfig.systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: promptConfig.maxTokens,
      temperature: promptConfig.temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('GPT-4 insights error:', error);
    throw new Error('Failed to generate insights');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateKnowledgeCards(playAnalysis: any, metadata: any): Promise<any[]> {
  // Determine content type from metadata (default to 'play' if not specified)
  const contentType: ContentType = (metadata.content_type as ContentType) || 'play';

  // Get dynamic prompts based on content type
  const promptConfig = getKnowledgeCardsPrompt(contentType);

  // Build context string based on content type
  let context = '';
  if (contentType === 'play') {
    // For plays, use structured template variables
    context = fillPromptTemplate(promptConfig.userPromptTemplate, {
      NAME: playAnalysis.name || 'Unknown',
      FORMATION: playAnalysis.formation || metadata.formation_name || 'Unknown',
      CONCEPT: playAnalysis.concept || metadata.concept_name || 'Unknown',
      PLAY_TYPE: playAnalysis.playType || 'Unknown',
      DESCRIPTION: playAnalysis.description || 'N/A',
    });
  } else if (contentType === 'coverage') {
    // For coverage, use coverage-specific fields
    context = fillPromptTemplate(promptConfig.userPromptTemplate, {
      NAME: playAnalysis.name || metadata.formation_name || 'Unknown',
      COVERAGE_TYPE: playAnalysis.coverageType || 'Unknown',
      COVERAGE_FAMILY: playAnalysis.coverageFamily || 'Unknown',
      FRONT: playAnalysis.front || 'Unknown',
      DESCRIPTION: playAnalysis.description || 'N/A',
    });
  } else if (contentType === 'formation') {
    // For formations, use formation-specific fields
    context = fillPromptTemplate(promptConfig.userPromptTemplate, {
      NAME: playAnalysis.name || metadata.formation_name || 'Unknown',
      PERSONNEL: playAnalysis.personnel || metadata.personnel || 'Unknown',
      ALIGNMENT: playAnalysis.alignment || 'Unknown',
      KEY_FEATURES: playAnalysis.keyFeatures ? playAnalysis.keyFeatures.join(', ') : 'N/A',
      COMMON_PLAYS: playAnalysis.commonPlays ? playAnalysis.commonPlays.join(', ') : 'N/A',
    });
  } else {
    // For other content types, build generic context
    const contextData = buildInsightsContext(metadata, playAnalysis);
    context = fillPromptTemplate(promptConfig.userPromptTemplate, {
      CONTEXT: contextData,
    });
  }

  console.log(`[Knowledge Cards] Generating ${promptConfig.cardCount} cards for content type: ${contentType}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: promptConfig.systemPrompt,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      max_tokens: promptConfig.maxTokens,
      temperature: promptConfig.temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('GPT-4 knowledge cards error:', error);
    return []; // Return empty array on error rather than failing the whole request
  }

  const data = await response.json();
  const cardsText = data.choices[0].message.content;

  try {
    const jsonMatch = cardsText.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : cardsText;
    const cards = JSON.parse(jsonString);
    return Array.isArray(cards) ? cards : [];
  } catch (parseError) {
    console.error('Failed to parse knowledge cards:', cardsText);
    return [];
  }
}

async function generateAssignmentFlashcards(
  playAnalysis: any,
  assignments: any[],
  playId: string
): Promise<any[]> {
  const flashcards: any[] = [];

  // Get all unique positions from assignments
  const positionData = assignments.reduce((acc: any, assignment: any) => {
    if (!acc[assignment.position]) {
      acc[assignment.position] = assignment;
    }
    return acc;
  }, {});

  // For each position, generate 3 flashcards: alignment, assignment, key_read
  for (const [position, data] of Object.entries(positionData) as [string, any][]) {
    // Get other positions' data for generating distractors
    const otherPositions = Object.entries(positionData).filter(([pos]) => pos !== position);

    // 1. Alignment question
    const alignmentOptions = [
      data.alignment,
      ...otherPositions.slice(0, 3).map(([_, d]: [string, any]) => d.alignment),
    ].filter((v, i, a) => v && a.indexOf(v) === i); // Remove duplicates and empty values

    if (alignmentOptions.length >= 2) {
      flashcards.push({
        play_id: playId,
        assignment_id: data.id,
        position: position,
        card_type: 'assignment',
        category: 'alignment',
        question_prompt: `Where do you line up as the ${position}?`,
        correct_answer: data.alignment,
        hints: shuffleArray(alignmentOptions), // Store options in hints field
        difficulty: 'beginner',
        is_auto_generated: true,
        is_active: true,
      });
    }

    // 2. Assignment question
    const assignmentOptions = [
      data.assignment,
      ...otherPositions.slice(0, 3).map(([_, d]: [string, any]) => d.assignment),
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    if (assignmentOptions.length >= 2) {
      flashcards.push({
        play_id: playId,
        assignment_id: data.id,
        position: position,
        card_type: 'assignment',
        category: 'assignment',
        question_prompt: `What is your assignment as the ${position}?`,
        correct_answer: data.assignment,
        hints: shuffleArray(assignmentOptions),
        difficulty: 'intermediate',
        is_auto_generated: true,
        is_active: true,
      });
    }

    // 3. Key Read question
    const readOptions = [
      data.key_read,
      ...otherPositions.slice(0, 3).map(([_, d]: [string, any]) => d.key_read),
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    if (readOptions.length >= 2) {
      flashcards.push({
        play_id: playId,
        assignment_id: data.id,
        position: position,
        card_type: 'assignment',
        category: 'read',
        question_prompt: `What is your key read as the ${position}?`,
        correct_answer: data.key_read,
        hints: shuffleArray(readOptions),
        difficulty: 'intermediate',
        is_auto_generated: true,
        is_active: true,
      });
    }
  }

  return flashcards;
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const PLAY_ANALYSIS_SYSTEM_PROMPT = `You are an expert football coach and analyst. Your job is to analyze football play diagrams and extract structured information about the play.

CRITICAL: If the user provides a "USER'S PLAY DESCRIPTION" section in the input, treat it as EXTREMELY IMPORTANT guidance. This description tells you exactly what the image(s) contain and what to focus on. Use it to guide your analysis and ensure you extract the correct information. The user's description should override any assumptions you might make from the image alone.

CRITICAL - Position Filtering: The user will specify "Position relevance" in the context. If specific positions are listed (not "all positions"), you MUST ONLY generate assignments for those exact positions. Do NOT generate assignments for any positions not in that list. This is a strict filtering requirement.

IMPORTANT - Multiple Plays in Images: If an image contains multiple plays/formations (e.g., 5-8 different plays shown on one sheet), extract ALL position assignments from ALL visible plays. Create a comprehensive list that captures every position's assignment across all plays shown. Each position may appear multiple times with different assignments.

When analyzing a play diagram, identify:
1. The play name and formation
2. The play type - MUST be one of these values ONLY:
   - "pass" - passing plays
   - "run" - running plays
   - "rpo" - run-pass option plays
   - "screen" - screen passes
   Note: If the content is coverage/defensive concepts, instructional material, or doesn't fit these categories, default to "pass"
3. The concept being used (e.g., Mesh, Flood, Power, Zone, Cover 3, Cover 2, etc.)
4. Position assignments for each skill position

IMPORTANT: Use ONLY these exact position abbreviations in your response:

OFFENSE:
- QB (Quarterback)
- RB (Running Back / Halfback)
- FB (Fullback)
- X (Split End / Left Wide Receiver)
- Z (Flanker / Right Wide Receiver)
- H (Slot Receiver)
- Y (Tight End / Y Receiver)
- TE (Tight End)
- LT (Left Tackle)
- LG (Left Guard)
- C (Center)
- RG (Right Guard)
- RT (Right Tackle)

DEFENSE:
- DE (Defensive End)
- DT (Defensive Tackle)
- NT (Nose Tackle)
- MLB (Middle Linebacker)
- OLB (Outside Linebacker)
- ILB (Inside Linebacker)
- WILL (Will Linebacker / Weakside)
- MIKE (Mike Linebacker / Middle)
- SAM (Sam Linebacker / Strongside)
- CB (Cornerback)
- FS (Free Safety)
- SS (Strong Safety)
- S (Safety)
- NB (Nickelback)

SPECIAL TEAMS:
- K (Kicker)
- P (Punter)
- LS (Long Snapper)
- KR (Kick Returner)
- PR (Punt Returner)

Do NOT use abbreviations like "F", "HB", "WR", or any other variations.

For each position assignment, extract:
- alignment: Where they line up (e.g., "Slot left", "Split right 12 yards", "Pistol")
- landmark: Their aiming point (e.g., "Inside shoulder of #2", "Frontside A-gap", "Backside hash")
- assignment: Their route or responsibility (e.g., "15-yard dig", "Lead block backside linebacker", "Pass protect")
- read: What they're reading (e.g., "Safety rotation", "Mike linebacker", "Cornerback leverage")
- category: The assignment category - use ONE of these exact values:
  - "formation" for alignment/formation details
  - "route" for routes and route running
  - "coverage" for coverage reads and adjustments (USE THIS for defensive coverage concepts and responsibilities)
  - "protection" for pass protection
  - "blocking" for run blocking
  - "run_fits" for run game fits and gaps
  - "adjustments" for play adjustments
  - "hot_routes" for hot routes and audibles
  - "checks" for pre-snap checks
  - "general" for general assignments that don't fit other categories
  Note: When analyzing coverage/defensive content, prioritize using the "coverage" category for relevant assignments
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
    "QB": { "alignment": "...", "landmark": "...", "assignment": "...", "read": "...", "category": "formation", "adjustments": { "vsMan": "...", "vsZone": "...", "vsBlitz": "..." } },
    "RB": { "alignment": "...", "landmark": "...", "assignment": "...", "read": "...", "category": "blocking" },
    "X": { "alignment": "...", "landmark": "...", "assignment": "...", "read": "...", "category": "route", "adjustments": { "vsMan": "...", "vsZone": "..." }, "routeId": "dig", "depth": 15 },
    ... (include all visible positions)
  }
}

When multiple files are provided, synthesize ALL the information to create comprehensive assignments that reference all material. Pay special attention to the user's description if provided - it will explain how the files relate to each other.

If the image is unclear or doesn't contain a football play, return:
{
  "error": "Unable to identify a football play in this image",
  "suggestion": "Please provide a clear football play diagram"
}

Only return valid JSON, no additional text or markdown.`;
