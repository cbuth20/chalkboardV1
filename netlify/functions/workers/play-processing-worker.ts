/**
 * Play Processing Worker
 * Extracted logic from process-play-content-background.ts
 * Called by the BullMQ worker, NOT directly via HTTP
 */

import { createClient } from '@supabase/supabase-js';
import { PlayProcessingJobData } from '../shared/queue';
import { GLOSSARY_CONTEXT } from '../../../src/lib/football-glossary';
import { playDataToText } from '../../../src/lib/playDataToText';
import {
  getInsightsPrompt,
  getKnowledgeCardsPrompt,
  buildInsightsContext,
  fillPromptTemplate,
  type ContentType,
} from '../content-generation-prompts';
import { generateAssignmentFlashcards } from '../flashcard-templates';
import {
  QUESTION_GENERATION_SYSTEM_PROMPT,
  buildQuestionGenerationPrompt,
} from '../../../src/lib/question-generation-prompts';
import {
  getDefaultDifficultyDistribution,
  getRecommendedQuestionTypes,
} from '../../../src/lib/services/question-generator';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.GPT_KEY;

export async function processPlay(data: PlayProcessingJobData): Promise<void> {
  const {
    playId,
    imageUrl,
    playData,
    fileName,
    generateInsights,
    generateAssignments,
    generateKnowledge,
  } = data;

  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    throw new Error('Missing required environment variables (Supabase or OpenAI)');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const startTime = Date.now();

  try {
    console.log('Processing play:', playId);

    if (!playId || (!imageUrl && !playData)) {
      throw new Error('Missing required fields: playId, (imageUrl or playData)');
    }

    // Fetch the existing play with its metadata
    console.log('Fetching play and metadata...');
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select(`
        *,
        playbook_metadata!plays_playbook_metadata_id_fkey (*)
      `)
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new Error(`Play not found: ${playError?.message}`);
    }

    const metadata = (play as any).playbook_metadata;
    console.log('Play and metadata found:', metadata?.formation_name);

    // Build metadata context for AI
    const metadataContext = buildMetadataContext(metadata);

    console.log('Starting AI generation...');

    // --- AI Generation Phase ---
    let playAnalysis: any = null;
    let insights: string | null = null;
    let knowledgeCards: any[] = [];

    // Determine whether we're analyzing an image or structured play data
    if (generateAssignments) {
      if (playData) {
        console.log('Analyzing built play with structured data...');
        const playDescription = playDataToText(playData);
        playAnalysis = await analyzePlayWithText(playDescription, metadataContext, playData);
        console.log('Play analysis complete:', {
          name: playAnalysis?.name,
          playType: playAnalysis?.playType,
          positionCount: playAnalysis?.positions ? Object.keys(playAnalysis.positions).length : 0,
        });
      } else if (imageUrl) {
        console.log('Fetching image from:', imageUrl);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from URL (HTTP ${imageResponse.status})`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const contentType = imageResponse.headers.get('content-type');
        const mimeType = contentType || (fileName?.endsWith('.png') ? 'image/png' : 'image/jpeg');
        console.log('Image fetched, size:', imageBuffer.byteLength, 'bytes');

        console.log('Generating assignments via GPT-4o Vision...');
        playAnalysis = await analyzePlayWithVision(base64Image, mimeType, metadataContext);
        console.log('Play analysis complete:', {
          name: playAnalysis?.name,
          playType: playAnalysis?.playType,
          positionCount: playAnalysis?.positions ? Object.keys(playAnalysis.positions).length : 0,
        });
      }
    }

    // 2. Generate insights via GPT-4
    if (generateInsights && playAnalysis) {
      console.log('Generating insights via GPT-4...');
      insights = await generatePlayInsights(metadata, playAnalysis);
      console.log('Insights generated');
    }

    // 3. Generate knowledge cards via GPT-4
    if (generateKnowledge && playAnalysis) {
      console.log('Generating knowledge cards via GPT-4...');
      knowledgeCards = await generateKnowledgeCards(playAnalysis, metadata);
      console.log('Generated', knowledgeCards.length, 'knowledge cards');
    }

    // --- Update Play Record ---
    console.log('Updating play with AI-generated content...');

    // Validate and normalize play_type to match database enum
    const validPlayTypes = ['PASS', 'RUN', 'RPO', 'SCREEN'];
    let playType = playAnalysis?.playType?.toUpperCase() || 'PASS';

    if (!validPlayTypes.includes(playType)) {
      console.log(`[Play Type] Invalid play_type "${playType}" returned by AI. Defaulting to PASS.`);
      playType = 'PASS';
    }

    // v1 Classification fields
    let unit = metadata?.unit;
    if (!unit && metadata?.side_of_ball) {
      const sideOfBallToUnit: Record<string, 'O' | 'D' | 'ST' | undefined> = {
        offense: 'O',
        defense: 'D',
        special_teams: 'ST',
      };
      unit = sideOfBallToUnit[metadata.side_of_ball];
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
        content_status: 'draft',
        unit: unit,
        playbook_section: metadata?.playbook_section,
        primary_classification: metadata?.primary_classification,
        situation: metadata?.situation,
      })
      .eq('id', playId);

    if (updateError) {
      console.error('Failed to update play:', updateError);
      await supabase
        .from('plays')
        .update({ content_status: 'rejected' })
        .eq('id', playId);
      throw new Error(`Failed to update play record: ${updateError.message}`);
    }

    console.log('Play updated successfully');

    // Insert play_assignments
    const assignments: any[] = [];
    if (playAnalysis?.positions && generateAssignments) {
      const sourceMetadataIds = metadata?.id ? [metadata.id] : [];

      const assignmentRecords = Object.entries(playAnalysis.positions)
        .map(([position, posData]: [string, any]) => {
          const normalizedPosition = normalizePosition(position);
          if (!normalizedPosition) {
            return null;
          }

          const category = posData.category || 'general';

          return {
            play_id: playId,
            org_id: play.org_id,
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
        .filter((record) => record !== null);

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
        org_id: play.org_id,
        position: 'QB',
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

    // Generate AI-powered quiz questions
    if (playAnalysis?.positions && generateAssignments && assignments.length > 0) {
      console.log('Generating AI-powered quiz questions...');

      try {
        const positions = [...new Set(assignments.map((a: any) => a.position)), 'all'];

        const difficultyDist = getDefaultDifficultyDistribution(
          playType,
          assignments.length
        );

        const questionTypes = getRecommendedQuestionTypes(
          playType,
          !!metadata?.situation
        );

        const questionPrompt = buildQuestionGenerationPrompt({
          playData: {
            name: playAnalysis.name || play.name,
            concept: playAnalysis.concept || play.concept,
            playType: playType,
            formation: playAnalysis.formation || play.formation_name,
            unit: unit,
            situation: metadata?.situation,
          },
          assignments: assignments.map((a: any) => ({
            position: a.position,
            alignment: a.alignment,
            assignment: a.assignment,
            key_read: a.key_read,
            category: a.category,
          })),
          positions,
          questionCount: Math.min(12, assignments.length * 2),
          difficultyDistribution: difficultyDist,
          questionTypes: questionTypes as any[],
        });

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: QUESTION_GENERATION_SYSTEM_PROMPT,
              },
              {
                role: 'user',
                content: questionPrompt,
              },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          const questionsData = JSON.parse(aiResult.choices[0].message.content);
          const generatedQuestions = questionsData.questions || [];

          console.log(`Generated ${generatedQuestions.length} AI questions`);

          const assignmentMap = new Map(
            assignments.map((a: any) => [a.position, a.id])
          );

          const dbQuestions = generatedQuestions.map((q: any) => {
            const categoryMap: Record<string, string> = {
              formation_identification: 'formation',
              alignment_rules: 'alignment',
              route_running: 'route',
              blocking_assignments: 'blocking',
              pass_protection: 'protection',
              coverage_recognition: 'coverage',
              pre_snap_reads: 'read',
              post_snap_reads: 'read',
              coverage_adjustments: 'adjustments',
              play_concepts: 'general',
              situational_football: 'general',
            };

            const category = categoryMap[q.topic] || 'general';
            const assignmentId = q.position !== 'all' ? assignmentMap.get(q.position) || null : null;

            return {
              play_id: playId,
              org_id: play.org_id,
              assignment_id: assignmentId,
              position: q.position,
              question_type: q.question_type || 'multiple_choice',
              topic: q.topic || null,
              category,
              question_prompt: q.question_prompt,
              correct_answer: q.correct_answer,
              options: q.options ? q.options : null,
              explanation: q.explanation || null,
              scenario_context: q.scenario_context || null,
              learning_objective: q.learning_objective || '',
              tags: q.tags || [],
              hints: q.hints || [],
              difficulty: q.difficulty || 'intermediate',
              card_type: 'knowledge',
              is_auto_generated: true,
              is_active: true,
              ai_generation_metadata: {
                generated_at: new Date().toISOString(),
                model: 'gpt-4o',
                related_concepts: q.related_concepts || [],
              },
              requires_position: q.position !== 'all',
              visible_to_positions: q.position !== 'all' ? [q.position] : ['all'],
            };
          });

          if (dbQuestions.length > 0) {
            const { data: insertedQuestions, error: questionsError } = await supabase
              .from('flashcard_templates')
              .insert(dbQuestions)
              .select();

            if (questionsError) {
              console.error('Failed to insert AI questions:', questionsError);
              console.log('Falling back to basic flashcard generation...');
              const basicFlashcards = await generateAssignmentFlashcards(
                playAnalysis,
                assignments,
                playId,
                metadata,
                shuffleArray
              );

              if (basicFlashcards.length > 0) {
                const flashcardsWithOrgId = basicFlashcards.map((fc) => ({
                  ...fc,
                  org_id: play.org_id,
                }));

                await supabase
                  .from('flashcard_templates')
                  .insert(flashcardsWithOrgId);
              }
            } else {
              flashcards.push(...(insertedQuestions || []));
              console.log(`Inserted ${insertedQuestions?.length || 0} AI-generated questions`);
            }
          }
        } else {
          console.error('AI question generation failed, falling back to basic flashcards');
          const basicFlashcards = await generateAssignmentFlashcards(
            playAnalysis,
            assignments,
            playId,
            metadata,
            shuffleArray
          );

          if (basicFlashcards.length > 0) {
            const flashcardsWithOrgId = basicFlashcards.map((fc) => ({
              ...fc,
              org_id: play.org_id,
            }));

            const { data: insertedCards } = await supabase
              .from('flashcard_templates')
              .insert(flashcardsWithOrgId)
              .select();

            if (insertedCards) {
              flashcards.push(...insertedCards);
              console.log(`Inserted ${insertedCards.length} basic flashcards (fallback)`);
            }
          }
        }
      } catch (error) {
        console.error('Error in AI question generation:', error);
        const basicFlashcards = await generateAssignmentFlashcards(
          playAnalysis,
          assignments,
          playId,
          metadata,
          shuffleArray
        );

        if (basicFlashcards.length > 0) {
          const flashcardsWithOrgId = basicFlashcards.map((fc) => ({
            ...fc,
            org_id: play.org_id,
          }));

          await supabase
            .from('flashcard_templates')
            .insert(flashcardsWithOrgId);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Play ${playId} processed in ${(duration / 1000).toFixed(2)}s`);
  } catch (error: any) {
    console.error(`Play ${playId} processing failed:`, error);

    // Mark as rejected
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    await supabase
      .from('plays')
      .update({ content_status: 'rejected' })
      .eq('id', playId);

    throw error; // Re-throw so BullMQ knows the job failed and can retry
  }
}

