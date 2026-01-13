-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CHALKBOARD — PLAYBOOK SYSTEM DATABASE SCHEMA
-- 
-- A comprehensive Postgres schema for the Playbook, Installs, Reps/Mastery, 
-- Flashcards, and AI Coach Insights features.
-- 
-- Run this after schema.sql and previous migrations have been applied.
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- ENTITY LIST (Summary)
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 
-- ACCOUNTS & TEAMS:
--   seasons              - Team seasons (e.g., "2025 Varsity Season")
--   position_groups      - Position group definitions (WR, RB, QB, OL, etc.)
--   user_position_groups - Junction: which players belong to which position groups
-- 
-- PLAYBOOKS / INSTALLS / PLAYS:
--   playbooks            - Named collections of plays ("Base Offense", "Red Zone Package")
--   plays                - Core reusable play definitions (the master play template)
--   team_plays           - Team-specific customizations of plays
--   play_tags            - Tag definitions (RPO, Red Zone, Short Yardage, etc.)
--   play_tag_assignments - Junction: which tags are assigned to which plays
--   personnel_groupings  - Personnel package definitions (11, 12, 21, etc.)
--   installs             - Weekly install schedules
--   install_plays        - Junction: plays in an install with ordering and metadata
-- 
-- ASSIGNMENTS & COACHING:
--   play_assignments     - Position-specific assignments per play
--   coaching_points      - Key coaching bullets per play
--   coverage_variants    - How plays adjust vs different coverages
--   motion_definitions   - Pre-snap motion/shift rules
-- 
-- PLAYER STUDY / REPS / MASTERY:
--   player_study_sessions - When a player actively studies
--   play_rep_events       - Individual rep/study events (raw data)
--   player_play_mastery   - Aggregated mastery per player per play (summary)
-- 
-- FLASHCARDS & QUIZZING:
--   flashcard_templates   - Generated flashcard definitions per play
--   player_flashcard_attempts - Individual flashcard attempt history
-- 
-- AI COACH INSIGHTS:
--   ai_insights          - Persisted AI analysis outputs
--   ai_recommendations   - Recommended next plays/actions
-- 
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- NEW ENUMS FOR PLAYBOOK SYSTEM
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Play type categories
CREATE TYPE play_type AS ENUM (
  'PASS',
  'RUN', 
  'RPO',
  'SCREEN',
  'TRICK',
  'SPECIAL'
);

-- Skill positions that receive assignments
CREATE TYPE skill_position AS ENUM (
  'QB', 'RB', 'FB',
  'X',   -- Split end (usually left WR)
  'Z',   -- Flanker (usually right WR)
  'H',   -- Slot receiver
  'Y',   -- Tight end / slot
  'TE',
  'LT', 'LG', 'C', 'RG', 'RT'  -- O-Line for blocking assignments
);

-- Mastery levels
CREATE TYPE mastery_level AS ENUM (
  'new',
  'learning', 
  'proficient',
  'mastered'
);

-- Flashcard categories
CREATE TYPE flashcard_category AS ENUM (
  'alignment',
  'assignment',
  'coverage',
  'motion',
  'read',
  'progression',
  'terminology',
  'blocking'
);

-- Motion types
CREATE TYPE motion_type AS ENUM (
  'jet',
  'orbit',
  'shift',
  'trade',
  'stack',
  'empty',
  'bunch',
  'zip'
);

-- Motion timing
CREATE TYPE motion_timing AS ENUM (
  'pre_huddle',
  'at_line',
  'on_cadence',
  'on_snap',
  'post_snap'
);

-- Install status
CREATE TYPE install_status AS ENUM (
  'upcoming',
  'active',
  'completed'
);

-- Play status (dynamic)
CREATE TYPE play_status AS ENUM (
  'NEW',
  'DUE_TODAY',
  'EMPHASIS',
  'NEEDS_REPS',
  'COMPLETED',
  'NORMAL'
);

-- AI insight types
CREATE TYPE ai_insight_type AS ENUM (
  'weak_concept',
  'progress_update',
  'study_recommendation',
  'install_readiness',
  'coverage_gap',
  'assignment_gap',
  'streak_milestone',
  'mastery_achieved'
);

-- Coverage effectiveness
CREATE TYPE coverage_effectiveness AS ENUM (
  'excellent',
  'good',
  'neutral',
  'poor'
);


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 1: SEASONS & POSITION GROUPS
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- SEASONS TABLE
-- Each team can have multiple seasons (e.g., "2025 Varsity Season")
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Identity
  name VARCHAR(100) NOT NULL,           -- "2025 Varsity Season"
  year VARCHAR(20) NOT NULL,            -- "2025" or "2024-25"
  
  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT FALSE,      -- Only one active season per team
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, year, name)
);

CREATE INDEX idx_seasons_team_id ON seasons(team_id);
CREATE INDEX idx_seasons_active ON seasons(team_id, is_active) WHERE is_active = TRUE;


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- POSITION GROUPS TABLE
-- Defines position groupings (WR Room, QB Room, RB Room, O-Line, etc.)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE position_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Identity
  name VARCHAR(50) NOT NULL,            -- "WR Room", "QB Room", "O-Line"
  code VARCHAR(10) NOT NULL,            -- "WR", "QB", "OL"
  
  -- Display
  display_order INT DEFAULT 0,
  color VARCHAR(20),                    -- For UI theming
  
  -- Positions included
  positions skill_position[] NOT NULL,  -- ['X', 'Z', 'H'] for WR Room
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, code)
);

CREATE INDEX idx_position_groups_team_id ON position_groups(team_id);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- USER POSITION GROUPS TABLE (Junction)
-- Links players to their position groups (a player can be in multiple groups)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE user_position_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  position_group_id UUID NOT NULL REFERENCES position_groups(id) ON DELETE CASCADE,
  
  -- Primary position within this group
  primary_position skill_position,
  
  -- Status
  is_primary_group BOOLEAN DEFAULT FALSE,  -- Player's main position group
  
  -- Metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  
  UNIQUE(user_id, team_id, position_group_id)
);

