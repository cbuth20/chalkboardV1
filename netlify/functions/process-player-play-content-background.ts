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
    } = JSON.parse(event.body || '{}');

    playId = inputPlayId;
    console.log('📝 Processing player play:', playId);

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

      console.log('1️⃣  Analyzing diagram play with GPT-4...');
      playAnalysis = await analyzeDiagramPlay(openai, diagramText, metadataContext);
    } else {
      // For image plays, use vision AI
      if (!imageUrl) {
        throw new Error('Image URL is required for non-diagram plays');
      }

      console.log('📷 Fetching image from:', imageUrl);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image from URL');
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      console.log('1️⃣  Analyzing play with GPT-4o Vision...');
      playAnalysis = await analyzePlayWithVision(openai, base64Image, mimeType, metadataContext);
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
        const { data: assignments, error: assignmentError } = await supabase
          .from('player_play_assignments')
          .insert(assignmentRecords)
          .select();

        if (assignmentError) {
          console.error('Failed to insert assignments:', assignmentError);
        } else {
          console.log(`✅ Inserted ${assignments?.length || 0} assignments`);
        }
      }
    }

    // Insert flashcards
    if (knowledgeCards.length > 0 && generateKnowledge) {
      const flashcardRecords = knowledgeCards.map((card: any) => {
        // Store question type and options in hints field as metadata
        const hintsData: any = {
          questionType: card.questionType || 'multiple_choice',
        };

        // For multiple choice, store the options
        if (card.questionType === 'multiple_choice' && card.options) {
          hintsData.options = card.options;
        }

        return {
          player_play_id: playId,
          position: normalizePosition(card.position) || 'QB',
          category: mapToValidCategory(card.category),
          question_prompt: card.question,
          correct_answer: card.correctAnswer || card.answer,
          hints: hintsData,
          explanation: card.explanation || null,
          difficulty: card.difficulty || 'intermediate',
          is_auto_generated: true,
          is_active: true,
        };
      });

      const { data: flashcards, error: flashcardError } = await supabase
        .from('player_flashcard_templates')
        .insert(flashcardRecords)
        .select();

      if (flashcardError) {
        console.error('Failed to insert flashcards:', flashcardError);
      } else {
        console.log(`✅ Inserted ${flashcards?.length || 0} flashcards`);
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

    if (playId) {
      await supabase
        .from('player_plays')
        .update({ content_status: 'rejected' })
        .eq('id', playId);
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process player play',
        message: error.message,
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
  const prompt = `Generate 8-10 study flashcards for this football play:

Play: ${playAnalysis.name}
Type: ${playAnalysis.playType}
Concept: ${playAnalysis.concept}

Create a mix of TRUE/FALSE and MULTIPLE CHOICE questions covering different aspects of the play.

For TRUE/FALSE questions:
{
  "position": "QB|RB|X|Z|H|Y|TE|LT|LG|C|RG|RT",
  "category": "alignment|assignment|coverage|motion|read|progression|terminology|blocking",
  "questionType": "true_false",
  "question": "statement to evaluate as true or false",
  "correctAnswer": "true" or "false",
  "explanation": "why this answer is correct",
  "difficulty": "beginner|intermediate|advanced"
}

For MULTIPLE CHOICE questions (provide 4 options):
{
  "position": "QB|RB|X|Z|H|Y|TE|LT|LG|C|RG|RT",
  "category": "alignment|assignment|coverage|motion|read|progression|terminology|blocking",
  "questionType": "multiple_choice",
  "question": "question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": "option A" (must exactly match one of the options),
  "explanation": "why this answer is correct and others are wrong",
  "difficulty": "beginner|intermediate|advanced"
}

CATEGORY VALUES (use ONLY these):
- "alignment" - stance, splits, position on field
- "assignment" - route concepts, play execution, responsibilities
- "coverage" - coverage recognition and adjustments
- "motion" - pre-snap movement
- "read" - single read/key
- "progression" - multi-step read progressions
- "terminology" - play calling and terminology
- "blocking" - blocking schemes

Create a good mix: about 40% true/false and 60% multiple choice questions.

Return a JSON object with a "flashcards" array containing these flashcard objects.`;

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
