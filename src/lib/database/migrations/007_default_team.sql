-- Migration: Find Existing Default Team
-- Date: 2026-01-16
-- Purpose: Display the existing team ID to use as DEFAULT_TEAM_ID

-- Query to find the existing team
SELECT
  id as team_id,
  name as team_name,
  slug as team_slug,
  created_at
FROM teams
ORDER BY created_at ASC
LIMIT 1;
