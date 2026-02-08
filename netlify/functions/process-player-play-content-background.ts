/**
 * Background function to process player play content with AI
 * Targets player_plays, player_play_assignments, player_flashcard_templates
 * IMPORTANT: This reuses the same AI analysis logic as team plays
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { diagramToText } from '../../src/lib/playDiagramToText';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.GPT_KEY || process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
const openai = new OpenAI({
  apiKey: openaiApiKey,
  baseURL: 'https://api.openai.com/v1',
  maxRetries: 3,
});

export const handler: Handler = async (event, context) => {
  console.log('🚀 Player play background processing started - 15 minute timeout');

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error - missing Supabase credentials' }),
    };
  }

  if (!openaiApiKey) {
    console.error('❌ Missing OpenAI API key - GPT_KEY environment variable not set');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error - missing OpenAI API key' }),
    };
  }

  console.log('✅ Environment variables loaded:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseServiceKey,
    hasOpenAIKey: !!openaiApiKey,
    openAIKeyPrefix: openaiApiKey?.substring(0, 15) + '...',
    openAIKeyLength: openaiApiKey?.length,
    openAIKeySuffix: '...' + openaiApiKey?.substring(openaiApiKey.length - 8),
  });

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
      generateInsights = true,
      generateAssignments = true,
      generateKnowledge = true,
      useStructuredData = false, // NEW: Flag to use structured assignments instead of image
    } = JSON.parse(event.body || '{}');

    playId = inputPlayId;
    console.log('📝 Processing player play:', playId);
    console.log('🔧 Using structured data:', useStructuredData);

    if (!playId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'playId is required' }),
      };
    }

    // Fetch player play
    const { data: play, error: playError } = await supabase
      .from('player_plays')
      .select(`
        *,
        player_playbook_metadata!player_plays_player_playbook_metadata_id_fkey (*)
      `)
      .eq('id', playId)
      .single();

    if (playError || !play) {
      console.error('❌ Player play fetch failed:', playError);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Player play not found' }),
      };
    }

    const metadata = (play as any).player_playbook_metadata;
    console.log('✅ Player play and metadata found:', play.name);

    // Build metadata context
    const metadataContext = buildMetadataContext(metadata);
    console.log('🎬 Starting AI generation...');

    let playAnalysis = null;

    // NEW: Check if this is a structured play (with player_responsibilities)
    const hasStructuredData = useStructuredData && play.player_responsibilities && Object.keys(play.player_responsibilities).length > 0;

    if (hasStructuredData) {
      // For structured plays, use player responsibilities directly
      console.log('🎯 This is a structured play - using player responsibilities');

      // Get situational tags
      const { data: situationalTags } = await supabase
        .from('player_play_situational_tags')
        .select('tag_id, situational_tags(name)')
        .eq('player_play_id', playId);

      const tags = situationalTags?.map((t: any) => t.situational_tags?.name).filter(Boolean) || [];

      const structuredText = buildStructuredPlayText(play, tags);
      console.log('1️⃣  Analyzing structured play with GPT-4o...');
      playAnalysis = await analyzeStructuredPlay(openai, structuredText, metadataContext);
    } else {
      // Check if this is a diagram-built play or an image-based play
      const isDiagramPlay = play.diagram_data && play.diagram_data.offensePlayers;

      if (isDiagramPlay) {
        // For diagram plays, convert diagram to text and use that instead of vision
        console.log('📐 This is a diagram-built play - using diagram data');
        const diagramText = diagramToText(play.diagram_data, {
          name: play.name,
          formation: play.formation_name || '',
          concept: play.concept || '',
          playType: play.play_type as 'PASS' | 'RUN' | 'RPO',
          strength: 'Right',
          personnel: '11',
        });

        console.log('1️⃣  Analyzing diagram play with GPT-4o...');
        playAnalysis = await analyzeDiagramPlay(openai, diagramText, metadataContext);
      } else {
        // For image/PDF plays, use vision AI
        if (!imageUrl) {
          throw new Error('Image URL is required for non-diagram plays');
        }

        console.log('📷 Fetching file from:', imageUrl);
        const fileResponse = await fetch(imageUrl);
        if (!fileResponse.ok) {
          throw new Error('Failed to fetch file from URL');
        }

        const fileBuffer = await fileResponse.arrayBuffer();
        const base64File = Buffer.from(fileBuffer).toString('base64');
        const mimeType = fileResponse.headers.get('content-type') || 'image/jpeg';

        // Check if this is a PDF
        const filePath = metadata?.file_paths?.[0] || '';
        const fileName = filePath.split('/').pop() || '';
        const isPDF = fileName.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';

        if (isPDF) {
          console.log('📄 Analyzing PDF with GPT-4o...');
          playAnalysis = await analyzePDFWithVision(openai, base64File, metadataContext);
        } else {
          console.log('1️⃣  Analyzing play with GPT-4o Vision...');
          playAnalysis = await analyzePlayWithVision(openai, base64File, mimeType, metadataContext);
        }
      }
    }

    console.log('✅ Analysis complete:', {
      name: playAnalysis?.name,
      positions: playAnalysis?.positions ? Object.keys(playAnalysis.positions).length : 0,
    });

    // Generate insights
    let insights = null;
    if (generateInsights && playAnalysis) {
      console.log('2️⃣  Generating insights...');
      insights = await generatePlayInsights(openai, metadata, playAnalysis);
      console.log('✅ Insights generated');
    }

    // Generate knowledge cards
    let knowledgeCards: any[] = [];
    if (generateKnowledge && playAnalysis) {
      console.log('3️⃣  Generating knowledge cards...');
      knowledgeCards = await generateKnowledgeCards(openai, playAnalysis, metadata);
      console.log('✅ Generated', knowledgeCards.length, 'knowledge cards');
    }

    // Update player play
    console.log('💾 Updating player play...');
    const validPlayTypes = ['PASS', 'RUN', 'RPO', 'SCREEN'];
    let playType = playAnalysis?.playType?.toUpperCase() || 'PASS';
    if (!validPlayTypes.includes(playType)) {
      playType = 'PASS';
    }

    const { error: updateError } = await supabase
      .from('player_plays')
      .update({
        name: playAnalysis?.name || play.name,
        short_name: playAnalysis?.shortName || playAnalysis?.name?.substring(0, 50) || play.name.substring(0, 50),
        play_type: playType,
        concept: playAnalysis?.concept || metadata?.concept_name,
        formation_name: playAnalysis?.formation || metadata?.formation_name,
        ai_insights: insights,
        content_status: 'approved', // Auto-approve for player plays
      })
      .eq('id', playId);

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      await supabase
        .from('player_plays')
        .update({ content_status: 'rejected' })
        .eq('id', playId);
      throw updateError;
    }

    console.log('✅ Player play updated');

    // Insert assignments
    if (playAnalysis?.positions && generateAssignments) {
      const assignmentRecords = Object.entries(playAnalysis.positions)
        .map(([position, posData]: [string, any]) => {
          const normalizedPosition = normalizePosition(position);
          if (!normalizedPosition) return null;

          // Parse route_depth - should be a number, not a string
          let routeDepth = null;
          if (posData.depth) {
            const parsed = parseInt(posData.depth);
            if (!isNaN(parsed)) {
              routeDepth = parsed;
            }
          }

          return {
            player_play_id: playId,
            position: normalizedPosition,
            alignment: posData.alignment || '',
            landmark: posData.landmark || '',
            assignment: posData.assignment || '',
            key_read: posData.read || '',
            route_id: posData.routeId || null,
            route_depth: routeDepth,
            coverage_adjustments: {
              vs_man: posData.adjustments?.vsMan || '',
              vs_zone: posData.adjustments?.vsZone || '',
              vs_blitz: posData.adjustments?.vsBlitz || '',
            },
          };
        })
        .filter(Boolean);

      if (assignmentRecords.length > 0) {
        // Delete existing assignments first to avoid duplicates (for re-processing)
        const { error: deleteError } = await supabase
          .from('player_play_assignments')
          .delete()
          .eq('player_play_id', playId);

        if (deleteError) {
          console.error('Warning: Failed to delete existing assignments:', deleteError);
        }

        const { data: assignments, error: assignmentError } = await supabase
          .from('player_play_assignments')
          .insert(assignmentRecords)
          .select();

        if (assignmentError) {
          console.error('Failed to insert assignments:', assignmentError);
          throw new Error(`Failed to insert assignments: ${assignmentError.message}`);
        } else {
          console.log(`✅ Inserted ${assignments?.length || 0} assignments`);
        }
      }
    }

    // Insert flashcards
    if (knowledgeCards.length > 0 && generateKnowledge) {
      // Fetch play tags for inheritance
      const { data: situationalTags } = await supabase
        .from('player_play_situational_tags')
        .select('situational_tags(name)')
        .eq('player_play_id', playId);

      const { data: conceptTags } = await supabase
        .from('player_play_concept_tags')
        .select('concept_tags(name)')
        .eq('player_play_id', playId);

      const inheritedTags = [
        ...(situationalTags?.map((st: any) => st.situational_tags?.name).filter(Boolean) || []),
        ...(conceptTags?.map((ct: any) => ct.concept_tags?.name).filter(Boolean) || [])
      ];

      console.log(`📌 Inherited ${inheritedTags.length} tags from play:`, inheritedTags);

      const flashcardRecords = knowledgeCards.map((card: any) => {
        // Combine inherited tags with AI-generated tags
        const allTags = [
          ...inheritedTags,
          ...(card.tags || [])
        ];

        return {
          player_play_id: playId,
          org_id: play.org_id,
          position: normalizePosition(card.position) || 'QB',
          category: mapToValidCategory(card.category),

          // NEW FIELDS
          question_type: card.questionType || 'multiple_choice',
          topic: card.topic || null,
          options: card.options || null,
          scenario_context: card.scenarioContext || null,
          learning_objective: card.learningObjective || '',
          tags: allTags,
          ai_generation_metadata: {
            generated_at: new Date().toISOString(),
            model: 'gpt-4o',
            play_concept: play.concept,
            play_name: play.name,
          },

          // EXISTING FIELDS
          question_prompt: card.question,
          correct_answer: card.correctAnswer || card.answer,
          hints: card.hints || [],
          explanation: card.explanation || null,
          difficulty: card.difficulty || 'intermediate',
          is_auto_generated: true,
          is_active: true,
        };
      });

      // Delete existing flashcards first to avoid duplicates (for re-processing)
      const { error: deleteFlashcardsError } = await supabase
        .from('player_flashcard_templates')
        .delete()
        .eq('player_play_id', playId);

      if (deleteFlashcardsError) {
        console.error('Warning: Failed to delete existing flashcards:', deleteFlashcardsError);
      }

      const { data: flashcards, error: flashcardError } = await supabase
        .from('player_flashcard_templates')
        .insert(flashcardRecords)
        .select();

      if (flashcardError) {
        console.error('Failed to insert flashcards:', flashcardError);
        throw new Error(`Failed to insert flashcards: ${flashcardError.message}`);
      } else {
        console.log(`✅ Inserted ${flashcards?.length || 0} flashcards with enhanced metadata`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Player play processing complete in ${elapsed}s`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        playId,
        processingTimeSeconds: parseFloat(elapsed),
        assignmentsGenerated: playAnalysis?.positions ? Object.keys(playAnalysis.positions).length : 0,
        flashcardsGenerated: knowledgeCards.length,
      }),
    };
  } catch (error: any) {
    console.error('❌ Processing failed:', error);

    // Store error message for UI to display
    const errorMessage = error.message || 'Unknown processing error';
    const errorDetails = `Processing Error: ${errorMessage}\n\nTimestamp: ${new Date().toISOString()}\n\nYou can retry processing this play.`;

    if (playId) {
      await supabase
        .from('player_plays')
        .update({
          content_status: 'rejected',
          ai_insights: errorDetails, // Store error in ai_insights field for now
        })
        .eq('id', playId);
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process player play',
        message: errorMessage,
        playId,
      }),
    };
  }
};

// AI Processing Functions (using fetch instead of OpenAI SDK)

/**
 * Analyze a diagram-built play using text description instead of vision
 */
