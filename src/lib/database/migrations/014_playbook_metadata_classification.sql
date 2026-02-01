-- =====================================================================
-- Migration 014: Add Classification Fields to Playbook Metadata
--
-- Adds v1 classification fields to playbook_metadata table to store
-- classification info for files before they become plays
-- =====================================================================

-- Add classification fields to playbook_metadata
ALTER TABLE playbook_metadata
ADD COLUMN IF NOT EXISTS unit unit_type,
ADD COLUMN IF NOT EXISTS playbook_section TEXT,
ADD COLUMN IF NOT EXISTS primary_classification TEXT,
ADD COLUMN IF NOT EXISTS situation TEXT,
ADD COLUMN IF NOT EXISTS play_type TEXT;

-- Add comments
COMMENT ON COLUMN playbook_metadata.unit IS 'Which unit this metadata belongs to: O (Offense), D (Defense), or ST (Special Teams)';
COMMENT ON COLUMN playbook_metadata.playbook_section IS 'Coach-defined folder/section (e.g., Pass Game, Run Game, Third Down, Red Zone)';
COMMENT ON COLUMN playbook_metadata.primary_classification IS 'Primary type based on unit: Offense (RUN/PASS), Defense (COVERAGE/PRESSURE/FRONT), ST (KO/Punt/FG/etc.)';
COMMENT ON COLUMN playbook_metadata.situation IS 'Optional situational context (e.g., "1st-2nd Down", "3rd Down", "Red Zone")';
COMMENT ON COLUMN playbook_metadata.play_type IS 'Play type for offense (PASS, RUN, RPO, SCREEN)';
