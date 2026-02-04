/**
 * POST /api/player-games-start
 * Start a game session (saved game or ad-hoc)
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';

interface StartGameRequest {
  gameId?: string; // For saved games
  adHocFilters?: {
    positions?: string[];
    topics?: string[];
    difficulty?: string[];
    playIds?: string[];
    tags?: string[];
  };
  questionCount?: number;
  timeLimitSeconds?: number;
}

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    const body: StartGameRequest = JSON.parse(event.body || '{}');

    let gameConfig: any = null;
    let filters: any = {};
    let questionCount = body.questionCount || 10;
    let timeLimitSeconds = body.timeLimitSeconds || null;
    let selectionStrategy = 'random';

    // If gameId provided, fetch game configuration
    if (body.gameId) {
      const { data: game, error: gameError } = await supabase
        .from('player_games')
        .select('*')
        .eq('id', body.gameId)
        .eq('user_id', user.userId)
        .single();

      if (gameError || !game) {
        throw new ValidationError('Game not found or access denied');
      }

      gameConfig = game;
      filters = game.filters;
      questionCount = game.question_count;
      timeLimitSeconds = game.time_limit_seconds;
      selectionStrategy = game.selection_strategy;
    } else if (body.adHocFilters) {
      // Ad-hoc game with custom filters
      filters = body.adHocFilters;
    } else {
      throw new ValidationError('Either gameId or adHocFilters must be provided');
    }

    // Build question query with filters
    let query = supabase
      .from('player_flashcard_templates')
      .select(`
        *,
        player_plays!inner(id, name, concept, org_id)
      `)
      .eq('is_active', true)
      .eq('org_id', user.orgId);

    // Apply filters
    if (filters.positions && filters.positions.length > 0) {
      query = query.in('position', filters.positions);
    }

    if (filters.topics && filters.topics.length > 0) {
      query = query.in('topic', filters.topics);
    }

    if (filters.difficulty && filters.difficulty.length > 0) {
      query = query.in('difficulty', filters.difficulty);
    }

    if (filters.playIds && filters.playIds.length > 0) {
      query = query.in('player_play_id', filters.playIds);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    const { data: availableQuestions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Failed to fetch questions:', questionsError);
      throw new Error('Failed to fetch questions');
    }

    if (!availableQuestions || availableQuestions.length === 0) {
      console.error('No questions found for filters:', {
        filters,
        orgId: user.orgId,
        userId: user.userId,
      });

      // Provide helpful error message
      if (filters.playIds && filters.playIds.length > 0) {
        throw new ValidationError(
          'No questions available for this play. Make sure the play has been processed and questions have been generated.'
        );
      } else {
        throw new ValidationError(
          'No questions match the specified filters. Try adjusting your filters or processing more plays.'
        );
      }
    }

    // Select questions based on strategy
    let selectedQuestions: any[] = [];

    if (selectionStrategy === 'random') {
      // Simple random selection
      selectedQuestions = shuffleArray([...availableQuestions]).slice(0, questionCount);
    } else if (selectionStrategy === 'difficulty_progression') {
      // Sort by difficulty and select mix
      const beginner = availableQuestions.filter(q => q.difficulty === 'beginner');
      const intermediate = availableQuestions.filter(q => q.difficulty === 'intermediate');
      const advanced = availableQuestions.filter(q => q.difficulty === 'advanced');

      const beginnerCount = Math.floor(questionCount * 0.3);
      const intermediateCount = Math.floor(questionCount * 0.5);
      const advancedCount = questionCount - beginnerCount - intermediateCount;

      selectedQuestions = [
        ...shuffleArray(beginner).slice(0, Math.min(beginnerCount, beginner.length)),
        ...shuffleArray(intermediate).slice(0, Math.min(intermediateCount, intermediate.length)),
        ...shuffleArray(advanced).slice(0, Math.min(advancedCount, advanced.length)),
      ];
    } else if (selectionStrategy === 'spaced_repetition') {
      // TODO: Implement spaced repetition logic with player_flashcard_progress
      // For now, fall back to random
      selectedQuestions = shuffleArray([...availableQuestions]).slice(0, questionCount);
    }

    // Ensure we have the requested number of questions
    if (selectedQuestions.length < questionCount && availableQuestions.length >= questionCount) {
      const remaining = availableQuestions.filter(
        q => !selectedQuestions.some(s => s.id === q.id)
      );
      selectedQuestions = [
        ...selectedQuestions,
        ...shuffleArray(remaining).slice(0, questionCount - selectedQuestions.length),
      ];
    }

    // Create game attempt record
    const { data: attempt, error: attemptError } = await supabase
      .from('player_game_attempts')
      .insert({
        user_id: user.userId,
        org_id: user.orgId,
        game_id: body.gameId || null,
        started_at: new Date().toISOString(),
        questions_asked: selectedQuestions.length,
        questions_correct: 0,
        score_percentage: 0,
        question_ids: selectedQuestions.map(q => q.id),
        responses: [],
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      console.error('Failed to create attempt:', attemptError);
      throw new Error('Failed to create game attempt');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        attemptId: attempt.id,
        questions: selectedQuestions.map(q => ({
          id: q.id,
          position: q.position,
          questionType: q.question_type,
          topic: q.topic,
          questionPrompt: q.question_prompt,
          options: q.options,
          scenarioContext: q.scenario_context,
          difficulty: q.difficulty,
          hints: q.hints,
          playName: q.player_plays?.name,
        })),
        questionCount: selectedQuestions.length,
        timeLimitSeconds,
      }),
    };
  } catch (error: any) {
    console.error('Error starting game:', error);
    return formatErrorResponse(error);
  }
});

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export { handler };
