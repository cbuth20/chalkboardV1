-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CREATE DEFAULT TEAM FOR TESTING
--
-- This creates a default team that can be used for testing/development
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Create default team if it doesn't exist
INSERT INTO teams (id, name, slug, season, timezone)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Default Team',
  'default-team',
  '2024',
  'America/New_York'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the team was created
SELECT id, name, slug FROM teams WHERE id = '00000000-0000-0000-0000-000000000000';