async function analyzeDiagramPlay(
  openai: OpenAI,
  diagramText: string,
  metadataContext: string
): Promise<any> {
  const prompt = `Analyze this football play diagram (provided as text description) and extract detailed information.

${metadataContext ? `Context: ${metadataContext}` : ''}

DIAGRAM DESCRIPTION:
${diagramText}

Based on this diagram, provide a JSON response with:
{
  "name": "descriptive play name",
  "shortName": "short version (max 50 chars)",
  "playType": "PASS|RUN|RPO|SCREEN",
  "concept": "offensive concept",
  "formation": "formation name",
  "positions": {
    "QB": { "alignment": "under center|shotgun|pistol", "landmark": "", "assignment": "", "read": "", "adjustments": { "vsMan": "", "vsZone": "", "vsBlitz": "" } },
    "RB": { "alignment": "", "landmark": "", "assignment": "", "read": "", "adjustments": { ... } },
    "X": { "alignment": "", "landmark": "", "assignment": "", "routeId": "Go|Post|Corner|Dig|etc", "depth": 15, "adjustments": { ... } }
  }
}

IMPORTANT:
- For "routeId" use the route name (e.g., "Go", "Post", "Corner", "Dig")
- For "depth" use a NUMBER representing yards (e.g., 5, 10, 15, 20) NOT a route name
- Include all visible positions in the diagram`;

  const apiKey = openaiApiKey;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  return JSON.parse(content);
}

