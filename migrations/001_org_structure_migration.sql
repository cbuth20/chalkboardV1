-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION 001: Organization Structure
--
-- Migrates to the new ER diagram structure:
-- - organizations (root tenant with owner)
-- - teams (one-to-one with organizations)
-- - team_segments (subdivisions within teams)
-- - org_memberships (replaces team_members)
-- - onboarding_state on profiles
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 1: Add onboarding_state to users (profiles)
-- ───────────────────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE onboarding_state AS ENUM (
    'new',                    -- Just signed up, no profile
    'profile_incomplete',     -- Started profile, missing info
    'pending_org',           -- Profile complete, needs org assignment
    'pending_team',          -- In org, needs team assignment
    'pending_position',      -- In team, needs position
    'completed'              -- Fully onboarded
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add onboarding columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_state onboarding_state DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';  -- Moved from team_members to user level

-- Create index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_state ON users(onboarding_state);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 2: Create organizations table
-- ───────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 3: Modify teams table to link to organizations
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Add org_id to teams (nullable for migration, will be made required after data migration)
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create unique constraint for one-to-one relationship (one org → one team)
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_org_id_unique ON teams(org_id) WHERE org_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 4: Create team_segments table
-- ───────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(team_id, code)
);

CREATE INDEX IF NOT EXISTS idx_team_segments_team_id ON team_segments(team_id);

-- Enable RLS
ALTER TABLE team_segments ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 5: Create org_memberships table
-- ───────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'player',  -- player, coach, admin
  segment_id UUID REFERENCES team_segments(id) ON DELETE SET NULL,  -- Optional segment assignment
  jersey_number INT,
  position_code TEXT,  -- Primary position code (e.g., 'QB', 'WR', 'CB')
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_segment_id ON org_memberships(segment_id);

-- Enable RLS
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 6: Data Migration
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- For each existing team, create an organization (owner will be first admin/coach, or first user)
INSERT INTO organizations (id, owner_id, name, created_at, updated_at)
SELECT
  uuid_generate_v4() as id,
  COALESCE(
    (SELECT tm.user_id FROM team_members tm WHERE tm.team_id = t.id AND tm.role IN ('admin', 'coach') ORDER BY tm.joined_at LIMIT 1),
    (SELECT tm.user_id FROM team_members tm WHERE tm.team_id = t.id ORDER BY tm.joined_at LIMIT 1)
  ) as owner_id,
  t.name,
  t.created_at,
  t.updated_at
FROM teams t
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.name = t.name)  -- Prevent duplicates if migration runs twice
ON CONFLICT DO NOTHING;

-- Link teams to organizations (match by name for migration)
UPDATE teams t
SET org_id = o.id
FROM organizations o
WHERE t.name = o.name
  AND t.org_id IS NULL;

-- Migrate team_members to org_memberships
INSERT INTO org_memberships (org_id, user_id, role, jersey_number, position_code, created_at, updated_at)
SELECT
  t.org_id,
  tm.user_id,
  tm.role::TEXT,
  -- Handle jersey_number which might be VARCHAR or not exist
  CASE
    WHEN tm.jersey_number ~ '^[0-9]+$' THEN CAST(tm.jersey_number AS INT)
    ELSE NULL
  END,
  tm.position::TEXT,
  tm.joined_at,
  NOW()
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
WHERE t.org_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM org_memberships om
    WHERE om.org_id = t.org_id AND om.user_id = tm.user_id
  )
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Update user onboarding states based on existing data
UPDATE users u
SET onboarding_state = CASE
  WHEN EXISTS (SELECT 1 FROM org_memberships om WHERE om.user_id = u.id AND om.position_code IS NOT NULL)
    THEN 'completed'::onboarding_state
  WHEN EXISTS (SELECT 1 FROM org_memberships om WHERE om.user_id = u.id)
    THEN 'pending_position'::onboarding_state
  WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL
    THEN 'pending_org'::onboarding_state
  ELSE 'profile_incomplete'::onboarding_state
END
WHERE onboarding_state = 'new';

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 7: Update RLS Policies
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- New helper: Check if user is in an organization
CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_memberships om
    JOIN users u ON om.user_id = u.id
    WHERE om.org_id = check_org_id AND u.auth_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Updated helper: Check if user is in a team (now checks via organization)
-- This replaces the old is_team_member function but keeps same signature for compatibility
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_memberships om
    JOIN teams t ON om.org_id = t.org_id
    JOIN users u ON om.user_id = u.id
    WHERE t.id = check_team_id AND u.auth_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- New helper: Check if user owns an organization
CREATE OR REPLACE FUNCTION public.is_org_owner(check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations o
    JOIN users u ON o.owner_id = u.id
    WHERE o.id = check_org_id AND u.auth_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organizations policies
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;
CREATE POLICY "Users can view organizations they are members of" ON organizations
  FOR SELECT USING (public.is_org_member(organizations.id));

DROP POLICY IF EXISTS "Org owners can update their organizations" ON organizations;
CREATE POLICY "Org owners can update their organizations" ON organizations
  FOR UPDATE USING (public.is_org_owner(organizations.id));

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = organizations.owner_id AND u.auth_id = auth.uid()
    )
  );

-- Team segments policies
DROP POLICY IF EXISTS "Org members can view team segments" ON team_segments;
CREATE POLICY "Org members can view team segments" ON team_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_segments.team_id AND public.is_org_member(t.org_id)
    )
  );

DROP POLICY IF EXISTS "Org admins can manage team segments" ON team_segments;
CREATE POLICY "Org admins can manage team segments" ON team_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN org_memberships om ON om.org_id = t.org_id
      JOIN users u ON om.user_id = u.id
      WHERE t.id = team_segments.team_id
        AND u.auth_id = auth.uid()
        AND om.role IN ('admin', 'coach')
    )
  );

-- Org memberships policies
DROP POLICY IF EXISTS "Org members can view other org members" ON org_memberships;
CREATE POLICY "Org members can view other org members" ON org_memberships
  FOR SELECT USING (public.is_org_member(org_memberships.org_id));

DROP POLICY IF EXISTS "Users can view their own org memberships" ON org_memberships;
CREATE POLICY "Users can view their own org memberships" ON org_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = org_memberships.user_id AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org admins can manage org memberships" ON org_memberships;
CREATE POLICY "Org admins can manage org memberships" ON org_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_memberships om
      JOIN users u ON om.user_id = u.id
      WHERE om.org_id = org_memberships.org_id
        AND u.auth_id = auth.uid()
        AND om.role IN ('admin', 'coach')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 8: Update triggers for updated_at
-- ───────────────────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_segments_updated_at ON team_segments;
CREATE TRIGGER update_team_segments_updated_at
  BEFORE UPDATE ON team_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_memberships_updated_at ON org_memberships;
CREATE TRIGGER update_org_memberships_updated_at
  BEFORE UPDATE ON org_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 9: Create views for backwards compatibility
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- View to maintain backwards compatibility with queries expecting team_members
CREATE OR REPLACE VIEW team_members_view AS
SELECT
  om.id,
  om.user_id,
  t.id as team_id,
  om.role,
  om.position_code as position,
  NULL as position_group,  -- Can be computed from segment if needed
  0 as team_xp,  -- Maintained separately, can join if needed
  NULL::INT as team_rank,
  TRUE as is_active,
  om.created_at as joined_at
FROM org_memberships om
JOIN teams t ON om.org_id = t.org_id;

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Note: team_members table is kept for now but should not be used going forward.
-- Existing foreign keys to team_members will need to be migrated to org_memberships over time.