CREATE INDEX idx_user_position_groups_user_id ON user_position_groups(user_id);
CREATE INDEX idx_user_position_groups_team_id ON user_position_groups(team_id);
CREATE INDEX idx_user_position_groups_group_id ON user_position_groups(position_group_id);


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 2: PLAYBOOKS, PLAYS, TAGS, PERSONNEL
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PERSONNEL GROUPINGS TABLE
-- Defines personnel packages (11, 12, 21, 10, 20, etc.)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE personnel_groupings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  code VARCHAR(10) NOT NULL UNIQUE,     -- "11", "12", "21", "10"
  name VARCHAR(50) NOT NULL,            -- "1 RB, 1 TE, 3 WR"
  
  -- Breakdown
  running_backs INT NOT NULL DEFAULT 1,
  tight_ends INT NOT NULL DEFAULT 1,
  wide_receivers INT NOT NULL DEFAULT 3,
  fullbacks INT NOT NULL DEFAULT 0,
  
  -- Description
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard personnel groupings
INSERT INTO personnel_groupings (code, name, running_backs, tight_ends, wide_receivers, fullbacks, description) VALUES
('10', '1 RB, 0 TE, 4 WR', 1, 0, 4, 0, 'Empty look - 4 wide receivers'),
('11', '1 RB, 1 TE, 3 WR', 1, 1, 3, 0, 'Standard spread personnel'),
('12', '1 RB, 2 TE, 2 WR', 1, 2, 2, 0, 'Two tight end set'),
('13', '1 RB, 3 TE, 1 WR', 1, 3, 1, 0, 'Heavy personnel'),
('20', '2 RB, 0 TE, 3 WR', 2, 0, 3, 0, 'Two back empty'),
('21', '2 RB, 1 TE, 2 WR', 2, 1, 2, 0, 'I-formation personnel'),
('22', '2 RB, 2 TE, 1 WR', 2, 2, 1, 0, 'Power personnel'),
('23', '2 RB, 3 TE, 0 WR', 2, 3, 0, 0, 'Jumbo/Goal line'),
('00', '0 RB, 0 TE, 5 WR', 0, 0, 5, 0, 'Empty 5-wide');


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAY TAGS TABLE
-- Tag definitions for categorizing plays
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE play_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Can be global (NULL team_id) or team-specific
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Identity
  name VARCHAR(50) NOT NULL,            -- "Red Zone", "Short Yardage"
  code VARCHAR(30) NOT NULL,            -- "RED_ZONE", "SHORT_YARDAGE"
  category VARCHAR(30) NOT NULL,        -- "situational", "concept", "formation"
  
  -- Display
  color VARCHAR(20),
  icon VARCHAR(30),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, code)
);

CREATE INDEX idx_play_tags_team_id ON play_tags(team_id);
CREATE INDEX idx_play_tags_category ON play_tags(category);

-- Insert global tags
INSERT INTO play_tags (team_id, name, code, category) VALUES
(NULL, 'Red Zone', 'RED_ZONE', 'situational'),
(NULL, 'Goal Line', 'GOAL_LINE', 'situational'),
(NULL, 'Short Yardage', 'SHORT_YARDAGE', 'situational'),
(NULL, '3rd Down', 'THIRD_DOWN', 'situational'),
(NULL, '2-Minute', 'TWO_MINUTE', 'situational'),
(NULL, 'Backed Up', 'BACKED_UP', 'situational'),
(NULL, 'Plus Territory', 'PLUS_TERRITORY', 'situational'),
(NULL, 'First Down', 'FIRST_DOWN', 'situational'),
(NULL, 'Quick Game', 'QUICK_GAME', 'concept'),
(NULL, 'Play Action', 'PLAY_ACTION', 'concept'),
(NULL, 'Dropback', 'DROPBACK', 'concept'),
(NULL, 'Zone Run', 'ZONE_RUN', 'concept'),
(NULL, 'Gap Run', 'GAP_RUN', 'concept'),
(NULL, 'Option', 'OPTION', 'concept'),
(NULL, 'Screen', 'SCREEN', 'concept'),
(NULL, 'Trick Play', 'TRICK', 'concept');


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAYBOOKS TABLE
-- Named collections of plays ("Base Offense", "Red Zone Package")
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  
  -- Identity
  name VARCHAR(100) NOT NULL,           -- "Base Offense", "Red Zone Package"
  description TEXT,
  
  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,     -- Default playbook for the team
  
  -- Display
  color VARCHAR(20),
  icon VARCHAR(30),
  display_order INT DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, season_id, name)
);

CREATE INDEX idx_playbooks_team_id ON playbooks(team_id);
CREATE INDEX idx_playbooks_season_id ON playbooks(season_id);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAYS TABLE (Master Play Template)
-- Core reusable play definitions - these can be shared across teams/seasons
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership: NULL = global library play, set = team's private play
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- If this play was derived from a library play, reference it
  source_play_id UUID REFERENCES plays(id) ON DELETE SET NULL,
  
  -- Identity
  name VARCHAR(100) NOT NULL,           -- "Gun Trips RPO Glance"
  short_name VARCHAR(50),               -- "Glance RPO"
  
  -- Classification
  play_type play_type NOT NULL,         -- PASS, RUN, RPO, etc.
  concept VARCHAR(100),                 -- "Glance RPO", "Inside Zone", "Mesh"
  
  -- Personnel
  personnel_id UUID REFERENCES personnel_groupings(id),
  personnel_code VARCHAR(10),           -- Denormalized for quick access
  
  -- Formation reference (stored as string ID to match domain types)
  formation_id VARCHAR(50),
  formation_name VARCHAR(100),
  
  -- Diagram
  diagram_type VARCHAR(20) DEFAULT 'pass',  -- "pass" | "run"
  diagram_data JSONB,                   -- Full diagram coordinates/routes
  
  -- Rich content (JSONB for flexibility)
  coaching_points JSONB DEFAULT '[]',   -- Array of coaching point strings
  
  -- Status
  is_published BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Versioning
  version INT DEFAULT 1,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plays_team_id ON plays(team_id);
