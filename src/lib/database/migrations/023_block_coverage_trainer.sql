-- Block Coverage Trainer System
-- Creates tables for defensive coverage blocking drills

-- Store defensive coverages for blocking drills
CREATE TABLE IF NOT EXISTS player_block_coverages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Coverage details
  coverage_name VARCHAR(100) NOT NULL,        -- "Cover 2 Shell", "6-man box"
  coverage_type VARCHAR(50),                  -- "zone", "man", "blitz"
  down_distance VARCHAR(50),                  -- "1st & 10", "3rd & short"

  -- Defensive positions (coordinate system: x: 0-100, y: 0-60)
  defensive_positions JSONB NOT NULL,         -- {"Mike": {x: 50, y: 38, type: "LB"}, ...}

  -- Offensive formation context
  offensive_formation VARCHAR(100),           -- "POSSE 2x2", "Spread"
  rb_position JSONB NOT NULL,                 -- {x: 45, y: 42} - RB starting position

  -- Blocking assignment
  correct_block_target VARCHAR(50),           -- "Mike", "Will", "RELEASE"
  blocking_rules TEXT,                        -- "Block the first linebacker to your side"
  coaching_notes TEXT,                        -- Additional context

  -- Source tracking
  source_pdf_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Block coverage quizzes
CREATE TABLE IF NOT EXISTS player_block_coverage_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),

  position_filter VARCHAR(10),                -- "RB" (can expand later)
  coverage_type_filter VARCHAR(50),           -- Optional: "zone", "man", "blitz"

  total_questions INT NOT NULL,
  correct_count INT DEFAULT 0,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Block coverage attempts
CREATE TABLE IF NOT EXISTS player_block_coverage_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES player_block_coverage_quizzes(id) ON DELETE CASCADE,
  coverage_id UUID NOT NULL REFERENCES player_block_coverages(id),
  user_id UUID NOT NULL REFERENCES users(id),

  user_answer VARCHAR(50) NOT NULL,           -- "Mike", "Will", "RELEASE"
  correct_answer VARCHAR(50) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_block_coverages_user ON player_block_coverages(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_block_coverage_quizzes_user ON player_block_coverage_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_block_coverage_attempts_quiz ON player_block_coverage_attempts(quiz_id);

-- RLS Policies
ALTER TABLE player_block_coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_block_coverage_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_block_coverage_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own block coverages" ON player_block_coverages;
DROP POLICY IF EXISTS "Users can insert own block coverages" ON player_block_coverages;
DROP POLICY IF EXISTS "Users can view own block coverage quizzes" ON player_block_coverage_quizzes;
DROP POLICY IF EXISTS "Users can insert own block coverage quizzes" ON player_block_coverage_quizzes;
DROP POLICY IF EXISTS "Users can update own block coverage quizzes" ON player_block_coverage_quizzes;
DROP POLICY IF EXISTS "Users can view own block coverage attempts" ON player_block_coverage_attempts;
DROP POLICY IF EXISTS "Users can insert own block coverage attempts" ON player_block_coverage_attempts;

-- Create policies
CREATE POLICY "Users can view own block coverages"
  ON player_block_coverages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own block coverages"
  ON player_block_coverages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own block coverage quizzes"
  ON player_block_coverage_quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own block coverage quizzes"
  ON player_block_coverage_quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own block coverage quizzes"
  ON player_block_coverage_quizzes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own block coverage attempts"
  ON player_block_coverage_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own block coverage attempts"
  ON player_block_coverage_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
