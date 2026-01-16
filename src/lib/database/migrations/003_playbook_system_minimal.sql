-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CHALKBOARD — MINIMAL PLAYBOOK SYSTEM
--
-- Simplified playbook system with only essential tables
-- Run this after schema_minimal.sql has been applied.
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Play types
DO $$ BEGIN
  CREATE TYPE play_type AS ENUM ('PASS', 'RUN', 'RPO', 'SCREEN', 'TRICK', 'SPECIAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Skill positions for assignments
DO $$ BEGIN
  CREATE TYPE skill_position AS ENUM (
    'QB', 'RB', 'FB',
    'X', 'Z', 'H', 'Y', 'TE',
    'LT', 'LG', 'C', 'RG', 'RT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Flashcard categories
DO $$ BEGIN
  CREATE TYPE flashcard_category AS ENUM (
    'alignment',
    'assignment',
    'coverage',
    'read',
    'terminology'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Seasons Table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  year VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, year, name)
);

CREATE INDEX idx_seasons_team_id ON seasons(team_id);

-- Personnel Groupings (Reference Data)
CREATE TABLE IF NOT EXISTS personnel_groupings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  running_backs INT NOT NULL DEFAULT 1,
  tight_ends INT NOT NULL DEFAULT 1,
  wide_receivers INT NOT NULL DEFAULT 3,
  fullbacks INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard personnel groupings
INSERT INTO personnel_groupings (code, name, running_backs, tight_ends, wide_receivers, fullbacks, description)
VALUES
  ('10', '1 RB, 0 TE, 4 WR', 1, 0, 4, 0, 'Empty look - 4 wide receivers'),
  ('11', '1 RB, 1 TE, 3 WR', 1, 1, 3, 0, 'Standard spread personnel'),
  ('12', '1 RB, 2 TE, 2 WR', 1, 2, 2, 0, 'Two tight end set'),
  ('13', '1 RB, 3 TE, 1 WR', 1, 3, 1, 0, 'Heavy personnel'),
  ('20', '2 RB, 0 TE, 3 WR', 2, 0, 3, 0, 'Two back empty'),
  ('21', '2 RB, 1 TE, 2 WR', 2, 1, 2, 0, 'I-formation personnel'),
  ('22', '2 RB, 2 TE, 1 WR', 2, 2, 1, 0, 'Power personnel'),
  ('23', '2 RB, 3 TE, 0 WR', 2, 3, 0, 0, 'Jumbo/Goal line'),
  ('00', '0 RB, 0 TE, 5 WR', 0, 0, 5, 0, 'Empty 5-wide')
ON CONFLICT (code) DO NOTHING;

-- Playbooks Table
CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, season_id, name)
);

CREATE INDEX idx_playbooks_team_id ON playbooks(team_id);
CREATE INDEX idx_playbooks_season_id ON playbooks(season_id);

-- Plays Table
CREATE TABLE IF NOT EXISTS plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50),
  play_type play_type NOT NULL,
  concept VARCHAR(100),
  personnel_id UUID REFERENCES personnel_groupings(id),
  personnel_code VARCHAR(10),
  formation_id VARCHAR(50),
  formation_name VARCHAR(100),
  diagram_data JSONB,
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plays_team_id ON plays(team_id);
CREATE INDEX idx_plays_play_type ON plays(play_type);
CREATE INDEX idx_plays_concept ON plays(concept);

-- Play Assignments Table
CREATE TABLE IF NOT EXISTS play_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  position skill_position NOT NULL,
  alignment TEXT NOT NULL,
  landmark TEXT NOT NULL,
  assignment TEXT NOT NULL,
  key_read TEXT NOT NULL,
  route_id VARCHAR(50),
  route_depth INT,
  coverage_adjustments JSONB DEFAULT '{
    "vs_man": "",
    "vs_zone": "",
    "vs_blitz": ""
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(play_id, position)
);

CREATE INDEX idx_play_assignments_play_id ON play_assignments(play_id);

-- Flashcard Templates Table
CREATE TABLE IF NOT EXISTS flashcard_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES play_assignments(id) ON DELETE CASCADE,
  position skill_position NOT NULL,
  category flashcard_category NOT NULL,
  question_prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  hints JSONB DEFAULT '[]',
  explanation TEXT,
  difficulty VARCHAR(20) DEFAULT 'intermediate',
  is_auto_generated BOOLEAN DEFAULT TRUE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flashcard_templates_play_id ON flashcard_templates(play_id);
CREATE INDEX idx_flashcard_templates_position ON flashcard_templates(position);
CREATE INDEX idx_flashcard_templates_category ON flashcard_templates(category);

-- Player Flashcard Attempts Table
CREATE TABLE IF NOT EXISTS player_flashcard_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcard_templates(id) ON DELETE CASCADE,
  was_correct BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_flashcard_attempts_user_id ON player_flashcard_attempts(user_id);
CREATE INDEX idx_player_flashcard_attempts_flashcard_id ON player_flashcard_attempts(flashcard_id);
CREATE INDEX idx_player_flashcard_attempts_attempted_at ON player_flashcard_attempts(attempted_at DESC);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ───────────────────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbooks_updated_at
  BEFORE UPDATE ON playbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plays_updated_at
  BEFORE UPDATE ON plays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_play_assignments_updated_at
  BEFORE UPDATE ON play_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcard_templates_updated_at
  BEFORE UPDATE ON flashcard_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY POLICIES
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_groupings ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_flashcard_attempts ENABLE ROW LEVEL SECURITY;

-- Seasons
CREATE POLICY "Team members can view seasons" ON seasons
  FOR SELECT USING (public.is_team_member(seasons.team_id));

CREATE POLICY "Coaches can manage seasons" ON seasons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = seasons.team_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- Personnel groupings are public reference data
CREATE POLICY "Personnel groupings are public" ON personnel_groupings
  FOR SELECT USING (true);

-- Playbooks
CREATE POLICY "Team members can view playbooks" ON playbooks
  FOR SELECT USING (public.is_team_member(playbooks.team_id));

CREATE POLICY "Coaches can manage playbooks" ON playbooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = playbooks.team_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- Plays
CREATE POLICY "Team members can view team plays" ON plays
  FOR SELECT USING (
    team_id IS NULL OR public.is_team_member(plays.team_id)
  );

CREATE POLICY "Coaches can manage team plays" ON plays
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = plays.team_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- Play Assignments
CREATE POLICY "Team members can view play assignments" ON play_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plays p
      WHERE p.id = play_assignments.play_id
        AND (p.team_id IS NULL OR public.is_team_member(p.team_id))
    )
  );

CREATE POLICY "Coaches can manage play assignments" ON play_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM plays p
      JOIN team_members tm ON tm.team_id = p.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE p.id = play_assignments.play_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- Flashcard Templates
CREATE POLICY "Team members can view flashcards" ON flashcard_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plays p
      WHERE p.id = flashcard_templates.play_id
        AND (p.team_id IS NULL OR public.is_team_member(p.team_id))
    )
  );

CREATE POLICY "Coaches can manage flashcards" ON flashcard_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM plays p
      JOIN team_members tm ON tm.team_id = p.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE p.id = flashcard_templates.play_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- Player Flashcard Attempts
CREATE POLICY "Users can manage own flashcard attempts" ON player_flashcard_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = player_flashcard_attempts.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════════════════
