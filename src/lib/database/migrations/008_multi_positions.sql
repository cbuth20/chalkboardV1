-- Migration: Multi-Position Support
-- Date: 2026-01-16
-- Purpose: Allow users to have multiple positions (e.g., QB and RB)

-- Step 1: Add new column for positions array
ALTER TABLE team_members
ADD COLUMN positions JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing single position to positions array
UPDATE team_members
SET positions = CASE
  WHEN position IS NOT NULL THEN jsonb_build_array(position::text)
  ELSE '[]'::jsonb
END;

-- Step 3: Create index for performance
CREATE INDEX idx_team_members_positions ON team_members USING GIN (positions);

-- Step 4: Add check constraint to ensure it's an array
ALTER TABLE team_members
ADD CONSTRAINT positions_is_array CHECK (jsonb_typeof(positions) = 'array');

-- Note: We're keeping the old 'position' column for now for backwards compatibility
-- It will be deprecated in a future migration
-- For now, we'll use 'positions' (plural) going forward

-- Optional: Comment on the column
COMMENT ON COLUMN team_members.positions IS 'Array of positions this user plays (e.g., ["QB", "RB"])';
COMMENT ON COLUMN team_members.position IS 'DEPRECATED: Use positions array instead. Kept for backwards compatibility.';
