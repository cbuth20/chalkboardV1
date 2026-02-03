-- =====================================================================
-- Migration 019: Structured Play Builder System
--
-- Transforms PlayBuilder from simple drawing tool to structured coaching
-- workflow with assignments, responsibilities, and situational context.
--
-- Key Features:
-- - Side of ball (offense/defense)
-- - Structured player assignments
-- - Player responsibilities with AI inclusion flags
-- - Situational tags for context
-- - Concept tags for organizing plays
-- - Formation library (system + custom)
-- - Validation and finalization workflow
-- =====================================================================

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 1: UPDATE PLAYER_PLAYS TABLE
-- Add new fields for structured play builder
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE player_plays
  -- Side of ball (offense/defense)
  ADD COLUMN IF NOT EXISTS side_of_ball TEXT CHECK (side_of_ball IN ('offense', 'defense')),

  -- Structured play type (different values for offense vs defense)
  ADD COLUMN IF NOT EXISTS structured_play_type TEXT,
  -- offense: run/pass/rpo/screen/play_action
  -- defense: coverage/pressure/run_fit/stunt/simulated_pressure

  -- Personnel grouping
  ADD COLUMN IF NOT EXISTS personnel TEXT,

  -- Primary folder/category for organization
  ADD COLUMN IF NOT EXISTS primary_folder TEXT,

  -- Defensive look (for offensive plays)
  ADD COLUMN IF NOT EXISTS defensive_look TEXT,

  -- Offensive look (for defensive plays)
  ADD COLUMN IF NOT EXISTS offensive_look TEXT,

  -- Install phase tracking
  ADD COLUMN IF NOT EXISTS install_phase TEXT,

  -- Finalization status
  ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT false,

  -- Structured assignments per player
  -- Format: {playerId: {type, routeType, direction, ...}}
  ADD COLUMN IF NOT EXISTS player_assignments JSONB DEFAULT '{}',

  -- Responsibilities per player
  -- Format: {playerId: {assignment, responsibility, coachingNotes, includeInAI}}
  ADD COLUMN IF NOT EXISTS player_responsibilities JSONB DEFAULT '{}',

  -- Visual data (routes, blocks, zones) - separates visual from structured data
  ADD COLUMN IF NOT EXISTS visual_data JSONB DEFAULT '{}',

  -- Validation warnings before finalization
  ADD COLUMN IF NOT EXISTS completion_warnings JSONB DEFAULT '[]';

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_player_plays_side_of_ball ON player_plays(side_of_ball);
CREATE INDEX IF NOT EXISTS idx_player_plays_structured_play_type ON player_plays(structured_play_type);
CREATE INDEX IF NOT EXISTS idx_player_plays_is_finalized ON player_plays(is_finalized);
CREATE INDEX IF NOT EXISTS idx_player_plays_personnel ON player_plays(personnel);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_player_plays_player_assignments ON player_plays USING GIN (player_assignments);
CREATE INDEX IF NOT EXISTS idx_player_plays_player_responsibilities ON player_plays USING GIN (player_responsibilities);
CREATE INDEX IF NOT EXISTS idx_player_plays_visual_data ON player_plays USING GIN (visual_data);

COMMENT ON COLUMN player_plays.side_of_ball IS 'Which side of the ball: offense or defense';
COMMENT ON COLUMN player_plays.structured_play_type IS 'Type of play: run/pass/rpo/screen/play_action OR coverage/pressure/run_fit/stunt/simulated_pressure';
COMMENT ON COLUMN player_plays.player_assignments IS 'Structured assignments per player (routes, blocks, coverage, etc.)';
COMMENT ON COLUMN player_plays.player_responsibilities IS 'Plain English responsibilities per player with AI inclusion flags';
COMMENT ON COLUMN player_plays.visual_data IS 'Visual elements: routes, blocks, zones, ball carrier paths';
COMMENT ON COLUMN player_plays.is_finalized IS 'Whether play has been validated and finalized';
COMMENT ON COLUMN player_plays.completion_warnings IS 'Validation warnings preventing finalization';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 2: SITUATIONAL TAGS
-- System-defined and custom tags for play situations
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS situational_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tag details
  name TEXT NOT NULL,
  category TEXT, -- 'down', 'field_position', 'game_situation', 'custom'
  side_of_ball TEXT CHECK (side_of_ball IN ('offense', 'defense', 'both')),

  -- System vs custom
  is_system_defined BOOLEAN DEFAULT true,

  -- Organization ownership (NULL for system tags)
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique names per org (or system-wide for system tags)
  UNIQUE NULLS NOT DISTINCT (name, org_id)
);

