-- =====================================================================
-- Migration 022: Formations Trainer System
--
-- Creates tables for the formations trainer game type:
-- - player_formations: Extracted formations from PDF analysis
-- - player_formation_quizzes: Quiz sessions
-- - player_formation_attempts: Individual question attempts
--
-- Positions supported: QB, RB, WR, OT
-- Modules: 2x2, Trips, Quads, Ranger, Zombie, Empty, Special
-- =====================================================================

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 1: PLAYER FORMATIONS TABLE
-- Stores formations extracted from PDF analysis
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_formations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Formation details
  formation_name VARCHAR(100) NOT NULL,
  personnel VARCHAR(50), -- "POSSE (3WR, 1TB, 1TE)", "RANGER (4WR, 1TB)"
  description TEXT,
  module VARCHAR(50), -- "posse_2x2", "posse_trips", "quads", "ranger", "zombie", "empty", "special"

  -- Field diagram data (positions on 100x50 coordinate system)
  -- Example: {"Q": {"x": 50, "y": 85}, "T": {"x": 50, "y": 75}, "X": {"x": 15, "y": 70}}
  positions JSONB NOT NULL,

  -- Coaching notes by position
  -- Example: {"QB": "Check protection, read safety", "RB": "Watch for blitz", "WR": "Run vertical routes"}
  coaching_notes JSONB DEFAULT '{}',

  -- Source tracking
  source_pdf_ids UUID[], -- Which uploaded PDFs this formation came from
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_player_formations_user_id ON player_formations(user_id);
CREATE INDEX idx_player_formations_org_id ON player_formations(org_id);
CREATE INDEX idx_player_formations_module ON player_formations(module);
CREATE INDEX idx_player_formations_formation_name ON player_formations(formation_name);

COMMENT ON TABLE player_formations IS 'Formations extracted from player PDF analysis for formations trainer';

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 2: PLAYER FORMATION QUIZZES TABLE
-- Stores quiz sessions for formations trainer
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_formation_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Quiz configuration
  module VARCHAR(50), -- "posse_2x2", "mixed" (all modules)
  quiz_type VARCHAR(20) DEFAULT 'test', -- "learn", "test"
  position_filter skill_position, -- Optional: filter questions by position

  -- Progress tracking
  total_questions INT DEFAULT 10,
  correct_count INT DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_player_formation_quizzes_user_id ON player_formation_quizzes(user_id);
CREATE INDEX idx_player_formation_quizzes_completed ON player_formation_quizzes(completed_at);

COMMENT ON TABLE player_formation_quizzes IS 'Quiz sessions for formations trainer game';

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 3: PLAYER FORMATION ATTEMPTS TABLE
-- Individual question attempts within quizzes
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_formation_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  quiz_id UUID NOT NULL REFERENCES player_formation_quizzes(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES player_formations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Question details
  question_type VARCHAR(20) NOT NULL, -- "identify", "position"
  question_text TEXT NOT NULL,
  target_position VARCHAR(10), -- For "position" type questions: "X", "Y", "Z", "T", "Q"

  -- Answer tracking
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT, -- Time taken to answer in milliseconds

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_player_formation_attempts_quiz_id ON player_formation_attempts(quiz_id);
CREATE INDEX idx_player_formation_attempts_user_id ON player_formation_attempts(user_id);
CREATE INDEX idx_player_formation_attempts_formation_id ON player_formation_attempts(formation_id);
CREATE INDEX idx_player_formation_attempts_is_correct ON player_formation_attempts(is_correct);

COMMENT ON TABLE player_formation_attempts IS 'Individual question attempts in formations trainer quizzes';

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 4: PLAYBOOK ANALYSIS TRACKING
-- Track when playbooks were last analyzed to avoid unnecessary re-analysis
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_playbook_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Analysis details
  pdf_count INT NOT NULL, -- How many PDFs were analyzed
  formations_extracted INT DEFAULT 0, -- How many formations were found

  -- Cost tracking
  estimated_tokens INT, -- Approximate tokens used
  processing_time_seconds INT, -- How long it took

  -- Status
  status VARCHAR(20) DEFAULT 'processing', -- "processing", "completed", "failed"
  error_message TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_player_playbook_analysis_user_id ON player_playbook_analysis(user_id);
CREATE INDEX idx_player_playbook_analysis_status ON player_playbook_analysis(status);

COMMENT ON TABLE player_playbook_analysis IS 'Tracks playbook analysis runs for cost monitoring';

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 5: ROW-LEVEL SECURITY POLICIES
-- Ensure users can only access their own formations and quizzes
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE player_formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_formation_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_formation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_playbook_analysis ENABLE ROW LEVEL SECURITY;

-- Player Formations Policies
CREATE POLICY "Users can view own formations" ON player_formations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_formations.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own formations" ON player_formations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_formations.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own formations" ON player_formations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_formations.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own formations" ON player_formations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_formations.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Player Formation Quizzes Policies
CREATE POLICY "Users can view own quizzes" ON player_formation_quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_formation_quizzes.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own quizzes" ON player_formation_quizzes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_formation_quizzes.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own quizzes" ON player_formation_quizzes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_formation_quizzes.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Player Formation Attempts Policies
CREATE POLICY "Users can view own attempts" ON player_formation_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_formation_attempts.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own attempts" ON player_formation_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_formation_attempts.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Player Playbook Analysis Policies
CREATE POLICY "Users can view own analysis" ON player_playbook_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_playbook_analysis.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own analysis" ON player_playbook_analysis
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_playbook_analysis.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 6: TRIGGERS FOR UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER update_player_formations_updated_at
  BEFORE UPDATE ON player_formations
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON SCHEMA public IS 'Migration 022: Formations Trainer System - Formation recognition and position quiz game';
