// ═══════════════════════════════════════════════════════════════════════════════════════════
// REFINED DATABASE TYPES — Organization-Scoped Multi-Tenancy
//
// TypeScript types for the refined schema with organization-based access control
// ═══════════════════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────────────────
// ENUMS (unchanged from original)
// ───────────────────────────────────────────────────────────────────────────────────────────

export type UserRole = 'player' | 'coach' | 'admin';
export type SkillPosition = 'QB' | 'RB' | 'FB' | 'X' | 'Z' | 'H' | 'Y' | 'TE' | 'LT' | 'LG' | 'C' | 'RG' | 'RT' | 'DE' | 'DT' | 'NT' | 'MLB' | 'OLB' | 'ILB' | 'WILL' | 'MIKE' | 'SAM' | 'CB' | 'FS' | 'SS' | 'S' | 'NB' | 'K' | 'P' | 'LS' | 'KR' | 'PR';
export type PlayType = 'PASS' | 'RUN' | 'RPO' | 'SCREEN' | 'TRICK' | 'SPECIAL';
export type ContentType = 'play' | 'coverage' | 'formation' | 'legend' | 'index' | 'coaching_points' | 'technique' | 'terminology' | 'reference' | 'other';
export type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'generating';
export type FlashcardCategory = 'alignment' | 'assignment' | 'coverage' | 'motion' | 'read' | 'progression' | 'terminology' | 'blocking';
export type FlashcardDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type FlashcardCardType = 'assignment' | 'knowledge';
export type AssignmentCategory = 'formation' | 'coverage' | 'route' | 'protection' | 'blocking' | 'run_fits' | 'adjustments' | 'hot_routes' | 'checks' | 'general';
export type SideOfBall = 'offense' | 'defense' | 'special_teams' | 'general';
export type OnboardingState = 'new' | 'profile_incomplete' | 'pending_org' | 'pending_team' | 'pending_position' | 'completed';

// ───────────────────────────────────────────────────────────────────────────────────────────
// CORE IDENTITY & TENANCY
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  auth_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string | null;  // Generated
  display_name: string | null;
  avatar_url: string | null;

  // Global gamification
  total_xp: number;
  current_level: number;

  // Onboarding
  onboarding_state: OnboardingState;

  created_at: string;
  updated_at: string;
}

