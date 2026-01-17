-- Migration: Add positions array column to team_members table
-- This allows team members to have multiple positions instead of just one

-- Add positions column as JSONB array
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '[]'::jsonb;

-- Backfill existing data: migrate single position to positions array
UPDATE team_members
SET positions =
  CASE
    WHEN position IS NOT NULL THEN jsonb_build_array(position::text)
    ELSE '[]'::jsonb
  END
WHERE positions = '[]'::jsonb OR positions IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_positions
ON team_members USING GIN (positions);

-- Add check constraint: ensure positions is always an array
ALTER TABLE team_members
ADD CONSTRAINT IF NOT EXISTS positions_is_array
CHECK (jsonb_typeof(positions) = 'array');

-- Optional: Add comment for documentation
COMMENT ON COLUMN team_members.positions IS 'Array of positions this team member plays. For backwards compatibility, position column is kept and synced with first element of positions array.';