CREATE INDEX idx_plays_play_type ON plays(play_type);
CREATE INDEX idx_plays_concept ON plays(concept);
CREATE INDEX idx_plays_source_play_id ON plays(source_play_id);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- TEAM PLAYS TABLE
-- Team-specific customizations layered on top of base plays
-- Allows coaches to modify coaching points/assignments without breaking the template
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE team_plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  
  -- Override name (optional - uses base play name if NULL)
  custom_name VARCHAR(100),
  
  -- Override coaching points (NULL = use base play's points)
  custom_coaching_points JSONB,
  
  -- Team-specific metadata
  team_notes TEXT,
  
  -- Playbook association
  playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL,
  
  -- Install schedule
  install_week INT,
  install_date DATE,
  
  -- Status flags
  is_active BOOLEAN DEFAULT TRUE,
  is_emphasis BOOLEAN DEFAULT FALSE,
  emphasis_reason TEXT,
  
  -- Rep targets
  default_rep_target INT DEFAULT 10,
  
  -- Metadata
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, play_id, season_id)
);

CREATE INDEX idx_team_plays_team_id ON team_plays(team_id);
CREATE INDEX idx_team_plays_play_id ON team_plays(play_id);
CREATE INDEX idx_team_plays_season_id ON team_plays(season_id);
CREATE INDEX idx_team_plays_playbook_id ON team_plays(playbook_id);
CREATE INDEX idx_team_plays_install_week ON team_plays(team_id, install_week);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAY TAG ASSIGNMENTS TABLE (Junction)
-- Links plays to their tags
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE play_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES play_tags(id) ON DELETE CASCADE,
  
  -- Optional: team-specific tag assignment (vs global)
  team_play_id UUID REFERENCES team_plays(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(play_id, tag_id)
);

CREATE INDEX idx_play_tag_assignments_play_id ON play_tag_assignments(play_id);
CREATE INDEX idx_play_tag_assignments_tag_id ON play_tag_assignments(tag_id);


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 3: INSTALLS
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- INSTALLS TABLE
-- Weekly install schedules managed by coaches
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE installs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  
  -- Schedule identity
  week_number INT NOT NULL,
  week_label VARCHAR(100) NOT NULL,     -- "Week 4 - Red Zone RPO"
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status
  status install_status DEFAULT 'upcoming',
  
  -- Rep targets (JSONB for flexibility)
  rep_targets JSONB DEFAULT '{
    "default": 10,
    "by_position": {},
    "by_play_id": {}
  }',
  
  -- Notes
  coach_notes TEXT,
  focus_areas JSONB DEFAULT '[]',       -- Array of focus area strings
  
  -- Opponent context (optional)
  opponent_name VARCHAR(100),
  game_date DATE,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, season_id, week_number)
);

CREATE INDEX idx_installs_team_id ON installs(team_id);
CREATE INDEX idx_installs_season_id ON installs(season_id);
CREATE INDEX idx_installs_status ON installs(team_id, status);
CREATE INDEX idx_installs_dates ON installs(team_id, start_date, end_date);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- INSTALL PLAYS TABLE (Junction)
-- Links plays to installs with ordering, category, and emphasis
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE install_plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  install_id UUID NOT NULL REFERENCES installs(id) ON DELETE CASCADE,
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  team_play_id UUID REFERENCES team_plays(id) ON DELETE SET NULL,
  
  -- Ordering & Display
  display_order INT DEFAULT 0,
  category VARCHAR(30) DEFAULT 'NORMAL',  -- "RPO", "PASS", "RUN", "TRICK"
  
  -- Emphasis
  is_emphasis BOOLEAN DEFAULT FALSE,
  emphasis_reason TEXT,
  
  -- Install-specific rep target (overrides install default)
  rep_target_override INT,
  
  -- Metadata
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES users(id),
  
  UNIQUE(install_id, play_id)
);

CREATE INDEX idx_install_plays_install_id ON install_plays(install_id);
CREATE INDEX idx_install_plays_play_id ON install_plays(play_id);
CREATE INDEX idx_install_plays_category ON install_plays(install_id, category);
CREATE INDEX idx_install_plays_emphasis ON install_plays(install_id, is_emphasis) WHERE is_emphasis = TRUE;


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 4: ASSIGNMENTS & COACHING DETAIL
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAY ASSIGNMENTS TABLE
-- Position-specific assignments within a play (one row per play + position)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE play_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  
  -- Position
  position skill_position NOT NULL,
  
  -- Core assignment fields (all quizzable)
  alignment TEXT NOT NULL,              -- "Shotgun, 5 yards deep"
  split_depth TEXT,                     -- "3x1 outside numbers"
  landmark TEXT NOT NULL,               -- "Eyes on Mike LB"
  first_step TEXT,                      -- "Open step to playside"
  assignment TEXT NOT NULL,             -- "Quick game: Mesh → Corner → Check"
  
  -- Read progression (for QB, receivers)
  read_progression JSONB DEFAULT '[]',  -- ["1. Mesh crosser", "2. Corner route"]
  
  -- Run-specific (for RB)
  run_track TEXT,                       -- "Zone track - press the A-gap"
  blocking_assignment TEXT,             -- For O-line or blocking assignments
  
  -- Route info (for pass plays)
  route_id VARCHAR(50),                 -- Reference to route library
  route_depth INT,                      -- Depth in yards
  route_landmarks TEXT,                 -- "Opposite hash at 6 yards"
  
  -- Key read
  key_read TEXT NOT NULL,               -- What to look for pre/post snap
  
  -- Coverage adjustments (JSONB for flexibility)
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
  motion JSONB,                         -- { type, timing, path }
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(play_id, position)
);

