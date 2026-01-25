-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION 001 VERIFICATION SCRIPT
--
-- Run this script after running 001_org_structure_migration.sql to verify success
-- ═══════════════════════════════════════════════════════════════════════════════════════════

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'MIGRATION 001 VERIFICATION'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 1. Verify New Tables Exist
-- ───────────────────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '✓ Checking new tables exist...'

SELECT
  table_name,
  CASE
    WHEN table_name IN ('organizations', 'org_memberships', 'team_segments') THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'org_memberships', 'team_segments')
ORDER BY table_name;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 2. Verify Data Counts
-- ───────────────────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '✓ Checking data counts...'

SELECT
  'organizations' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END as status
FROM organizations

UNION ALL

SELECT
  'org_memberships' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END as status
FROM org_memberships

UNION ALL

SELECT
  'team_segments' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) >= 0 THEN '✅ OK (optional)' ELSE '⚠️ ERROR' END as status
FROM team_segments

UNION ALL

SELECT
  'teams (with org_id)' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ LINKED' ELSE '❌ NOT LINKED' END as status
FROM teams
WHERE org_id IS NOT NULL

ORDER BY table_name;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 3. Verify Users Have Onboarding State
-- ───────────────────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '✓ Checking user onboarding states...'

SELECT
  onboarding_state,
  COUNT(*) as user_count
FROM users
GROUP BY onboarding_state
ORDER BY onboarding_state;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 4. Verify Data Migration from team_members
-- ───────────────────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '✓ Checking data migration from team_members...'

SELECT
  'team_members' as source_table,
  COUNT(*) as original_count
FROM team_members

UNION ALL

SELECT
  'org_memberships' as destination_table,
  COUNT(*) as migrated_count
FROM org_memberships

ORDER BY source_table;

\echo ''
\echo '⚠️ NOTE: Counts should match. If org_memberships is 0 but team_members > 0, migration failed.'

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 5. Verify Org-Team Relationships
-- ───────────────────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '✓ Checking org-team relationships...'

SELECT
  o.name as organization,
  t.name as team,
  COUNT(om.id) as member_count,
  CASE
    WHEN t.id IS NULL THEN '❌ NO TEAM'
    WHEN COUNT(om.id) = 0 THEN '⚠️ NO MEMBERS'
    ELSE '✅ OK'
  END as status
FROM organizations o
LEFT JOIN teams t ON t.org_id = o.id
LEFT JOIN org_memberships om ON om.org_id = o.id
GROUP BY o.id, o.name, t.id, t.name
ORDER BY o.name;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 6. Verify RLS Policies
-- ───────────────────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '✓ Checking RLS is enabled on new tables...'

SELECT
  tablename,
  rowsecurity,
  CASE
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'org_memberships', 'team_segments')
ORDER BY tablename;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 7. Check Sample Data
-- ───────────────────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '✓ Sample data from new structure...'

SELECT
  u.first_name || ' ' || u.last_name as user_name,
  u.role as user_role,
  u.onboarding_state,
  o.name as organization,
  om.role as membership_role,
  om.position_code,
  om.jersey_number
FROM users u
LEFT JOIN org_memberships om ON om.user_id = u.id
LEFT JOIN organizations o ON o.id = om.org_id
LIMIT 10;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'VERIFICATION COMPLETE'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Review the results above. All checks should show ✅ or ⚠️ (warnings are OK).'
\echo 'If you see ❌ errors, review the migration script and data.'
