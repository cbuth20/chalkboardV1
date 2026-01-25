-- Cleanup duplicate organizations from testing
-- This keeps your active org "Central High School" and removes the test duplicates

-- IMPORTANT: Review this carefully before running!
-- Your active org is: 986d0f15-e926-4f76-89e1-bf7c7f731923 (Central High School)

-- First, let's see what we're about to delete:
SELECT
  id,
  name,
  created_at,
  CASE
    WHEN id = '986d0f15-e926-4f76-89e1-bf7c7f731923' THEN '✓ KEEP (Active)'
    ELSE '✗ DELETE'
  END as action
FROM organizations
WHERE owner_id = '5568feb7-1ba5-4d11-8d24-e3b082388dd0'
ORDER BY created_at DESC;

-- If the above looks good, uncomment and run this to delete:
/*
DELETE FROM organizations
WHERE owner_id = '5568feb7-1ba5-4d11-8d24-e3b082388dd0'
  AND id != '986d0f15-e926-4f76-89e1-bf7c7f731923';  -- Keep the active one
*/

-- Verify what's left:
-- SELECT * FROM organizations WHERE owner_id = '5568feb7-1ba5-4d11-8d24-e3b082388dd0';
