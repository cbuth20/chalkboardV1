# Delete Functionality & Route Depth Fix

## Issues Fixed

### 1. Integer Parsing Error for Route Depth ✅

**Error:**
```
Failed to insert assignments: {
  code: '22P02',
  message: 'invalid input syntax for type integer: "Deep"'
}
```

**Root Cause:**
- GPT-4o Vision was returning non-numeric values for `route_depth` (e.g., "Deep", "15 yards")
- Database expects INTEGER type
- No validation/parsing before insertion

**Fix:**
Added intelligent parsing in `src/app/api/generate-play-content/route.ts` (lines 139-145):

```typescript
// Parse route_depth to ensure it's a number
let routeDepth = null;
if (posData.depth) {
  // Try to parse as integer, handle strings like "15 yards" or "Deep"
  const depthNum = parseInt(String(posData.depth).replace(/\D/g, ''));
  routeDepth = !isNaN(depthNum) ? depthNum : null;
}
```

**How It Works:**
- Converts value to string
- Removes all non-digit characters with `/\D/g`
- Parses remaining digits as integer
- Returns `null` if no digits found or invalid

**Examples:**
```typescript
"15"         → 15
"15 yards"   → 15
"Deep"       → null (no digits)
"20-yard"    → 20
null         → null
undefined    → null
```

### 2. Complete Delete Functionality ✅

**Previous Behavior:**
- Only deleted file from Supabase Storage
- Left orphaned records in database:
  - `playbook_metadata` table
  - `plays` table
  - `play_assignments` table
  - `flashcard_templates` table

**New Behavior:**
- Deletes everything associated with the play
- Shows detailed confirmation before deletion
- Shows success message with counts

## Delete Implementation

### Updated DELETE Endpoint

**File:** `src/app/api/playbooks/route.ts` (lines 237-363)

**Deletion Order:**
1. Find `playbook_metadata` by file path
2. Find all `plays` linked to that metadata
3. Delete `play_assignments` for those plays
4. Delete `flashcard_templates` for those plays
5. Delete `plays` records
6. Delete `playbook_metadata` record
7. Delete file from Supabase Storage

**Why This Order:**
- Deletes children before parents (avoid foreign key violations)
- Tracks counts for feedback
- Continues on error (best effort)

### Updated UI

**File:** `src/components/play-recognition/SavedPlayLibrary.tsx` (lines 245-289)

**Before Deletion - Confirmation:**
```
Delete "Spread Right 2-Jet E Drive"?

This will permanently delete:
• The play image/PDF
• All generated content (insights, assignments, flashcards)
• Metadata

This cannot be undone.

[Cancel] [OK]
```

**After Deletion - Success:**
```
Successfully deleted:
• 1 play(s)
• 6 assignment(s)
• 18 flashcard(s)
• 1 metadata record(s)
• 1 file from storage

[OK]
```

## Technical Details

### Database Cascade Behavior

From schema:
```sql
-- plays table
playbook_metadata_id UUID REFERENCES playbook_metadata(id) ON DELETE SET NULL

-- play_assignments table
play_id UUID REFERENCES plays(id) ON DELETE CASCADE

-- flashcard_templates table
play_id UUID REFERENCES plays(id) ON DELETE CASCADE
```

**Note:** While CASCADE is set up, the delete endpoint explicitly deletes records for better control and feedback.

### Delete API Response

```typescript
{
  success: true,
  message: "Play and all related data deleted successfully",
  deleted: {
    plays: 1,
    assignments: 6,
    flashcards: 18,
    metadata: 1
  }
}
```

### Error Handling

- Continues even if some deletions fail
- Logs errors to console
- Returns partial success counts
- Shows user-friendly error messages

## Testing

### 1. Test Route Depth Parsing

**Upload a play and generate content:**

```bash
# Watch terminal for:
Created play: <uuid>
Inserted 6 assignments  # Should succeed (no integer error)
Inserted 5 knowledge cards
Inserted 18 assignment flashcards
```

**Verify in Database:**
```sql
SELECT position, route_id, route_depth
FROM play_assignments
WHERE play_id = 'your-play-id';
```

