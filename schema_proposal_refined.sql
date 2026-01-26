-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CHALKBOARD — REFINED SCHEMA PROPOSAL
-- Multi-tenant with Organization-based Access Control
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- CORE IDENTITY & TENANCY
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Users table (global, not org-specific)
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id uuid UNIQUE,  -- Links to auth.users
  email character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  display_name character varying,
  avatar_url text,

  -- Global gamification (across all orgs)
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,

  -- Onboarding
  onboarding_state onboarding_state DEFAULT 'new',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organizations (primary tenant boundary)
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  slug text UNIQUE,  -- URL-friendly identifier
  logo_url text,

  -- Settings
  timezone varchar(50) DEFAULT 'America/New_York',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teams (subdivisions within an organization)
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name character varying NOT NULL,
  slug character varying NOT NULL,  -- Unique within org
  logo_url text,
  season character varying DEFAULT '2024',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(org_id, slug)  -- Slug unique within organization
);

-- Team segments (e.g., Varsity, JV, Offense, Defense)
CREATE TABLE public.team_segments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  code text NOT NULL,  -- 'VARSITY', 'JV', 'OFFENSE', 'DEFENSE'
  name text NOT NULL,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(team_id, code)
);

-- Organization memberships (replaces team_members)
CREATE TABLE public.org_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role-based access control
  role user_role NOT NULL DEFAULT 'player',  -- admin, coach, player

  -- Team assignment (optional - user might be org-level admin)
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  segment_id uuid REFERENCES team_segments(id) ON DELETE SET NULL,

  -- Player-specific fields
  jersey_number integer,
  position_code text,  -- Primary position
  positions jsonb DEFAULT '[]' CHECK (jsonb_typeof(positions) = 'array'),  -- All positions

  -- Org-specific gamification
  org_xp integer DEFAULT 0,

  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(org_id, user_id)  -- User can only have one membership per org
);

CREATE INDEX idx_org_memberships_org_user ON org_memberships(org_id, user_id);
CREATE INDEX idx_org_memberships_team ON org_memberships(team_id);
CREATE INDEX idx_org_memberships_role ON org_memberships(org_id, role);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAYBOOK & PLAYS (Org-scoped)
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Seasons (org-scoped)
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,  -- Optional team association

  name character varying NOT NULL,
  year character varying NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(org_id, name, year)
);

-- Playbooks (org-scoped)
CREATE TABLE public.playbooks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,  -- Optional team specificity
  season_id uuid REFERENCES seasons(id) ON DELETE SET NULL,

  name character varying NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,

  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(org_id, name, season_id)
);

-- Playbook metadata (org-scoped)
CREATE TABLE public.playbook_metadata (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,

  -- File information
  file_name character varying,
  file_url text,
  storage_path text,
  file_size_bytes bigint,
  mime_type character varying,
  file_paths text[] DEFAULT '{}',

  -- Content classification
  content_type content_type NOT NULL DEFAULT 'other',
  side_of_ball side_of_ball,

  -- Play/formation context
  formation_name character varying,
  concept_name character varying,
  play_type character varying,

  -- Organization & tags
  level character varying,
  position_relevance text[],
  tags text[],

  -- User annotations
  custom_notes text,
  custom_title character varying,

  -- AI analysis
  analyzed_at timestamptz,
  ai_model_version character varying,
  ai_confidence_score numeric,

  -- Status
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  is_built_play boolean DEFAULT false,

  -- Links
  play_id uuid REFERENCES plays(id),

  -- Additional data
  play_data jsonb,

  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_playbook_metadata_org ON playbook_metadata(org_id);
CREATE INDEX idx_playbook_metadata_content_type ON playbook_metadata(org_id, content_type);

-- Plays (org-scoped)
CREATE TABLE public.plays (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,  -- Optional team specificity

  -- Play identity
  name character varying NOT NULL,
  short_name character varying,
  play_type play_type NOT NULL,
  concept character varying,

  -- Formation & personnel
  personnel_id uuid REFERENCES personnel_groupings(id),
  personnel_code character varying,
  formation_name character varying,

  -- Diagram
  diagram_data jsonb,

  -- Content management
  content_type content_type DEFAULT 'play',
  content_status content_status DEFAULT 'draft',
  is_published boolean DEFAULT false,

  -- Review workflow
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_notes text,

  -- AI insights
  ai_insights text,

  -- Links
  playbook_metadata_id uuid REFERENCES playbook_metadata(id),

  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(org_id, name)  -- Play name unique within org
);

CREATE INDEX idx_plays_org ON plays(org_id);
CREATE INDEX idx_plays_team ON plays(team_id);
CREATE INDEX idx_plays_content_status ON plays(org_id, content_status);

-- Play assignments (position-specific instructions for executing a play)
CREATE TABLE public.play_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id uuid NOT NULL REFERENCES plays(id) ON DELETE CASCADE,

  -- Position this assignment is for
  position skill_position NOT NULL,

  -- Assignment details
  alignment text NOT NULL,
  landmark text NOT NULL,
  assignment text NOT NULL,
  key_read text NOT NULL,

  -- Route details (for receivers/backs)
  route_id character varying,
  route_depth integer,

  -- Coverage adjustments
  coverage_adjustments jsonb DEFAULT '{"vs_man": "", "vs_zone": "", "vs_blitz": ""}'::jsonb,

  -- Categorization
  category assignment_category DEFAULT 'general',

  -- Visibility control (which positions can see this)
  visible_to_positions jsonb DEFAULT '[]' CHECK (jsonb_typeof(visible_to_positions) = 'array'),

  -- Metadata
  source_metadata_ids text[] DEFAULT '{}',
  display_order integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_play_assignments_play ON play_assignments(play_id);
CREATE INDEX idx_play_assignments_position ON play_assignments(play_id, position);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- QUIZ & LEARNING SYSTEM (Org-scoped)
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Flashcard templates (org-scoped quiz questions)
CREATE TABLE public.flashcard_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  play_id uuid NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES play_assignments(id) ON DELETE SET NULL,

  -- Target audience
  position skill_position NOT NULL,  -- Which position is this for

  -- Card details
  category flashcard_category NOT NULL,
  card_type varchar DEFAULT 'assignment' CHECK (card_type IN ('assignment', 'knowledge')),

  -- Question content
  question_prompt text NOT NULL,
  correct_answer text NOT NULL,
  hints jsonb DEFAULT '[]',
  explanation text,

  -- Difficulty
  difficulty varchar DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),

  -- Metadata
  is_auto_generated boolean DEFAULT true,
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_flashcard_templates_org ON flashcard_templates(org_id);
CREATE INDEX idx_flashcard_templates_play ON flashcard_templates(play_id);
CREATE INDEX idx_flashcard_templates_position ON flashcard_templates(org_id, position);