async function analyzePDFWithVision(
  openai: OpenAI,
  base64PDF: string,
  metadataContext: string
): Promise<any> {
  const prompt = `Analyze this football playbook PDF and extract detailed information for study purposes.

${metadataContext ? `Context: ${metadataContext}` : ''}

Provide a JSON response with:
{
  "name": "descriptive name for the content (e.g., 'Red Zone Passing Concepts' or 'Cover 2 Defense')",
  "shortName": "short version (max 50 chars)",
  "playType": "PASS|RUN|RPO|SCREEN",
  "concept": "main concept or scheme",
  "formation": "formation name if visible",
  "positions": {
    "QB": { "alignment": "", "landmark": "", "assignment": "", "read": "", "adjustments": { "vsMan": "", "vsZone": "", "vsBlitz": "" } },
    "RB": { "alignment": "", "landmark": "", "assignment": "", "read": "", "adjustments": { ... } }
    // Include all positions with responsibilities mentioned
  }
}

Extract key information about:
- Play concepts and schemes
- Position responsibilities and assignments
- Formations and alignments
- Reads and progressions
- Adjustments vs different defenses
- Coaching points

Focus on information that would be useful for generating study flashcards.`;

  const apiKey = openaiApiKey;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64PDF}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No response from Vision API');

  return JSON.parse(content);
}

