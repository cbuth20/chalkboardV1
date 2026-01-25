# Migration Guide: Org Structure (001)

## Overview
This migration adds the organization structure to match your ER diagram:
- `organizations` (root tenant)
- `org_memberships` (user-org relationships)
- `team_segments` (team subdivisions)
- `onboarding_state` (user onboarding tracking)

## ⚠️ Before You Start

**IMPORTANT:** This migration will:
1. ✅ Preserve all existing data
2. ✅ Migrate `team_members` data to `org_memberships`
3. ✅ Create organizations for each existing team
4. ⚠️ Keep `team_members` table for backwards compatibility (deprecated)

**Backup Recommendation:** While this migration is designed to be safe, consider taking a Supabase backup first.

## Running the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open SQL Editor**
   - Go to https://supabase.com/dashboard/project/svqkijmzpmxcmmapsdzp
   - Navigate to "SQL Editor" in the left sidebar

2. **Run the Migration**
   - Click "New Query"
   - Copy the entire contents of `migrations/001_org_structure_migration.sql`
   - Paste into the SQL editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

3. **Verify Success**
   - Check for "Success. No rows returned" or similar message
   - No errors should appear

### Option 2: Supabase CLI (if you install it later)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref svqkijmzpmxcmmapsdzp

# Run migration
supabase db push
```

## Verification Steps

After running the migration, verify it worked:

### 1. Check New Tables Exist

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'org_memberships', 'team_segments')
ORDER BY table_name;
```

Expected result: 3 rows (all three tables)

### 2. Check Data Migration

```sql
-- Check that organizations were created
SELECT COUNT(*) as org_count FROM organizations;

-- Check that memberships were migrated
SELECT COUNT(*) as membership_count FROM org_memberships;

-- Check that teams are linked to orgs
SELECT
  t.name as team_name,
  o.name as org_name
FROM teams t
LEFT JOIN organizations o ON t.org_id = o.id
LIMIT 10;
```

### 3. Check Onboarding State Column

```sql
-- Check that onboarding_state was added to users
SELECT
  first_name,
  last_name,
  onboarding_state,
  role
FROM users
LIMIT 10;
```

### 4. Test RLS Policies

```sql
-- Check that RLS is enabled on new tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'org_memberships', 'team_segments')
ORDER BY tablename;
```

All should have `rowsecurity = true`

## Expected Results Summary

| Check | Expected Count |
|-------|----------------|
| New tables created | 3 (organizations, org_memberships, team_segments) |
| Organizations created | Same as number of teams |
| Org memberships created | Same as team_members count |
| Teams with org_id set | All teams |
| Users with onboarding_state | All users |

## Rollback (if needed)

If something goes wrong, you can rollback:

```sql
-- Drop new tables (CASCADE will clean up foreign keys)
DROP TABLE IF EXISTS team_segments CASCADE;
DROP TABLE IF EXISTS org_memberships CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Remove org_id from teams
ALTER TABLE teams DROP COLUMN IF EXISTS org_id;

-- Remove onboarding columns from users
ALTER TABLE users
  DROP COLUMN IF EXISTS onboarding_state,
  DROP COLUMN IF EXISTS full_name,
  DROP COLUMN IF EXISTS role;

-- Drop new enum types
DROP TYPE IF EXISTS onboarding_state;
```

## Troubleshooting

### Error: "relation already exists"
The migration tries to handle this with `IF NOT EXISTS`, but if you see this:
- The migration may have partially run before
- Safe to continue, just check verification steps

### Error: "column already exists"
Same as above - use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` pattern

### Error: "foreign key violation"
This shouldn't happen due to the migration order, but if it does:
- Check that `users` table has data
- Ensure `team_members` references valid `team_id` values

## Next Steps After Migration

1. ✅ Run verification queries above
2. ✅ Test API endpoints (see `migrations/TEST_ENDPOINTS.md`)
3. ✅ Update frontend to use new structure
4. 🔄 Gradually migrate code from `team_members` to `org_memberships`
5. 🗑️ Eventually drop `team_members` table (not in this migration)
