/**
 * POST /api/player-block-coverage-quiz/start
 * Start a new block coverage trainer quiz
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';

interface StartQuizRequest {
  position_filter?: 'RB'; // Default: RB
  coverage_type_filter?: 'zone' | 'man' | 'blitz' | 'all'; // Optional
  total_questions?: number; // Default: 10
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

    // Parse request body
    const body: StartQuizRequest = JSON.parse(event.body || '{}');
    const {
      position_filter = 'RB',
      coverage_type_filter = 'all',
      total_questions = 10,
    } = body;

    console.log(`🎮 Starting block coverage quiz: position=${position_filter}, coverage_type=${coverage_type_filter}`);

    // Fetch coverages based on filters
    let query = supabase
      .from('player_block_coverages')
      .select('*')
      .eq('user_id', user.userId);

    if (coverage_type_filter !== 'all') {
      query = query.eq('coverage_type', coverage_type_filter);
    }

    const { data: coverages, error: coveragesError } = await query;

    if (coveragesError) {
      throw new Error(`Failed to fetch coverages: ${coveragesError.message}`);
    }

    if (!coverages || coverages.length === 0) {
      throw new ValidationError('No block coverage scenarios found. Please analyze your playbook PDFs first.');
    }

    // Randomly select coverages for quiz
    const selectedCoverages = shuffleArray(coverages).slice(0, total_questions);

    console.log(`📝 Selected ${selectedCoverages.length} coverages from ${coverages.length} available`);

    // Create quiz record
    const { data: quiz, error: quizError } = await supabase
      .from('player_block_coverage_quizzes')
      .insert({
        user_id: user.userId,
        org_id: user.orgId,
        position_filter,
        coverage_type_filter: coverage_type_filter !== 'all' ? coverage_type_filter : null,
        total_questions: selectedCoverages.length,
        correct_count: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quizError || !quiz) {
      throw new Error(`Failed to create quiz: ${quizError?.message}`);
    }

    console.log(`✅ Created quiz ${quiz.id}`);

    // Generate questions for each coverage
    const questions = selectedCoverages.map(coverage => {
      // Get all defender names
      const defenders = Object.keys(coverage.defensive_positions as Record<string, any>);

      // Generate options: correct answer + 3 other defenders + "RELEASE"
      const otherDefenders = defenders.filter(d => d !== coverage.correct_block_target);
      const distractors = shuffleArray(otherDefenders).slice(0, 3);
      const options = shuffleArray([
        coverage.correct_block_target,
        ...distractors,
        'RELEASE',
      ]).slice(0, 5); // Max 5 options

      return {
        coverage_id: coverage.id,
        question_text: `Who should the ${position_filter} block on this play?`,
        correct_answer: coverage.correct_block_target,
        options,
        coverage_data: {
          coverage_name: coverage.coverage_name,
          coverage_type: coverage.coverage_type,
          down_distance: coverage.down_distance,
          defensive_positions: coverage.defensive_positions,
          rb_position: coverage.rb_position,
          offensive_formation: coverage.offensive_formation,
        },
        coaching_notes: coverage.coaching_notes,
        blocking_rules: coverage.blocking_rules,
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        quiz_id: quiz.id,
        questions,
        total_questions: questions.length,
        position_filter,
        coverage_type_filter,
      }),
    };
  } catch (error) {
    console.error('Error starting block coverage quiz:', error);
    return formatErrorResponse(error);
  }
});

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export { handler };
