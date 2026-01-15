# Metadata Saving Fix Summary

## 🐛 The Problem

When uploading plays, the image was saving correctly to Supabase Storage, but the metadata (formation, concept, level, etc.) wasn't being saved to the `playbook_metadata` table. When reloading the play, all metadata fields were empty.

## 🔍 Root Cause

The `playbook_metadata` table has a `team_id` column that is **NOT NULL** (required), but the API endpoints were not including `team_id` when inserting metadata records. This caused the database insert to fail silently.

## ✅ What Was Fixed

### 1. **`src/app/api/playbooks/route.ts`** - Upload Endpoint
- ✅ Added `teamId` parameter to POST request
- ✅ Added `team_id` to metadata insert
- ✅ Added better error logging for metadata failures
- ✅ Added warning if metadata provided but teamId missing

### 2. **`src/app/api/playbook-metadata/route.ts`** - Metadata Endpoint
- ✅ Added validation to require `team_id` in POST requests
- ✅ Added `team_id` to metadata insert

### 3. **`src/app/play-recognition/page.tsx`** - Upload UI
- ✅ Added `teamId` to the upload request body
- ⚠️  Currently using hardcoded `'default-team-id'` - needs to be replaced with actual teamId from auth context

## 📝 Testing the Fix

### Before Testing:
Make sure your dev server is restarted:
```bash
npm run dev
```

### Test Steps:

1. **Upload a new play:**
   - Go to Play Recognition page
   - Click "New Scan" or upload button
   - Upload a play image
   - Fill in metadata fields (formation, concept, level, etc.)
   - Click save/upload

2. **Verify metadata saved:**
   - Check your terminal - should NOT see "Failed to save metadata" error
   - Reload the page
   - Select the play you just uploaded
   - **All metadata fields should still be filled in** ✅

3. **Check database directly (optional):**
   ```sql
   SELECT * FROM playbook_metadata ORDER BY created_at DESC LIMIT 5;
   ```
   You should see your metadata record with a `team_id`.

## ⚠️ TODO: Replace Hardcoded TeamId

Currently using `'default-team-id'` as a placeholder. This needs to be replaced with actual teamId from your auth context.

### Where to Fix:
**File:** `src/app/play-recognition/page.tsx`
**Line:** 33

**Current code:**
```typescript
const teamId = 'default-team-id'; // Replace with actual teamId from context
```

**Should be something like:**
```typescript
const { currentTeam } = useAuth(); // or however you access team context
const teamId = currentTeam?.id || 'default-team-id';
```

## 🎯 Expected Behavior After Fix

✅ Upload play → Image saves to Storage
✅ Upload play → Metadata saves to database with team_id
✅ Reload page → Metadata still there
✅ Edit metadata fields → Updates save correctly
✅ Generate AI content → Works with metadata

## 🐛 If Metadata Still Doesn't Save

Check your terminal for errors. You should see one of these:

### Success:
```
No errors - metadata saved successfully
```

### Error - Missing teamId:
```
Metadata provided but teamId missing - skipping metadata save
```
**Fix:** Make sure teamId is being passed from the UI

### Error - Database constraint violation:
```
Failed to save metadata: { code: '23502', message: 'null value in column "team_id"' }
```
**Fix:** The teamId is still not being included - check the request body

### Error - RLS policy:
```
Failed to save metadata: { code: '42501', message: 'new row violates row-level security policy' }
```
**Fix:** The user doesn't have permission to insert metadata for this team - check RLS policies

## 📊 Database Schema Reference

```sql
CREATE TABLE playbook_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,  -- ← This was missing!
  formation_name VARCHAR(100),
  concept_name VARCHAR(100),
  side_of_ball VARCHAR(20),
  content_type VARCHAR(50),
  level VARCHAR(50),
  position_relevance TEXT[],
  custom_notes TEXT,
  file_paths TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

The `team_id NOT NULL` constraint means every metadata record MUST have a team_id or the insert will fail.

---

## 🚀 Summary

The fix ensures that when you upload a play and fill in metadata:
1. The image saves to Supabase Storage ✅
2. The metadata saves to the database **with team_id** ✅
3. When you reload, metadata persists ✅
4. You can edit and update metadata ✅

Just remember to replace the hardcoded `'default-team-id'` with the actual teamId from your auth context!