-- Quiz assignments (coaches assign quizzes to players)
CREATE TABLE public.quiz_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,

  -- Assignment details
  title varchar NOT NULL,
  description text,

  -- Target audience (one of these will be set)
  assigned_to_user_id uuid REFERENCES users(id) ON DELETE CASCADE,  -- Specific player
  assigned_to_position skill_position,  -- All players at this position
  assigned_to_segment_id uuid REFERENCES team_segments(id) ON DELETE CASCADE,  -- All in segment
  assigned_to_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,  -- All in team

  -- Timing
  due_date timestamptz,
  available_from timestamptz DEFAULT now(),
  available_until timestamptz,

  -- Settings
  passing_score integer DEFAULT 80,  -- Percentage
  max_attempts integer,
  time_limit_seconds integer,
  randomize_questions boolean DEFAULT true,

  -- Status
  is_active boolean DEFAULT true,

  assigned_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT quiz_assignment_target_check CHECK (
    (assigned_to_user_id IS NOT NULL)::int +
    (assigned_to_position IS NOT NULL)::int +
    (assigned_to_segment_id IS NOT NULL)::int +
    (assigned_to_team_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX idx_quiz_assignments_org ON quiz_assignments(org_id);
CREATE INDEX idx_quiz_assignments_user ON quiz_assignments(assigned_to_user_id);
CREATE INDEX idx_quiz_assignments_team ON quiz_assignments(team_id);

-- Quiz assignment questions (which flashcards are in this quiz)
CREATE TABLE public.quiz_assignment_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_assignment_id uuid NOT NULL REFERENCES quiz_assignments(id) ON DELETE CASCADE,
  flashcard_id uuid NOT NULL REFERENCES flashcard_templates(id) ON DELETE CASCADE,

  display_order integer DEFAULT 0,
  points integer DEFAULT 1,

  created_at timestamptz DEFAULT now(),

  UNIQUE(quiz_assignment_id, flashcard_id)
);

-- Quiz attempts (player takes a quiz)
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_assignment_id uuid NOT NULL REFERENCES quiz_assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Attempt details
  attempt_number integer NOT NULL DEFAULT 1,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,

  -- Results
  total_questions integer NOT NULL,
  correct_answers integer DEFAULT 0,
  score_percentage numeric(5,2),
  passed boolean,

  -- Timing
  time_taken_seconds integer,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quiz_attempts_assignment ON quiz_attempts(quiz_assignment_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Quiz attempt answers (individual question responses)
CREATE TABLE public.quiz_attempt_answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_attempt_id uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  flashcard_id uuid NOT NULL REFERENCES flashcard_templates(id) ON DELETE CASCADE,

  -- Answer details
  question_number integer NOT NULL,
  user_answer text,
  is_correct boolean NOT NULL,

  -- Timing
  response_time_ms integer NOT NULL,
  answered_at timestamptz DEFAULT now(),

  UNIQUE(quiz_attempt_id, flashcard_id)
);

-- Player flashcard progress (spaced repetition tracking)
CREATE TABLE public.player_flashcard_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id uuid NOT NULL REFERENCES flashcard_templates(id) ON DELETE CASCADE,

  -- Spaced repetition algorithm
  ease_factor numeric(3,2) DEFAULT 2.5,
  interval_days integer DEFAULT 1,
  due_date date DEFAULT CURRENT_DATE,

  -- Statistics
  times_shown integer DEFAULT 0,
  times_correct integer DEFAULT 0,

  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, flashcard_id)
);