async function analyzePlayWithVision(
  openai: OpenAI,
  base64Image: string,
  mimeType: string,
  metadataContext: string
): Promise<any> {
  const prompt = `Analyze this football play diagram and extract detailed information.

${metadataContext ? `Context: ${metadataContext}` : ''}

Provide a JSON response with:
{
  "name": "descriptive play name",
  "shortName": "short version (max 50 chars)",
  "playType": "PASS|RUN|RPO|SCREEN",
  "concept": "offensive concept",
  "formation": "formation name",
  "positions": {
    "QB": { "alignment": "under center|shotgun|pistol", "landmark": "", "assignment": "", "read": "", "adjustments": { "vsMan": "", "vsZone": "", "vsBlitz": "" } },
    "RB": { "alignment": "", "landmark": "", "assignment": "", "read": "", "adjustments": { ... } },
    "X": { "alignment": "", "landmark": "", "assignment": "", "routeId": "Go|Post|Corner|Dig|etc", "depth": 15, "adjustments": { ... } }
  }
}

IMPORTANT:
- For "routeId" use the route name (e.g., "Go", "Post", "Corner", "Dig")
- For "depth" use a NUMBER representing yards (e.g., 5, 10, 15, 20) NOT a route name
- Include all visible positions in the diagram`;

  // Use fetch directly instead of OpenAI SDK to avoid bundling issues
  const apiKey = openaiApiKey;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No response from Vision API');

  return JSON.parse(content);
}