CREATE INDEX idx_play_assignments_play_id ON play_assignments(play_id);
CREATE INDEX idx_play_assignments_position ON play_assignments(play_id, position);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- COACHING POINTS TABLE
-- Key coaching bullets per play (global or per position group)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE coaching_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  
  -- Optional: restrict to specific position (NULL = applies to all)
  position skill_position,
  position_group_id UUID REFERENCES position_groups(id) ON DELETE SET NULL,
  
  -- Content
  point_text TEXT NOT NULL,
  point_type VARCHAR(30) DEFAULT 'general',  -- "timing", "read", "mistake", "success"
  
  -- Ordering
  display_order INT DEFAULT 0,
  
  -- Team-specific override
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coaching_points_play_id ON coaching_points(play_id);
CREATE INDEX idx_coaching_points_position ON coaching_points(play_id, position);
CREATE INDEX idx_coaching_points_team_id ON coaching_points(team_id);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- COVERAGE VARIANTS TABLE
-- How plays adjust vs different coverages
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE coverage_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  
  -- Coverage identification
  coverage_id VARCHAR(50) NOT NULL,     -- "cover_1", "cover_2", "cover_3", "man", "quarters"
  coverage_name VARCHAR(50) NOT NULL,   -- "Cover 2", "Man Free"
  
  -- Overall adjustment
  play_adjustment TEXT NOT NULL,        -- "Work the seams—Cover 2 is weak there"
  coverage_key TEXT NOT NULL,           -- "Corner sinks with #1 = Cover 2"
  
  -- Effectiveness rating
  effectiveness coverage_effectiveness DEFAULT 'neutral',
  
  -- Position-specific adjustments (JSONB array)
  position_adjustments JSONB DEFAULT '[]',  -- [{ position, adjustment, reason }]
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(play_id, coverage_id)
);

CREATE INDEX idx_coverage_variants_play_id ON coverage_variants(play_id);
CREATE INDEX idx_coverage_variants_coverage_id ON coverage_variants(coverage_id);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- MOTION DEFINITIONS TABLE
-- Pre-snap motion/shift rules for plays
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE motion_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  
  -- Motion details
  motion_type motion_type NOT NULL,
  motion_timing motion_timing NOT NULL,
  
  -- Who moves
  mover_position skill_position NOT NULL,
  
  -- Motion path
  path_description TEXT NOT NULL,       -- "Jet motion from trips to backfield"
  start_alignment TEXT,                 -- Where player starts
  end_alignment TEXT,                   -- Where player ends
  
  -- Timing
  step_number INT DEFAULT 1,            -- For multi-step motions
  snap_timing TEXT,                     -- "Ball snapped as H crosses center"
  
  -- Reads for defense
  defensive_key TEXT,                   -- "Watch for safety rotating"
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_motion_definitions_play_id ON motion_definitions(play_id);


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 5: PLAYER STUDY / REPS / MASTERY
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAYER STUDY SESSIONS TABLE
-- Tracks when a player is actively studying (session-level)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE player_study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Context
  install_id UUID REFERENCES installs(id) ON DELETE SET NULL,
  playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL,
  
  -- Session type
  session_type VARCHAR(30) NOT NULL,    -- "quiz", "flashcard", "review", "walkthrough"
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  
  -- Activity counts
  plays_studied INT DEFAULT 0,
  reps_logged INT DEFAULT 0,
  flashcards_reviewed INT DEFAULT 0,
  questions_attempted INT DEFAULT 0,
  questions_correct INT DEFAULT 0,
  
  -- Device context
  device_type VARCHAR(30),
  client_version VARCHAR(30),
  
  -- XP earned
  xp_earned INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_study_sessions_user_id ON player_study_sessions(user_id);
CREATE INDEX idx_player_study_sessions_team_id ON player_study_sessions(team_id);
CREATE INDEX idx_player_study_sessions_started_at ON player_study_sessions(started_at DESC);
CREATE INDEX idx_player_study_sessions_install_id ON player_study_sessions(install_id);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAY REP EVENTS TABLE
-- Raw event log for individual reps/study activities (granular tracking)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE play_rep_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  
  -- Context
  install_id UUID REFERENCES installs(id) ON DELETE SET NULL,
  study_session_id UUID REFERENCES player_study_sessions(id) ON DELETE SET NULL,
  
  -- Event type
  event_type VARCHAR(30) NOT NULL,      -- "mental_rep", "physical_rep", "walkthrough", "quiz", "flashcard"
  
  -- Position studied
  position skill_position,
  
  -- Performance (for quiz/flashcard events)
  was_correct BOOLEAN,
  response_time_ms INT,
  
  -- Category (for quiz events)
  category flashcard_category,
  
  -- Notes
  notes TEXT,
  
  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_play_rep_events_user_id ON play_rep_events(user_id);
