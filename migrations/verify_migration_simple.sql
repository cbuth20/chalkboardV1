-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION 001 VERIFICATION (Simple - for Supabase Dashboard)
-- Copy and paste this into Supabase SQL Editor after running the migration
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- 1. Check new tables exist (should return 3 rows)
SELECT 'New Tables' as check_name, COUNT(*) as result, 'Should be 3' as expected
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'org_memberships', 'team_segments');

-- 2. Check organizations were created
SELECT 'Organizations' as check_name, COUNT(*) as result, 'Should match team count' as expected
FROM organizations;

-- 3. Check org_memberships were created
SELECT 'Org Memberships' as check_name, COUNT(*) as result, 'Should match team_members count' as expected
FROM org_memberships;

-- 4. Check teams have org_id
SELECT 'Teams Linked to Orgs' as check_name, COUNT(*) as result, 'Should be all teams' as expected
FROM teams
WHERE org_id IS NOT NULL;

-- 5. Check users have onboarding_state
SELECT 'Users with Onboarding State' as check_name, COUNT(*) as result, 'Should be all users' as expected
FROM users
WHERE onboarding_state IS NOT NULL;

-- 6. Check RLS enabled on new tables
SELECT 'RLS Enabled' as check_name, COUNT(*) as result, 'Should be 3' as expected
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'org_memberships', 'team_segments')
AND rowsecurity = true;

-- 7. Sample data check - show first org with members
SELECT
  o.name as organization_name,
  COUNT(om.id) as member_count,
  t.name as team_name
FROM organizations o
LEFT JOIN org_memberships om ON om.org_id = o.id
LEFT JOIN teams t ON t.org_id = o.id
GROUP BY o.id, o.name, t.name
LIMIT 5;
