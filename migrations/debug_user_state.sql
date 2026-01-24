-- Debug user state for auth_id: efb810dd-afd7-4027-a150-b83a08b7f1e2
-- Run this in Supabase SQL Editor to see what's going on

-- 1. Check users table
SELECT
  id,
  auth_id,
  email,
  first_name,
  last_name,
  role,
  onboarding_state,
  created_at,
  updated_at
FROM users
WHERE auth_id = 'efb810dd-afd7-4027-a150-b83a08b7f1e2';

-- 2. Check org_memberships table
SELECT
  om.id,
  om.org_id,
  om.user_id,
  om.team_id,
  om.role,
  om.position_code,
  om.jersey_number,
  o.name as org_name
FROM org_memberships om
LEFT JOIN organizations o ON o.id = om.org_id
WHERE om.user_id IN (
  SELECT id FROM users WHERE auth_id = 'efb810dd-afd7-4027-a150-b83a08b7f1e2'
);

-- 3. Fix inconsistent onboarding state (if user has profile, state should not be 'new')
/*
UPDATE users
SET onboarding_state = CASE
  WHEN EXISTS (
    SELECT 1 FROM org_memberships om
    WHERE om.user_id = users.id
      AND om.team_id IS NOT NULL
      AND om.position_code IS NOT NULL
  ) THEN 'completed'
  WHEN EXISTS (
    SELECT 1 FROM org_memberships om
    WHERE om.user_id = users.id
      AND om.team_id IS NOT NULL
  ) THEN CASE WHEN users.role = 'player' THEN 'pending_position' ELSE 'completed' END
  WHEN EXISTS (
    SELECT 1 FROM org_memberships om
    WHERE om.user_id = users.id
  ) THEN 'pending_team'
  WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 'pending_org'
  ELSE 'profile_incomplete'
END,
updated_at = NOW()
WHERE auth_id = 'efb810dd-afd7-4027-a150-b83a08b7f1e2'
  AND onboarding_state = 'new'
  AND first_name IS NOT NULL;
*/