CREATE INDEX idx_play_rep_events_play_id ON play_rep_events(play_id);
CREATE INDEX idx_play_rep_events_team_id ON play_rep_events(team_id);
CREATE INDEX idx_play_rep_events_recorded_at ON play_rep_events(recorded_at DESC);
CREATE INDEX idx_play_rep_events_user_play ON play_rep_events(user_id, play_id);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAYER PLAY MASTERY TABLE
-- Aggregated mastery summary per player per play (denormalized for performance)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE player_play_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  
  -- Position context
  position skill_position NOT NULL,
  
  -- Rep tracking
  reps_completed INT DEFAULT 0,
  reps_target INT DEFAULT 10,
  physical_reps INT DEFAULT 0,
  
  -- Mastery metrics
  mastery_score INT DEFAULT 0,          -- 0-100
  mastery_level mastery_level DEFAULT 'new',
  
  -- Quiz performance
  quiz_attempts INT DEFAULT 0,
  quiz_correct INT DEFAULT 0,
  quiz_accuracy DECIMAL(5,2) DEFAULT 0, -- 0-100
  avg_response_time_ms INT,
  
  -- Category breakdown (JSONB for flexibility)
  category_scores JSONB DEFAULT '{
    "alignment": 0,
    "landmark": 0,
    "assignment": 0,
    "read": 0,
    "adjustment": 0
  }',
  
  -- Spaced repetition (SM-2 algorithm)
  last_studied_at TIMESTAMPTZ,
  next_due_date DATE,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval_days INT DEFAULT 0,
  
  -- Status flags
  is_starred BOOLEAN DEFAULT FALSE,
  is_emphasis BOOLEAN DEFAULT FALSE,
  needs_review BOOLEAN DEFAULT FALSE,
  
  -- Current install context
  current_install_id UUID REFERENCES installs(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, team_id, play_id, position)
);

CREATE INDEX idx_player_play_mastery_user_id ON player_play_mastery(user_id);
CREATE INDEX idx_player_play_mastery_team_id ON player_play_mastery(team_id);
CREATE INDEX idx_player_play_mastery_play_id ON player_play_mastery(play_id);
CREATE INDEX idx_player_play_mastery_user_team ON player_play_mastery(user_id, team_id);
CREATE INDEX idx_player_play_mastery_mastery ON player_play_mastery(team_id, mastery_score);
CREATE INDEX idx_player_play_mastery_due ON player_play_mastery(user_id, next_due_date);
CREATE INDEX idx_player_play_mastery_needs_review ON player_play_mastery(user_id, needs_review) WHERE needs_review = TRUE;


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 6: FLASHCARDS & QUIZZING
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- FLASHCARD TEMPLATES TABLE
-- Generated flashcard definitions per play (can be auto-generated or manual)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE flashcard_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  
  -- Optionally linked to a specific assignment
  assignment_id UUID REFERENCES play_assignments(id) ON DELETE CASCADE,
  
  -- Position targeting
  position skill_position NOT NULL,
  
  -- Category
  category flashcard_category NOT NULL,
  
  -- Content
  question_prompt TEXT NOT NULL,        -- "What's your alignment on Mesh Trips?"
  correct_answer TEXT NOT NULL,         -- "Inline, 1 yard outside #2"
  hints JSONB DEFAULT '[]',             -- Array of hint strings
  explanation TEXT,                     -- Shown after answer
  
  -- Difficulty
  difficulty VARCHAR(20) DEFAULT 'intermediate',  -- "beginner", "intermediate", "advanced"
  
  -- Whether auto-generated or coach-created
  is_auto_generated BOOLEAN DEFAULT TRUE,
  
  -- Team-specific (NULL = global for the play)
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flashcard_templates_play_id ON flashcard_templates(play_id);
CREATE INDEX idx_flashcard_templates_position ON flashcard_templates(position);
CREATE INDEX idx_flashcard_templates_category ON flashcard_templates(category);
CREATE INDEX idx_flashcard_templates_team_id ON flashcard_templates(team_id);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAYER FLASHCARD ATTEMPTS TABLE
-- Individual flashcard attempt history
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE player_flashcard_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcard_templates(id) ON DELETE CASCADE,
  
  -- Context
  study_session_id UUID REFERENCES player_study_sessions(id) ON DELETE SET NULL,
  
  -- Result
  was_correct BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL,
  
  -- Self-assessment (optional)
  self_rating INT,                      -- 1-5 difficulty rating
  
  -- Spaced repetition update
  new_ease_factor DECIMAL(3,2),
  new_interval INT,
  
  -- Timestamp
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_flashcard_attempts_user_id ON player_flashcard_attempts(user_id);
CREATE INDEX idx_player_flashcard_attempts_flashcard_id ON player_flashcard_attempts(flashcard_id);
CREATE INDEX idx_player_flashcard_attempts_attempted_at ON player_flashcard_attempts(attempted_at DESC);
CREATE INDEX idx_player_flashcard_attempts_user_flashcard ON player_flashcard_attempts(user_id, flashcard_id);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAYER FLASHCARD PROGRESS TABLE
-- Per-player, per-flashcard spaced repetition state
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE player_flashcard_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcard_templates(id) ON DELETE CASCADE,
  
  -- Spaced repetition state
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval_days INT DEFAULT 0,
  due_date DATE DEFAULT CURRENT_DATE,
  
  -- Performance tracking
  times_shown INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  
  -- Last studied
  last_reviewed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, flashcard_id)
);

