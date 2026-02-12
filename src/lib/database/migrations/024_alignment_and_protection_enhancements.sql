-- Enhancement: Alignment data for formations + Protection scenario fields
-- Supports the reworked Formation Trainer (alignment mode) and RB Protection Trainer

-- 1. Add alignments column to player_formations
ALTER TABLE player_formations
ADD COLUMN IF NOT EXISTS alignments JSONB DEFAULT '{}';
-- Format: { "X": { "spot": "Split wide LEFT", "detail": "..." }, "Y": { ... }, ... }

-- 2. Add protection scenario fields to player_block_coverages
ALTER TABLE player_block_coverages
ADD COLUMN IF NOT EXISTS protection_type VARCHAR(50),       -- "360", "64", "350", "433", "201", etc.
ADD COLUMN IF NOT EXISTS call_side VARCHAR(10),             -- "left" or "right"
ADD COLUMN IF NOT EXISTS solid_call BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS free_release BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS play_action BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS naked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hoss BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scat_release VARCHAR(10),          -- "call", "back", or null
ADD COLUMN IF NOT EXISTS explanation TEXT;                   -- Why this is the correct answer

-- 3. Add index on protection_type for filtering
CREATE INDEX IF NOT EXISTS idx_block_coverages_protection_type
  ON player_block_coverages(user_id, protection_type);