// --- Helper Functions ---

const VALID_POSITIONS = new Set([
  'QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE',
  'LT', 'LG', 'C', 'RG', 'RT'
]);

const POSITION_MAPPING: Record<string, string> = {
  'F': 'FB',
  'FULLBACK': 'FB',
  'HALFBACK': 'RB',
  'HB': 'RB',
  'WR': 'X',
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

  if (VALID_POSITIONS.has(upperPos)) {
    return upperPos;
  }

  if (POSITION_MAPPING[upperPos]) {
    return POSITION_MAPPING[upperPos];
  }

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
  const contentType: ContentType = (metadata.content_type as ContentType) || 'play';
  const promptConfig = getInsightsPrompt(contentType);
  const context = buildInsightsContext(metadata, playAnalysis);
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
  const contentType: ContentType = (metadata.content_type as ContentType) || 'play';
  const promptConfig = getKnowledgeCardsPrompt(contentType);

  let context = '';
  if (contentType === 'play') {
    context = fillPromptTemplate(promptConfig.userPromptTemplate, {
      NAME: playAnalysis.name || 'Unknown',
      FORMATION: playAnalysis.formation || metadata.formation_name || 'Unknown',
      CONCEPT: playAnalysis.concept || metadata.concept_name || 'Unknown',
      PLAY_TYPE: playAnalysis.playType || 'Unknown',
      DESCRIPTION: playAnalysis.description || 'N/A',
    });
  } else if (contentType === 'coverage') {
    context = fillPromptTemplate(promptConfig.userPromptTemplate, {
      NAME: playAnalysis.name || metadata.formation_name || 'Unknown',
      COVERAGE_TYPE: playAnalysis.coverageType || 'Unknown',
      COVERAGE_FAMILY: playAnalysis.coverageFamily || 'Unknown',
      FRONT: playAnalysis.front || 'Unknown',
      DESCRIPTION: playAnalysis.description || 'N/A',
    });
  } else if (contentType === 'formation') {
    context = fillPromptTemplate(promptConfig.userPromptTemplate, {
      NAME: playAnalysis.name || metadata.formation_name || 'Unknown',
      PERSONNEL: playAnalysis.personnel || metadata.personnel || 'Unknown',
      ALIGNMENT: playAnalysis.alignment || 'Unknown',
      KEY_FEATURES: playAnalysis.keyFeatures ? playAnalysis.keyFeatures.join(', ') : 'N/A',
      COMMON_PLAYS: playAnalysis.commonPlays ? playAnalysis.commonPlays.join(', ') : 'N/A',
    });
  } else {
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
    return [];
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
