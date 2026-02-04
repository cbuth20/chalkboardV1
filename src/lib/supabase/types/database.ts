// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — DATABASE TYPES
// 
// TypeScript types generated from the PostgreSQL schema.
// These types are used for type-safe Supabase queries.
// ═══════════════════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────────────────
// ENUMS
// ───────────────────────────────────────────────────────────────────────────────────────────

export type PlayType = 'PASS' | 'RUN' | 'RPO' | 'SCREEN' | 'TRICK' | 'SPECIAL';

export type SkillPosition =
  // Offense - Skill Positions
  | 'QB' | 'RB' | 'FB'
  | 'X' | 'Z' | 'H' | 'Y' | 'TE'
  // Offense - Offensive Line
  | 'LT' | 'LG' | 'C' | 'RG' | 'RT'
  // Defense - Defensive Line
  | 'DE' | 'DT' | 'NT'
  // Defense - Linebackers
  | 'MLB' | 'OLB' | 'ILB' | 'WILL' | 'MIKE' | 'SAM'
  // Defense - Secondary
  | 'CB' | 'FS' | 'SS' | 'S' | 'NB'
  // Special Teams
  | 'K' | 'P' | 'LS' | 'KR' | 'PR';

export type MasteryLevel = 'new' | 'learning' | 'proficient' | 'mastered';

export type FlashcardCategory = 
  | 'alignment' 
  | 'assignment' 
  | 'coverage' 
  | 'motion' 
  | 'read' 
  | 'progression' 
  | 'terminology' 
  | 'blocking';

export type MotionType = 'jet' | 'orbit' | 'shift' | 'trade' | 'stack' | 'empty' | 'bunch' | 'zip';

export type MotionTiming = 'pre_huddle' | 'at_line' | 'on_cadence' | 'on_snap' | 'post_snap';

export type InstallStatus = 'upcoming' | 'active' | 'completed';

export type PlayStatus = 'NEW' | 'DUE_TODAY' | 'EMPHASIS' | 'NEEDS_REPS' | 'COMPLETED' | 'NORMAL';

export type AIInsightType = 
  | 'weak_concept' 
  | 'progress_update' 
  | 'study_recommendation'
  | 'install_readiness' 
  | 'coverage_gap' 
  | 'assignment_gap'
  | 'streak_milestone' 
  | 'mastery_achieved';

export type CoverageEffectiveness = 'excellent' | 'good' | 'neutral' | 'poor';

export type UserRole = 'player' | 'coach' | 'admin';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export type ContentType =
  | 'play'
  | 'coverage'
  | 'formation'
  | 'legend'
  | 'index'
  | 'coaching_points'
  | 'technique'
  | 'terminology'
  | 'reference'
  | 'other';

export type SideOfBall = 'offense' | 'defense' | 'special_teams' | 'general';

export type OnboardingState =
  | 'new'                    // Just signed up, no profile
  | 'profile_incomplete'     // Started profile, missing info
  | 'pending_org'           // Profile complete, needs org assignment
  | 'pending_team'          // In org, needs team assignment
  | 'pending_position'      // In team, needs position
  | 'completed';            // Fully onboarded


// ───────────────────────────────────────────────────────────────────────────────────────────
// BASE TYPES (from existing schema)
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  auth_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string | null;  // Generated column: first_name + last_name
  display_name: string | null;
  avatar_url: string | null;
  jersey_number: number | null;
  role: UserRole;  // Moved from team_members to user level
  onboarding_state: OnboardingState;  // Track onboarding progress
  total_xp: number;
  current_level: number;
  football_iq_rating: number;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface DbTeam {
  id: string;
  org_id: string;  // FK to organizations (one-to-one)
  name: string;
  slug: string;
  logo_url: string | null;
  season: string;
  timezone: string;
  tier: string;
  max_players: number;
  created_at: string;
  updated_at: string;
}

