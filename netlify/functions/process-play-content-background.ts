import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { GLOSSARY_CONTEXT } from '../../src/lib/football-glossary';
import { playDataToText } from '../../src/lib/playDataToText';
import {
  getInsightsPrompt,
  getKnowledgeCardsPrompt,
  buildInsightsContext,
  fillPromptTemplate,
  type ContentType,
} from './content-generation-prompts';
import { generateAssignmentFlashcards } from './flashcard-templates';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.GPT_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('Missing required environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    openaiApiKey: !!openaiApiKey,
  });
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Background function to process play content with AI
// The -background suffix gives this 15 minutes instead of 10 seconds
export const handler: Handler = async (event, context) => {
  console.log('🚀 Background processing started - 15 minute timeout');

  // Check for missing environment variables
  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    console.error('❌ Missing environment variables');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Server configuration error',
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const startTime = Date.now();
  let playId: string | null = null;

  try {
    const {
      playId: inputPlayId,
      imageUrl,
      playData, // Structured play data from Play Builder
      fileName,
      generateInsights = true,
      generateAssignments = true,
      generateKnowledge = true,
    } = JSON.parse(event.body || '{}');

    playId = inputPlayId;

    console.log('📝 Processing play:', playId);

    // Validation: Either imageUrl (for uploads) or playData (for built plays) must be provided
    if (!playId || (!imageUrl && !playData)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: playId, (imageUrl or playData)',
        }),
      };
    }

    // Fetch the existing play with its metadata
    console.log('📖 Fetching play and metadata...');
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select(`
        *,
        playbook_metadata!plays_playbook_metadata_id_fkey (*)
      `)
      .eq('id', playId)
      .single();

    if (playError || !play) {
      console.error('❌ Play fetch failed:', playError);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Play not found' }),
      };
    }

    const metadata = (play as any).playbook_metadata;
    console.log('✅ Play and metadata found:', metadata?.formation_name);

    // Build metadata context for AI
    const metadataContext = buildMetadataContext(metadata);

    console.log('🎬 Starting AI generation...');

    // --- AI Generation Phase ---
    let playAnalysis: any = null;
    let insights: string | null = null;
    let knowledgeCards: any[] = [];

    // Determine whether we're analyzing an image or structured play data
    if (generateAssignments) {
      if (playData) {
        // Built play: Convert structured data to text and analyze
        console.log('1️⃣  Analyzing built play with structured data...');
        const playDescription = playDataToText(playData);
        playAnalysis = await analyzePlayWithText(playDescription, metadataContext, playData);
        console.log('✅ Play analysis complete:', {
          name: playAnalysis?.name,
          playType: playAnalysis?.playType,
          positionCount: playAnalysis?.positions ? Object.keys(playAnalysis.positions).length : 0,
        });
      } else if (imageUrl) {
        // Uploaded image: Fetch and analyze with vision
        console.log('🖼️  Fetching image from:', imageUrl);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error('❌ Failed to fetch image:', imageResponse.status);
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to fetch image from URL' }),
          };
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const contentType = imageResponse.headers.get('content-type');
        const mimeType = contentType || (fileName?.endsWith('.png') ? 'image/png' : 'image/jpeg');
        console.log('✅ Image fetched, size:', imageBuffer.byteLength, 'bytes');

        console.log('1️⃣  Generating assignments via GPT-4o Vision...');
        playAnalysis = await analyzePlayWithVision(base64Image, mimeType, metadataContext);
        console.log('✅ Play analysis complete:', {
          name: playAnalysis?.name,
          playType: playAnalysis?.playType,
          positionCount: playAnalysis?.positions ? Object.keys(playAnalysis.positions).length : 0,
        });
      }
    }

    // 2. Generate insights via GPT-4
    if (generateInsights && playAnalysis) {
      console.log('2️⃣  Generating insights via GPT-4...');
      insights = await generatePlayInsights(metadata, playAnalysis);
      console.log('✅ Insights generated');
    }

    // 3. Generate knowledge cards via GPT-4
    if (generateKnowledge && playAnalysis) {
      console.log('3️⃣  Generating knowledge cards via GPT-4...');
      knowledgeCards = await generateKnowledgeCards(playAnalysis, metadata);
      console.log('✅ Generated', knowledgeCards.length, 'knowledge cards');
    }

    // --- Update Play Record ---
    console.log('💾 Updating play with AI-generated content...');

    // Validate and normalize play_type to match database enum
    const validPlayTypes = ['PASS', 'RUN', 'RPO', 'SCREEN'];
    let playType = playAnalysis?.playType?.toUpperCase() || 'PASS';

    // If AI returned an invalid type (e.g., 'COVERAGE', 'DEFENSE', 'INSTRUCTION'), default to PASS
    if (!validPlayTypes.includes(playType)) {
      console.log(`[Play Type] Invalid play_type "${playType}" returned by AI. Defaulting to PASS.`);
      playType = 'PASS';
    }

    const { error: updateError } = await supabase
      .from('plays')
      .update({
        name: playAnalysis?.name || metadata.formation_name || 'Untitled Play',
        short_name: playAnalysis?.shortName || playAnalysis?.name?.substring(0, 50) || 'Untitled',
        play_type: playType,
        concept: playAnalysis?.concept || metadata.concept_name,
        formation_name: playAnalysis?.formation || metadata.formation_name,
        ai_insights: insights,
        content_status: 'draft', // Mark as draft, ready for review
      })
      .eq('id', playId);

    if (updateError) {
      console.error('❌ Failed to update play:', updateError);
      // Mark as rejected on error
      await supabase
        .from('plays')
        .update({ content_status: 'rejected' })
        .eq('id', playId);

      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to update play record',
          details: updateError.message,
        }),
      };
    }

    console.log('✅ Play updated successfully');

    // Insert play_assignments
    const assignments: any[] = [];
    if (playAnalysis?.positions && generateAssignments) {
      // Build source_metadata_ids array (track which metadata was used for this play)
      const sourceMetadataIds = metadata?.id ? [metadata.id] : [];

      const assignmentRecords = Object.entries(playAnalysis.positions)
        .map(([position, posData]: [string, any]) => {
          const normalizedPosition = normalizePosition(position);
          if (!normalizedPosition) {
            return null; // Skip invalid positions
          }

          // Determine category (default to 'general' if not provided)
          const category = posData.category || 'general';

          return {
            play_id: playId,
            org_id: play.org_id, // Explicitly set org_id for proper scoping
            position: normalizedPosition,
            alignment: posData.alignment || '',
            landmark: posData.landmark || '',
            assignment: posData.assignment || '',
            key_read: posData.read || '',
            route_id: posData.routeId || null,
            route_depth: posData.depth || null,
            category: category,
            source_metadata_ids: sourceMetadataIds,
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
        org_id: play.org_id, // Explicitly set org_id for proper scoping
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
        playId,
        metadata,
        shuffleArray
      );

      if (assignmentFlashcards.length > 0) {
        // Add org_id to all assignment flashcards for proper scoping
        const flashcardsWithOrgId = assignmentFlashcards.map((fc) => ({
          ...fc,
          org_id: play.org_id,
        }));

        const { data: insertedAssignmentCards, error: assignmentCardsError } = await supabase
          .from('flashcard_templates')
          .insert(flashcardsWithOrgId)
          .select();

        if (assignmentCardsError) {
          console.error('Failed to insert assignment flashcards:', assignmentCardsError);
        } else {
          flashcards.push(...(insertedAssignmentCards || []));
          console.log(`Inserted ${insertedAssignmentCards?.length || 0} assignment flashcards`);
        }
      }
    }

    // Generation complete
    const duration = Date.now() - startTime;
    console.log(`✅ Content generation completed in ${(duration / 1000).toFixed(2)}s`);
    console.log(`✅ Play ${playId} marked as draft - ready for review`);

    // Return success (though response will be discarded by Netlify for background functions)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        playId,
        message: 'Content generation completed',
        generationTimeMs: duration,
      }),
    };
  } catch (error: any) {
    console.error('❌ Error generating play content:', error);

    // Try to mark play as rejected if we have playId
    if (playId) {
      try {
        console.log('Marking play as rejected due to error:', playId);
        await supabase
          .from('plays')
          .update({ content_status: 'rejected' })
          .eq('id', playId);
      } catch (updateError) {
        console.error('Failed to update play status to rejected:', updateError);
      }
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate play content',
        message: error.message,
        playId: playId,
      }),
    };
  }
};

