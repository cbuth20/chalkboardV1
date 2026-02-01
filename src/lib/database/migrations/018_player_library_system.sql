-- =====================================================================
-- Migration 018: Player Library System
--
-- Creates player-owned versions of the playbook tables to enable
-- personal learning libraries separate from coach-managed team content.
--
-- Key Differences from Coach Playbook:
-- - user_id (owner) instead of team_id
-- - org_id for data isolation
-- - is_private flag for future sharing features
-- - RLS enforces strict user ownership (coaches have NO access)
-- =====================================================================

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 1: PLAYER PLAYBOOK METADATA
-- Stores metadata for files uploaded by players to their personal library
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_playbook_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership: user_id (individual player) + org_id (isolation)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- File storage
  file_paths TEXT[] NOT NULL,

  -- Classification (mirrors playbook_metadata)
  side_of_ball VARCHAR(20),
  content_type TEXT,
  position_relevance TEXT[] DEFAULT ARRAY['all'],
  level VARCHAR(20),
  formation_name VARCHAR(100),
  concept_name VARCHAR(100),
  custom_notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  play_type TEXT,

  -- v1 Classification fields
  unit unit_type,
  playbook_section TEXT,
  primary_classification TEXT,
  situation TEXT,

  -- Privacy control (for future sharing features)
  is_private BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_player_playbook_metadata_user_id ON player_playbook_metadata(user_id);
CREATE INDEX idx_player_playbook_metadata_org_id ON player_playbook_metadata(org_id);
CREATE INDEX idx_player_playbook_metadata_unit ON player_playbook_metadata(unit);
CREATE INDEX idx_player_playbook_metadata_created_at ON player_playbook_metadata(created_at DESC);

COMMENT ON TABLE player_playbook_metadata IS 'Player-owned playbook metadata for uploaded files in personal learning library';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 2: PLAYER PLAYS
-- Player-created and owned plays (mirrors core plays table)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership: user_id (individual player) + org_id (isolation)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Reference to uploaded file metadata (if created from upload)
  player_playbook_metadata_id UUID REFERENCES player_playbook_metadata(id) ON DELETE SET NULL,

  -- If this play was derived from a library or team play, reference it
  source_play_id UUID REFERENCES plays(id) ON DELETE SET NULL,

  -- Identity
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50),

  -- Classification
  play_type play_type NOT NULL DEFAULT 'PASS',
  concept VARCHAR(100),

  -- Personnel
  personnel_id UUID REFERENCES personnel_groupings(id),
  personnel_code VARCHAR(10),

  -- Formation reference
  formation_id VARCHAR(50),
  formation_name VARCHAR(100),

  -- Diagram (if using PlayBuilder)
  diagram_type VARCHAR(20) DEFAULT 'pass',
  diagram_data JSONB,

  -- Rich content
  coaching_points JSONB DEFAULT '[]',
  ai_insights JSONB,

  -- Content processing status
  content_status VARCHAR(30) DEFAULT 'draft',
  content_type content_type DEFAULT 'play',

  -- Status (no publish workflow - auto-approved)
  is_archived BOOLEAN DEFAULT FALSE,

  -- v1 Classification fields
  unit unit_type,
  playbook_section TEXT,
  primary_classification TEXT,
  situation TEXT,

  -- Privacy control
  is_private BOOLEAN DEFAULT TRUE,

  -- Versioning
  version INT DEFAULT 1,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_player_plays_user_id ON player_plays(user_id);
CREATE INDEX idx_player_plays_org_id ON player_plays(org_id);
CREATE INDEX idx_player_plays_play_type ON player_plays(play_type);
CREATE INDEX idx_player_plays_concept ON player_plays(concept);
CREATE INDEX idx_player_plays_metadata_id ON player_plays(player_playbook_metadata_id);
CREATE INDEX idx_player_plays_content_status ON player_plays(content_status);
CREATE INDEX idx_player_plays_unit ON player_plays(unit);
CREATE INDEX idx_player_plays_created_at ON player_plays(created_at DESC);

COMMENT ON TABLE player_plays IS 'Player-owned plays in personal learning library';

-- Add check constraint for content_status
ALTER TABLE player_plays
  ADD CONSTRAINT chk_player_plays_content_status
  CHECK (content_status IN ('draft', 'pending_review', 'approved', 'rejected', 'generating'));


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 3: PLAYER PLAY ASSIGNMENTS
-- Position-specific assignments for player plays
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_play_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_play_id UUID NOT NULL REFERENCES player_plays(id) ON DELETE CASCADE,

  -- Position
  position skill_position NOT NULL,

  -- Core assignment fields (all quizzable)
  alignment TEXT NOT NULL,
  split_depth TEXT,
  landmark TEXT NOT NULL,
  first_step TEXT,
  assignment TEXT NOT NULL,

  -- Read progression (for QB, receivers)
  read_progression JSONB DEFAULT '[]',

  -- Run-specific (for RB)
  run_track TEXT,
  blocking_assignment TEXT,

  -- Route info (for pass plays)
  route_id VARCHAR(50),
  route_depth INT,
  route_landmarks TEXT,

  -- Key read
  key_read TEXT NOT NULL,

  -- Coverage adjustments
  coverage_adjustments JSONB DEFAULT '{
    "vs_man": "",
    "vs_zone": "",
    "vs_cover_2": "",
    "vs_cover_3": "",
    "vs_cover_4": "",
    "vs_blitz": "",
    "vs_fire_zone": ""
  }',

  -- Motion (if applicable)
  motion JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(player_play_id, position)
);

