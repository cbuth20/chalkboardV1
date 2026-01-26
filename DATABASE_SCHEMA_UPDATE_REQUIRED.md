# Database Schema Update Required

## Issue
File upload is failing with error:
```
null value in column "team_id" of relation "playbook_metadata" violates not-null constraint
```

## Root Cause
The `playbook_metadata` table still has `team_id` as NOT NULL, but after the org-scoped migration, `team_id` should be nullable (optional) because:

1. `org_id` is now the required field for organization membership
2. `team_id` is only used as an optional filter for multi-team organizations
3. Single-team organizations or org-wide content should have `team_id = NULL`

## Database Schema Before Migration

```sql
CREATE TABLE playbook_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),  -- ❌ NOT NULL constraint
  org_id UUID NOT NULL REFERENCES organizations(id),
  -- ... other columns
);
```

## Database Schema After Migration

```sql
CREATE TABLE playbook_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NULL REFERENCES teams(id),  -- ✅ Now nullable
  org_id UUID NOT NULL REFERENCES organizations(id),
  -- ... other columns
);
```

## Migration Steps

### Option 1: Supabase Dashboard (Recommended for Quick Fix)

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **playbook_metadata**
3. Click on the `team_id` column
4. Uncheck "Is Nullable: No" or change to "Allow NULL"
5. Save changes

### Option 2: SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
-- Make team_id nullable
ALTER TABLE playbook_metadata
ALTER COLUMN team_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN playbook_metadata.team_id IS
'Optional team filter for multi-team organizations. NULL means content applies to entire organization.';
```

4. Click "Run" or press Cmd/Ctrl + Enter

### Option 3: Migration File (For Version Control)

A migration file has been created at:
```
DATABASE_MIGRATION_TEAM_ID_NULLABLE.sql
```

To apply:
1. Copy the SQL from the migration file
2. Run it in Supabase SQL Editor
3. Commit the migration file to version control

## Verification

After running the migration, verify it worked:

```sql
SELECT
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'playbook_metadata'
  AND column_name IN ('org_id', 'team_id')
ORDER BY ordinal_position;
```

**Expected Result:**
```
column_name | is_nullable | data_type | column_default
------------|-------------|-----------|---------------
org_id      | NO          | uuid      | NULL
team_id     | YES         | uuid      | NULL
```

## Why This Change Is Needed

### Before (Team-Scoped)
- Every playbook_metadata record required a team_id
- Users without team assignment couldn't upload content
- Multi-org users needed separate records per team

### After (Org-Scoped)
- `org_id` is required (NOT NULL) - content belongs to an organization
- `team_id` is optional (NULL) - used to filter content by team
- Benefits:
  - ✅ Single-team organizations: team_id = NULL (content applies to whole org)
  - ✅ Multi-team organizations: team_id can specify which team
  - ✅ Users without team assignment can upload content
  - ✅ Org-wide content (all teams): team_id = NULL

## Example Records

### Org-Wide Content (NULL team_id)
```sql
INSERT INTO playbook_metadata (org_id, team_id, formation_name, ...)
VALUES ('org-123', NULL, 'Spread', ...);
-- Applies to entire organization
```

### Team-Specific Content
```sql
INSERT INTO playbook_metadata (org_id, team_id, formation_name, ...)
VALUES ('org-123', 'team-456', 'Spread', ...);
-- Applies only to team-456 within org-123
```

## Impact on Existing Data

If you have existing records with team_id values, they will NOT be affected. The migration only changes the constraint, not the data.

### Check Existing Data
```sql
-- Count records by team_id presence
SELECT
  COUNT(*) FILTER (WHERE team_id IS NOT NULL) as with_team,
  COUNT(*) FILTER (WHERE team_id IS NULL) as without_team,
  COUNT(*) as total
FROM playbook_metadata;
```

## Related Files Changed

### Frontend
- ✅ `src/app/play-recognition/page.tsx` - Now sends orgId
- ✅ MetadataForm.tsx - No changes needed (doesn't handle IDs)

### Backend
- ✅ `netlify/functions/playbooks.ts` - Uses org_id (required), team_id (optional)
- ✅ `src/app/api/playbooks/route.ts` - Uses org_id (required), team_id (optional)

## Testing After Migration

1. **Upload without error:**
   ```bash
   # Sign in as coach
   # Navigate to /play-recognition
   # Upload a play with metadata
   # Should succeed without team_id error
   ```

2. **Verify database:**
   ```sql
   -- Check recent uploads have org_id set
   SELECT
     id,
     org_id,
     team_id,
     formation_name,
     created_at
   FROM playbook_metadata
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Test both scenarios:**
   - Upload content as user with team assignment (team_id should be NULL or valid UUID)
   - Upload content as user without team assignment (team_id should be NULL)

## Rollback (If Needed)

If you need to rollback (not recommended):

```sql
-- WARNING: This will fail if you have any records with team_id = NULL
ALTER TABLE playbook_metadata
ALTER COLUMN team_id SET NOT NULL;
```

**Note:** You cannot rollback if you have NULL team_id values. You would need to:
1. Update all NULL team_id records to a valid team_id
2. Then apply the NOT NULL constraint

## Common Questions

**Q: What if I want all my content to be team-specific?**
A: You can still pass a teamId when uploading. The API accepts it as an optional parameter.

**Q: Will this break existing team-filtered queries?**
A: No. Queries filtering by team_id will still work. NULL values simply won't match the filter.

**Q: Should I migrate existing org-wide content to have team_id = NULL?**
A: Not necessary immediately, but it would make the data model cleaner. You can run:
```sql
-- Optional: Set team_id to NULL for org-wide content
UPDATE playbook_metadata
SET team_id = NULL
WHERE /* your criteria for org-wide content */;
```

---

**Migration Date:** January 26, 2026
**Status:** ⏳ Pending - User needs to run SQL migration
**Priority:** 🔴 HIGH - Blocking file uploads
**Estimated Time:** < 1 minute to apply migration
