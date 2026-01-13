// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — DATABASE TYPES
// 
// TypeScript type definitions for all database tables and relationships.
// These types mirror the Postgres schema and can be used with Supabase client.
// ═══════════════════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────────────────
// ENUMS
// ───────────────────────────────────────────────────────────────────────────────────────────

export type UserRole = 'player' | 'coach' | 'admin';

export type FootballPosition = 
  // Offense
  | 'QB' | 'RB' | 'FB' | 'WR' | 'TE' | 'OT' | 'OG' | 'C'
  // Defense
  | 'DE' | 'DT' | 'NT' | 'OLB' | 'ILB' | 'MLB' | 'CB' | 'FS' | 'SS'
  // Special Teams
  | 'K' | 'P' | 'LS';

export type GameType = 
  | 'coverage_recognition'
  | 'blitz_id'
  | 'route_matching'
  | 'formation_memory'
  | 'play_responsibility'
  | 'red_zone_scenarios'
  | 'two_minute_drill'
  | 'film_reaction';

export type GameMode = 'train' | 'compete';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned' | 'timed_out';

export type XPEventType = 
  | 'game_completion'
  | 'correct_answer'
  | 'streak_bonus'
  | 'daily_challenge'
  | 'first_play_of_day'
  | 'perfect_game'
  | 'level_up'
  | 'achievement';

export type LeaderboardScope = 'team' | 'position_room' | 'global';

export type TimeWindow = 'daily' | 'weekly' | 'season' | 'all_time';

// ───────────────────────────────────────────────────────────────────────────────────────────
// CORE TABLES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  season: string;
  timezone: string;
  tier: 'free' | 'pro' | 'elite';
  max_players: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  avatar_url: string | null;
  jersey_number: number | null;
  total_xp: number;
  current_level: number;
  football_iq_rating: number;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: UserRole;
  position: FootballPosition | null;
  position_group: string | null;
  team_xp: number;
  team_rank: number | null;
  is_active: boolean;
  joined_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// GAME DEFINITIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Game category for analytics grouping
 * Maps game types to high-level categories for IQ calculation
 */
export type GameCategory = 
  | 'coverage'     // coverage_recognition, film_reaction
  | 'blitz'        // blitz_id
  | 'routes'       // route_matching
  | 'memory'       // formation_memory
  | 'situational'  // red_zone_scenarios, two_minute_drill
  | 'assignment';  // play_responsibility

