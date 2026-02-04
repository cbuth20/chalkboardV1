-- =====================================================================
-- Migration 020: Player Games System
--
-- Creates infrastructure for player-created learning games from their
-- question bank, with position-specific filtering, difficulty levels,
-- and spaced repetition tracking.
--
-- Key Features:
-- - Enhanced flashcard templates with structured question types
-- - Player games (custom game configurations)
-- - Game attempts (session tracking and scoring)
-- - Robust tagging and filtering system
-- =====================================================================

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 1: EXTEND PLAYER_FLASHCARD_TEMPLATES TABLE
-- Add robust question structure and metadata fields
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE player_flashcard_templates
  -- Question structure
  ADD COLUMN IF NOT EXISTS question_type VARCHAR(30)
    CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'scenario', 'identification')),

  -- Topic (from QuestionTopic enum in question-generation-prompts.ts)
  ADD COLUMN IF NOT EXISTS topic TEXT,

  -- Multiple choice options (JSONB array of strings)
  ADD COLUMN IF NOT EXISTS options JSONB,

  -- Learning context
  ADD COLUMN IF NOT EXISTS scenario_context TEXT,
  ADD COLUMN IF NOT EXISTS learning_objective TEXT,

  -- Flexible tagging (inherits from play + AI-generated tags)
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',

  -- AI metadata for tracking generation details
  ADD COLUMN IF NOT EXISTS ai_generation_metadata JSONB DEFAULT '{}',

  -- Organization reference (for RLS)
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update existing rows to have org_id from parent play
UPDATE player_flashcard_templates pft
SET org_id = pp.org_id
FROM player_plays pp
WHERE pft.player_play_id = pp.id
  AND pft.org_id IS NULL;

-- Make org_id NOT NULL after backfill
ALTER TABLE player_flashcard_templates
  ALTER COLUMN org_id SET NOT NULL;

-- Indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_player_flashcard_templates_org_id
  ON player_flashcard_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_player_flashcard_templates_question_type
  ON player_flashcard_templates(question_type);
CREATE INDEX IF NOT EXISTS idx_player_flashcard_templates_topic
  ON player_flashcard_templates(topic);
CREATE INDEX IF NOT EXISTS idx_player_flashcard_templates_difficulty
  ON player_flashcard_templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_player_flashcard_templates_tags
  ON player_flashcard_templates USING GIN (tags);

COMMENT ON COLUMN player_flashcard_templates.question_type IS 'Type of question: multiple_choice, true_false, fill_blank, scenario, identification';
COMMENT ON COLUMN player_flashcard_templates.topic IS 'Specific topic from QuestionTopic enum (e.g., coverage_recognition, route_running)';
COMMENT ON COLUMN player_flashcard_templates.options IS 'For multiple choice: array of 4 options ["Option A", "Option B", ...]';
COMMENT ON COLUMN player_flashcard_templates.scenario_context IS 'Game situation context (e.g., "3rd & 6, red zone, vs Cover 2")';
COMMENT ON COLUMN player_flashcard_templates.learning_objective IS 'What this question teaches or reinforces';
COMMENT ON COLUMN player_flashcard_templates.tags IS 'Array of tags (inherited from play + AI-generated), e.g., ["3rd_down", "red_zone", "cover_2"]';
COMMENT ON COLUMN player_flashcard_templates.ai_generation_metadata IS 'Metadata about AI generation: model, timestamp, play concept, etc.';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 2: PLAYER_GAMES TABLE
-- Custom game configurations created by players
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Game identity
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'coverage_blitz', 'routes_concepts', 'situational', 'assignments'

  -- Question selection filters (JSONB)
  -- Format: {positions: ['QB', 'X'], topics: ['coverage_recognition'], difficulty: ['intermediate'], playIds: [...], tags: [...]}
  filters JSONB NOT NULL DEFAULT '{}',

  -- Game settings
  question_count INT DEFAULT 10 CHECK (question_count > 0 AND question_count <= 50),
  time_limit_seconds INT CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
  passing_score INT DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  selection_strategy VARCHAR(30) DEFAULT 'random' CHECK (selection_strategy IN ('random', 'difficulty_progression', 'spaced_repetition')),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Stats (updated from attempts)
  total_attempts INT DEFAULT 0 CHECK (total_attempts >= 0),
  best_score INT CHECK (best_score IS NULL OR (best_score >= 0 AND best_score <= 100)),
  last_played_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_player_games_user_id ON player_games(user_id);