CREATE INDEX idx_player_flashcard_progress_user ON player_flashcard_progress(user_id);
CREATE INDEX idx_player_flashcard_progress_due ON player_flashcard_progress(user_id, due_date);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- GAMIFICATION & XP (Org-scoped)
-- ───────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,

  event_type varchar NOT NULL,
  xp_amount integer NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',

  -- Context
  quiz_attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_xp_events_user ON xp_events(user_id);
CREATE INDEX idx_xp_events_org ON xp_events(org_id);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- REFERENCE TABLES (Global, not org-specific)
-- ───────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.personnel_groupings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  running_backs integer NOT NULL DEFAULT 1,
  tight_ends integer NOT NULL DEFAULT 1,
  wide_receivers integer NOT NULL DEFAULT 3,
  fullbacks integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS FOR RLS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Check if current user is member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_memberships om
    JOIN users u ON om.user_id = u.id
    WHERE om.org_id = check_org_id
      AND u.auth_id = auth.uid()
      AND om.is_active = true
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get current user's role in organization
CREATE OR REPLACE FUNCTION public.get_user_org_role(check_org_id UUID)
RETURNS TEXT AS $$
  SELECT om.role::text FROM org_memberships om
  JOIN users u ON om.user_id = u.id
  WHERE om.org_id = check_org_id
    AND u.auth_id = auth.uid()
    AND om.is_active = true
  LIMIT 1
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user has specific role in org (admin, coach, or player)
CREATE OR REPLACE FUNCTION public.has_org_role(check_org_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_memberships om
    JOIN users u ON om.user_id = u.id
    WHERE om.org_id = check_org_id
      AND u.auth_id = auth.uid()
      AND om.role::text = required_role
      AND om.is_active = true
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is admin or coach in org
CREATE OR REPLACE FUNCTION public.is_org_staff(check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_memberships om
    JOIN users u ON om.user_id = u.id
    WHERE om.org_id = check_org_id
      AND u.auth_id = auth.uid()
      AND om.role::text IN ('admin', 'coach')
      AND om.is_active = true
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY POLICIES
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Users (can read own profile)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Organizations (members can view)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org" ON organizations
  FOR SELECT USING (public.is_org_member(id));

CREATE POLICY "Org admins can update org" ON organizations
  FOR UPDATE USING (public.has_org_role(id, 'admin'));

-- Org memberships
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view memberships" ON org_memberships
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Org admins and coaches can manage memberships" ON org_memberships
  FOR ALL USING (public.is_org_staff(org_id));

-- Teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view teams" ON teams
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Org staff can manage teams" ON teams
  FOR ALL USING (public.is_org_staff(org_id));

-- Plays (org-scoped)
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view plays" ON plays
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Org staff can manage plays" ON plays
  FOR ALL USING (public.is_org_staff(org_id));

-- Flashcard templates (org-scoped)
ALTER TABLE flashcard_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view flashcards" ON flashcard_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plays p
      WHERE p.id = flashcard_templates.play_id
        AND public.is_org_member(p.org_id)
    )
  );

CREATE POLICY "Org staff can manage flashcards" ON flashcard_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM plays p
      WHERE p.id = flashcard_templates.play_id
        AND public.is_org_staff(p.org_id)
    )
  );

-- Quiz assignments
ALTER TABLE quiz_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view quiz assignments" ON quiz_assignments
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Org staff can manage quiz assignments" ON quiz_assignments
  FOR ALL USING (public.is_org_staff(org_id));

-- Quiz attempts (users can view own attempts, coaches can view all)
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = quiz_attempts.user_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can view all quiz attempts" ON quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_assignments qa
      WHERE qa.id = quiz_attempts.quiz_assignment_id
        AND public.is_org_staff(qa.org_id)
    )
  );

CREATE POLICY "Users can create own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = quiz_attempts.user_id AND u.auth_id = auth.uid()
    )
  );

-- XP events
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own XP events" ON xp_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = xp_events.user_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can view org XP events" ON xp_events
  FOR SELECT USING (public.is_org_staff(org_id));