// --- Helper Functions ---

// Valid position enum values from database
const VALID_POSITIONS = new Set([
  'QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE',
  'LT', 'LG', 'C', 'RG', 'RT'
]);

// Map common position abbreviations to valid enum values
const POSITION_MAPPING: Record<string, string> = {
  'F': 'FB',
  'FULLBACK': 'FB',
  'HALFBACK': 'RB',
  'HB': 'RB',
  'WR': 'X', // Default wide receiver to X
  'SLOT': 'H',
  'TIGHTEND': 'TE',
  'LEFTTACKLE': 'LT',
  'LEFTGUARD': 'LG',
  'CENTER': 'C',
  'RIGHTGUARD': 'RG',
  'RIGHTTACKLE': 'RT',
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function normalizePosition(position: string): string | null {
  const upperPos = position.toUpperCase().trim();

  // Check if it's already valid
  if (VALID_POSITIONS.has(upperPos)) {
    return upperPos;
  }

  // Check mapping
  if (POSITION_MAPPING[upperPos]) {
    return POSITION_MAPPING[upperPos];
  }

  // Invalid position
  console.warn(`Invalid position detected: "${position}" - skipping`);
  return null;
}

function buildMetadataContext(metadata: any): string {
  const contextParts = [];
  if (metadata.side_of_ball) contextParts.push(`Side of ball: ${metadata.side_of_ball}`);
  if (metadata.content_type) contextParts.push(`Content type: ${metadata.content_type}`);
  if (metadata.level) contextParts.push(`Level: ${metadata.level}`);
  if (metadata.formation_name) contextParts.push(`Formation: ${metadata.formation_name}`);
  if (metadata.concept_name) contextParts.push(`Concept: ${metadata.concept_name}`);
  if (metadata.position_relevance && metadata.position_relevance.length > 0) {
    contextParts.push(`Position relevance: ${metadata.position_relevance.join(', ')}`);
  }
  if (metadata.custom_notes) {
    contextParts.push(`\nCoach's additional information:\n${metadata.custom_notes}`);
  }

  return contextParts.length > 0
    ? `\n\nAdditional context:\n${contextParts.join('\n')}`
    : '';
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

const PLAY_ANALYSIS_SYSTEM_PROMPT = `You are an expert football coach and analyst. Your job is to analyze football play diagrams and extract structured information about the play.

When analyzing a play diagram, identify:
1. The play name and formation
2. The play type (pass, run, RPO, screen)
3. The concept being used (e.g., Mesh, Flood, Power, Zone, etc.)
4. Position assignments for each skill position

IMPORTANT: Use ONLY these exact position abbreviations in your response:
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

Do NOT use abbreviations like "F", "HB", "WR", or any other variations.

For each position assignment, extract:
- alignment: Where they line up (e.g., "Slot left", "Split right 12 yards", "Pistol")
- landmark: Their aiming point (e.g., "Inside shoulder of #2", "Frontside A-gap", "Backside hash")
- assignment: Their route or responsibility (e.g., "15-yard dig", "Lead block backside linebacker", "Pass protect")
- read: What they're reading (e.g., "Safety rotation", "Mike linebacker", "Cornerback leverage")
- category: The assignment category - use ONE of these exact values:
  - "formation" for alignment/formation details
  - "route" for routes and route running
  - "coverage" for coverage reads and adjustments
  - "protection" for pass protection
  - "blocking" for run blocking
  - "run_fits" for run game fits and gaps
  - "adjustments" for play adjustments
  - "hot_routes" for hot routes and audibles
  - "checks" for pre-snap checks
  - "general" for general assignments that don't fit other categories
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

If the image is unclear or doesn't contain a football play, return:
{
  "error": "Unable to identify a football play in this image",
  "suggestion": "Please provide a clear football play diagram"
}

Only return valid JSON, no additional text or markdown.`;