CREATE INDEX idx_player_flashcard_progress_user_id ON player_flashcard_progress(user_id);
CREATE INDEX idx_player_flashcard_progress_due ON player_flashcard_progress(user_id, due_date);


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 7: AI COACH INSIGHTS & RECOMMENDATIONS
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- AI INSIGHTS TABLE
-- Persisted AI analysis outputs (cached to avoid recomputation)
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Scope
  install_id UUID REFERENCES installs(id) ON DELETE CASCADE,
  play_id UUID REFERENCES plays(id) ON DELETE SET NULL,
  
  -- Insight details
  insight_type ai_insight_type NOT NULL,
  
  -- Content
  title VARCHAR(200) NOT NULL,
  text_summary TEXT NOT NULL,
  
  -- Structured data for programmatic use
  structured_payload JSONB DEFAULT '{}',
  
  -- Priority/severity
  priority VARCHAR(20) DEFAULT 'normal',  -- "low", "normal", "high", "urgent"
  
  -- Lifecycle
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  is_actioned BOOLEAN DEFAULT FALSE,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_team_id ON ai_insights(team_id);
CREATE INDEX idx_ai_insights_install_id ON ai_insights(install_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_unread ON ai_insights(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at DESC);


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- AI RECOMMENDATIONS TABLE
-- Specific play/action recommendations from AI
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Context
  insight_id UUID REFERENCES ai_insights(id) ON DELETE CASCADE,
  install_id UUID REFERENCES installs(id) ON DELETE SET NULL,
  
  -- Recommendation target
  recommended_play_id UUID REFERENCES plays(id) ON DELETE CASCADE,
  recommended_action VARCHAR(50),       -- "study", "quiz", "review", "drill"
  
  -- Reason
  reason TEXT NOT NULL,
  reason_category VARCHAR(50),          -- "weak_concept", "due_date", "emphasis", "new_play"
  
  -- Priority/ranking
  priority_rank INT DEFAULT 0,          -- Lower = higher priority
  priority_score DECIMAL(5,2),          -- Computed priority score
  
  -- Lifecycle
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  -- Validity period
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_team_id ON ai_recommendations(team_id);
CREATE INDEX idx_ai_recommendations_play_id ON ai_recommendations(recommended_play_id);
CREATE INDEX idx_ai_recommendations_active ON ai_recommendations(user_id, is_completed, is_dismissed) 
  WHERE is_completed = FALSE AND is_dismissed = FALSE;
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(user_id, priority_rank);


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 8: VIEWS FOR COMMON QUERIES
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- INSTALL PLAYS WITH DETAILS VIEW
-- Get all plays in an install with mastery data
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW install_plays_detail_view AS
SELECT 
  ip.id AS install_play_id,
  ip.install_id,
  i.week_number,
  i.week_label,
  i.team_id,
  ip.play_id,
  p.name AS play_name,
  p.short_name,
  p.play_type,
  p.concept,
  p.personnel_code,
  ip.display_order,
  ip.category,
  ip.is_emphasis,
  ip.rep_target_override,
  COALESCE(ip.rep_target_override, (i.rep_targets->>'default')::INT, 10) AS effective_rep_target
FROM install_plays ip
JOIN installs i ON ip.install_id = i.id
JOIN plays p ON ip.play_id = p.id;


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAYER INSTALL MASTERY VIEW
-- Player mastery across all plays in an install
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW player_install_mastery_view AS
SELECT 
  ppm.user_id,
  ppm.team_id,
  ppm.play_id,
  ppm.position,
  i.id AS install_id,
  i.week_number,
  ppm.reps_completed,
  ppm.reps_target,
  ppm.mastery_score,
  ppm.mastery_level,
  ppm.quiz_accuracy,
  ppm.last_studied_at,
  ppm.next_due_date,
  ppm.is_starred,
  ppm.is_emphasis,
  ppm.needs_review,
  -- Calculate rep progress percentage
  ROUND((ppm.reps_completed::DECIMAL / NULLIF(ppm.reps_target, 0)) * 100, 1) AS rep_progress_pct
FROM player_play_mastery ppm
JOIN installs i ON ppm.current_install_id = i.id
WHERE i.status = 'active';


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- PLAYER WEAKEST PLAYS VIEW
-- Get plays with lowest mastery for a player
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW player_weakest_plays_view AS
SELECT 
  ppm.user_id,
  ppm.team_id,
  ppm.play_id,
  p.name AS play_name,
  p.concept,
  ppm.position,
  ppm.mastery_score,
  ppm.mastery_level,
  ppm.quiz_accuracy,
  ppm.reps_completed,
  ppm.reps_target,
  ppm.category_scores,
  ppm.last_studied_at,
  RANK() OVER (PARTITION BY ppm.user_id, ppm.team_id ORDER BY ppm.mastery_score ASC) AS weakness_rank
FROM player_play_mastery ppm
JOIN plays p ON ppm.play_id = p.id
WHERE ppm.mastery_level != 'mastered';


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- DUE TODAY PLAYS VIEW
-- Plays that are due for review today
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW due_today_plays_view AS
SELECT 
  ppm.user_id,
  ppm.team_id,
  ppm.play_id,
  p.name AS play_name,
  p.short_name,
  p.concept,
  ppm.position,
  ppm.mastery_score,
  ppm.last_studied_at,
  ppm.next_due_date,
  ppm.is_emphasis,
  CASE 
    WHEN ppm.next_due_date < CURRENT_DATE THEN 'overdue'
    WHEN ppm.next_due_date = CURRENT_DATE THEN 'due_today'
    ELSE 'upcoming'
  END AS due_status
FROM player_play_mastery ppm
JOIN plays p ON ppm.play_id = p.id
WHERE ppm.next_due_date <= CURRENT_DATE
ORDER BY ppm.next_due_date ASC, ppm.is_emphasis DESC;


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 9: FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Calculate mastery level from score
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_mastery_level(score INT)
RETURNS mastery_level AS $$
BEGIN
  IF score >= 81 THEN
    RETURN 'mastered';
  ELSIF score >= 51 THEN
    RETURN 'proficient';
  ELSIF score >= 21 THEN
    RETURN 'learning';
  ELSE
    RETURN 'new';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Calculate SM-2 spaced repetition interval
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_next_review(
  p_current_interval INT,
  p_ease_factor DECIMAL,
  p_was_correct BOOLEAN
)
RETURNS TABLE(next_interval INT, new_ease_factor DECIMAL) AS $$
BEGIN
  IF p_was_correct THEN
    IF p_current_interval = 0 THEN
      next_interval := 1;
    ELSIF p_current_interval = 1 THEN
      next_interval := 3;
    ELSE
      next_interval := ROUND(p_current_interval * p_ease_factor);
    END IF;
    new_ease_factor := GREATEST(1.3, p_ease_factor + 0.1);
  ELSE
    next_interval := 1;
    new_ease_factor := GREATEST(1.3, p_ease_factor - 0.2);
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Update mastery after rep event
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_mastery_on_rep()
RETURNS TRIGGER AS $$
DECLARE
  v_mastery RECORD;
  v_new_score INT;
  v_quiz_accuracy DECIMAL;
  v_rep_progress DECIMAL;
  v_review RECORD;
BEGIN
  -- Get current mastery record
  SELECT * INTO v_mastery
  FROM player_play_mastery
  WHERE user_id = NEW.user_id 
    AND play_id = NEW.play_id
    AND team_id = NEW.team_id;
  
  -- If no mastery record exists, create one
  IF v_mastery IS NULL THEN
    INSERT INTO player_play_mastery (
      user_id, team_id, play_id, position,
      reps_completed, reps_target, last_studied_at
    ) VALUES (
      NEW.user_id, NEW.team_id, NEW.play_id, 
      COALESCE(NEW.position, 'QB'),
      1, 10, NOW()
    );
    RETURN NEW;
  END IF;
  
  -- Calculate new metrics
  v_quiz_accuracy := CASE 
    WHEN v_mastery.quiz_attempts > 0 
    THEN (v_mastery.quiz_correct::DECIMAL / v_mastery.quiz_attempts) * 100
    ELSE 0 
  END;
  
  v_rep_progress := LEAST(100, (v_mastery.reps_completed::DECIMAL / NULLIF(v_mastery.reps_target, 0)) * 100);
  
  -- Calculate new mastery score (weighted formula)
  v_new_score := ROUND(
    v_quiz_accuracy * 0.40 +
    v_rep_progress * 0.25 +
    50 * 0.20 +  -- Category balance placeholder
    LEAST(100, 100 - EXTRACT(DAY FROM NOW() - COALESCE(v_mastery.last_studied_at, NOW() - INTERVAL '7 days')) * 5) * 0.15
  );
  
  -- Calculate next review date if this was a quiz event
  IF NEW.event_type IN ('quiz', 'flashcard') AND NEW.was_correct IS NOT NULL THEN
    SELECT * INTO v_review 
    FROM calculate_next_review(v_mastery.interval_days, v_mastery.ease_factor, NEW.was_correct);
  END IF;
  
  -- Update mastery record
  UPDATE player_play_mastery
  SET 
    reps_completed = CASE 
      WHEN NEW.event_type IN ('mental_rep', 'physical_rep', 'walkthrough') 
      THEN reps_completed + 1 
      ELSE reps_completed 
    END,
    physical_reps = CASE 
      WHEN NEW.event_type = 'physical_rep' 
      THEN physical_reps + 1 
      ELSE physical_reps 
    END,
    quiz_attempts = CASE 
      WHEN NEW.event_type IN ('quiz', 'flashcard') 
      THEN quiz_attempts + 1 
      ELSE quiz_attempts 
    END,
    quiz_correct = CASE 
      WHEN NEW.event_type IN ('quiz', 'flashcard') AND NEW.was_correct = TRUE 
      THEN quiz_correct + 1 
      ELSE quiz_correct 
    END,
    mastery_score = GREATEST(0, LEAST(100, v_new_score)),
    mastery_level = calculate_mastery_level(v_new_score),
    last_studied_at = NOW(),
    interval_days = COALESCE(v_review.next_interval, interval_days),
    ease_factor = COALESCE(v_review.new_ease_factor, ease_factor),
    next_due_date = CASE 
      WHEN v_review.next_interval IS NOT NULL 
      THEN CURRENT_DATE + v_review.next_interval 
      ELSE next_due_date 
    END,
    needs_review = CASE 
      WHEN NEW.was_correct = FALSE THEN TRUE 
      ELSE FALSE 
    END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id 
    AND play_id = NEW.play_id
    AND team_id = NEW.team_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for mastery updates
CREATE TRIGGER trigger_update_mastery_on_rep
AFTER INSERT ON play_rep_events
FOR EACH ROW
EXECUTE FUNCTION update_mastery_on_rep();


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Auto-generate flashcards for a play
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_flashcards_for_play(p_play_id UUID)
RETURNS INT AS $$
DECLARE
  v_assignment RECORD;
  v_count INT := 0;
BEGIN
  -- Generate flashcards for each assignment
  FOR v_assignment IN 
    SELECT * FROM play_assignments WHERE play_id = p_play_id
  LOOP
    -- Alignment flashcard
    INSERT INTO flashcard_templates (
      play_id, assignment_id, position, category,
      question_prompt, correct_answer, difficulty, is_auto_generated
    ) VALUES (
      p_play_id, v_assignment.id, v_assignment.position, 'alignment',
      'Where do you align on this play?',
      v_assignment.alignment,
      'beginner', TRUE
    ) ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
    
    -- Assignment flashcard
    INSERT INTO flashcard_templates (
      play_id, assignment_id, position, category,
      question_prompt, correct_answer, difficulty, is_auto_generated
    ) VALUES (
      p_play_id, v_assignment.id, v_assignment.position, 'assignment',
      'What is your assignment on this play?',
      v_assignment.assignment,
      'beginner', TRUE
    ) ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
    
    -- Read flashcard
    INSERT INTO flashcard_templates (
      play_id, assignment_id, position, category,
      question_prompt, correct_answer, difficulty, is_auto_generated
    ) VALUES (
      p_play_id, v_assignment.id, v_assignment.position, 'read',
      'What are you reading on this play?',
      v_assignment.key_read,
      'intermediate', TRUE
    ) ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_playbook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_playbooks_updated_at
  BEFORE UPDATE ON playbooks
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_plays_updated_at
  BEFORE UPDATE ON plays
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_team_plays_updated_at
  BEFORE UPDATE ON team_plays
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_installs_updated_at
  BEFORE UPDATE ON installs
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_play_assignments_updated_at
  BEFORE UPDATE ON play_assignments
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_coverage_variants_updated_at
  BEFORE UPDATE ON coverage_variants
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_player_play_mastery_updated_at
  BEFORE UPDATE ON player_play_mastery
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_flashcard_templates_updated_at
  BEFORE UPDATE ON flashcard_templates
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

CREATE TRIGGER update_player_flashcard_progress_updated_at
  BEFORE UPDATE ON player_flashcard_progress
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 10: ROW-LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all playbook tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_position_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_groupings ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE install_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_rep_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_play_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_flashcard_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: Team-scoped tables (team members can view their team's data)
-- ─────────────────────────────────────────────────────────────────────────────

-- Seasons
CREATE POLICY "Team members can view seasons" ON seasons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = seasons.team_id AND u.auth_id = auth.uid()
    )
  );

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

