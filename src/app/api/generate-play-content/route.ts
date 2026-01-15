import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GLOSSARY_CONTEXT } from '@/lib/football-glossary';

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
      imageUrl,
      fileName,
      teamId,
      generateInsights = true,
      generateAssignments = true,
      generateKnowledge = true,
    } = body;

    // Validation
    if (!playbookMetadataId || !imageUrl || !teamId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: playbookMetadataId, imageUrl, teamId',
        },
        { status: 400 }
      );
    }

    // Fetch playbook metadata for context
    const { data: metadata, error: metadataError } = await supabase
      .from('playbook_metadata')
      .select('*')
      .eq('id', playbookMetadataId)
      .single();

    if (metadataError || !metadata) {
      return NextResponse.json(
        { error: 'Playbook metadata not found' },
        { status: 404 }
      );
    }

    // Fetch image for AI processing
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from URL' },
        { status: 404 }
      );
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
      // Map position names to valid enum values
      const positionMap: Record<string, string> = {
        'HB': 'RB',  // Halfback -> Running Back
        'TB': 'RB',  // Tailback -> Running Back
        'WR': 'X',   // Generic WR -> X receiver
      };

      const assignmentRecords = Object.entries(playAnalysis.positions).map(
        ([position, posData]: [string, any]) => {
          const normalizedPosition = position.toUpperCase();
          const mappedPosition = positionMap[normalizedPosition] || normalizedPosition;

          // Parse route_depth to ensure it's a number
          let routeDepth = null;
          if (posData.depth) {
            // Try to parse as integer, handle strings like "15 yards" or "Deep"
            const depthNum = parseInt(String(posData.depth).replace(/\D/g, ''));
            routeDepth = !isNaN(depthNum) ? depthNum : null;
          }

          return {
            play_id: playId,
            position: mappedPosition,
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
        }
      );

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
    contextParts.push(`Position relevance: ${metadata.position_relevance.join(', ')}`);
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

When analyzing a play diagram, identify:
1. The play name and formation
2. The play type (pass, run, RPO, screen)
3. The concept being used (e.g., Mesh, Flood, Power, Zone, etc.)
4. Position assignments for each skill position (QB, RB, FB, X, Z, H, Y, TE)

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
