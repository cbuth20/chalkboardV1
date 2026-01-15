-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CHALKBOARD — MINIMAL DATABASE SCHEMA
--
-- Simplified schema with only essential tables for coach review workflow
-- Designed for Supabase with Row-Level Security (RLS) policies.
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- User roles within a team
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('player', 'coach', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Football positions for metadata
DO $$ BEGIN
  CREATE TYPE football_position AS ENUM (
    'QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'OG', 'C',  -- Offense
    'DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB', 'CB', 'FS', 'SS',  -- Defense
    'K', 'P', 'LS'  -- Special Teams
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- CORE TABLES
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  season VARCHAR(20) DEFAULT '2024',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  current_level INT DEFAULT 1,
  total_xp INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'player',
  position football_position,
  jersey_number VARCHAR(10),
  team_xp INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- XP Events Table (optional but useful for tracking)
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  xp_amount INT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX idx_xp_events_team_id ON xp_events(team_id);
CREATE INDEX idx_xp_events_created_at ON xp_events(created_at DESC);

-- Playbook Metadata Table
CREATE TABLE IF NOT EXISTS playbook_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  formation_name VARCHAR(100),
  concept_name VARCHAR(100),
  side_of_ball VARCHAR(20),
  content_type VARCHAR(50),
  level VARCHAR(50),
  position_relevance TEXT[],
  custom_notes TEXT,
  file_paths TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playbook_metadata_team_id ON playbook_metadata(team_id);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_metadata_updated_at
  BEFORE UPDATE ON playbook_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY POLICIES
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Helper function to check if user is in a team (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = check_team_id AND u.auth_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_metadata ENABLE ROW LEVEL SECURITY;

-- Users can read all user profiles
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Team members can view their teams
CREATE POLICY "Team members can view team" ON teams
  FOR SELECT USING (public.is_team_member(teams.id));

-- Team members can view other team members
CREATE POLICY "Users can view team members" ON team_members
  FOR SELECT USING (public.is_team_member(team_members.team_id));

-- XP events
CREATE POLICY "Users can view own xp events" ON xp_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = xp_events.user_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own xp events" ON xp_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = xp_events.user_id AND u.auth_id = auth.uid()
    )
  );

-- Playbook metadata
CREATE POLICY "Team members can view playbook metadata" ON playbook_metadata
  FOR SELECT USING (public.is_team_member(playbook_metadata.team_id));

CREATE POLICY "Coaches can manage playbook metadata" ON playbook_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = playbook_metadata.team_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SCHEMA COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════════════════
