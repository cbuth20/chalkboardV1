-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- FIX INVALID POSITION VALUES
--
-- This script fixes any play_assignments that have invalid position enum values
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Update HB (Halfback) to RB (Running Back)
UPDATE play_assignments
SET position = 'RB'
WHERE position = 'HB';

-- Update TB (Tailback) to RB (Running Back)
UPDATE play_assignments
SET position = 'RB'
WHERE position = 'TB';

-- Update WR (Wide Receiver) to X
UPDATE play_assignments
SET position = 'X'
WHERE position = 'WR';

-- Verify the fix
SELECT position, COUNT(*) as count
FROM play_assignments
GROUP BY position
ORDER BY position;

-- Should only show valid positions: QB, RB, FB, X, Z, H, Y, TE, LT, LG, C, RG, RT