export interface DbOrganization {
  id: string;
  owner_id: string;  // FK to users
  name: string;
  slug: string | null;
  logo_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface DbTeam {
  id: string;
  org_id: string;  // FK to organizations
  name: string;
  slug: string;
  logo_url: string | null;
  season: string;
  created_at: string;
  updated_at: string;
}

export interface DbTeamSegment {
  id: string;
  team_id: string;  // FK to teams
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbOrgMembership {
  id: string;
  org_id: string;  // FK to organizations
  user_id: string;  // FK to users

  // RBAC
  role: UserRole;  // admin, coach, player

  // Team assignment (optional)
  team_id: string | null;  // FK to teams
  segment_id: string | null;  // FK to team_segments

  // Player-specific
  jersey_number: number | null;
  position_code: string | null;  // Primary position
  positions: SkillPosition[];  // All positions (JSONB array)

  // Org-specific gamification
  org_xp: number;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// PLAYBOOK & CONTENT (Org-scoped)
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbSeason {
  id: string;
  org_id: string;  // FK to organizations ✓
  team_id: string | null;  // FK to teams (optional)
  name: string;
  year: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPlaybook {
  id: string;
  org_id: string;  // FK to organizations ✓
  team_id: string | null;  // FK to teams (optional)
  season_id: string | null;  // FK to seasons
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;  // FK to users
  created_at: string;
  updated_at: string;
}

export interface DbPlaybookMetadata {
  id: string;
  org_id: string;  // FK to organizations ✓
  team_id: string | null;  // FK to teams (optional)

  // File information
  file_name: string | null;
  file_url: string | null;
  storage_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  file_paths: string[];

  // Content classification
  content_type: ContentType;
  side_of_ball: SideOfBall | null;

  // Play/formation context
  formation_name: string | null;
  concept_name: string | null;
  play_type: string | null;

  // Organization & tags
  level: string | null;
  position_relevance: string[] | null;
  tags: string[] | null;

  // User annotations
  custom_notes: string | null;
  custom_title: string | null;

  // AI analysis
  analyzed_at: string | null;
  ai_model_version: string | null;
  ai_confidence_score: number | null;

  // Status
  is_active: boolean;
  is_archived: boolean;
  is_built_play: boolean;

  // Links
  play_id: string | null;  // FK to plays

  // Additional data
  play_data: Record<string, unknown> | null;

  uploaded_by: string | null;  // FK to users
  created_at: string;
  updated_at: string;
}

export interface DbPlay {
  id: string;
  org_id: string;  // FK to organizations ✓
  team_id: string | null;  // FK to teams (optional)

  // Play identity
  name: string;
  short_name: string | null;
  play_type: PlayType;
  concept: string | null;

  // Formation & personnel
  personnel_id: string | null;  // FK to personnel_groupings
  personnel_code: string | null;
  formation_name: string | null;

  // Diagram
  diagram_data: Record<string, unknown> | null;

  // Content management
  content_type: ContentType;
  content_status: ContentStatus;
  is_published: boolean;

  // Review workflow
  reviewed_by: string | null;  // FK to users
  reviewed_at: string | null;
  review_notes: string | null;

  // AI insights
  ai_insights: string | null;

  // Links
  playbook_metadata_id: string | null;  // FK to playbook_metadata

  created_by: string | null;  // FK to users
  created_at: string;
  updated_at: string;
}

export interface DbPlayAssignment {
  id: string;
  play_id: string;  // FK to plays

  // Position this assignment is for
  position: SkillPosition;

  // Assignment details
  alignment: string;
  landmark: string;
  assignment: string;
  key_read: string;

  // Route details (for receivers/backs)
  route_id: string | null;
  route_depth: number | null;

  // Coverage adjustments
  coverage_adjustments: {
    vs_man: string;
    vs_zone: string;
    vs_blitz?: string;
    vs_cover_2?: string;
    vs_cover_3?: string;
    vs_cover_4?: string;
  };

  // Categorization
  category: AssignmentCategory;

  // Visibility control
  visible_to_positions: SkillPosition[];  // JSONB array

  // Metadata
  source_metadata_ids: string[];
  display_order: number;

  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// QUIZ & LEARNING SYSTEM (Org-scoped)
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbFlashcardTemplate {
  id: string;
  org_id: string;  // FK to organizations ✓ (via play relationship)
  play_id: string;  // FK to plays
  assignment_id: string | null;  // FK to play_assignments

  // Target audience
  position: SkillPosition;  // Which position is this for

  // Card details
  category: FlashcardCategory;
  card_type: FlashcardCardType;

  // Question content
  question_prompt: string;
  correct_answer: string;
  hints: string[];  // JSONB array
  explanation: string | null;

  // Difficulty
  difficulty: FlashcardDifficulty;

  // Metadata
  is_auto_generated: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface DbQuizAssignment {
  id: string;
  org_id: string;  // FK to organizations ✓
  team_id: string | null;  // FK to teams (optional)

  // Assignment details
  title: string;
  description: string | null;

  // Target audience (only ONE will be set)
  assigned_to_user_id: string | null;  // FK to users
  assigned_to_position: SkillPosition | null;
  assigned_to_segment_id: string | null;  // FK to team_segments
  assigned_to_team_id: string | null;  // FK to teams

  // Timing
  due_date: string | null;
  available_from: string;
  available_until: string | null;

  // Settings
  passing_score: number;  // Default 80
  max_attempts: number | null;
  time_limit_seconds: number | null;
  randomize_questions: boolean;

  // Status
  is_active: boolean;

  assigned_by: string | null;  // FK to users
  created_at: string;
  updated_at: string;
}

export interface DbQuizAssignmentQuestion {
  id: string;
  quiz_assignment_id: string;  // FK to quiz_assignments
  flashcard_id: string;  // FK to flashcard_templates

  display_order: number;
  points: number;

  created_at: string;
}

export interface DbQuizAttempt {
  id: string;
  quiz_assignment_id: string;  // FK to quiz_assignments
  user_id: string;  // FK to users

  // Attempt details
  attempt_number: number;
  started_at: string;
  completed_at: string | null;

  // Results
  total_questions: number;
  correct_answers: number;
  score_percentage: number | null;
  passed: boolean | null;

  // Timing
  time_taken_seconds: number | null;

  created_at: string;
}

export interface DbQuizAttemptAnswer {
  id: string;
  quiz_attempt_id: string;  // FK to quiz_attempts
  flashcard_id: string;  // FK to flashcard_templates

  // Answer details
  question_number: number;
  user_answer: string | null;
  is_correct: boolean;

  // Timing
  response_time_ms: number;
  answered_at: string;
}

export interface DbPlayerFlashcardProgress {
  id: string;
  user_id: string;  // FK to users
  flashcard_id: string;  // FK to flashcard_templates

  // Spaced repetition algorithm (SM-2)
  ease_factor: number;  // Default 2.5
  interval_days: number;  // Default 1
  due_date: string;  // Date

  // Statistics
  times_shown: number;
  times_correct: number;

  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// GAMIFICATION (Org-scoped)
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbXpEvent {
  id: string;
  user_id: string;  // FK to users
  org_id: string;  // FK to organizations ✓
  team_id: string | null;  // FK to teams (optional)

  event_type: string;  // 'quiz_completion', 'streak_bonus', etc.
  xp_amount: number;
  description: string | null;
  metadata: Record<string, unknown>;

  // Context
  quiz_attempt_id: string | null;  // FK to quiz_attempts

  created_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// REFERENCE TABLES (Global, not org-specific)
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface DbPersonnelGrouping {
  id: string;
  code: string;  // '11', '12', '21', etc.
  name: string;
  running_backs: number;
  tight_ends: number;
  wide_receivers: number;
  fullbacks: number;
  description: string | null;
  created_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// VIEWS
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface UserQuizAssignmentView {
  // All fields from quiz_assignments
  id: string;
  org_id: string;
  team_id: string | null;
  title: string;
  description: string | null;
  // ... other quiz_assignment fields

  // Added from org_memberships
  user_id: string;  // The user this applies to
  position_code: string | null;
  membership_team_id: string | null;
  membership_segment_id: string | null;
}

export interface UserQuizStatsView {
  user_id: string;
  org_id: string;
  total_attempts: number;
  passed_attempts: number;
  avg_score: number | null;
  last_quiz_completed: string | null;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// DATABASE SCHEMA TYPE
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface RefinedDatabase {
  public: {
    Tables: {
      // Core identity & tenancy
      users: { Row: DbUser; Insert: Partial<DbUser>; Update: Partial<DbUser> };
      organizations: { Row: DbOrganization; Insert: Partial<DbOrganization>; Update: Partial<DbOrganization> };
      teams: { Row: DbTeam; Insert: Partial<DbTeam>; Update: Partial<DbTeam> };
      team_segments: { Row: DbTeamSegment; Insert: Partial<DbTeamSegment>; Update: Partial<DbTeamSegment> };
      org_memberships: { Row: DbOrgMembership; Insert: Partial<DbOrgMembership>; Update: Partial<DbOrgMembership> };

      // Playbook & content
      seasons: { Row: DbSeason; Insert: Partial<DbSeason>; Update: Partial<DbSeason> };
      playbooks: { Row: DbPlaybook; Insert: Partial<DbPlaybook>; Update: Partial<DbPlaybook> };
      playbook_metadata: { Row: DbPlaybookMetadata; Insert: Partial<DbPlaybookMetadata>; Update: Partial<DbPlaybookMetadata> };
      plays: { Row: DbPlay; Insert: Partial<DbPlay>; Update: Partial<DbPlay> };
      play_assignments: { Row: DbPlayAssignment; Insert: Partial<DbPlayAssignment>; Update: Partial<DbPlayAssignment> };

      // Quiz & learning
      flashcard_templates: { Row: DbFlashcardTemplate; Insert: Partial<DbFlashcardTemplate>; Update: Partial<DbFlashcardTemplate> };
      quiz_assignments: { Row: DbQuizAssignment; Insert: Partial<DbQuizAssignment>; Update: Partial<DbQuizAssignment> };
      quiz_assignment_questions: { Row: DbQuizAssignmentQuestion; Insert: Partial<DbQuizAssignmentQuestion>; Update: Partial<DbQuizAssignmentQuestion> };
      quiz_attempts: { Row: DbQuizAttempt; Insert: Partial<DbQuizAttempt>; Update: Partial<DbQuizAttempt> };
      quiz_attempt_answers: { Row: DbQuizAttemptAnswer; Insert: Partial<DbQuizAttemptAnswer>; Update: Partial<DbQuizAttemptAnswer> };
      player_flashcard_progress: { Row: DbPlayerFlashcardProgress; Insert: Partial<DbPlayerFlashcardProgress>; Update: Partial<DbPlayerFlashcardProgress> };

      // Gamification
      xp_events: { Row: DbXpEvent; Insert: Partial<DbXpEvent>; Update: Partial<DbXpEvent> };

      // Reference tables
      personnel_groupings: { Row: DbPersonnelGrouping; Insert: Partial<DbPersonnelGrouping>; Update: Partial<DbPersonnelGrouping> };
    };
    Views: {
      user_quiz_assignments: { Row: UserQuizAssignmentView };
      user_quiz_stats: { Row: UserQuizStatsView };
    };
    Functions: {
      is_org_member: {
        Args: { check_org_id: string };
        Returns: boolean;
      };
      get_user_org_role: {
        Args: { check_org_id: string };
        Returns: string;
      };
      has_org_role: {
        Args: { check_org_id: string; required_role: string };
        Returns: boolean;
      };
      is_org_staff: {
        Args: { check_org_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      skill_position: SkillPosition;
      play_type: PlayType;
      content_type: ContentType;
      content_status: ContentStatus;
      flashcard_category: FlashcardCategory;
      assignment_category: AssignmentCategory;
      side_of_ball: SideOfBall;
      onboarding_state: OnboardingState;
    };
  };
}

// Type helpers
export type Tables<T extends keyof RefinedDatabase['public']['Tables']> = RefinedDatabase['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof RefinedDatabase['public']['Tables']> = RefinedDatabase['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof RefinedDatabase['public']['Tables']> = RefinedDatabase['public']['Tables'][T]['Update'];
export type Views<T extends keyof RefinedDatabase['public']['Views']> = RefinedDatabase['public']['Views'][T]['Row'];

// ───────────────────────────────────────────────────────────────────────────────────────────
// UTILITY TYPES FOR APPLICATION USE
// ───────────────────────────────────────────────────────────────────────────────────────────

// Organization with member info
export interface OrganizationWithMembership extends DbOrganization {
  membership: DbOrgMembership;
}

// Play with assignments
export interface PlayWithAssignments extends DbPlay {
  assignments: DbPlayAssignment[];
}

// Quiz assignment with questions
export interface QuizAssignmentWithQuestions extends DbQuizAssignment {
  questions: (DbQuizAssignmentQuestion & {
    flashcard: DbFlashcardTemplate;
  })[];
}

// Quiz attempt with answers
export interface QuizAttemptWithAnswers extends DbQuizAttempt {
  assignment: DbQuizAssignment;
  answers: DbQuizAttemptAnswer[];
}

// User with org memberships
export interface UserWithMemberships extends DbUser {
  memberships: (DbOrgMembership & {
    organization: DbOrganization;
    team: DbTeam | null;
  })[];
}
