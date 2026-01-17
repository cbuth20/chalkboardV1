-- Migration: Add Position Visibility to Play Assignments
-- Date: 2026-01-16
-- Purpose: Allow assignments to be visible to multiple positions beyond their primary position

-- Step 1: Add visible_to_positions field to play_assignments table
ALTER TABLE play_assignments
ADD COLUMN IF NOT EXISTS visible_to_positions JSONB DEFAULT '[]'::jsonb;

-- Step 2: Backfill existing assignments - default to their own position
UPDATE play_assignments
SET visible_to_positions = jsonb_build_array(position::text)
WHERE visible_to_positions = '[]'::jsonb OR visible_to_positions IS NULL;

-- Step 3: Create GIN index for efficient querying of JSONB array
CREATE INDEX IF NOT EXISTS idx_play_assignments_visible_positions
ON play_assignments USING GIN (visible_to_positions);

-- Step 4: Add check constraint to ensure it's a valid JSON array
-- First drop if exists, then add
DO $$
BEGIN
  -- Drop constraint if it exists
  ALTER TABLE play_assignments DROP CONSTRAINT IF EXISTS visible_positions_valid;

  -- Add the constraint
  ALTER TABLE play_assignments
  ADD CONSTRAINT visible_positions_valid
  CHECK (jsonb_typeof(visible_to_positions) = 'array');
EXCEPTION
  WHEN others THEN
    -- If any error occurs, just try to add it
    BEGIN
      ALTER TABLE play_assignments
      ADD CONSTRAINT visible_positions_valid
      CHECK (jsonb_typeof(visible_to_positions) = 'array');
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Constraint already exists, that's fine
    END;
END $$;

-- Step 5: Show summary of visibility
DO $$
DECLARE
  total_assignments INTEGER;
  multi_position_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_assignments
  FROM play_assignments;

  SELECT COUNT(*) INTO multi_position_count
  FROM play_assignments
  WHERE jsonb_array_length(visible_to_positions) > 1;

  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE 'Total assignments: %', total_assignments;
  RAISE NOTICE 'Assignments visible to multiple positions: %', multi_position_count;
  RAISE NOTICE 'All existing assignments now visible to their primary position';
END $$;
