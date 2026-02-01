-- ═══════════════════════════════════════════════════════════════════════════
-- ACTIVITY-BASED LEARNING SYSTEM
-- Replaces flashcard quiz system with engaging activity-based learning
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 1: Create activity_type enum
-- ───────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'quick_quiz',        -- Multiple choice questions
    'true_false',        -- True/false challenge
    'scenario',          -- Scenario-based decisions
    'coverage_id',       -- Coverage recognition
    'route_id',          -- Route identification
    'mixed'              -- Mix of all types
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 2: Create activities table (coach creates these)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

  -- Activity details
  activity_type activity_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Content: which plays and questions to include
  play_ids UUID[] NOT NULL DEFAULT '{}', -- Array of play IDs included in this activity
  question_filters JSONB DEFAULT '{}', -- {difficulty: ['intermediate', 'advanced'], topics: ['coverage_recognition'], positions: ['QB', 'WR']}

  -- Settings
  time_limit_seconds INTEGER, -- NULL = no time limit
  passing_score_percent INTEGER DEFAULT 80,
  question_count INTEGER, -- NULL = use all matching questions
  show_explanations BOOLEAN DEFAULT true,
  allow_retakes BOOLEAN DEFAULT true,
  randomize_questions BOOLEAN DEFAULT true,
  randomize_options BOOLEAN DEFAULT true,

  -- Assignment: who should complete this activity
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to JSONB NOT NULL DEFAULT '{"type": "team", "values": []}',
  -- Examples:
  -- {type: 'positions', values: ['QB', 'WR']}
  -- {type: 'users', values: [uuid1, uuid2]}
  -- {type: 'team', values: []} (all team members)

  due_date TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- draft, active, completed, archived
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_passing_score CHECK (passing_score_percent >= 0 AND passing_score_percent <= 100),
  CONSTRAINT valid_question_count CHECK (question_count IS NULL OR question_count > 0)
);

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 3: Create activity_attempts table (player attempts)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Attempt details
  attempt_number INTEGER DEFAULT 1, -- 1st attempt, 2nd attempt, etc.
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,

  -- Results
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  score_percent DECIMAL(5,2),
  passed BOOLEAN,

  -- Question-level results
  question_results JSONB DEFAULT '[]',
  -- [{question_id: uuid, flashcard_id: uuid, correct: true, time_spent: 12, answer_given: 'Cover 2', correct_answer: 'Cover 2'}]

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_score_percent CHECK (score_percent >= 0 AND score_percent <= 100),
  CONSTRAINT valid_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions)
);

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 4: Create indexes for performance
-- ───────────────────────────────────────────────────────────────────────────

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_org_id ON activities(org_id);
CREATE INDEX IF NOT EXISTS idx_activities_team_id ON activities(team_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);

-- Activity attempts indexes
CREATE INDEX IF NOT EXISTS idx_activity_attempts_activity_id ON activity_attempts(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_user_id ON activity_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_org_id ON activity_attempts(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_completed_at ON activity_attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_user_activity ON activity_attempts(user_id, activity_id);

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 5: Add helpful views
-- ───────────────────────────────────────────────────────────────────────────

-- View for coaches to see activity statistics
CREATE OR REPLACE VIEW activity_stats AS
SELECT
  a.id AS activity_id,
  a.title,
  a.activity_type,
  a.org_id,
  a.team_id,
  a.due_date,
  a.status,
  COUNT(DISTINCT aa.user_id) AS total_assigned_users,
  COUNT(DISTINCT CASE WHEN aa.completed_at IS NOT NULL THEN aa.user_id END) AS completed_users,
  ROUND(AVG(aa.score_percent), 2) AS avg_score,
  ROUND(AVG(aa.time_spent_seconds), 0) AS avg_time_seconds,
  COUNT(DISTINCT aa.id) AS total_attempts
FROM activities a
LEFT JOIN activity_attempts aa ON a.id = aa.activity_id
GROUP BY a.id, a.title, a.activity_type, a.org_id, a.team_id, a.due_date, a.status;

-- View for players to see their activity progress
CREATE OR REPLACE VIEW player_activity_progress AS
SELECT
  aa.user_id,
  a.id AS activity_id,
  a.title,
  a.activity_type,
  a.description,
  a.due_date,
  a.passing_score_percent,
  a.allow_retakes,
  COUNT(aa.id) AS attempts_taken,
  MAX(aa.score_percent) AS best_score,
  MAX(aa.completed_at) AS last_completed_at,
  BOOL_OR(aa.passed) AS ever_passed,
  MAX(aa.attempt_number) AS latest_attempt_number
FROM activities a
LEFT JOIN activity_attempts aa ON a.id = aa.activity_id
WHERE a.is_active = true AND a.status = 'active'
GROUP BY aa.user_id, a.id, a.title, a.activity_type, a.description, a.due_date, a.passing_score_percent, a.allow_retakes;

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 6: Add comments for documentation
-- ───────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE activities IS 'Coach-created learning activities (quizzes, challenges, etc.)';
COMMENT ON TABLE activity_attempts IS 'Player attempts at completing activities';
COMMENT ON TYPE activity_type IS 'Types of learning activities: quick_quiz, true_false, scenario, coverage_id, route_id, mixed';

COMMENT ON COLUMN activities.play_ids IS 'Array of play UUIDs - questions will be pulled from these plays';
COMMENT ON COLUMN activities.question_filters IS 'JSONB filters for selecting questions: {difficulty: [string], topics: [string], positions: [string]}';
COMMENT ON COLUMN activities.assigned_to IS 'JSONB assignment config: {type: "positions|users|team", values: [string]}';
COMMENT ON COLUMN activity_attempts.question_results IS 'Array of question results: [{question_id, flashcard_id, correct, time_spent, answer_given, correct_answer}]';

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════

-- Summary:
-- ✓ activity_type enum created (6 types)
-- ✓ activities table created (coach creates these)
-- ✓ activity_attempts table created (player attempts)
-- ✓ Indexes created for performance
-- ✓ Views created for analytics (activity_stats, player_activity_progress)
-- ✓ Comments added for documentation

SELECT '✅ Activity system migration complete!' AS status;