-- Position Groups
CREATE POLICY "Team members can view position groups" ON position_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = position_groups.team_id AND u.auth_id = auth.uid()
    )
  );

-- Playbooks
CREATE POLICY "Team members can view playbooks" ON playbooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = playbooks.team_id AND u.auth_id = auth.uid()
    )
  );

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

-- Plays (global or team-specific)
CREATE POLICY "Users can view global plays" ON plays
  FOR SELECT USING (team_id IS NULL);

CREATE POLICY "Team members can view team plays" ON plays
  FOR SELECT USING (
    team_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = plays.team_id AND u.auth_id = auth.uid()
    )
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

-- Installs
CREATE POLICY "Team members can view installs" ON installs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = installs.team_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage installs" ON installs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = installs.team_id 
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: User-scoped tables (users can only see their own data)
-- ─────────────────────────────────────────────────────────────────────────────

-- Player Study Sessions
CREATE POLICY "Users can view own study sessions" ON player_study_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = player_study_sessions.user_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own study sessions" ON player_study_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = player_study_sessions.user_id AND u.auth_id = auth.uid()
    )
  );

-- Play Rep Events
CREATE POLICY "Users can view own rep events" ON play_rep_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = play_rep_events.user_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own rep events" ON play_rep_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = play_rep_events.user_id AND u.auth_id = auth.uid()
    )
  );

