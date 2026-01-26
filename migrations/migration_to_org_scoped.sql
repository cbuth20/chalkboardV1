-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Transition to Organization-Scoped Multi-Tenancy
--
-- This migration refactors the schema to use organizations as the primary tenant
-- and introduces proper role-based access control.
--
-- IMPORTANT: Run this migration in a transaction and test thoroughly before production!
-- ═══════════════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 1: Add org_id columns to existing tables
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Add org_id to plays (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plays' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE plays ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add org_id to playbooks (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playbooks' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE playbooks ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add org_id to playbook_metadata (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playbook_metadata' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE playbook_metadata ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add org_id to flashcard_templates (if not exists)
-- Note: This will be populated via plays relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flashcard_templates' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE flashcard_templates ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add org_id to xp_events (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xp_events' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE xp_events ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add org_id to seasons (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seasons' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE seasons ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 2: Backfill org_id from team relationships
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Backfill plays.org_id from plays.team_id → teams.org_id
UPDATE plays
SET org_id = t.org_id
FROM teams t
WHERE plays.team_id = t.id
  AND plays.org_id IS NULL;

-- Backfill playbooks.org_id
UPDATE playbooks
SET org_id = t.org_id
FROM teams t
WHERE playbooks.team_id = t.id
  AND playbooks.org_id IS NULL;

-- Backfill playbook_metadata.org_id
UPDATE playbook_metadata
SET org_id = t.org_id
FROM teams t
WHERE playbook_metadata.team_id = t.id
  AND playbook_metadata.org_id IS NULL;

-- Backfill flashcard_templates.org_id via plays
UPDATE flashcard_templates
SET org_id = p.org_id
FROM plays p
WHERE flashcard_templates.play_id = p.id
  AND flashcard_templates.org_id IS NULL;

-- Backfill xp_events.org_id
UPDATE xp_events
SET org_id = t.org_id
FROM teams t
WHERE xp_events.team_id = t.id
  AND xp_events.org_id IS NULL;

-- Backfill seasons.org_id
UPDATE seasons
SET org_id = t.org_id
FROM teams t
WHERE seasons.team_id = t.id
  AND seasons.org_id IS NULL;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 3: Make org_id NOT NULL (after backfill)
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Note: Only uncomment after verifying backfill is complete
-- ALTER TABLE plays ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE playbooks ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE playbook_metadata ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE flashcard_templates ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE xp_events ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE seasons ALTER COLUMN org_id SET NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 4: Create new quiz system tables
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Quiz assignments (coaches assign quizzes to players)
CREATE TABLE IF NOT EXISTS quiz_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,

  -- Assignment details
  title varchar NOT NULL,
  description text,

  -- Target audience (one of these will be set)
  assigned_to_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  assigned_to_position skill_position,
  assigned_to_segment_id uuid REFERENCES team_segments(id) ON DELETE CASCADE,
  assigned_to_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,

  -- Timing
  due_date timestamptz,
  available_from timestamptz DEFAULT now(),
  available_until timestamptz,

  -- Settings
  passing_score integer DEFAULT 80,
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

CREATE INDEX IF NOT EXISTS idx_quiz_assignments_org ON quiz_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_quiz_assignments_user ON quiz_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_assignments_team ON quiz_assignments(team_id);

-- Quiz assignment questions (which flashcards are in this quiz)
CREATE TABLE IF NOT EXISTS quiz_assignment_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_assignment_id uuid NOT NULL REFERENCES quiz_assignments(id) ON DELETE CASCADE,
  flashcard_id uuid NOT NULL REFERENCES flashcard_templates(id) ON DELETE CASCADE,

  display_order integer DEFAULT 0,
  points integer DEFAULT 1,

  created_at timestamptz DEFAULT now(),

  UNIQUE(quiz_assignment_id, flashcard_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_assignment_questions_assignment ON quiz_assignment_questions(quiz_assignment_id);

-- Quiz attempts (player takes a quiz)
CREATE TABLE IF NOT EXISTS quiz_attempts (
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

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_assignment ON quiz_attempts(quiz_assignment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Quiz attempt answers (individual question responses)
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
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

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt ON quiz_attempt_answers(quiz_attempt_id);

-- Player flashcard progress (if not exists)
CREATE TABLE IF NOT EXISTS player_flashcard_progress (
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

CREATE INDEX IF NOT EXISTS idx_player_flashcard_progress_user ON player_flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_player_flashcard_progress_due ON player_flashcard_progress(user_id, due_date);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 5: Update org_memberships table
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Add org_xp column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_memberships' AND column_name = 'org_xp'
  ) THEN
    ALTER TABLE org_memberships ADD COLUMN org_xp integer DEFAULT 0;
  END IF;
END $$;

-- Add is_active column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_memberships' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE org_memberships ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add positions column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_memberships' AND column_name = 'positions'
  ) THEN
    ALTER TABLE org_memberships ADD COLUMN positions jsonb DEFAULT '[]' CHECK (jsonb_typeof(positions) = 'array');
  END IF;
END $$;

-- Migrate data from team_members to org_memberships if needed
-- This is a complex migration that depends on your specific data structure
-- You may need to customize this based on your needs

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 6: Create RLS helper functions
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

-- Check if user has specific role in org
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
-- STEP 7: Update RLS policies for org-scoped tables
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Org members can view plays" ON plays;
DROP POLICY IF EXISTS "Org staff can manage plays" ON plays;

-- Enable RLS on plays
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;

-- Create new org-scoped policies
CREATE POLICY "Org members can view plays" ON plays
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Org staff can manage plays" ON plays
  FOR ALL USING (public.is_org_staff(org_id));

-- Flashcard templates policies
DROP POLICY IF EXISTS "Org members can view flashcards" ON flashcard_templates;
DROP POLICY IF EXISTS "Org staff can manage flashcards" ON flashcard_templates;

ALTER TABLE flashcard_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view flashcards" ON flashcard_templates
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Org staff can manage flashcards" ON flashcard_templates
  FOR ALL USING (public.is_org_staff(org_id));

-- Quiz assignments policies
ALTER TABLE quiz_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view quiz assignments" ON quiz_assignments
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Org staff can manage quiz assignments" ON quiz_assignments
  FOR ALL USING (public.is_org_staff(org_id));

-- Quiz attempts policies
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

-- XP events policies
DROP POLICY IF EXISTS "Users can view own XP events" ON xp_events;
DROP POLICY IF EXISTS "Org staff can view org XP events" ON xp_events;

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

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 8: Add indexes for performance
-- ───────────────────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_plays_org ON plays(org_id);
CREATE INDEX IF NOT EXISTS idx_plays_org_status ON plays(org_id, content_status);
CREATE INDEX IF NOT EXISTS idx_playbooks_org ON playbooks(org_id);
CREATE INDEX IF NOT EXISTS idx_playbook_metadata_org ON playbook_metadata(org_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_templates_org ON flashcard_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_org ON xp_events(org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_user ON org_memberships(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_role ON org_memberships(org_id, role);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 9: Create views for common queries
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- View: Get quiz assignments for a specific user
CREATE OR REPLACE VIEW user_quiz_assignments AS
SELECT
  qa.*,
  om.user_id,
  om.position_code,
  om.team_id AS membership_team_id,
  om.segment_id AS membership_segment_id
FROM quiz_assignments qa
JOIN org_memberships om ON qa.org_id = om.org_id
WHERE qa.is_active = true
  AND (
    qa.assigned_to_user_id = om.user_id
    OR qa.assigned_to_position = om.position_code::skill_position
    OR qa.assigned_to_segment_id = om.segment_id
    OR qa.assigned_to_team_id = om.team_id
  )
  AND (qa.available_until IS NULL OR qa.available_until > NOW());

-- View: Quiz completion statistics per user
CREATE OR REPLACE VIEW user_quiz_stats AS
SELECT
  u.id AS user_id,
  qa.org_id,
  COUNT(DISTINCT qat.id) AS total_attempts,
  COUNT(DISTINCT CASE WHEN qat.passed = true THEN qat.id END) AS passed_attempts,
  AVG(qat.score_percentage) AS avg_score,
  MAX(qat.completed_at) AS last_quiz_completed
FROM users u
JOIN quiz_attempts qat ON u.id = qat.user_id
JOIN quiz_assignments qa ON qat.quiz_assignment_id = qa.id
WHERE qat.completed_at IS NOT NULL
GROUP BY u.id, qa.org_id;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION CHECKLIST
-- ═══════════════════════════════════════════════════════════════════════════════════════════
--
-- 1. Verify all org_id columns are populated:
--    SELECT COUNT(*) FROM plays WHERE org_id IS NULL;
--    SELECT COUNT(*) FROM playbooks WHERE org_id IS NULL;
--    SELECT COUNT(*) FROM playbook_metadata WHERE org_id IS NULL;
--    SELECT COUNT(*) FROM flashcard_templates WHERE org_id IS NULL;
--    SELECT COUNT(*) FROM xp_events WHERE org_id IS NULL;
--
-- 2. Verify RLS policies are working:
--    - Test as player: Can only see own quiz attempts
--    - Test as coach: Can see all org data
--    - Test as admin: Full access
--
-- 3. Test quiz assignment flow:
--    - Coach creates quiz assignment
--    - Player sees assignment
--    - Player completes quiz
--    - Coach sees results
--
-- 4. Update application code:
--    - Update queries to use org_id
--    - Add org context provider
--    - Implement role-based UI
--
-- 5. Consider making org_id NOT NULL after verification (commented out in STEP 3)
--
-- ═══════════════════════════════════════════════════════════════════════════════════════════
