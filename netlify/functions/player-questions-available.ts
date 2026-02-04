/**
 * GET /api/player-questions-available
 * Get available question counts and breakdown for game configuration
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse } from './shared/errors';

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    // Optional filters from query params
    const position = event.queryStringParameters?.position;
    const category = event.queryStringParameters?.category;
    const topic = event.queryStringParameters?.topic;
    const difficulty = event.queryStringParameters?.difficulty;

    // Build base query
    let query = supabase
      .from('player_flashcard_templates')
      .select(`
        *,
        player_plays!inner(id, name, concept, org_id)
      `)
      .eq('is_active', true)
      .eq('org_id', user.orgId);

    // Apply filters
    if (position) {
      query = query.eq('position', position);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (topic) {
      query = query.eq('topic', topic);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Failed to fetch questions:', questionsError);
      throw new Error('Failed to fetch questions');
    }

    const allQuestions = questions || [];

    // Calculate breakdowns
    const byDifficulty: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    const byTopic: Record<string, number> = {};
    const byPosition: Record<string, number> = {};
    const playMap: Record<string, { playId: string; playName: string; questionCount: number }> = {};

    allQuestions.forEach(q => {
      // Difficulty
      if (q.difficulty) {
        byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
      }

      // Topic
      if (q.topic) {
        byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
      }

      // Position
      if (q.position) {
        byPosition[q.position] = (byPosition[q.position] || 0) + 1;
      }

      // Play
      const playId = q.player_play_id;
      if (playId && q.player_plays) {
        if (!playMap[playId]) {
          playMap[playId] = {
            playId,
            playName: q.player_plays.name,
            questionCount: 0,
          };
        }
        playMap[playId].questionCount++;
      }
    });

    const plays = Object.values(playMap).sort((a, b) => b.questionCount - a.questionCount);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        total: allQuestions.length,
        byDifficulty,
        byTopic,
        byPosition,
        plays,
        filters: {
          position,
          category,
          topic,
          difficulty,
        },
      }),
    };
  } catch (error: any) {
    console.error('Error fetching question availability:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