CREATE INDEX idx_player_play_assignments_play_id ON player_play_assignments(player_play_id);
CREATE INDEX idx_player_play_assignments_position ON player_play_assignments(player_play_id, position);

COMMENT ON TABLE player_play_assignments IS 'Position-specific assignments for player-owned plays';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 4: PLAYER FLASHCARD TEMPLATES
-- Generated flashcards for player plays
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_flashcard_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_play_id UUID NOT NULL REFERENCES player_plays(id) ON DELETE CASCADE,

  -- Optionally linked to a specific assignment
  player_assignment_id UUID REFERENCES player_play_assignments(id) ON DELETE CASCADE,

  -- Position targeting
  position skill_position NOT NULL,

  -- Category
  category flashcard_category NOT NULL,

  -- Content
  question_prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  hints JSONB DEFAULT '[]',
  explanation TEXT,

  -- Difficulty
  difficulty VARCHAR(20) DEFAULT 'intermediate',

  -- Whether auto-generated or player-created
  is_auto_generated BOOLEAN DEFAULT TRUE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_flashcard_templates_play_id ON player_flashcard_templates(player_play_id);
CREATE INDEX idx_player_flashcard_templates_position ON player_flashcard_templates(position);
CREATE INDEX idx_player_flashcard_templates_category ON player_flashcard_templates(category);
CREATE INDEX idx_player_flashcard_templates_assignment_id ON player_flashcard_templates(player_assignment_id);

COMMENT ON TABLE player_flashcard_templates IS 'Flashcard templates for player-owned plays';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 5: ROW-LEVEL SECURITY POLICIES
-- Enforce strict user ownership - only player can access their content
-- Coaches have NO access to player libraries (completely private)
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on all player library tables
ALTER TABLE player_playbook_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_play_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_flashcard_templates ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────
-- Player Playbook Metadata Policies
-- ─────────────────────────────────────────────────────────────────────

CREATE POLICY "Players can view own playbook metadata" ON player_playbook_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_playbook_metadata.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert own playbook metadata" ON player_playbook_metadata
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_playbook_metadata.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can update own playbook metadata" ON player_playbook_metadata
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_playbook_metadata.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can delete own playbook metadata" ON player_playbook_metadata
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_playbook_metadata.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- Player Plays Policies
-- ─────────────────────────────────────────────────────────────────────

CREATE POLICY "Players can view own plays" ON player_plays
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_plays.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert own plays" ON player_plays
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_plays.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can update own plays" ON player_plays
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_plays.user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can delete own plays" ON player_plays
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_plays.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- Player Play Assignments Policies
-- (Access through parent player_plays ownership)
-- ─────────────────────────────────────────────────────────────────────

CREATE POLICY "Players can view own play assignments" ON player_play_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_play_assignments.player_play_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert own play assignments" ON player_play_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_play_assignments.player_play_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can update own play assignments" ON player_play_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_play_assignments.player_play_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can delete own play assignments" ON player_play_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_play_assignments.player_play_id
        AND u.auth_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- Player Flashcard Templates Policies
-- (Access through parent player_plays ownership)
-- ─────────────────────────────────────────────────────────────────────

CREATE POLICY "Players can view own flashcard templates" ON player_flashcard_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_flashcard_templates.player_play_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert own flashcard templates" ON player_flashcard_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_flashcard_templates.player_play_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can update own flashcard templates" ON player_flashcard_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_flashcard_templates.player_play_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Players can delete own flashcard templates" ON player_flashcard_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_flashcard_templates.player_play_id
        AND u.auth_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 6: TRIGGERS FOR UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════

-- Reuse existing update_playbook_updated_at function from migration 003

CREATE TRIGGER update_player_playbook_metadata_updated_at
  BEFORE UPDATE ON player_playbook_metadata
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_player_plays_updated_at
  BEFORE UPDATE ON player_plays
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_player_play_assignments_updated_at
  BEFORE UPDATE ON player_play_assignments
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_player_flashcard_templates_updated_at
  BEFORE UPDATE ON player_flashcard_templates
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();


-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON SCHEMA public IS 'Migration 018: Player Library System - Personal learning libraries for players';
