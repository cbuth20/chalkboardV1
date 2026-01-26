-- Migration: Make team_id nullable in playbook_metadata table
-- Date: 2026-01-26
-- Reason: Organization-scoped multi-tenancy - team_id is now optional

-- Make team_id column nullable
ALTER TABLE playbook_metadata
ALTER COLUMN team_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN playbook_metadata.team_id IS
'Optional team filter for multi-team organizations. NULL means content applies to entire organization.';

-- Verify the change
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'playbook_metadata'
  AND column_name IN ('org_id', 'team_id')
ORDER BY ordinal_position;
