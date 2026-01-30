-- =====================================================================
-- Migration 013: Play Classification System
--
-- Adds enhanced play categorization for better playbook organization:
-- 1. Unit (O/D/ST) - which side of ball
-- 2. Playbook Section - coach-defined folder structure
-- 3. Primary Classification - varies by unit type
-- 4. Situation - optional down/distance context
-- =====================================================================

-- 1. Create unit enum (Offense, Defense, Special Teams)
DO $$ BEGIN
    CREATE TYPE unit_type AS ENUM ('O', 'D', 'ST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE unit_type IS 'Unit classification: O (Offense), D (Defense), ST (Special Teams)';

-- 2. Add classification fields to plays table
ALTER TABLE plays
ADD COLUMN IF NOT EXISTS unit unit_type,
ADD COLUMN IF NOT EXISTS playbook_section TEXT,
ADD COLUMN IF NOT EXISTS primary_classification TEXT,
ADD COLUMN IF NOT EXISTS situation TEXT;

-- Add comments for clarity
COMMENT ON COLUMN plays.unit IS 'Which unit this play belongs to: O (Offense), D (Defense), or ST (Special Teams)';
COMMENT ON COLUMN plays.playbook_section IS 'Coach-defined folder/section (e.g., Pass Game, Run Game, Third Down, Red Zone)';
COMMENT ON COLUMN plays.primary_classification IS 'Primary type based on unit: Offense (RUN/PASS), Defense (COVERAGE/PRESSURE/FRONT), ST (KO/Punt/FG/etc.)';
COMMENT ON COLUMN plays.situation IS 'Optional situational context (e.g., "1st-2nd Down", "3rd Down", "Red Zone")';

-- 3. Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_plays_unit ON plays(unit) WHERE unit IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plays_playbook_section ON plays(playbook_section) WHERE playbook_section IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plays_primary_classification ON plays(primary_classification) WHERE primary_classification IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plays_situation ON plays(situation) WHERE situation IS NOT NULL;

-- 4. Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_plays_classification
ON plays(unit, playbook_section, primary_classification)
WHERE unit IS NOT NULL;

-- 5. Migrate existing data based on play_type
-- Default offensive plays to 'O' unit
UPDATE plays
SET unit = 'O'
WHERE play_type IN ('PASS', 'RUN', 'RPO', 'SCREEN')
  AND unit IS NULL;

-- Set primary_classification based on existing play_type for offense
UPDATE plays
SET primary_classification = 'PASS'
WHERE play_type IN ('PASS', 'RPO', 'SCREEN')
  AND unit = 'O'
  AND primary_classification IS NULL;

UPDATE plays
SET primary_classification = 'RUN'
WHERE play_type = 'RUN'
  AND unit = 'O'
  AND primary_classification IS NULL;

-- Set default playbook section based on play_type
UPDATE plays
SET playbook_section = 'Pass Game'
WHERE play_type IN ('PASS', 'RPO', 'SCREEN')
  AND unit = 'O'
  AND playbook_section IS NULL;

UPDATE plays
SET playbook_section = 'Run Game'
WHERE play_type = 'RUN'
  AND unit = 'O'
  AND playbook_section IS NULL;
