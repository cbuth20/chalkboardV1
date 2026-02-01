/**
 * Question Generator Service
 * Uses AI to generate high-quality, varied quiz questions from play data
 */

import {
  QUESTION_GENERATION_SYSTEM_PROMPT,
  buildQuestionGenerationPrompt,
  buildCoverageQuestionPrompt,
  buildSituationalQuestionPrompt,
  QuestionType,
  QuestionTopic,
  DifficultyLevel,
} from '../question-generation-prompts';

export interface GeneratedQuestion {
  question_type: QuestionType;
  topic: QuestionTopic;
  position: string;
  difficulty: DifficultyLevel;
  question_prompt: string;
  correct_answer: string;
  options?: string[]; // For multiple choice
  explanation: string;
  scenario_context?: string; // For scenario questions
  learning_objective: string;
  tags: string[];
  hints?: string[];
  related_concepts?: string[];
}

export interface QuestionGenerationParams {
  playId: string;
  orgId: string;
  playData: {
    name: string;
    concept?: string;
    playType: string;
    formation?: string;
    unit?: string;
    situation?: string;
    primaryClassification?: string;
  };
  assignments: Array<{
    id: string;
    position: string;
    alignment: string;
    assignment: string;
    key_read: string;
    category?: string;
  }>;
  options?: {
    questionCount?: number;
    positions?: string[];
    difficultyDistribution?: {
      beginner?: number;
      intermediate?: number;
      advanced?: number;
    };
    questionTypes?: QuestionType[];
    focusTopics?: QuestionTopic[];
  };
}

/**
 * Generate questions using OpenAI GPT-4
 */
export async function generateQuestionsWithAI(
  params: QuestionGenerationParams,
  apiKey: string
): Promise<GeneratedQuestion[]> {
  const {
    playData,
    assignments,
    options = {},
  } = params;

  // Determine which positions to generate questions for
  const positions = options.positions || [
    ...new Set(assignments.map((a) => a.position)),
    'all',
  ];

  // Build the prompt
  const userPrompt = buildQuestionGenerationPrompt({
    playData,
    assignments,
    positions,
    questionCount: options.questionCount || 10,
    difficultyDistribution: options.difficultyDistribution,
    questionTypes: options.questionTypes,
    focusTopics: options.focusTopics,
  });

  console.log('[QuestionGenerator] Generating questions with AI...');
  console.log('[QuestionGenerator] Positions:', positions);
  console.log('[QuestionGenerator] Question count:', options.questionCount || 10);

  try {
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
            content: userPrompt,
          },
        ],
        temperature: 0.7, // Some creativity for varied questions
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const parsed = JSON.parse(content);

    console.log(`[QuestionGenerator] Generated ${parsed.questions.length} questions`);

    return parsed.questions;
  } catch (error) {
    console.error('[QuestionGenerator] Error generating questions:', error);
    throw error;
  }
}

/**
 * Generate coverage-specific questions
 */
export async function generateCoverageQuestions(
  params: {
    coverageData: {
      name: string;
      coverageType: string;
      coverageFamily: string;
      front?: string;
      description?: string;
      strengths?: string[];
      weaknesses?: string[];
    };
    assignments: Array<{
      position: string;
      alignment: string;
      assignment: string;
      read: string;
    }>;
    questionCount?: number;
  },
  apiKey: string
): Promise<GeneratedQuestion[]> {
  const userPrompt = buildCoverageQuestionPrompt(params);

  console.log('[QuestionGenerator] Generating coverage questions with AI...');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const parsed = JSON.parse(content);

    console.log(`[QuestionGenerator] Generated ${parsed.questions.length} coverage questions`);

    return parsed.questions;
  } catch (error) {
    console.error('[QuestionGenerator] Error generating coverage questions:', error);
    throw error;
  }
}

/**
 * Transform generated questions into database format
 */
export function transformQuestionsForDatabase(
  questions: GeneratedQuestion[],
  playId: string,
  orgId: string,
  assignmentMap: Map<string, string> // Map position -> assignment_id
): Array<{
  play_id: string;
  org_id: string;
  assignment_id: string | null;
  position: string;
  question_type: string;
  topic: string | null;
  category: string; // Keep for backward compatibility
  question_prompt: string;
  correct_answer: string;
  options: any;
  explanation: string;
  scenario_context: string | null;
  learning_objective: string;
  tags: string[];
  hints: any;
  difficulty: string;
  card_type: string;
  is_auto_generated: boolean;
  is_active: boolean;
  ai_generation_metadata: any;
  requires_position: boolean;
  visible_to_positions: any;
}> {
  return questions.map((q) => {
    // Map topic to legacy category for backward compatibility
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

    // Get assignment_id if position-specific
    const assignmentId = q.position !== 'all' ? assignmentMap.get(q.position) || null : null;

    // For multiple choice, combine correct answer with distractors
    let options = null;
    if (q.question_type === 'multiple_choice' && q.options) {
      options = q.options;
    }

    return {
      play_id: playId,
      org_id: orgId,
      assignment_id: assignmentId,
      position: q.position,
      question_type: q.question_type,
      topic: q.topic,
      category,
      question_prompt: q.question_prompt,
      correct_answer: q.correct_answer,
      options: options ? JSON.stringify(options) : null,
      explanation: q.explanation,
      scenario_context: q.scenario_context || null,
      learning_objective: q.learning_objective,
      tags: q.tags,
      hints: q.hints ? JSON.stringify(q.hints) : JSON.stringify([]),
      difficulty: q.difficulty,
      card_type: 'knowledge', // New AI-generated questions are knowledge-based
      is_auto_generated: true,
      is_active: true,
      ai_generation_metadata: JSON.stringify({
        generated_at: new Date().toISOString(),
        model: 'gpt-4o',
        related_concepts: q.related_concepts || [],
      }),
      requires_position: q.position !== 'all',
      visible_to_positions: q.position !== 'all'
        ? JSON.stringify([q.position])
        : JSON.stringify(['all']),
    };
  });
}

/**
 * Get default difficulty distribution based on play complexity
 */
export function getDefaultDifficultyDistribution(
  playType: string,
  assignmentCount: number
): { beginner: number; intermediate: number; advanced: number } {
  // More assignments = more complex play = more advanced questions
  if (assignmentCount >= 8) {
    return { beginner: 2, intermediate: 5, advanced: 3 };
  } else if (assignmentCount >= 5) {
    return { beginner: 3, intermediate: 5, advanced: 2 };
  } else {
    return { beginner: 4, intermediate: 4, advanced: 2 };
  }
}

/**
 * Get recommended question types based on content
 */
export function getRecommendedQuestionTypes(
  playType: string,
  hasScenario: boolean
): QuestionType[] {
  const types: QuestionType[] = ['multiple_choice', 'true_false'];

  if (playType === 'pass') {
    types.push('identification'); // Coverage recognition
  }

  if (hasScenario) {
    types.push('scenario'); // Situational questions
  }

  return types;
}