export interface Game {
  id: string;
  type: GameType;
  name: string;
  subtitle: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  default_time_limit_seconds: number | null;
  default_question_count: number;
  min_questions: number;
  max_questions: number;
  base_points_per_correct: number;
  time_bonus_enabled: boolean;
  max_time_bonus: number;
  applicable_positions: FootballPosition[] | null;
  /** Analytics category for IQ grouping (BRIDGE CONTRACT) */
  category: GameCategory | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Concept family for grouping related concepts
 */
export type ConceptFamily = 'zone' | 'man' | 'match' | 'pressure' | 'route' | 'formation' | 'situation';

export interface Question {
  id: string;
  game_id: string;
  team_id: string | null;
  prompt: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'formation' | null;
  options: QuestionOption[];
  correct_answer_id: string;
  explanation: string | null;
  difficulty: DifficultyLevel;
  category: string | null;
  tags: string[] | null;
  target_positions: FootballPosition[] | null;
  /** Concept identifier for analytics (BRIDGE CONTRACT) - e.g., COVER_3, MESH */
  concept_key: string | null;
  /** Concept family for grouping (BRIDGE CONTRACT) */
  concept_family: ConceptFamily | null;
  times_shown: number;
  times_correct: number;
  avg_response_time_ms: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// GAME SESSIONS & ATTEMPTS
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface GameSession {
  id: string;
  user_id: string;
  team_id: string;
  game_id: string;
  mode: GameMode;
  difficulty: DifficultyLevel;
  question_count: number;
  time_limit_seconds: number | null;
  status: SessionStatus;
  started_at: string;
  finished_at: string | null;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  skipped_answers: number;
  raw_score: number;
  time_bonus: number;
  streak_bonus: number;
  difficulty_multiplier: number;
  final_score: number;
  total_time_seconds: number | null;
  accuracy: number | null;
  avg_response_time_ms: number | null;
  longest_streak: number;
  xp_earned: number;
  client_version: string | null;
  is_valid: boolean;
  created_at: string;
}

export interface GameAttempt {
  id: string;
  session_id: string;
  question_id: string;
  /** Denormalized user_id for analytics (BRIDGE CONTRACT) */
  user_id: string | null;
  attempt_number: number;
  selected_answer_id: string | null;
  is_correct: boolean | null;
  time_taken_ms: number;
  started_at: string;
  answered_at: string | null;
  base_points: number;
  time_bonus: number;
  streak_multiplier: number;
  total_points: number;
  current_streak: number;
  /** Denormalized difficulty for analytics (BRIDGE CONTRACT) */
  difficulty: DifficultyLevel | null;
  /** Concept identifier for analytics (BRIDGE CONTRACT) - e.g., COVER_3, MESH */
  concept_key: string | null;
  /** Flexible metadata for extended analytics (BRIDGE CONTRACT) */
  metadata: GameAttemptMetadata | null;
  created_at: string;
}

/**
 * Metadata schema for game_attempts (BRIDGE CONTRACT)
 * Written by ENGINE, read by INSIGHTS
 */
export interface GameAttemptMetadata {
  /** Concept identifier - REQUIRED */
  concept_key: string;
  /** Concept family - REQUIRED (zone, man, match, pressure) */
  concept_family: ConceptFamily;
  /** Denormalized difficulty - REQUIRED */
  difficulty: DifficultyLevel;
  /** High-level category - REQUIRED */
  question_category: GameCategory;
  /** Formation if applicable - OPTIONAL */
  formation?: string;
  /** Down and distance context - OPTIONAL */
  down_distance?: string;
  /** Field position context - OPTIONAL */
  field_position?: string;
  /** Clock context for situational - OPTIONAL */
  time_remaining?: number;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// XP & PROGRESSION
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface XPEvent {
  id: string;
  user_id: string;
  team_id: string | null;
  event_type: XPEventType;
  xp_amount: number;
  session_id: string | null;
  game_type: GameType | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Level {
  level: number;
  xp_required: number;
  xp_to_next: number;
  title: string | null;
  badge_url: string | null;
  perks: Record<string, unknown> | null;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// STREAKS & DAILY CHALLENGES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface UserStreak {
  id: string;
  user_id: string;
  team_id: string;
  current_streak: number;
  longest_streak: number;
  last_play_date: string;
  streak_start_date: string | null;
  freeze_tokens: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  game_type: GameType;
  difficulty: DifficultyLevel;
  question_count: number;
  time_limit_seconds: number;
  required_accuracy: number | null;
  max_mistakes: number;
  xp_reward: number;
  bonus_xp_for_perfect: number;
  available_date: string;
  team_id: string | null;
  created_at: string;
}

export interface DailyChallengeCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  session_id: string | null;
  completed_at: string;
  was_successful: boolean;
  was_perfect: boolean;
  xp_earned: number;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// LEADERBOARDS
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string;
  rank: number;
  xp: number;
  games_played: number;
  accuracy: number;
  streak: number;
  display_name?: string;
  avatar_url?: string;
  position?: FootballPosition;
}

export interface LeaderboardSnapshot {
  id: string;
  team_id: string | null;
  position_group: string | null;
  time_window: TimeWindow;
  season: string | null;
  window_start: string;
  window_end: string;
  rankings: LeaderboardEntry[];
  computed_at: string;
}

export interface SeasonArchive {
  id: string;
  team_id: string;
  season: string;
  final_rankings: LeaderboardEntry[];
  total_games_played: number;
  total_xp_earned: number;
  top_performers: Record<string, unknown> | null;
  position_leaders: Record<string, LeaderboardEntry> | null;
  season_start: string;
  season_end: string;
  archived_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// VIEW TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Player Game Stats View (BRIDGE CONTRACT - owned by INSIGHTS)
 * Aggregates player performance by game type
 */
export interface PlayerGameStatsView {
  user_id: string;
  team_id: string;
  game_type: GameType;
  category: GameCategory | null;
  games_played: number;
  avg_accuracy: number;
  avg_score: number;
  total_xp: number;
  avg_response_time: number;
  best_streak: number;
  accuracy_variance: number;
  first_played: string;
  last_played: string;
}

/**
 * Player Concept Mastery View (BRIDGE CONTRACT - owned by INSIGHTS)
 * Tracks mastery level per football concept
 */
export interface PlayerConceptMasteryView {
  user_id: string;
  team_id: string;
  concept_key: string;
  game_type: GameType;
  category: GameCategory | null;
  total_reps: number;
  correct_reps: number;
  accuracy: number;
  avg_response_time: number;
  last_practiced: string | null;
  mastery_level: 'not_started' | 'learning' | 'proficient' | 'mastered';
}

/**
 * Player IQ Scores View (BRIDGE CONTRACT - owned by INSIGHTS)
 * Computes Football IQ scores per player
 */
export interface PlayerIQScoresView {
  user_id: string;
  team_id: string;
  coverage_iq: number;
  blitz_iq: number;
  situational_iq: number;
  route_iq: number;
  formation_iq: number;
  assignment_iq: number;
  football_iq: number;
  confidence: 'low' | 'medium' | 'high';
  total_games: number;
}

/**
 * Team Analytics Snapshot (BRIDGE CONTRACT - owned by INSIGHTS)
 * Periodic snapshots for dashboard performance
 */
export interface TeamAnalyticsSnapshot {
  id: string;
  team_id: string;
  snapshot_date: string;
  snapshot_type: 'daily' | 'weekly';
  total_sessions: number;
  total_xp_earned: number;
  active_players: number;
  average_accuracy: number | null;
  average_football_iq: number | null;
  position_breakdown: Record<string, unknown> | null;
  top_performers: unknown[] | null;
  at_risk_players: unknown[] | null;
  most_improved: Record<string, unknown> | null;
  created_at: string;
}

export interface UserTeamStats {
  user_id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  avatar_url: string | null;
  position: FootballPosition | null;
  position_group: string | null;
  role: UserRole;
  current_level: number;
  team_xp: number;
  current_streak: number;
  longest_streak: number;
  total_games: number;
  avg_accuracy: number;
  total_score: number;
}

export interface WeeklyLeaderboardEntry {
  user_id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  avatar_url: string | null;
  position: FootballPosition | null;
  position_group: string | null;
  current_level: number;
  weekly_xp: number;
  games_this_week: number;
  current_streak: number;
  team_rank: number;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// API PAYLOAD TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface StartSessionPayload {
  game_type: GameType;
  team_id: string;
  mode: GameMode;
  difficulty: DifficultyLevel;
  question_count?: number;
}

export interface StartSessionResponse {
  session: GameSession;
  questions: Question[];
}

export interface SubmitAttemptPayload {
  session_id: string;
  question_id: string;
  selected_answer_id: string | null;
  time_taken_ms: number;
}

export interface SubmitAttemptResponse {
  attempt: GameAttempt;
  is_correct: boolean;
  correct_answer_id: string;
  explanation: string | null;
  points_earned: number;
  current_streak: number;
  session_progress: {
    current_question: number;
    total_questions: number;
    current_score: number;
    accuracy: number;
  };
}

export interface FinishSessionPayload {
  session_id: string;
}

export interface FinishSessionResponse {
  session: GameSession;
  xp_events: XPEvent[];
  level_up: boolean;
  new_level: number | null;
  streak_updated: boolean;
  new_streak: number;
  achievements_unlocked: string[];
}

export interface PlayerSummary {
  user: User;
  team_stats: UserTeamStats;
  streak: UserStreak | null;
  recent_sessions: GameSession[];
  level_progress: {
    current_level: number;
    current_xp: number;
    xp_for_level: number;
    xp_to_next: number;
    progress_percent: number;
  };
  game_stats: {
    game_type: GameType;
    games_played: number;
    best_score: number;
    avg_accuracy: number;
    best_streak: number;
  }[];
}

export interface LeaderboardRequest {
  team_id?: string;
  scope: LeaderboardScope;
  time_window: TimeWindow;
  position_group?: string;
  limit?: number;
  offset?: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  user_rank: number | null;
  total_participants: number;
  time_window: TimeWindow;
  window_start: string;
  window_end: string;
}

export interface DailyChallengeResponse {
  challenge: DailyChallenge;
  user_completion: DailyChallengeCompletion | null;
  expires_at: string;
  time_remaining_seconds: number;
}

