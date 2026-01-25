-- Check admin user status
-- Run this in Supabase SQL Editor

-- 1. Check user record
SELECT id, auth_id, email, first_name, last_name, role, onboarding_state
FROM users
WHERE email = 'cbuth20@gmail.com';

-- 2. Check org membership (using the user ID from above)
SELECT om.id, om.org_id, om.user_id, om.role, om.position_code, om.jersey_number,
       o.name as org_name
FROM org_memberships om
LEFT JOIN organizations o ON o.id = om.org_id
WHERE om.user_id = (SELECT id FROM users WHERE email = 'cbuth20@gmail.com');

-- 3. If membership role is wrong, fix it:
-- UPDATE org_memberships
-- SET role = 'admin'
-- WHERE user_id = (SELECT id FROM users WHERE email = 'cbuth20@gmail.com');
