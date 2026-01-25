-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- RESET ONBOARDING STATE FOR TESTING
-- Run this in Supabase SQL Editor to test the onboarding flow with your existing account
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Option 1: Reset to 'new' (start from beginning)
UPDATE users
SET onboarding_state = 'new'
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Option 2: Reset to 'pending_org' (skip profile, test org/team flow)
UPDATE users
SET onboarding_state = 'pending_org'
WHERE email = 'YOUR_EMAIL_HERE';

-- Option 3: Reset to 'pending_position' (test position selection)
UPDATE users
SET onboarding_state = 'pending_position'
WHERE email = 'YOUR_EMAIL_HERE';

-- Optional: Delete org membership to test joining flow
-- DELETE FROM org_memberships
-- WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL_HERE');

-- Check your current state
SELECT
  email,
  first_name,
  last_name,
  role,
  onboarding_state
FROM users
WHERE email = 'YOUR_EMAIL_HERE';
