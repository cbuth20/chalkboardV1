-- Migration: Sync org_memberships role with users role
-- This ensures that the role in org_memberships matches the role in users table
-- Run this in Supabase SQL Editor

-- Sync roles: Update org_memberships.role to match users.role
UPDATE org_memberships om
SET role = u.role,
    updated_at = NOW()
FROM users u
WHERE om.user_id = u.id
  AND om.role != u.role;

-- Verify the changes
SELECT
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.role as user_role,
  om.role as membership_role,
  CASE
    WHEN u.role = om.role THEN '✓ Synced'
    ELSE '✗ Mismatch'
  END as status
FROM users u
LEFT JOIN org_memberships om ON om.user_id = u.id
WHERE om.id IS NOT NULL
ORDER BY u.email;