async function generatePlayInsights(
  openai: OpenAI,
  metadata: any,
  playAnalysis: any
): Promise<string> {
  const prompt = `Generate coaching insights for this play:

Play: ${playAnalysis.name}
Type: ${playAnalysis.playType}
Concept: ${playAnalysis.concept}
Formation: ${playAnalysis.formation}

Provide 3-5 key coaching points focusing on:
- When to call this play
- Key reads and progressions
- Common mistakes to avoid
- Adjustments vs different defenses

Keep it concise and actionable.`;

  const apiKey = openaiApiKey;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error (insights):', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function generateKnowledgeCards(
  openai: OpenAI,
  playAnalysis: any,
  metadata: any
): Promise<any[]> {
  const prompt = `Generate 8-12 high-quality study flashcards for this football play:

Play: ${playAnalysis.name}
Type: ${playAnalysis.playType}
Concept: ${playAnalysis.concept}

Create diverse questions covering different aspects. For each question, provide:

{
  "position": "QB|RB|X|Z|H|Y|TE|LT|LG|C|RG|RT",
  "category": "alignment|assignment|coverage|motion|read|progression|terminology|blocking",
  "questionType": "multiple_choice|true_false|scenario",
  "topic": "coverage_recognition|route_running|blocking_assignments|pre_snap_reads|post_snap_reads|alignment_rules|play_concepts|situational_football",
  "question": "question text",
  "options": ["A", "B", "C", "D"],  // For multiple_choice only
  "correctAnswer": "exact match to one option or 'true'/'false'",
  "explanation": "detailed explanation of correct answer",
  "learningObjective": "what this question teaches",
  "scenarioContext": "game situation if applicable (e.g., '3rd & 6, red zone, vs Cover 2')",
  "tags": ["relevant", "tags"],  // e.g., ["3rd_down", "red_zone"]
  "difficulty": "beginner|intermediate|advanced"
}

TOPICS (use one of these exact values):
- formation_identification, alignment_rules, personnel_groupings
- route_running, blocking_assignments, pass_protection, run_fits
- pre_snap_reads, post_snap_reads, coverage_recognition, hot_routes
- coverage_adjustments, formation_checks, audibles, motion_adjustments
- play_concepts, coverage_concepts, situational_football, game_planning
- terminology, rules, techniques

CATEGORIES:
- alignment: stance, splits, position
- assignment: routes, execution, responsibilities
- coverage: recognition and adjustments
- motion: pre-snap movement
- read: single read/key
- progression: multi-step reads
- terminology: play calling terms
- blocking: blocking schemes

Generate 2-5 questions per position based on their assignments. Mix difficulty levels and question types.

Return JSON: { "flashcards": [...] }`;

  const apiKey = openaiApiKey;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error (flashcards):', response.status, errorText);
    return [];
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content);
  return parsed.flashcards || parsed.cards || [];
}

// Helper functions
function buildMetadataContext(metadata: any): string {
  if (!metadata) return '';
  const parts: string[] = [];
  if (metadata.formation_name) parts.push(`Formation: ${metadata.formation_name}`);
  if (metadata.concept_name) parts.push(`Concept: ${metadata.concept_name}`);
  if (metadata.side_of_ball) parts.push(`Side: ${metadata.side_of_ball}`);
  if (metadata.level) parts.push(`Level: ${metadata.level}`);
  if (metadata.unit) parts.push(`Unit: ${metadata.unit}`);
  if (metadata.playbook_section) parts.push(`Section: ${metadata.playbook_section}`);
  if (metadata.custom_notes) parts.push(`Notes: ${metadata.custom_notes}`);
  return parts.join(' | ');
}