-- Junction table for play-tag relationships
CREATE TABLE IF NOT EXISTS player_play_situational_tags (
  player_play_id UUID REFERENCES player_plays(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES situational_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (player_play_id, tag_id)
);

-- Indexes
CREATE INDEX idx_situational_tags_org_id ON situational_tags(org_id);
CREATE INDEX idx_situational_tags_category ON situational_tags(category);
CREATE INDEX idx_situational_tags_side_of_ball ON situational_tags(side_of_ball);
CREATE INDEX idx_player_play_situational_tags_play_id ON player_play_situational_tags(player_play_id);
CREATE INDEX idx_player_play_situational_tags_tag_id ON player_play_situational_tags(tag_id);

COMMENT ON TABLE situational_tags IS 'System and custom tags for play situations (down, field position, game situation)';
COMMENT ON TABLE player_play_situational_tags IS 'Links player plays to situational tags';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 3: CONCEPT TAGS
-- Custom tags for organizing plays by concept
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS concept_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tag details
  name TEXT NOT NULL,
  description TEXT,
  side_of_ball TEXT CHECK (side_of_ball IN ('offense', 'defense', 'both')),

  -- Organization ownership
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique names per org
  UNIQUE (name, org_id)
);

-- Junction table for play-concept relationships
CREATE TABLE IF NOT EXISTS player_play_concept_tags (
  player_play_id UUID REFERENCES player_plays(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES concept_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (player_play_id, tag_id)
);

-- Indexes
CREATE INDEX idx_concept_tags_org_id ON concept_tags(org_id);
CREATE INDEX idx_concept_tags_side_of_ball ON concept_tags(side_of_ball);
CREATE INDEX idx_player_play_concept_tags_play_id ON player_play_concept_tags(player_play_id);
CREATE INDEX idx_player_play_concept_tags_tag_id ON player_play_concept_tags(tag_id);

COMMENT ON TABLE concept_tags IS 'Custom tags for organizing plays by concept (e.g., "Mesh Concept", "Cover 3 Beater")';
COMMENT ON TABLE player_play_concept_tags IS 'Links player plays to concept tags';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 4: FORMATION LIBRARY
-- System-defined and custom formations
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS formations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Formation details
  name TEXT NOT NULL,
  side_of_ball TEXT NOT NULL CHECK (side_of_ball IN ('offense', 'defense')),

  -- Personnel grouping
  personnel TEXT, -- '11', '12', '21', etc. for offense; '4-3', '3-4', 'Nickel', etc. for defense

  -- System vs custom
  is_system_defined BOOLEAN DEFAULT true,

  -- Organization ownership (NULL for system formations)
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Player positions in formation
  -- Format: [{position: 'QB', x: 0, y: 0, label: 'QB', group: 'quarterback'}, ...]
  player_positions JSONB NOT NULL,

  -- Optional description
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique names per org/side (or system-wide for system formations)
  UNIQUE NULLS NOT DISTINCT (name, side_of_ball, org_id)
);

-- Indexes
CREATE INDEX idx_formations_org_id ON formations(org_id);
CREATE INDEX idx_formations_side_of_ball ON formations(side_of_ball);
CREATE INDEX idx_formations_personnel ON formations(personnel);
CREATE INDEX idx_formations_is_system_defined ON formations(is_system_defined);

