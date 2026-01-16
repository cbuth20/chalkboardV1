import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { GLOSSARY_CONTEXT } from '../../src/lib/football-glossary';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openaiApiKey = process.env.GPT_KEY!;

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const {
      playbookMetadataId,
      imageUrl,
      fileName,
      teamId,
      generateInsights = true,
      generateAssignments = true,
      generateKnowledge = true,
    } = JSON.parse(event.body || '{}');

    // Validation
    if (!playbookMetadataId || !imageUrl || !teamId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: playbookMetadataId, imageUrl, teamId',
        }),
      };
    }

    // Fetch playbook metadata for context
    const { data: metadata, error: metadataError } = await supabase
      .from('playbook_metadata')
      .select('*')
      .eq('id', playbookMetadataId)
      .single();

    if (metadataError || !metadata) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Playbook metadata not found' }),
      };
    }

    // Fetch image for AI processing
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
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

    // Build metadata context for AI
    const metadataContext = buildMetadataContext(metadata);

    // --- AI Generation Phase ---
    let playAnalysis: any = null;
    let insights: string | null = null;
    let knowledgeCards: any[] = [];

    // 1. Generate assignments via GPT-4o Vision
    if (generateAssignments) {
      console.log('Generating assignments via GPT-4o Vision...');
      playAnalysis = await analyzePlayWithVision(base64Image, mimeType, metadataContext);
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

    // Insert into plays table
    const { data: play, error: playError } = await supabase
      .from('plays')
      .insert({
        team_id: teamId,
        playbook_metadata_id: playbookMetadataId,
        name: playAnalysis?.name || metadata.formation_name || 'Untitled Play',
        short_name: playAnalysis?.shortName || playAnalysis?.name?.substring(0, 50) || 'Untitled',
        play_type: playAnalysis?.playType?.toUpperCase() || 'PASS',
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
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to create play record',
          details: playError?.message,
        }),
      };
    }

    const playId = play.id;
    console.log('Created play:', playId);

    // Insert play_assignments
    const assignments: any[] = [];
    if (playAnalysis?.positions && generateAssignments) {
      const assignmentRecords = Object.entries(playAnalysis.positions)
        .map(([position, posData]: [string, any]) => {
          const normalizedPosition = normalizePosition(position);
          if (!normalizedPosition) {
            return null; // Skip invalid positions
          }

          return {
            play_id: playId,
            position: normalizedPosition,
            alignment: posData.alignment || '',
            landmark: posData.landmark || '',
            assignment: posData.assignment || '',
            key_read: posData.read || '',
            route_id: posData.routeId || null,
            route_depth: posData.depth || null,
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
        card_type: 'knowledge',
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

    // Return generated content
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playId,
        insights,
        assignments,
        knowledgeCards: flashcards,
        playAnalysis,
        status: 'draft',
      }),
    };
  } catch (error: any) {
    console.error('Error generating play content:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate play content',
        message: error.message,
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

async function generatePlayInsights(metadata: any, playAnalysis: any): Promise<string> {
  const context = [
    metadata.formation_name && `Formation: ${metadata.formation_name}`,
    metadata.concept_name && `Concept: ${metadata.concept_name}`,
    playAnalysis.name && `Play: ${playAnalysis.name}`,
    metadata.side_of_ball && `Side of Ball: ${metadata.side_of_ball}`,
    metadata.content_type && `Content Type: ${metadata.content_type}`,
    metadata.level && `Level: ${metadata.level}`,
    metadata.position_relevance && `Relevant Positions: ${metadata.position_relevance.join(', ')}`,
    metadata.custom_notes && `Notes: ${metadata.custom_notes}`,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `You are a professional football coach analyzing play metadata. Based on the following play information, provide quick coaching insights in a concise, actionable format.

${context}

Provide insights in the following format:
- Play Type: [Brief description of what this play is]
- Common Uses: [When and why this play is used]
- Best Against: [What defensive schemes this works well against]
- Key Coaching Points: [2-3 critical execution points]
- Position Focus: [Key responsibilities for relevant positions]

Keep each section brief (1-2 sentences max). Be specific and actionable.`;

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
          content: 'You are an expert football coach providing concise, actionable play analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
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
  const prompt = `Based on this football play, generate 4-5 general knowledge quiz cards that test understanding of the play.

Play Information:
- Name: ${playAnalysis.name || 'Unknown'}
- Formation: ${playAnalysis.formation || metadata.formation_name || 'Unknown'}
- Concept: ${playAnalysis.concept || metadata.concept_name || 'Unknown'}
- Play Type: ${playAnalysis.playType || 'Unknown'}
- Description: ${playAnalysis.description || 'N/A'}

Generate flashcards that test:
1. When to use this play (situational understanding)
2. What coverage it works best against
3. Key execution points
4. Formation identification
5. Concept understanding

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "play_concept" | "formation_key" | "coverage_read" | "execution_key"
  }
]`;

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
          content:
            'You are a football coach creating quiz cards. Return only valid JSON arrays, no markdown or extra text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
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
    "QB": { "alignment": "...", "landmark": "...", "assignment": "...", "read": "...", "adjustments": { "vsMan": "...", "vsZone": "...", "vsBlitz": "..." } },
    "RB": { ... },
    "X": { "alignment": "...", "landmark": "...", "assignment": "...", "read": "...", "adjustments": { "vsMan": "...", "vsZone": "..." }, "routeId": "dig", "depth": 15 },
    ... (include all visible positions)
  }
}

If the image is unclear or doesn't contain a football play, return:
{
  "error": "Unable to identify a football play in this image",
  "suggestion": "Please provide a clear football play diagram"
}

Only return valid JSON, no additional text or markdown.`;