function normalizePosition(position: string): string | null {
  const positionMap: Record<string, string> = {
    'QB': 'QB', 'RB': 'RB', 'FB': 'FB',
    'X': 'X', 'Z': 'Z', 'H': 'H', 'Y': 'Y', 'TE': 'TE',
    'LT': 'LT', 'LG': 'LG', 'C': 'C', 'RG': 'RG', 'RT': 'RT',
  };
  const normalized = position.toUpperCase().trim();
  return positionMap[normalized] || null;
}

function mapToValidCategory(category: string): string {
  // Valid enum values: 'alignment', 'assignment', 'coverage', 'motion', 'read', 'progression', 'terminology', 'blocking'
  const categoryMap: Record<string, string> = {
    'play_concept': 'assignment',
    'route_running': 'assignment',
    'blocking': 'blocking',
    'reads': 'read',
    'read': 'read',
    'progression': 'progression',
    'progressions': 'progression',
    'adjustments': 'coverage',
    'coverage': 'coverage',
    'alignment': 'alignment',
    'motion': 'motion',
    'terminology': 'terminology',
    'assignment': 'assignment',
  };

  const normalized = (category || '').toLowerCase().replace(/_/g, '');

  // Try direct match
  if (categoryMap[category]) return categoryMap[category];

  // Try normalized match
  for (const [key, value] of Object.entries(categoryMap)) {
    if (key.replace(/_/g, '') === normalized) {
      return value;
    }
  }

  // Default to 'assignment' for unknown categories
  return 'assignment';
}

// NEW: Helper function to build structured play text from player responsibilities
function buildStructuredPlayText(play: any, situationalTags: string[]): string {
  const parts: string[] = [];

  // Play metadata
  parts.push(`Play: ${play.name}`);
  if (play.side_of_ball) parts.push(`Side of Ball: ${play.side_of_ball}`);
  if (play.structured_play_type) parts.push(`Play Type: ${play.structured_play_type}`);
  if (play.formation_name) parts.push(`Formation: ${play.formation_name}`);
  if (play.personnel) parts.push(`Personnel: ${play.personnel}`);

  // Situational tags
  if (situationalTags.length > 0) {
    parts.push(`Situations: ${situationalTags.join(', ')}`);
  }

  parts.push('\n--- Player Responsibilities ---\n');

  // Player responsibilities (filter by includeInAI flag)
  const responsibilities = play.player_responsibilities || {};
  Object.entries(responsibilities).forEach(([playerId, resp]: [string, any]) => {
    if (resp.includeInAI !== false) { // Include by default
      const playerLabel = playerId; // You may want to map this to actual player labels
      parts.push(`${playerLabel}: ${resp.responsibility}`);
      if (resp.coachingNotes) {
        parts.push(`  Notes: ${resp.coachingNotes}`);
      }
    }
  });

  return parts.join('\n');
}

// NEW: Analyze structured play using GPT-4o
async function analyzeStructuredPlay(
  openai: OpenAI,
  structuredText: string,
  metadataContext: string
): Promise<any> {
  const prompt = `You are analyzing a football play with structured player responsibilities.

${metadataContext}

Play Details:
${structuredText}

Analyze this play and provide:
1. A brief overview of the play concept (2-3 sentences)
2. Key coaching points for players
3. Potential adjustments based on defensive looks
4. The primary read/progression if applicable

Return your analysis in JSON format with these fields:
{
  "overview": "Play overview here",
  "coachingPoints": ["Point 1", "Point 2", ...],
  "adjustments": "Adjustment notes",
  "reads": "Read progression notes"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.6,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No analysis content returned from GPT-4o');
  }

  return JSON.parse(content);
}