COMMENT ON TABLE formations IS 'System and custom formation library with player positions';
COMMENT ON COLUMN formations.player_positions IS 'Array of player positions with x/y coordinates and labels';


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 5: SEED SYSTEM DATA
-- Pre-populate system-defined situational tags and formations
-- ═══════════════════════════════════════════════════════════════════

-- Offensive Situational Tags
INSERT INTO situational_tags (name, category, side_of_ball, is_system_defined) VALUES
  ('First Down', 'down', 'offense', true),
  ('Second Down', 'down', 'offense', true),
  ('Third Down', 'down', 'offense', true),
  ('Fourth Down', 'down', 'offense', true),
  ('Short Yardage', 'field_position', 'offense', true),
  ('Medium Yardage', 'field_position', 'offense', true),
  ('Long Yardage', 'field_position', 'offense', true),
  ('Red Zone', 'field_position', 'offense', true),
  ('Goal Line', 'field_position', 'offense', true),
  ('Backed Up', 'field_position', 'offense', true),
  ('Open Field', 'field_position', 'offense', true),
  ('Two-Minute', 'game_situation', 'offense', true),
  ('Four-Minute', 'game_situation', 'offense', true),
  ('Hurry-Up', 'game_situation', 'offense', true),
  ('Short Yardage', 'game_situation', 'offense', true)
ON CONFLICT (name, org_id) DO NOTHING;

-- Defensive Situational Tags
INSERT INTO situational_tags (name, category, side_of_ball, is_system_defined) VALUES
  ('First Down', 'down', 'defense', true),
  ('Second Down', 'down', 'defense', true),
  ('Third Down', 'down', 'defense', true),
  ('Fourth Down', 'down', 'defense', true),
  ('Short Yardage', 'field_position', 'defense', true),
  ('Medium Yardage', 'field_position', 'defense', true),
  ('Long Yardage', 'field_position', 'defense', true),
  ('Red Zone', 'field_position', 'defense', true),
  ('Goal Line', 'field_position', 'defense', true),
  ('Backed Up', 'field_position', 'defense', true),
  ('Open Field', 'field_position', 'defense', true),
  ('Two-Minute', 'game_situation', 'defense', true),
  ('Prevent', 'game_situation', 'defense', true)
ON CONFLICT (name, org_id) DO NOTHING;

