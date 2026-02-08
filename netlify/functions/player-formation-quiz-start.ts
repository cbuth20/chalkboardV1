/**
 * POST /api/player-formation-quiz/start
 * Start a new formations trainer quiz
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';

interface StartQuizRequest {
  module?: string; // Optional: specific module or "mixed" for all
  quiz_type?: 'learn' | 'test'; // Default: test
  position_filter?: 'QB' | 'RB' | 'WR' | 'OT'; // Optional: filter by position
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
      module = 'mixed',
      quiz_type = 'test',
      position_filter,
      total_questions = 10,
    } = body;

    console.log(`🎮 Starting quiz: module=${module}, type=${quiz_type}, position=${position_filter}`);

    // Fetch formations based on filters
    let query = supabase
      .from('player_formations')
      .select('*')
      .eq('user_id', user.userId);

    if (module !== 'mixed') {
      query = query.eq('module', module);
    }

    const { data: formations, error: formationsError } = await query;

    if (formationsError) {
      throw new Error(`Failed to fetch formations: ${formationsError.message}`);
    }

    if (!formations || formations.length === 0) {
      throw new ValidationError('No formations found. Please analyze your playbook PDFs first.');
    }

    // Filter by position if specified
    let availableFormations = formations;
    if (position_filter) {
      availableFormations = formations.filter(f => {
        const notes = f.coaching_notes as Record<string, string>;
        return notes && notes[position_filter];
      });

      if (availableFormations.length === 0) {
        throw new ValidationError(`No formations found with coaching notes for ${position_filter}`);
      }
    }

    // Randomly select formations for quiz
    const selectedFormations = shuffleArray(availableFormations).slice(0, total_questions);

    console.log(`📝 Selected ${selectedFormations.length} formations from ${availableFormations.length} available`);

    // Create quiz record
    const { data: quiz, error: quizError } = await supabase
      .from('player_formation_quizzes')
      .insert({
        user_id: user.userId,
        org_id: user.orgId,
        module,
        quiz_type,
        position_filter,
        total_questions: selectedFormations.length,
        correct_count: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quizError || !quiz) {
      throw new Error(`Failed to create quiz: ${quizError?.message}`);
    }

    console.log(`✅ Created quiz ${quiz.id}`);

    // Generate questions for each formation
    const questions = selectedFormations.map((formation, index) => {
      const questionType = Math.random() > 0.5 ? 'identify' : 'position';

      if (questionType === 'identify') {
        // "What formation is this?"
        const correctAnswer = formation.formation_name;

        // Generate distractor options
        const distractors = generateDistractors(
          correctAnswer,
          availableFormations,
          'identify',
          3
        );

        // Shuffle options
        const options = shuffleArray([correctAnswer, ...distractors]);

        return {
          formation_id: formation.id,
          question_type: 'identify',
          question_text: 'What formation is this?',
          correct_answer: correctAnswer,
          options,
          formation_data: {
            positions: formation.positions,
            personnel: formation.personnel,
          },
        };
      } else {
        // "Where is position X?"
        const positions = Object.keys(formation.positions as Record<string, any>);
        const targetPosition = positions[Math.floor(Math.random() * positions.length)];
        const correctAnswer = targetPosition;

        // Generate distractor options from other positions in same formation
        const distractors = generateDistractors(
          correctAnswer,
          [formation],
          'position',
          3
        );

        // Shuffle options
        const options = shuffleArray([correctAnswer, ...distractors]);

        return {
          formation_id: formation.id,
          question_type: 'position',
          question_text: `In the ${formation.formation_name} formation, where is the ${targetPosition} position?`,
          target_position: targetPosition,
          correct_answer: JSON.stringify((formation.positions as any)[targetPosition]),
          options,
          formation_data: {
            positions: formation.positions,
            personnel: formation.personnel,
            formation_name: formation.formation_name,
          },
        };
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        quiz_id: quiz.id,
        questions,
        total_questions: questions.length,
        quiz_type,
        module,
      }),
    };
  } catch (error) {
    console.error('Error starting formation quiz:', error);
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

// Generate distractor options for multiple choice
function generateDistractors(
  correctAnswer: string,
  formations: any[],
  questionType: 'identify' | 'position',
  count: number = 3
): string[] {
  if (questionType === 'identify') {
    // Get other formation names
    const otherFormations = formations
      .filter(f => f.formation_name !== correctAnswer)
      .map(f => f.formation_name);

    // Remove duplicates and shuffle
    const uniqueFormations = Array.from(new Set(otherFormations));
    return shuffleArray(uniqueFormations).slice(0, count);
  } else {
    // For position questions, use other positions from the formation
    if (formations.length === 0) return [];

    const formation = formations[0];
    const allPositions = Object.keys(formation.positions as Record<string, any>);
    const otherPositions = allPositions.filter(p => p !== correctAnswer);

    // If not enough positions, add common football positions as backups
    const commonPositions = ['X', 'Y', 'Z', 'H', 'T', 'F', 'Q', 'RB', 'LT', 'RT'];
    const backupPositions = commonPositions.filter(
      p => p !== correctAnswer && !otherPositions.includes(p)
    );

    const allOptions = [...otherPositions, ...backupPositions];
    return shuffleArray(allOptions).slice(0, count);
  }
}

export { handler };
