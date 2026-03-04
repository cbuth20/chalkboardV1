-- Add front_family column to player_block_coverages
-- Classifies defensive fronts as 'Odd', 'Even', or '5 Down' based on
-- center/guard coverage (not just DL count)
ALTER TABLE player_block_coverages
ADD COLUMN IF NOT EXISTS front_family VARCHAR(10) DEFAULT NULL;

COMMENT ON COLUMN player_block_coverages.front_family IS 'Defensive front family: Odd (center covered), Even (center uncovered, guards covered), or 5 Down (center + both guards covered)';