export interface DbOrganization {
  id: string;
  owner_id: string;  // FK to users
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbTeamSegment {
  id: string;
  team_id: string;  // FK to teams
  code: string;  // Short code like 'OFFENSE', 'DEFENSE', 'VARSITY', 'JV'
  name: string;  // Display name
  created_at: string;
  updated_at: string;
}

export interface DbOrgMembership {
  id: string;
  org_id: string;  // FK to organizations
  user_id: string;  // FK to users
  role: UserRole;  // player, coach, admin
  segment_id: string | null;  // Optional FK to team_segments
  jersey_number: number | null;
  position_code: string | null;  // Primary position (e.g., 'QB', 'WR')
  created_at: string;
  updated_at: string;
}

export interface DbTeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: UserRole;
  position: SkillPosition | null;  // Deprecated - use positions array. Kept for backwards compatibility
  positions: SkillPosition[];       // Array of positions this member plays
  position_group: string | null;
  team_xp: number;
  team_rank: number | null;
  is_active: boolean;
  joined_at: string;
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// SEASON & POSITION GROUP TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbSeason {
  id: string;
  team_id: string;
  name: string;
  year: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPositionGroup {
  id: string;
  team_id: string;
  name: string;
  code: string;
  display_order: number;
  color: string | null;
  positions: SkillPosition[];
  created_at: string;
}

export interface DbUserPositionGroup {
  id: string;
  user_id: string;
  team_id: string;
  position_group_id: string;
  primary_position: SkillPosition | null;
  is_primary_group: boolean;
  assigned_at: string;
  assigned_by: string | null;
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// PLAYBOOK & PLAY TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbPersonnelGrouping {
  id: string;
  code: string;
  name: string;
  running_backs: number;
  tight_ends: number;
  wide_receivers: number;
  fullbacks: number;
  description: string | null;
  created_at: string;
}

export interface DbPlayTag {
  id: string;
  team_id: string | null;
  name: string;
  code: string;
  category: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}

export interface DbPlaybook {
  id: string;
  team_id: string;
  season_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  color: string | null;
  icon: string | null;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ContentStatus = 'pending_review' | 'approved' | 'rejected';

export interface DbPlay {
  id: string;
  team_id: string | null;
  source_play_id: string | null;
  name: string;
  short_name: string | null;
  play_type: PlayType;
  concept: string | null;
  personnel_id: string | null;
  personnel_code: string | null;
  formation_id: string | null;
  formation_name: string | null;
  diagram_type: string;
  diagram_data: Record<string, unknown> | null;
  coaching_points: string[];
  is_published: boolean;
  is_archived: boolean;
  version: number;
  content_type: ContentType;  // NEW: Added in migration 004
  content_status: ContentStatus;  // NEW: Added in migration 004
  playbook_metadata_id: string | null;  // NEW: Added in migration 004
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTeamPlay {
  id: string;
  team_id: string;
  play_id: string;
  season_id: string | null;
  custom_name: string | null;
  custom_coaching_points: string[] | null;
  team_notes: string | null;
  playbook_id: string | null;
  install_week: number | null;
  install_date: string | null;
  is_active: boolean;
  is_emphasis: boolean;
  emphasis_reason: string | null;
  default_rep_target: number;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPlayTagAssignment {
  id: string;
  play_id: string;
  tag_id: string;
  team_play_id: string | null;
  created_at: string;
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// INSTALL TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface RepTargets {
  default: number;
  by_position?: Partial<Record<SkillPosition, number>>;
  by_play_id?: Record<string, number>;
}

export interface DbInstall {
  id: string;
  team_id: string;
  season_id: string | null;
  week_number: number;
  week_label: string;
  start_date: string;
  end_date: string;
  status: InstallStatus;
  rep_targets: RepTargets;
  coach_notes: string | null;
  focus_areas: string[];
  opponent_name: string | null;
  game_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInstallPlay {
  id: string;
  install_id: string;
  play_id: string;
  team_play_id: string | null;
  display_order: number;
  category: string;
  is_emphasis: boolean;
  emphasis_reason: string | null;
  rep_target_override: number | null;
  added_at: string;
  added_by: string | null;
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// ASSIGNMENT & COACHING TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface CoverageAdjustments {
  vs_man: string;
  vs_zone: string;
  vs_cover_2?: string;
  vs_cover_3?: string;
  vs_cover_4?: string;
  vs_blitz?: string;
  vs_fire_zone?: string;
}

export interface MotionInfo {
  type: MotionType;
  timing: MotionTiming;
  path: string;
}

export type AssignmentCategory =
  | 'formation'
  | 'coverage'
  | 'route'
  | 'protection'
  | 'blocking'
  | 'run_fits'
  | 'adjustments'
  | 'hot_routes'
  | 'checks'
  | 'general';

export interface DbPlayAssignment {
  id: string;
  play_id: string;
  position: SkillPosition;
  alignment: string;
  split_depth: string | null;
  landmark: string;
  first_step: string | null;
  assignment: string;
  read_progression: string[];
  run_track: string | null;
  blocking_assignment: string | null;
  route_id: string | null;
  route_depth: number | null;
  route_landmarks: string | null;
  key_read: string;
  coverage_adjustments: CoverageAdjustments;
  motion: MotionInfo | null;
  category: AssignmentCategory;  // UPDATED: Made required in migration 004
  source_metadata_ids: string[];  // NEW: Added in migration 004
  display_order: number;  // NEW: Added in migration 004
  created_at: string;
  updated_at: string;
}

export interface DbCoachingPoint {
  id: string;
  play_id: string;
  position: SkillPosition | null;
  position_group_id: string | null;
  point_text: string;
  point_type: string;
  display_order: number;
  team_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PositionAdjustment {
  position: SkillPosition;
  adjustment: string;
  reason: string;
}

export interface DbCoverageVariant {
  id: string;
  play_id: string;
  coverage_id: string;
  coverage_name: string;
  play_adjustment: string;
  coverage_key: string;
  effectiveness: CoverageEffectiveness;
  position_adjustments: PositionAdjustment[];
  created_at: string;
  updated_at: string;
}

export interface DbMotionDefinition {
  id: string;
  play_id: string;
  motion_type: MotionType;
  motion_timing: MotionTiming;
  mover_position: SkillPosition;
  path_description: string;
  start_alignment: string | null;
  end_alignment: string | null;
  step_number: number;
  snap_timing: string | null;
  defensive_key: string | null;
  created_at: string;
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// PLAYER STUDY & MASTERY TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbPlayerStudySession {
  id: string;
  user_id: string;
  team_id: string;
  install_id: string | null;
  playbook_id: string | null;
  session_type: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  plays_studied: number;
  reps_logged: number;
  flashcards_reviewed: number;
  questions_attempted: number;
  questions_correct: number;
  device_type: string | null;
  client_version: string | null;
  xp_earned: number;
  created_at: string;
}

export interface DbPlayRepEvent {
  id: string;
  user_id: string;
  team_id: string;
  play_id: string;
  install_id: string | null;
  study_session_id: string | null;
  event_type: string;
  position: SkillPosition | null;
  was_correct: boolean | null;
  response_time_ms: number | null;
  category: FlashcardCategory | null;
  notes: string | null;
  recorded_at: string;
}

export interface CategoryScores {
  alignment: number;
  landmark: number;
  assignment: number;
  read: number;
  adjustment: number;
}

export interface DbPlayerPlayMastery {
  id: string;
  user_id: string;
  team_id: string;
  play_id: string;
  position: SkillPosition;
  reps_completed: number;
  reps_target: number;
  physical_reps: number;
  mastery_score: number;
  mastery_level: MasteryLevel;
  quiz_attempts: number;
  quiz_correct: number;
  quiz_accuracy: number;
  avg_response_time_ms: number | null;
  category_scores: CategoryScores;
  last_studied_at: string | null;
  next_due_date: string | null;
  ease_factor: number;
  interval_days: number;
  is_starred: boolean;
  is_emphasis: boolean;
  needs_review: boolean;
  current_install_id: string | null;
  created_at: string;
  updated_at: string;
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// FLASHCARD TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbFlashcardTemplate {
  id: string;
  play_id: string;
  assignment_id: string | null;
  position: SkillPosition;
  category: FlashcardCategory;
  question_prompt: string;
  correct_answer: string;
  hints: string[];
  explanation: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_auto_generated: boolean;
  team_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPlayerFlashcardAttempt {
  id: string;
  user_id: string;
  flashcard_id: string;
  study_session_id: string | null;
  was_correct: boolean;
  response_time_ms: number;
  self_rating: number | null;
  new_ease_factor: number | null;
  new_interval: number | null;
  attempted_at: string;
}

export interface DbPlayerFlashcardProgress {
  id: string;
  user_id: string;
  flashcard_id: string;
  ease_factor: number;
  interval_days: number;
  due_date: string;
  times_shown: number;
  times_correct: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// PLAYER LIBRARY TYPES (Added in migration 018)
// ───────────────────────────────────────────────────────────────────────────────────────────

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'scenario' | 'identification';

export type QuestionTopic =
  | 'formation_identification'
  | 'alignment_rules'
  | 'personnel_groupings'
  | 'route_running'
  | 'blocking_assignments'
  | 'pass_protection'
  | 'run_fits'
  | 'pre_snap_reads'
  | 'post_snap_reads'
  | 'coverage_recognition'
  | 'hot_routes'
  | 'coverage_adjustments'
  | 'formation_checks'
  | 'audibles'
  | 'motion_adjustments'
  | 'play_concepts'
  | 'coverage_concepts'
  | 'situational_football'
  | 'game_planning'
  | 'terminology'
  | 'rules'
  | 'techniques';

export interface PlayerFlashcardTemplate {
  id: string;
  player_play_id: string;
  player_assignment_id: string | null;
  org_id: string;
  position: SkillPosition;
  category: FlashcardCategory;

  // Question content
  question_prompt: string;
  correct_answer: string;
  hints: Record<string, unknown>;
  explanation: string | null;

  // Enhanced fields (migration 020)
  question_type: QuestionType | null;
  topic: QuestionTopic | null;
  options: string[] | null; // For multiple choice
  scenario_context: string | null;
  learning_objective: string | null;
  tags: string[];
  ai_generation_metadata: Record<string, unknown>;

  // Metadata
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_auto_generated: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// PLAYER GAMES TYPES (Added in migration 020)
// ───────────────────────────────────────────────────────────────────────────────────────────

export type GameCategory = 'coverage_blitz' | 'routes_concepts' | 'situational' | 'assignments';
export type SelectionStrategy = 'random' | 'difficulty_progression' | 'spaced_repetition';

export interface GameFilters {
  positions?: SkillPosition[];
  topics?: QuestionTopic[];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  playIds?: string[];
  tags?: string[];
}

export interface PlayerGame {
  id: string;
  user_id: string;
  org_id: string;

  // Game identity
  name: string;
  description: string | null;
  category: GameCategory;

  // Configuration
  filters: GameFilters;
  question_count: number;
  time_limit_seconds: number | null;
  passing_score: number;
  selection_strategy: SelectionStrategy;

  // Status & Stats
  is_active: boolean;
  total_attempts: number;
  best_score: number | null;
  last_played_at: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface PlayerGameAttempt {
  id: string;
  user_id: string;
  org_id: string;
  game_id: string | null; // Null for ad-hoc games

  // Session timing
  started_at: string;
  completed_at: string | null;

  // Scoring
  questions_asked: number;
  questions_correct: number;
  score_percentage: number;

  // Question data
  question_ids: string[];
  responses: Array<{
    questionId: string;
    answer: string;
    correct: boolean;
    timeSpent: number;
  }>;

  // Metadata
  created_at: string;
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// AI INSIGHT TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbAIInsight {
  id: string;
  user_id: string;
  team_id: string;
  install_id: string | null;
  play_id: string | null;
  insight_type: AIInsightType;
  title: string;
  text_summary: string;
  structured_payload: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  is_dismissed: boolean;
  is_actioned: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface DbAIRecommendation {
  id: string;
  user_id: string;
  team_id: string;
  insight_id: string | null;
  install_id: string | null;
  recommended_play_id: string | null;
  recommended_action: string | null;
  reason: string;
  reason_category: string | null;
  priority_rank: number;
  priority_score: number | null;
  is_completed: boolean;
  completed_at: string | null;
  is_dismissed: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// CONTENT TYPES (Added in migration 004)
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbPlaybookMetadata {
  id: string;
  team_id: string;

  // File information
  file_name: string | null;  // Nullable - auto-generated from file_paths if not provided
  file_url: string | null;
  storage_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  file_paths: string[];  // NEW: Added for backwards compatibility

  // Content classification
  content_type: ContentType;
  side_of_ball: SideOfBall | null;

  // Play/formation context
  formation_name: string | null;
  concept_name: string | null;
  play_type: string | null;

  // Organization
  level: string | null;
  position_relevance: string[] | null;
  tags: string[] | null;

  // User annotations
  custom_notes: string | null;
  custom_title: string | null;

  // AI analysis metadata
  analyzed_at: string | null;
  ai_model_version: string | null;
  ai_confidence_score: number | null;

  // Status
  is_active: boolean;
  is_archived: boolean;
  is_built_play: boolean;  // NEW: Whether this is a built/generated play

  // Additional data
  play_data: Record<string, unknown> | null;  // NEW: Additional play data/metadata (JSONB)

  // Links
  play_id: string | null;

  // Metadata
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFormationDefinition {
  id: string;
  metadata_id: string;
  play_id: string | null;

  // Formation identity
  name: string;
  short_name: string | null;
  personnel: string | null;
  alignment: string | null;

  // Single formation content
  description: string | null;
  key_features: string[] | null;
  common_plays: string[] | null;
  positions: Record<string, unknown> | null;

  // Multi-formation support
  is_multi_formation: boolean;
  formations: Record<string, unknown>[] | null;

  // Additional info
  notes: string | null;
  diagram_data: Record<string, unknown> | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface DbCoverageDefinition {
  id: string;
  metadata_id: string;
  play_id: string | null;

  // Coverage identity
  name: string;
  short_name: string | null;
  coverage_type: string | null;
  coverage_family: string | null;
  front: string | null;

  // Content
  description: string | null;
  key_points: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  best_against: string[] | null;

  // Position assignments (defensive)
  positions: Record<string, unknown> | null;

  // Coverage keys
  coverage_keys: string[] | null;

  // Additional info
  coaching_points: string[] | null;
  diagram_data: Record<string, unknown> | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface DbReferenceContent {
  id: string;
  metadata_id: string;

  // Content identity
  title: string;
  subtitle: string | null;
  content_subtype: string | null;

  // General content
  description: string | null;

  // Structured content
  sections: Record<string, unknown>[] | null;
  terminology: Record<string, unknown>[] | null;
  diagrams: Record<string, unknown>[] | null;
  coaching_points: string[] | null;
  techniques: Record<string, unknown>[] | null;

  // Index/menu specific
  play_references: Record<string, unknown>[] | null;

  // Legend specific
  symbols: Record<string, unknown>[] | null;

  // Additional info
  notes: string | null;
  related_play_ids: string[] | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface DbGptAnalysisCache {
  id: string;
  metadata_id: string;

  // Request info
  model_version: string;
  prompt_version: string | null;
  request_timestamp: string;

  // Response
  raw_response: Record<string, unknown>;
  response_tokens: number | null;
  processing_time_ms: number | null;

  // Status
  is_successful: boolean;
  error_message: string | null;

  // Metadata
  created_at: string;
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// VIEW TYPES (for common queries)
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface InstallPlayDetail {
  install_play_id: string;
  install_id: string;
  week_number: number;
  week_label: string;
  team_id: string;
  play_id: string;
  play_name: string;
  short_name: string | null;
  play_type: PlayType;
  concept: string | null;
  personnel_code: string | null;
  display_order: number;
  category: string;
  is_emphasis: boolean;
  rep_target_override: number | null;
  effective_rep_target: number;
}

export interface PlayerInstallMastery {
  user_id: string;
  team_id: string;
  play_id: string;
  position: SkillPosition;
  install_id: string;
  week_number: number;
  reps_completed: number;
  reps_target: number;
  mastery_score: number;
  mastery_level: MasteryLevel;
  quiz_accuracy: number;
  last_studied_at: string | null;
  next_due_date: string | null;
  is_starred: boolean;
  is_emphasis: boolean;
  needs_review: boolean;
  rep_progress_pct: number;
}

export interface PlayerWeakestPlay {
  user_id: string;
  team_id: string;
  play_id: string;
  play_name: string;
  concept: string | null;
  position: SkillPosition;
  mastery_score: number;
  mastery_level: MasteryLevel;
  quiz_accuracy: number;
  reps_completed: number;
  reps_target: number;
  category_scores: CategoryScores;
  last_studied_at: string | null;
  weakness_rank: number;
}

export interface DueTodayPlay {
  user_id: string;
  team_id: string;
  play_id: string;
  play_name: string;
  short_name: string | null;
  concept: string | null;
  position: SkillPosition;
  mastery_score: number;
  last_studied_at: string | null;
  next_due_date: string;
  is_emphasis: boolean;
  due_status: 'overdue' | 'due_today' | 'upcoming';
}


// ───────────────────────────────────────────────────────────────────────────────────────────
// DATABASE SCHEMA TYPE (for Supabase client)
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      // Base tables
      users: { Row: DbUser; Insert: Partial<DbUser>; Update: Partial<DbUser> };
      organizations: { Row: DbOrganization; Insert: Partial<DbOrganization>; Update: Partial<DbOrganization> };
      teams: { Row: DbTeam; Insert: Partial<DbTeam>; Update: Partial<DbTeam> };
      team_segments: { Row: DbTeamSegment; Insert: Partial<DbTeamSegment>; Update: Partial<DbTeamSegment> };
      org_memberships: { Row: DbOrgMembership; Insert: Partial<DbOrgMembership>; Update: Partial<DbOrgMembership> };
      team_members: { Row: DbTeamMember; Insert: Partial<DbTeamMember>; Update: Partial<DbTeamMember> };  // Deprecated - use org_memberships

      // Season & Position
      seasons: { Row: DbSeason; Insert: Partial<DbSeason>; Update: Partial<DbSeason> };
      position_groups: { Row: DbPositionGroup; Insert: Partial<DbPositionGroup>; Update: Partial<DbPositionGroup> };
      user_position_groups: { Row: DbUserPositionGroup; Insert: Partial<DbUserPositionGroup>; Update: Partial<DbUserPositionGroup> };
      
      // Playbook & Plays
      personnel_groupings: { Row: DbPersonnelGrouping; Insert: Partial<DbPersonnelGrouping>; Update: Partial<DbPersonnelGrouping> };
      play_tags: { Row: DbPlayTag; Insert: Partial<DbPlayTag>; Update: Partial<DbPlayTag> };
      playbooks: { Row: DbPlaybook; Insert: Partial<DbPlaybook>; Update: Partial<DbPlaybook> };
      plays: { Row: DbPlay; Insert: Partial<DbPlay>; Update: Partial<DbPlay> };
      team_plays: { Row: DbTeamPlay; Insert: Partial<DbTeamPlay>; Update: Partial<DbTeamPlay> };
      play_tag_assignments: { Row: DbPlayTagAssignment; Insert: Partial<DbPlayTagAssignment>; Update: Partial<DbPlayTagAssignment> };
      
      // Installs
      installs: { Row: DbInstall; Insert: Partial<DbInstall>; Update: Partial<DbInstall> };
      install_plays: { Row: DbInstallPlay; Insert: Partial<DbInstallPlay>; Update: Partial<DbInstallPlay> };
      
      // Assignments & Coaching
      play_assignments: { Row: DbPlayAssignment; Insert: Partial<DbPlayAssignment>; Update: Partial<DbPlayAssignment> };
      coaching_points: { Row: DbCoachingPoint; Insert: Partial<DbCoachingPoint>; Update: Partial<DbCoachingPoint> };
      coverage_variants: { Row: DbCoverageVariant; Insert: Partial<DbCoverageVariant>; Update: Partial<DbCoverageVariant> };
      motion_definitions: { Row: DbMotionDefinition; Insert: Partial<DbMotionDefinition>; Update: Partial<DbMotionDefinition> };
      
      // Player Study & Mastery
      player_study_sessions: { Row: DbPlayerStudySession; Insert: Partial<DbPlayerStudySession>; Update: Partial<DbPlayerStudySession> };
      play_rep_events: { Row: DbPlayRepEvent; Insert: Partial<DbPlayRepEvent>; Update: Partial<DbPlayRepEvent> };
      player_play_mastery: { Row: DbPlayerPlayMastery; Insert: Partial<DbPlayerPlayMastery>; Update: Partial<DbPlayerPlayMastery> };
      
      // Flashcards
      flashcard_templates: { Row: DbFlashcardTemplate; Insert: Partial<DbFlashcardTemplate>; Update: Partial<DbFlashcardTemplate> };
      player_flashcard_attempts: { Row: DbPlayerFlashcardAttempt; Insert: Partial<DbPlayerFlashcardAttempt>; Update: Partial<DbPlayerFlashcardAttempt> };
      player_flashcard_progress: { Row: DbPlayerFlashcardProgress; Insert: Partial<DbPlayerFlashcardProgress>; Update: Partial<DbPlayerFlashcardProgress> };
      
      // AI Insights
      ai_insights: { Row: DbAIInsight; Insert: Partial<DbAIInsight>; Update: Partial<DbAIInsight> };
      ai_recommendations: { Row: DbAIRecommendation; Insert: Partial<DbAIRecommendation>; Update: Partial<DbAIRecommendation> };

      // Content Types (Added in migration 004)
      playbook_metadata: { Row: DbPlaybookMetadata; Insert: Partial<DbPlaybookMetadata>; Update: Partial<DbPlaybookMetadata> };
      formation_definitions: { Row: DbFormationDefinition; Insert: Partial<DbFormationDefinition>; Update: Partial<DbFormationDefinition> };
      coverage_definitions: { Row: DbCoverageDefinition; Insert: Partial<DbCoverageDefinition>; Update: Partial<DbCoverageDefinition> };
      reference_content: { Row: DbReferenceContent; Insert: Partial<DbReferenceContent>; Update: Partial<DbReferenceContent> };
      gpt_analysis_cache: { Row: DbGptAnalysisCache; Insert: Partial<DbGptAnalysisCache>; Update: Partial<DbGptAnalysisCache> };

      // Player Library (Added in migration 018)
      player_flashcard_templates: { Row: PlayerFlashcardTemplate; Insert: Partial<PlayerFlashcardTemplate>; Update: Partial<PlayerFlashcardTemplate> };

      // Player Games (Added in migration 020)
      player_games: { Row: PlayerGame; Insert: Partial<PlayerGame>; Update: Partial<PlayerGame> };
      player_game_attempts: { Row: PlayerGameAttempt; Insert: Partial<PlayerGameAttempt>; Update: Partial<PlayerGameAttempt> };
    };
    Views: {
      install_plays_detail_view: { Row: InstallPlayDetail };
      player_install_mastery_view: { Row: PlayerInstallMastery };
      player_weakest_plays_view: { Row: PlayerWeakestPlay };
      due_today_plays_view: { Row: DueTodayPlay };
    };
    Functions: {
      calculate_mastery_level: {
        Args: { score: number };
        Returns: MasteryLevel;
      };
      calculate_next_review: {
        Args: { 
          p_current_interval: number;
          p_ease_factor: number;
          p_was_correct: boolean;
        };
        Returns: { next_interval: number; new_ease_factor: number };
      };
      generate_flashcards_for_play: {
        Args: { p_play_id: string };
        Returns: number;
      };
    };
    Enums: {
      play_type: PlayType;
      skill_position: SkillPosition;
      mastery_level: MasteryLevel;
      flashcard_category: FlashcardCategory;
      motion_type: MotionType;
      motion_timing: MotionTiming;
      install_status: InstallStatus;
      ai_insight_type: AIInsightType;
      coverage_effectiveness: CoverageEffectiveness;
      content_type: ContentType;  // Added in migration 004
      content_status_enum: ContentStatus;  // Added in migration 004
      onboarding_state: OnboardingState;  // Added in migration 001
      user_role: UserRole;
    };
  };
}

// Type helper for typed Supabase queries
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];




