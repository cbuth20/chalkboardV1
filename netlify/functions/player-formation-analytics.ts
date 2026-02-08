/**
 * GET /api/player-formation-analytics
 * Get analytics and stats for formations trainer
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

    // Fetch all completed quizzes
    const { data: quizzes, error: quizzesError } = await supabase
      .from('player_formation_quizzes')
      .select('id, module, quiz_type, position_filter, total_questions, correct_count, started_at, completed_at')
      .eq('user_id', user.userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (quizzesError) {
      throw new Error(`Failed to fetch quizzes: ${quizzesError.message}`);
    }

    // Fetch all attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from('player_formation_attempts')
      .select('id, quiz_id, is_correct, response_time_ms, question_type, created_at')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (attemptsError) {
      throw new Error(`Failed to fetch attempts: ${attemptsError.message}`);
    }

    // Calculate overall stats
    const totalQuizzes = quizzes?.length || 0;
    const totalAttempts = attempts?.length || 0;
    const correctAttempts = attempts?.filter(a => a.is_correct).length || 0;
    const overallAccuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    // Calculate average response time
    const avgResponseTime = attempts?.length
      ? Math.round(
          attempts.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / attempts.length
        )
      : 0;

    // Get stats by module
    const statsByModule: Record<string, { total: number; correct: number; accuracy: number }> = {};
    quizzes?.forEach(quiz => {
      const module = quiz.module || 'mixed';
      if (!statsByModule[module]) {
        statsByModule[module] = { total: 0, correct: 0, accuracy: 0 };
      }
      statsByModule[module].total += quiz.total_questions;
      statsByModule[module].correct += quiz.correct_count;
    });

    // Calculate accuracy for each module
    Object.keys(statsByModule).forEach(module => {
      const stats = statsByModule[module];
      stats.accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    });

    // Get stats by position
    const statsByPosition: Record<string, { total: number; correct: number; accuracy: number }> = {};
    quizzes?.forEach(quiz => {
      if (quiz.position_filter) {
        const position = quiz.position_filter;
        if (!statsByPosition[position]) {
          statsByPosition[position] = { total: 0, correct: 0, accuracy: 0 };
        }
        statsByPosition[position].total += quiz.total_questions;
        statsByPosition[position].correct += quiz.correct_count;
      }
    });

    // Calculate accuracy for each position
    Object.keys(statsByPosition).forEach(position => {
      const stats = statsByPosition[position];
      stats.accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    });

    // Get recent activity (last 10 quizzes)
    const recentQuizzes = quizzes?.slice(0, 10).map(quiz => ({
      id: quiz.id,
      module: quiz.module,
      quiz_type: quiz.quiz_type,
      position_filter: quiz.position_filter,
      score: `${quiz.correct_count}/${quiz.total_questions}`,
      accuracy: quiz.total_questions > 0
        ? Math.round((quiz.correct_count / quiz.total_questions) * 100)
        : 0,
      completed_at: quiz.completed_at,
    }));

    // Get formations count
    const { count: formationsCount, error: formationsError } = await supabase
      .from('player_formations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.userId);

    if (formationsError) {
      console.error('Failed to count formations:', formationsError);
    }

    // Get latest analysis status
    const { data: latestAnalysis } = await supabase
      .from('player_playbook_analysis')
      .select('id, status, formations_extracted, processing_time_seconds, completed_at')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log(`✅ Analytics for user ${user.userId}: ${totalQuizzes} quizzes, ${totalAttempts} attempts, ${overallAccuracy}% accuracy`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overview: {
          total_quizzes: totalQuizzes,
          total_attempts: totalAttempts,
          correct_attempts: correctAttempts,
          overall_accuracy: overallAccuracy,
          avg_response_time_ms: avgResponseTime,
          formations_count: formationsCount || 0,
        },
        stats_by_module: statsByModule,
        stats_by_position: statsByPosition,
        recent_quizzes: recentQuizzes || [],
        latest_analysis: latestAnalysis || null,
      }),
    };
  } catch (error) {
    console.error('Error fetching formation analytics:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