Should show:
- `route_depth` as INTEGER or NULL
- No "Deep" or "15 yards" strings
- Valid numbers like 5, 10, 15, 20

### 2. Test Delete Functionality

**Step 1: Upload and Generate Play**
1. Upload a play image
2. Generate AI content
3. Approve the content
4. Note the play name

**Step 2: Check Database Before Delete**
```sql
-- Find the metadata ID
SELECT id, file_paths FROM playbook_metadata
WHERE file_paths @> '["/path/to/your/file"]'::jsonb;

-- Check what will be deleted
SELECT
  (SELECT COUNT(*) FROM plays WHERE playbook_metadata_id = 'metadata-id') as plays,
  (SELECT COUNT(*) FROM play_assignments WHERE play_id IN
    (SELECT id FROM plays WHERE playbook_metadata_id = 'metadata-id')) as assignments,
  (SELECT COUNT(*) FROM flashcard_templates WHERE play_id IN
    (SELECT id FROM plays WHERE playbook_metadata_id = 'metadata-id')) as flashcards;
```

**Step 3: Delete from UI**
1. Go to Play Recognition
2. Select the play
3. Click "Delete" button
4. Read confirmation message
5. Click "OK"

**Step 4: Verify Success Message**
Should show:
```
Successfully deleted:
• 1 play(s)
• 6 assignment(s)
• 18 flashcard(s)
• 1 metadata record(s)
• 1 file from storage
```

**Step 5: Verify Database is Clean**
```sql
-- Should return 0 rows
SELECT * FROM playbook_metadata WHERE id = 'metadata-id';
SELECT * FROM plays WHERE playbook_metadata_id = 'metadata-id';
SELECT * FROM play_assignments WHERE play_id = 'play-id';
SELECT * FROM flashcard_templates WHERE play_id = 'play-id';
```

**Step 6: Verify Storage is Clean**
- File should be deleted from Supabase Storage
- Check in Supabase Dashboard → Storage → Chalkboard Bucket → public/

### 3. Test Edge Cases

**Case 1: Delete play with no generated content**
- Upload play but don't generate content
- Delete should work (only deletes file and metadata)

**Case 2: Delete play that's already been deleted from storage**
- Manually delete file from storage
- Try to delete from UI
- Should fail gracefully with error message

**Case 3: Multiple plays with same metadata (edge case)**
- If metadata references multiple files, only linked play should be deleted
- Other plays should remain

## Console Logging

The delete endpoint logs detailed information:

```javascript
// Before deletion
console.log('Deleted:', {
  plays: 1,
  assignments: 6,
  flashcards: 18,
  metadata: 1
});
```

Monitor console to verify:
- All expected records are deleted
- Counts match expectations
- No errors during deletion

## Benefits

✅ **Complete Cleanup** - Removes all related data
✅ **User Feedback** - Clear confirmation and success messages
✅ **Detailed Counts** - Shows exactly what was deleted
✅ **Error Resilience** - Continues even if some deletions fail
✅ **Safe Confirmation** - Requires explicit user approval
✅ **Route Depth Fixed** - Handles non-numeric values gracefully

## Known Limitations

1. **No Undo:** Once deleted, data cannot be recovered
2. **No Soft Delete:** Hard deletes from database (not archived)
3. **No Audit Trail:** Doesn't track who deleted what when
4. **Blocking Operation:** UI waits for all deletions to complete

## Future Enhancements

1. **Soft Delete:**
   - Add `deleted_at` timestamp
   - Filter deleted records from queries
   - Allow recovery within 30 days

2. **Audit Trail:**
   - Track deletions in `audit_log` table
   - Store who deleted what when

3. **Batch Delete:**
   - Allow selecting multiple plays
   - Delete all at once

4. **Better Feedback:**
   - Show progress bar during deletion
   - Toast notifications instead of alerts

5. **Backup Before Delete:**
   - Archive deleted data
   - Allow restoration from admin panel

## Summary

Both issues are now fixed:

1. **Route Depth:** Intelligent parsing handles any format GPT returns
2. **Delete:** Complete cleanup of all related database records with user feedback

Coaches can now safely delete plays knowing that all related data will be removed, and route depth errors won't block assignment creation.
