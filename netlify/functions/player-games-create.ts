/**
 * POST /api/player-games-create
 * Create a new custom game configuration
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';
import { validateRequired } from './shared/validators';

interface CreateGameRequest {
  name: string;
  description?: string;
  category: string;
  filters: {
    positions?: string[];
    topics?: string[];
    difficulty?: string[];
    playIds?: string[];
    tags?: string[];
  };
  questionCount?: number;
  timeLimitSeconds?: number;
  passingScore?: number;
  selectionStrategy?: 'random' | 'difficulty_progression' | 'spaced_repetition';
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

    const body: CreateGameRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body.name, 'name');
    validateRequired(body.category, 'category');

    // Validate category
    const validCategories = ['coverage_blitz', 'routes_concepts', 'situational', 'assignments'];
    if (!validCategories.includes(body.category)) {
      throw new ValidationError(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Create game record
    const { data: game, error: gameError } = await supabase
      .from('player_games')
      .insert({
        user_id: user.userId,
        org_id: user.orgId,
        name: body.name,
        description: body.description || null,
        category: body.category,
        filters: body.filters || {},
        question_count: body.questionCount || 10,
        time_limit_seconds: body.timeLimitSeconds || null,
        passing_score: body.passingScore || 70,
        selection_strategy: body.selectionStrategy || 'random',
        is_active: true,
      })
      .select()
      .single();

    if (gameError || !game) {
      console.error('Failed to create game:', gameError);
      throw new Error('Failed to create game');
    }

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        gameId: game.id,
        game,
      }),
    };
  } catch (error: any) {
    console.error('Error creating game:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