-- System Offensive Formations
INSERT INTO formations (name, side_of_ball, personnel, is_system_defined, player_positions, description) VALUES
  (
    'Pro I Formation',
    'offense',
    '21',
    true,
    '[
      {"position": "QB", "x": 0, "y": -15, "label": "QB", "group": "quarterback"},
      {"position": "FB", "x": 0, "y": -35, "label": "FB", "group": "backs"},
      {"position": "RB", "x": 0, "y": -45, "label": "RB", "group": "backs"},
      {"position": "LT", "x": -40, "y": 0, "label": "LT", "group": "line"},
      {"position": "LG", "x": -20, "y": 0, "label": "LG", "group": "line"},
      {"position": "C", "x": 0, "y": 0, "label": "C", "group": "line"},
      {"position": "RG", "x": 20, "y": 0, "label": "RG", "group": "line"},
      {"position": "RT", "x": 40, "y": 0, "label": "RT", "group": "line"},
      {"position": "TE", "x": 60, "y": 0, "label": "TE", "group": "receivers"},
      {"position": "WR", "x": -80, "y": 0, "label": "X", "group": "receivers"},
      {"position": "WR", "x": 80, "y": 0, "label": "Z", "group": "receivers"}
    ]',
    'Traditional I-Formation with FB, TB, TE, and 2 WRs'
  ),
  (
    '11 Personnel - Shotgun',
    'offense',
    '11',
    true,
    '[
      {"position": "QB", "x": 0, "y": -40, "label": "QB", "group": "quarterback"},
      {"position": "RB", "x": -30, "y": -40, "label": "RB", "group": "backs"},
      {"position": "LT", "x": -40, "y": 0, "label": "LT", "group": "line"},
      {"position": "LG", "x": -20, "y": 0, "label": "LG", "group": "line"},
      {"position": "C", "x": 0, "y": 0, "label": "C", "group": "line"},
      {"position": "RG", "x": 20, "y": 0, "label": "RG", "group": "line"},
      {"position": "RT", "x": 40, "y": 0, "label": "RT", "group": "line"},
      {"position": "TE", "x": 60, "y": 0, "label": "Y", "group": "receivers"},
      {"position": "WR", "x": -80, "y": 0, "label": "X", "group": "receivers"},
      {"position": "WR", "x": 80, "y": 0, "label": "Z", "group": "receivers"},
      {"position": "WR", "x": 100, "y": 0, "label": "H", "group": "receivers"}
    ]',
    'Shotgun with 1 RB, 1 TE, 3 WRs'
  ),
  (
    '10 Personnel - Empty',
    'offense',
    '10',
    true,
    '[
      {"position": "QB", "x": 0, "y": -40, "label": "QB", "group": "quarterback"},
      {"position": "LT", "x": -40, "y": 0, "label": "LT", "group": "line"},
      {"position": "LG", "x": -20, "y": 0, "label": "LG", "group": "line"},
      {"position": "C", "x": 0, "y": 0, "label": "C", "group": "line"},
      {"position": "RG", "x": 20, "y": 0, "label": "RG", "group": "line"},
      {"position": "RT", "x": 40, "y": 0, "label": "RT", "group": "line"},
      {"position": "WR", "x": -80, "y": 0, "label": "X", "group": "receivers"},
      {"position": "WR", "x": -60, "y": 0, "label": "A", "group": "receivers"},
      {"position": "WR", "x": 60, "y": 0, "label": "Y", "group": "receivers"},
      {"position": "WR", "x": 80, "y": 0, "label": "Z", "group": "receivers"},
      {"position": "WR", "x": 100, "y": 0, "label": "H", "group": "receivers"}
    ]',
    'Empty backfield with 5 receivers'
  ),
  (
    '12 Personnel - I Formation',
    'offense',
    '12',
    true,
    '[
      {"position": "QB", "x": 0, "y": -15, "label": "QB", "group": "quarterback"},
      {"position": "FB", "x": 0, "y": -35, "label": "FB", "group": "backs"},
      {"position": "RB", "x": 0, "y": -45, "label": "RB", "group": "backs"},
      {"position": "LT", "x": -40, "y": 0, "label": "LT", "group": "line"},
      {"position": "LG", "x": -20, "y": 0, "label": "LG", "group": "line"},
      {"position": "C", "x": 0, "y": 0, "label": "C", "group": "line"},
      {"position": "RG", "x": 20, "y": 0, "label": "RG", "group": "line"},
      {"position": "RT", "x": 40, "y": 0, "label": "RT", "group": "line"},
      {"position": "TE", "x": 60, "y": 0, "label": "Y", "group": "receivers"},
      {"position": "TE", "x": -60, "y": 0, "label": "U", "group": "receivers"},
      {"position": "WR", "x": -80, "y": 0, "label": "X", "group": "receivers"}
    ]',
    'I-Formation with 2 TEs and 1 WR'
  )
ON CONFLICT (name, side_of_ball, org_id) DO NOTHING;