-- Player Play Mastery
CREATE POLICY "Users can view own mastery" ON player_play_mastery
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = player_play_mastery.user_id AND u.auth_id = auth.uid()
    )
  );

-- Coaches can view team mastery
CREATE POLICY "Coaches can view team mastery" ON player_play_mastery
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = player_play_mastery.team_id 
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- Player Flashcard Attempts
CREATE POLICY "Users can manage own flashcard attempts" ON player_flashcard_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = player_flashcard_attempts.user_id AND u.auth_id = auth.uid()
    )
  );

-- Player Flashcard Progress
CREATE POLICY "Users can manage own flashcard progress" ON player_flashcard_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = player_flashcard_progress.user_id AND u.auth_id = auth.uid()
    )
  );

-- AI Insights
CREATE POLICY "Users can view own AI insights" ON ai_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = ai_insights.user_id AND u.auth_id = auth.uid()
    )
  );

-- AI Recommendations
CREATE POLICY "Users can view own recommendations" ON ai_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = ai_recommendations.user_id AND u.auth_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: Global reference tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "Personnel groupings are public" ON personnel_groupings
  FOR SELECT USING (true);

CREATE POLICY "Global play tags are public" ON play_tags
  FOR SELECT USING (team_id IS NULL);

CREATE POLICY "Team members can view team tags" ON play_tags
  FOR SELECT USING (
    team_id IS NULL OR
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = play_tags.team_id AND u.auth_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE seasons IS 'Team seasons (e.g., "2025 Varsity Season") - each team can have multiple';
COMMENT ON TABLE position_groups IS 'Position group definitions (WR Room, QB Room, O-Line, etc.)';
COMMENT ON TABLE user_position_groups IS 'Junction: which players belong to which position groups';
COMMENT ON TABLE personnel_groupings IS 'Personnel package definitions (11, 12, 21, etc.)';
COMMENT ON TABLE play_tags IS 'Tag definitions for categorizing plays (situational, concept, etc.)';
COMMENT ON TABLE playbooks IS 'Named collections of plays (Base Offense, Red Zone Package)';
COMMENT ON TABLE plays IS 'Core reusable play definitions - the master play template';
COMMENT ON TABLE team_plays IS 'Team-specific customizations layered on base plays';
COMMENT ON TABLE play_tag_assignments IS 'Junction: links plays to their tags';
COMMENT ON TABLE installs IS 'Weekly install schedules managed by coaches';
COMMENT ON TABLE install_plays IS 'Junction: plays in an install with ordering and emphasis';
COMMENT ON TABLE play_assignments IS 'Position-specific assignments within a play';
COMMENT ON TABLE coaching_points IS 'Key coaching bullets per play';
COMMENT ON TABLE coverage_variants IS 'How plays adjust vs different coverages';
COMMENT ON TABLE motion_definitions IS 'Pre-snap motion/shift rules for plays';
COMMENT ON TABLE player_study_sessions IS 'Tracks when a player actively studies';
COMMENT ON TABLE play_rep_events IS 'Raw event log for individual reps/study activities';
COMMENT ON TABLE player_play_mastery IS 'Aggregated mastery summary per player per play';
COMMENT ON TABLE flashcard_templates IS 'Generated flashcard definitions per play';
COMMENT ON TABLE player_flashcard_attempts IS 'Individual flashcard attempt history';
COMMENT ON TABLE player_flashcard_progress IS 'Per-player, per-flashcard spaced repetition state';
COMMENT ON TABLE ai_insights IS 'Persisted AI analysis outputs';
COMMENT ON TABLE ai_recommendations IS 'Specific play/action recommendations from AI';


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════════════════




