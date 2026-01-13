// ═══════════════════════════════════════════════════════════════════════════════════════════
// POST /api/games/session/start
// 
// Starts a new game session for the authenticated user.
// Selects questions based on game type, difficulty, and user's position.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import type {
  GameType,
  GameMode,
  DifficultyLevel,
  GameSession,
  Question,
  StartSessionPayload,
  StartSessionResponse,
} from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// MOCK: In production, use Supabase client
// ───────────────────────────────────────────────────────────────────────────────────────────

// Mock game definitions
const GAME_CONFIGS: Record<GameType, { defaultQuestions: number; timeLimit: number | null }> = {
  coverage_recognition: { defaultQuestions: 25, timeLimit: 45 },
  blitz_id: { defaultQuestions: 20, timeLimit: 30 },
  route_matching: { defaultQuestions: 30, timeLimit: 25 },
  formation_memory: { defaultQuestions: 15, timeLimit: 60 },
  play_responsibility: { defaultQuestions: 20, timeLimit: 40 },
  red_zone_scenarios: { defaultQuestions: 18, timeLimit: 35 },
  two_minute_drill: { defaultQuestions: 10, timeLimit: 90 },
  film_reaction: { defaultQuestions: 35, timeLimit: 20 },
};

// Mock question bank (in production, fetched from DB)
function generateMockQuestions(
  gameType: GameType,
  difficulty: DifficultyLevel,
  count: number
): Question[] {
  const questions: Question[] = [];
  
  const questionTemplates: Record<GameType, { prompt: string; options: string[] }> = {
    coverage_recognition: {
      prompt: 'Identify the coverage shown in this pre-snap look:',
      options: ['Cover 1', 'Cover 2', 'Cover 3', 'Cover 4'],
    },
    blitz_id: {
      prompt: 'What protection call should be made against this front?',
      options: ['Slide Left', 'Slide Right', 'Full Slide', 'Max Protect'],
    },
    route_matching: {
      prompt: 'Identify the route concept:',
      options: ['Mesh', 'Mills', 'Shallow Cross', 'Four Verticals'],
    },
    formation_memory: {
      prompt: 'Recreate the formation you just saw:',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
    },
    play_responsibility: {
      prompt: 'What is your assignment on this play?',
      options: ['Block DE', 'Run flat route', 'Check release', 'Lead block'],
    },
    red_zone_scenarios: {
      prompt: 'Goal line: 3rd and Goal from the 2. What\'s the best read?',
      options: ['Fade', 'Slant', 'Quick out', 'Back shoulder'],
    },
    two_minute_drill: {
      prompt: '0:45 left, down by 4, no timeouts. Best play call?',
      options: ['Spike', 'Quick slant', 'Sideline route', 'Draw play'],
    },
    film_reaction: {
      prompt: 'What coverage is the defense in?',
      options: ['Man', 'Zone', 'Cover 2 Man', 'Tampa 2'],
    },
  };

  const template = questionTemplates[gameType];

  for (let i = 0; i < count; i++) {
    const correctIndex = Math.floor(Math.random() * 4);
    questions.push({
      id: `q-${gameType}-${difficulty}-${i}-${Date.now()}`,
      game_id: `game-${gameType}`,
      team_id: null,
      prompt: `${template.prompt} (Question ${i + 1})`,
      media_url: null,
      media_type: null,
      options: template.options.map((text, idx) => ({
        id: `opt-${idx}`,
        text,
        isCorrect: idx === correctIndex,
      })),
      correct_answer_id: `opt-${correctIndex}`,
      explanation: `The correct answer is ${template.options[correctIndex]} because...`,
      difficulty,
      category: null,
      tags: null,
      target_positions: null,
      times_shown: 0,
      times_correct: 0,
      avg_response_time_ms: null,
      is_active: true,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      concept_key: `${gameType.toUpperCase()}_CONCEPT`,
      concept_family: gameType.includes('coverage') ? 'zone' : gameType.includes('route') ? 'route' : 'situation',
    });
  }

  return questions;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// REQUEST HANDLER
// ───────────────────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as StartSessionPayload;
    
    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    
    if (!body.game_type) {
      return NextResponse.json(
        { error: 'game_type is required' },
        { status: 400 }
      );
    }

    if (!body.team_id) {
      return NextResponse.json(
        { error: 'team_id is required' },
        { status: 400 }
      );
    }

    if (!GAME_CONFIGS[body.game_type]) {
      return NextResponse.json(
        { error: `Invalid game_type: ${body.game_type}` },
        { status: 400 }
      );
    }

    const mode: GameMode = body.mode || 'train';
    const difficulty: DifficultyLevel = body.difficulty || 'medium';
    
    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION (Mock - in production use Supabase Auth)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: { user }, error } = await supabase.auth.getUser();
    // if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const mockUserId = 'user-demo-123'; // Mock user ID
    
    // ─────────────────────────────────────────────────────────────────────────
    // AUTHORIZATION (Check team membership)
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production:
    // const { data: membership } = await supabase
    //   .from('team_members')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .eq('team_id', body.team_id)
    //   .single();
    // if (!membership) return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
    
    // ─────────────────────────────────────────────────────────────────────────
    // CREATE SESSION
    // ─────────────────────────────────────────────────────────────────────────
    
    const gameConfig = GAME_CONFIGS[body.game_type];
    const questionCount = body.question_count || gameConfig.defaultQuestions;

    const session: GameSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: mockUserId,
      team_id: body.team_id,
      game_id: `game-${body.game_type}`,
      mode,
      difficulty,
      question_count: questionCount,
      time_limit_seconds: gameConfig.timeLimit,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      finished_at: null,
      total_questions: 0,
      correct_answers: 0,
      incorrect_answers: 0,
      skipped_answers: 0,
      raw_score: 0,
      time_bonus: 0,
      streak_bonus: 0,
      difficulty_multiplier: getDifficultyMultiplier(difficulty),
      final_score: 0,
      total_time_seconds: null,
      accuracy: null,
      avg_response_time_ms: null,
      longest_streak: 0,
      xp_earned: 0,
      client_version: request.headers.get('x-client-version') || '1.0.0',
      is_valid: true,
      created_at: new Date().toISOString(),
    };

    // In production, insert into database:
    // const { data: newSession, error } = await supabase
    //   .from('game_sessions')
    //   .insert(session)
    //   .select()
    //   .single();

    // ─────────────────────────────────────────────────────────────────────────
    // SELECT QUESTIONS
    // ─────────────────────────────────────────────────────────────────────────
    
    // In production, query questions from DB:
    // const { data: questions } = await supabase
    //   .from('questions')
    //   .select('*')
    //   .eq('game_id', session.game_id)
    //   .eq('difficulty', difficulty)
    //   .eq('is_active', true)
    //   .or(`team_id.is.null,team_id.eq.${body.team_id}`)
    //   .limit(questionCount)
    //   .order('RANDOM()');

    const questions = generateMockQuestions(body.game_type, difficulty, questionCount);

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────────
    
    const response: StartSessionResponse = {
      session,
      questions: questions.map(q => ({
        ...q,
        // Remove correct answer from client response (prevent cheating)
        options: q.options.map(opt => ({ id: opt.id, text: opt.text, isCorrect: false })),
        correct_answer_id: '', // Hidden from client
        explanation: null, // Hidden until after answer
      })),
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error starting game session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────────────────────

function getDifficultyMultiplier(difficulty: DifficultyLevel): number {
  const multipliers: Record<DifficultyLevel, number> = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0,
    expert: 2.5,
  };
  return multipliers[difficulty];
}








