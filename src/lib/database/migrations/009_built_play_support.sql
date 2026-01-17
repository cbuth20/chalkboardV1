-- Migration: Built Play Support
-- Date: 2026-01-16
-- Purpose: Add support for plays created with the play builder (structured data) vs uploaded images

-- Step 1: Add columns to playbook_metadata table to support built plays
ALTER TABLE playbook_metadata
ADD COLUMN is_built_play BOOLEAN DEFAULT FALSE,
ADD COLUMN play_data JSONB DEFAULT NULL;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN playbook_metadata.is_built_play IS 'True if play was created with play builder, false if uploaded as image/PDF';
COMMENT ON COLUMN playbook_metadata.play_data IS 'Structured play data (players, routes, blocking) for built plays. NULL for uploaded images.';

-- Step 3: Create index on is_built_play for filtering
CREATE INDEX idx_playbook_metadata_is_built_play ON playbook_metadata(is_built_play);

-- Step 4: Create GIN index on play_data for JSONB queries
CREATE INDEX idx_playbook_metadata_play_data ON playbook_metadata USING GIN (play_data);

-- Step 5: Add check constraint to ensure play_data is only set when is_built_play is true
ALTER TABLE playbook_metadata
ADD CONSTRAINT play_data_requires_built_play
CHECK (
  (is_built_play = TRUE AND play_data IS NOT NULL) OR
  (is_built_play = FALSE AND play_data IS NULL) OR
  (is_built_play IS NULL AND play_data IS NULL)
);

-- Note: Existing records will have is_built_play = FALSE and play_data = NULL by default
-- This maintains backward compatibility with uploaded images/PDFs