-- System Defensive Formations
INSERT INTO formations (name, side_of_ball, personnel, is_system_defined, player_positions, description) VALUES
  (
    '4-3 Base',
    'defense',
    '4-3',
    true,
    '[
      {"position": "DE", "x": -60, "y": 0, "label": "DE", "group": "line"},
      {"position": "DT", "x": -20, "y": 0, "label": "DT", "group": "line"},
      {"position": "DT", "x": 20, "y": 0, "label": "DT", "group": "line"},
      {"position": "DE", "x": 60, "y": 0, "label": "DE", "group": "line"},
      {"position": "LB", "x": -40, "y": -35, "label": "WLB", "group": "linebackers"},
      {"position": "LB", "x": 0, "y": -35, "label": "MLB", "group": "linebackers"},
      {"position": "LB", "x": 40, "y": -35, "label": "SLB", "group": "linebackers"},
      {"position": "CB", "x": -90, "y": -50, "label": "CB", "group": "secondary"},
      {"position": "CB", "x": 90, "y": -50, "label": "CB", "group": "secondary"},
      {"position": "S", "x": -30, "y": -80, "label": "SS", "group": "secondary"},
      {"position": "S", "x": 30, "y": -80, "label": "FS", "group": "secondary"}
    ]',
    'Base 4-3 defense with 4 down linemen and 3 linebackers'
  ),
  (
    '3-4 Base',
    'defense',
    '3-4',
    true,
    '[
      {"position": "DE", "x": -40, "y": 0, "label": "DE", "group": "line"},
      {"position": "NT", "x": 0, "y": 0, "label": "NT", "group": "line"},
      {"position": "DE", "x": 40, "y": 0, "label": "DE", "group": "line"},
      {"position": "LB", "x": -60, "y": -35, "label": "OLB", "group": "linebackers"},
      {"position": "LB", "x": -20, "y": -35, "label": "ILB", "group": "linebackers"},
      {"position": "LB", "x": 20, "y": -35, "label": "ILB", "group": "linebackers"},
      {"position": "LB", "x": 60, "y": -35, "label": "OLB", "group": "linebackers"},
      {"position": "CB", "x": -90, "y": -50, "label": "CB", "group": "secondary"},
      {"position": "CB", "x": 90, "y": -50, "label": "CB", "group": "secondary"},
      {"position": "S", "x": -30, "y": -80, "label": "SS", "group": "secondary"},
      {"position": "S", "x": 30, "y": -80, "label": "FS", "group": "secondary"}
    ]',
    'Base 3-4 defense with 3 down linemen and 4 linebackers'
  ),
  (
    'Nickel - 4-2-5',
    'defense',
    'Nickel',
    true,
    '[
      {"position": "DE", "x": -60, "y": 0, "label": "DE", "group": "line"},
      {"position": "DT", "x": -20, "y": 0, "label": "DT", "group": "line"},
      {"position": "DT", "x": 20, "y": 0, "label": "DT", "group": "line"},
      {"position": "DE", "x": 60, "y": 0, "label": "DE", "group": "line"},
      {"position": "LB", "x": -30, "y": -35, "label": "WLB", "group": "linebackers"},
      {"position": "LB", "x": 30, "y": -35, "label": "MLB", "group": "linebackers"},
      {"position": "CB", "x": -90, "y": -50, "label": "CB", "group": "secondary"},
      {"position": "CB", "x": 90, "y": -50, "label": "CB", "group": "secondary"},
      {"position": "CB", "x": -60, "y": -50, "label": "NB", "group": "secondary"},
      {"position": "S", "x": -30, "y": -80, "label": "SS", "group": "secondary"},
      {"position": "S", "x": 30, "y": -80, "label": "FS", "group": "secondary"}
    ]',
    'Nickel package with 4 DL, 2 LB, 5 DBs'
  ),
  (
    'Dime - 4-1-6',
    'defense',
    'Dime',
    true,
    '[
      {"position": "DE", "x": -60, "y": 0, "label": "DE", "group": "line"},
      {"position": "DT", "x": -20, "y": 0, "label": "DT", "group": "line"},
      {"position": "DT", "x": 20, "y": 0, "label": "DT", "group": "line"},
      {"position": "DE", "x": 60, "y": 0, "label": "DE", "group": "line"},
      {"position": "LB", "x": 0, "y": -35, "label": "MLB", "group": "linebackers"},
      {"position": "CB", "x": -90, "y": -50, "label": "CB", "group": "secondary"},
      {"position": "CB", "x": 90, "y": -50, "label": "CB", "group": "secondary"},
      {"position": "CB", "x": -60, "y": -50, "label": "NB", "group": "secondary"},
      {"position": "CB", "x": 60, "y": -50, "label": "NB", "group": "secondary"},
      {"position": "S", "x": -30, "y": -80, "label": "SS", "group": "secondary"},
      {"position": "S", "x": 30, "y": -80, "label": "FS", "group": "secondary"}
    ]',
    'Dime package with 4 DL, 1 LB, 6 DBs'
  )