CREATE INDEX idx_player_games_org_id ON player_games(org_id);
CREATE INDEX idx_player_games_category ON player_games(category);
CREATE INDEX idx_player_games_is_active ON player_games(is_active);
CREATE INDEX idx_player_games_filters ON player_games USING GIN (filters);

COMMENT ON TABLE player_games IS 'Custom game configurations created by players for their learning';
COMMENT ON COLUMN player_games.category IS 'Game category for organization (coverage_blitz, routes_concepts, situational, assignments)';
COMMENT ON COLUMN player_games.filters IS 'Question selection filters: positions, topics, difficulty, playIds, tags';
COMMENT ON COLUMN player_games.selection_strategy IS 'How to select questions: random, difficulty_progression, spaced_repetition';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 3: PLAYER_GAME_ATTEMPTS TABLE
-- Tracks individual game sessions and scores
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_game_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  game_id UUID REFERENCES player_games(id) ON DELETE SET NULL, -- NULL for ad-hoc games

  -- Session timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Scoring
  questions_asked INT NOT NULL CHECK (questions_asked > 0),
  questions_correct INT NOT NULL CHECK (questions_correct >= 0 AND questions_correct <= questions_asked),
  score_percentage INT NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),

  -- Question data (for review)
  question_ids UUID[] NOT NULL, -- Array of flashcard template IDs used
  responses JSONB, -- Array of {questionId, answer, correct, timeSpent}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_player_game_attempts_user_id ON player_game_attempts(user_id);
CREATE INDEX idx_player_game_attempts_org_id ON player_game_attempts(org_id);
CREATE INDEX idx_player_game_attempts_game_id ON player_game_attempts(game_id);
CREATE INDEX idx_player_game_attempts_completed_at ON player_game_attempts(completed_at DESC);
CREATE INDEX idx_player_game_attempts_score ON player_game_attempts(score_percentage DESC);

COMMENT ON TABLE player_game_attempts IS 'Individual game session attempts with scoring and question tracking';
COMMENT ON COLUMN player_game_attempts.question_ids IS 'Array of flashcard template IDs used in this attempt';
COMMENT ON COLUMN player_game_attempts.responses IS 'Detailed responses: [{questionId, answer, correct, timeSpent}, ...]';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 4: ROW-LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE player_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_attempts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────
-- Player Games Policies
-- ─────────────────────────────────────────────────────────────────────

CREATE POLICY "Players can view own games" ON player_games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_games.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert own games" ON player_games
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_games.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can update own games" ON player_games
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_games.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can delete own games" ON player_games
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_games.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- Player Game Attempts Policies
-- ─────────────────────────────────────────────────────────────────────

CREATE POLICY "Players can view own game attempts" ON player_game_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_game_attempts.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert own game attempts" ON player_game_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_game_attempts.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can update own game attempts" ON player_game_attempts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_game_attempts.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can delete own game attempts" ON player_game_attempts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_game_attempts.user_id
        AND u.auth_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 5: TRIGGERS FOR UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════

-- Reuse existing update_playbook_updated_at function from migration 003

CREATE TRIGGER update_player_games_updated_at
  BEFORE UPDATE ON player_games
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 6: UPDATE GAME STATS FUNCTION
-- Automatically update game stats when attempts are completed
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_player_game_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if attempt is for a saved game (not ad-hoc)
  IF NEW.game_id IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
    UPDATE player_games
    SET
      total_attempts = total_attempts + 1,
      best_score = GREATEST(COALESCE(best_score, 0), NEW.score_percentage),
      last_played_at = NEW.completed_at,
      updated_at = NOW()
    WHERE id = NEW.game_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_stats_on_attempt_complete
  AFTER INSERT OR UPDATE ON player_game_attempts
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION update_player_game_stats();

COMMENT ON FUNCTION update_player_game_stats() IS 'Updates game statistics when an attempt is completed';


-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON SCHEMA public IS 'Migration 020: Player Games System - Learning games with position-specific question filtering';
