-- Add protection_concept column to support universal protection terminology
-- This separates the team's display name (protection_type) from the behavioral classification (protection_concept)

ALTER TABLE player_block_coverages
ADD COLUMN IF NOT EXISTS protection_concept VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_block_coverages_concept
  ON player_block_coverages(user_id, protection_concept);

-- Backfill existing rows from legacy numbered schemes
UPDATE player_block_coverages
SET protection_concept = CASE
  WHEN protection_type ~ '^3[56]' THEN 'full_slide'
  WHEN protection_type ~ '^6[45]' THEN 'half_slide'
  WHEN protection_type IN ('433', '432', '201', '200') THEN 'play_action'
  WHEN protection_type IN ('50', '51') THEN 'full_slide'
  WHEN play_action = true THEN 'play_action'
  WHEN free_release = true THEN 'full_slide'
  ELSE 'full_slide'
END
WHERE protection_concept IS NULL;
