-- Migration: Enforce Position Assignment for Players
-- Date: 2026-01-16
-- Purpose: Convert team_members.position from football_position to skill_position
--          and make position required for players (allow NULL for coaches/admins)

-- IMPORTANT: This migration converts from football_position (21 positions) to skill_position (13 positions)
-- Defensive and special teams positions will be set to NULL and players will need to re-select

-- Step 1: Drop the constraint if position is currently required
ALTER TABLE team_members
DROP CONSTRAINT IF EXISTS position_required_for_players;

-- Step 2: Convert position column from football_position to skill_position
-- Maps offensive positions, sets defensive/ST positions to NULL
ALTER TABLE team_members
ALTER COLUMN position DROP DEFAULT,
ALTER COLUMN position TYPE skill_position
USING CASE
  WHEN position IS NULL THEN NULL
  -- Map football_position values to skill_position
  WHEN position::text = 'QB' THEN 'QB'::skill_position
  WHEN position::text = 'RB' THEN 'RB'::skill_position
  WHEN position::text = 'FB' THEN 'FB'::skill_position
  WHEN position::text = 'WR' THEN 'X'::skill_position  -- Default WR to X receiver
  WHEN position::text = 'TE' THEN 'TE'::skill_position
  WHEN position::text IN ('OT', 'LT') THEN 'LT'::skill_position
  WHEN position::text IN ('OG', 'LG') THEN 'LG'::skill_position
  WHEN position::text = 'C' THEN 'C'::skill_position
  WHEN position::text = 'RG' THEN 'RG'::skill_position
  WHEN position::text = 'RT' THEN 'RT'::skill_position
  -- Defensive and special teams positions -> NULL (will need reassignment)
  ELSE NULL
END;

-- Step 3: For testing/development, you can temporarily disable the constraint
-- In production, ensure all players have positions assigned before running this
-- Uncomment the next line to require positions immediately:
--
-- ALTER TABLE team_members
-- ADD CONSTRAINT position_required_for_players
-- CHECK (
--   (role = 'player' AND position IS NOT NULL) OR
--   (role IN ('coach', 'admin'))
-- );

-- Step 4: Create index for faster position lookups
CREATE INDEX IF NOT EXISTS idx_team_members_role_position
ON team_members(role, position)
WHERE role = 'player';

-- Step 5: Show summary of changes needed
DO $$
DECLARE
  unassigned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unassigned_count
  FROM team_members
  WHERE role = 'player' AND position IS NULL;

  IF unassigned_count > 0 THEN
    RAISE NOTICE '⚠️  % player(s) need position assignments', unassigned_count;
    RAISE NOTICE 'Coaches can assign positions at: /coach/team';
    RAISE NOTICE 'Players can set their own position at: /settings';
  ELSE
    RAISE NOTICE '✅ All players have positions assigned';
  END IF;
END $$;
