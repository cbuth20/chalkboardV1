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
WHERE owner_id = '82844ede-4ad2-44be-9307-bf7798926a1e'
ORDER BY created_at DESC;

-- If the above looks good, uncomment and run this to delete:
/*
DELETE FROM organizations
WHERE owner_id = '82844ede-4ad2-44be-9307-bf7798926a1e'
  AND id != '986d0f15-e926-4f76-89e1-bf7c7f731923';  -- Keep the active one
*/

-- Verify what's left:
-- SELECT * FROM organizations WHERE owner_id = '82844ede-4ad2-44be-9307-bf7798926a1e';
