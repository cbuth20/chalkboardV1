-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION 002: Multiple Teams Per Organization
--
-- Changes:
-- - Remove unique constraint on teams.org_id to allow multiple teams per org
-- - Add team_id to org_memberships for direct team assignment
-- - Update onboarding flow to support team selection
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 1: Remove unique constraint (allow multiple teams per org)
-- ───────────────────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_teams_org_id_unique;

-- Create regular index instead (multiple teams allowed)
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON teams(org_id);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 2: Add team_id to org_memberships
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Add team_id column to track which team the member is on
ALTER TABLE org_memberships
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for team queries
CREATE INDEX IF NOT EXISTS idx_org_memberships_team_id ON org_memberships(team_id);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 3: Migrate existing data (set team_id from org_id)
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- For existing memberships, assign them to their org's team
UPDATE org_memberships om
SET team_id = t.id
FROM teams t
WHERE om.org_id = t.org_id
  AND om.team_id IS NULL;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 4: Update onboarding states
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- pending_team state is now used for both coaches (creating team) and players (selecting team)
-- No schema change needed, just clarifying the flow
