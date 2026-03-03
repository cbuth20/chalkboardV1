/**
 * Question Regeneration Worker
 * Extracted logic from questions-regenerate-background.ts
 * Called by the BullMQ worker, NOT directly via HTTP
 */

import { QuestionRegenerationJobData } from '../shared/queue';
import { getSupabaseAdmin } from '../shared/supabase';
import {
  QUESTION_GENERATION_SYSTEM_PROMPT,
  buildQuestionGenerationPrompt,
} from '../../../src/lib/question-generation-prompts';
import {
  getDefaultDifficultyDistribution,
  getRecommendedQuestionTypes,
} from '../../../src/lib/services/question-generator';

export async function regenerateQuestions(data: QuestionRegenerationJobData): Promise<void> {
  const { playId, orgId, userId, questionCount, deactivateOld = true } = data;

  try {
    const supabase = getSupabaseAdmin();

    console.log(`[Questions Worker] Starting for play: ${playId}`);

    // Fetch play with assignments
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select(`
        *,
        play_assignments (*)
      `)
      .eq('id', playId)
      .eq('org_id', orgId)
      .single();

    if (playError || !play) {
      throw new Error(`Play not found: ${playError?.message}`);
    }

    const assignments = (play as any).play_assignments || [];

    if (assignments.length === 0) {
      throw new Error('Play has no assignments. Cannot generate questions.');
    }

    console.log(`[Questions Worker] Found ${assignments.length} assignments`);

    // Get positions from assignments
    const positions = [...new Set(assignments.map((a: any) => a.position)), 'all'];

    // Determine difficulty distribution
    const difficultyDist = getDefaultDifficultyDistribution(
      play.play_type,
      assignments.length
    );

    // Get recommended question types
    const questionTypes = getRecommendedQuestionTypes(
      play.play_type,
      !!play.situation
    );

    // Build prompt for AI
    const questionPrompt = buildQuestionGenerationPrompt({
      playData: {
        name: play.name,
        concept: play.concept,
        playType: play.play_type,
        formation: play.formation_name,
        unit: play.unit,
        situation: play.situation,
      },
      assignments: assignments.map((a: any) => ({
        position: a.position,
        alignment: a.alignment,
        assignment: a.assignment,
        key_read: a.key_read,
        category: a.category,
      })),
      positions,
      questionCount: questionCount || Math.min(12, assignments.length * 2),
      difficultyDistribution: difficultyDist,
      questionTypes: questionTypes as any[],
    });

    // Call OpenAI
    const openaiKey = process.env.GPT_KEY;
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('[Questions Worker] Calling OpenAI for question generation...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
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

    if (!aiResponse.ok) {
      const error = await aiResponse.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const aiResult = await aiResponse.json();
    const questionsData = JSON.parse(aiResult.choices[0].message.content);
    const generatedQuestions = questionsData.questions || [];

    console.log(`[Questions Worker] Generated ${generatedQuestions.length} questions`);

    // Deactivate old questions if requested
    if (deactivateOld) {
      console.log('[Questions Worker] Deactivating old questions...');
      await supabase
        .from('flashcard_templates')
        .update({ is_active: false })
        .eq('play_id', playId)
        .eq('org_id', orgId);
    }

    // Transform questions for database
    const assignmentMap = new Map(
      assignments.map((a: any) => [a.position, a.id])
    );

    const dbQuestions = generatedQuestions.map((q: any) => {
      // Normalize topic to valid question_topic enum values
      const topicNormalizationMap: Record<string, string> = {
        'protection': 'pass_protection',
        'routes': 'route_running',
        'blocking': 'blocking_assignments',
        'coverage': 'coverage_recognition',
        'reads': 'post_snap_reads',
        'formations': 'formation_identification',
        'alignments': 'alignment_rules',
      };

      let normalizedTopic = q.topic;
      if (topicNormalizationMap[q.topic]) {
        normalizedTopic = topicNormalizationMap[q.topic];
      }

      // Map topic to valid flashcard_category enum values
      const categoryMap: Record<string, string> = {
        formation_identification: 'terminology',
        alignment_rules: 'alignment',
        route_running: 'assignment',
        blocking_assignments: 'assignment',
        pass_protection: 'assignment',
        coverage_recognition: 'coverage',
        pre_snap_reads: 'read',
        post_snap_reads: 'read',
        coverage_adjustments: 'coverage',
        play_concepts: 'terminology',
        situational_football: 'terminology',
        hot_routes: 'assignment',
        timing_rhythm: 'assignment',
        defensive_tendencies: 'coverage',
        run_fits: 'assignment',
        gap_responsibility: 'assignment',
        personnel_groupings: 'terminology',
        formation_checks: 'terminology',
        audibles: 'terminology',
        motion_adjustments: 'assignment',
        coverage_concepts: 'coverage',
        game_planning: 'terminology',
        terminology: 'terminology',
        rules: 'terminology',
        techniques: 'terminology',
      };

      const category = categoryMap[normalizedTopic] || 'terminology';

      // Handle position validation
      const validPositions = ['QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];
      const isGeneralQuestion = q.position === 'all' || !validPositions.includes(q.position);

      const dbPosition = isGeneralQuestion ? 'QB' : q.position;
      const assignmentId = !isGeneralQuestion ? assignmentMap.get(q.position) || null : null;

      return {
        play_id: playId,
        org_id: orgId,
        assignment_id: assignmentId,
        position: dbPosition,
        question_type: q.question_type || 'multiple_choice',
        topic: normalizedTopic || null,
        category,
        question_prompt: q.question_prompt,
        correct_answer: q.correct_answer,
        options: q.options || null,
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
          regenerated_by: userId,
        },
        requires_position: !isGeneralQuestion,
        visible_to_positions: isGeneralQuestion ? ['all'] : [q.position],
      };
    });

    // Validate transformed questions before insert
    console.log('[Questions Worker] Validating transformed questions...');
    const validPositions = ['QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];
    const validCategories = ['alignment', 'assignment', 'coverage', 'read', 'terminology'];

    dbQuestions.forEach((q: any, idx: number) => {
      if (!validPositions.includes(q.position)) {
        console.error(`[Questions Worker] Invalid position at index ${idx}:`, q.position);
      }
      if (!validCategories.includes(q.category)) {
        console.error(`[Questions Worker] Invalid category at index ${idx}:`, q.category);
      }
    });

    console.log(`[Questions Worker] Inserting ${dbQuestions.length} validated questions...`);

    // Insert new questions
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('flashcard_templates')
      .insert(dbQuestions)
      .select();

    if (insertError) {
      console.error('[Questions Worker] Insert error:', insertError);
      throw new Error(`Failed to insert questions: ${insertError.message}`);
    }

    console.log(`[Questions Worker] Regenerated ${insertedQuestions?.length || 0} questions for play ${playId}`);
  } catch (error) {
    console.error('[Questions Worker] Error:', error);
    throw error; // Re-throw so BullMQ knows the job failed and can retry
  }
}