ON CONFLICT (name, side_of_ball, org_id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 6: ROW-LEVEL SECURITY POLICIES
-- Extend existing RLS to cover new tables
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on new tables
ALTER TABLE situational_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_play_situational_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_play_concept_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────
-- Situational Tags Policies (system tags + org custom tags)
-- ─────────────────────────────────────────────────────────────────────

-- Everyone can view system tags + their org's custom tags
CREATE POLICY "Users can view system and org situational tags" ON situational_tags
  FOR SELECT USING (
    is_system_defined = true
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = situational_tags.org_id
    )
  );

-- Users can create custom tags for their org
CREATE POLICY "Users can create org situational tags" ON situational_tags
  FOR INSERT WITH CHECK (
    is_system_defined = false
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = situational_tags.org_id
    )
  );

-- Users can update their org's custom tags
CREATE POLICY "Users can update org situational tags" ON situational_tags
  FOR UPDATE USING (
    is_system_defined = false
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = situational_tags.org_id
    )
  );

-- Users can delete their org's custom tags
CREATE POLICY "Users can delete org situational tags" ON situational_tags
  FOR DELETE USING (
    is_system_defined = false
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = situational_tags.org_id
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- Player Play Situational Tags Junction Table Policies
-- ─────────────────────────────────────────────────────────────────────

CREATE POLICY "Players can manage own play situational tags" ON player_play_situational_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_play_situational_tags.player_play_id
        AND u.auth_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- Concept Tags Policies (org-specific)
-- ─────────────────────────────────────────────────────────────────────

-- Users can view their org's concept tags
CREATE POLICY "Users can view org concept tags" ON concept_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = concept_tags.org_id
    )
  );

-- Users can create concept tags for their org
CREATE POLICY "Users can create org concept tags" ON concept_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = concept_tags.org_id
    )
  );

-- Users can update their org's concept tags
CREATE POLICY "Users can update org concept tags" ON concept_tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = concept_tags.org_id
    )
  );

-- Users can delete their org's concept tags
CREATE POLICY "Users can delete org concept tags" ON concept_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = concept_tags.org_id
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- Player Play Concept Tags Junction Table Policies
-- ─────────────────────────────────────────────────────────────────────

CREATE POLICY "Players can manage own play concept tags" ON player_play_concept_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM player_plays pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = player_play_concept_tags.player_play_id
        AND u.auth_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- Formations Policies (system formations + org custom formations)
-- ─────────────────────────────────────────────────────────────────────

-- Everyone can view system formations + their org's custom formations
CREATE POLICY "Users can view system and org formations" ON formations
  FOR SELECT USING (
    is_system_defined = true
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = formations.org_id
    )
  );

-- Users can create custom formations for their org
CREATE POLICY "Users can create org formations" ON formations
  FOR INSERT WITH CHECK (
    is_system_defined = false
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = formations.org_id
    )
  );

-- Users can update their org's custom formations
CREATE POLICY "Users can update org formations" ON formations
  FOR UPDATE USING (
    is_system_defined = false
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = formations.org_id
    )
  );

-- Users can delete their org's custom formations
CREATE POLICY "Users can delete org formations" ON formations
  FOR DELETE USING (
    is_system_defined = false
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN org_memberships om ON om.user_id = u.id
      WHERE u.auth_id = auth.uid()
        AND om.org_id = formations.org_id
    )
  );


-- ═══════════════════════════════════════════════════════════════════
-- SECTION 7: TRIGGERS FOR UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER update_situational_tags_updated_at
  BEFORE UPDATE ON situational_tags
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_concept_tags_updated_at
  BEFORE UPDATE ON concept_tags
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_formations_updated_at
  BEFORE UPDATE ON formations
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();


-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON SCHEMA public IS 'Migration 019: Structured Play Builder System - Transforms PlayBuilder into structured coaching workflow';
