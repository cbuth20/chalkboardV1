# Batch Generation Error - Missing Metadata

## Problem
When you clicked "Batch" to generate assignments, you got an error: `"Failed to create play record: {}"`. This happens when selected files don't have metadata records in the database.

## Root Cause
Files uploaded to Supabase Storage without corresponding metadata records can't be processed for AI generation because:
1. The generation endpoint requires a `playbookMetadataId`
2. Without metadata, there's no context for the AI to understand the play
3. The file exists in storage but can't be linked to a play record

## The Fix
I've added validation that will now show you **exactly which files are missing metadata** with a clear error message like:

```
Cannot generate plays: The following files are missing metadata:

Cover0.HEIC, Cover1.HEIC, Form0.HEIC

Please refresh the page or run the fix-orphans script to create metadata for these files.
```

## How to Resolve

### Step 1: Run Fix-Orphans Script
Open your browser console (F12) and paste this code:

```javascript
fetch('/api/playbooks/fix-orphans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teamId: '00000000-0000-0000-0000-000000000000'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Fix Orphans Result:', data);
  if (data.success) {
    alert(`Fixed ${data.createdCount} orphaned files!`);
    location.reload();
  }
})
.catch(err => console.error('❌ Error:', err));
```

### Step 2: Refresh the Page
After running the script, refresh the page to reload all plays with their new metadata.

### Step 3: Try Batch Generation Again
1. Go to Scanner tab
2. Click "Multi-Select"
3. Select the files you want to process
4. Click "Batch" or "Unified Play"
5. Generation should now work!

## What the Validation Does

### Before (Old Behavior)
- Selected files without metadata were sent to the API
- API validation failed silently
- Generic error: `"Failed to create play record: {}"`
- No indication which files were the problem

### After (New Behavior)
- Checks all selected files for metadata BEFORE calling the API
- Shows a clear error listing files without metadata
- Suggests fix-orphans script or page refresh
- Prevents wasted API calls

## Example Error Message

```
Cannot generate plays: The following files are missing metadata:

Cover0.HEIC, Cover1.HEIC, Form0.HEIC

Please refresh the page or run the fix-orphans script to create metadata for these files.
```

## Why This Happened

Your HEIC files were uploaded during early testing when:
1. Multi-file upload was being developed
2. HEIC format wasn't fully supported yet
3. Metadata creation had a bug

All of these issues are now fixed:
- ✅ HEIC/HEIF fully supported
- ✅ Multi-file upload creates metadata for each file
- ✅ Fix-orphans endpoint available to repair existing files
- ✅ Better validation with clear error messages

## Prevention

This won't happen for new uploads because:
- The upload endpoint ALWAYS creates metadata when `teamId` is provided
- HEIC files are now recognized and filtered properly
- Multi-file upload properly handles metadata for each file

## Verification

After running fix-orphans, you can verify all files have metadata:

1. **Check the Console Output**
   ```json
   {
     "success": true,
     "message": "Successfully created metadata for 11 orphaned files",
     "files": ["Cover0.HEIC", "Cover1.HEIC", ...]
   }
   ```

2. **Check the Library**
   - All files should be visible in Scanner tab
   - Click each file to view its metadata
   - Metadata should show formation_name (filename) and custom_notes

3. **Test Generation**
   - Select multiple files
   - Click "Batch" - should work without errors
   - Each file generates a separate play record

---

**Files Modified:**
- `src/components/play-recognition/SavedPlayLibrary.tsx` - Added metadata validation to both batch and unified generation workflows
