# HEIC Files Support - Fix Guide

## Problem Fixed
Your HEIC files (Apple photo format) were uploaded but not showing in the library because:
1. The GET endpoint was only filtering for PDF, PNG, JPG, JPEG (missing HEIC/HEIF)
2. Some files were uploaded without metadata during early multi-file upload testing

## Changes Made ✅

### 1. API Route (`src/app/api/playbooks/route.ts`)
- **GET endpoint**: Now includes HEIC and HEIF in file type filter
- **POST endpoint**: Added HEIC/HEIF content-type detection
- **Metadata**: Always created for all uploads (no longer conditional)
- **Tags field**: Now properly saved in metadata

### 2. File Upload Screen
- Already accepts `image/*` which includes HEIC files ✅

## How to Fix Your Existing Files

You have two options to make your existing HEIC files visible:

### Option 1: Use Fix-Orphans Endpoint (Recommended)

This will create metadata for any files in storage that don't have metadata records.

#### Steps:
1. Open your app in the browser
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to the **Console** tab
4. Paste this code and press Enter:

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
    // Refresh the page to see the files
    location.reload();
  } else {
    console.error('❌ Error:', data);
  }
})
.catch(err => console.error('❌ Error:', err));
```

5. The script will:
   - Find all files in storage without metadata
   - Create metadata records for them
   - Show you how many were fixed
   - Refresh the page

6. Your HEIC files should now appear in the library!

### Option 2: Re-upload Files

Simply re-upload your HEIC files through the Scanner → File Upload interface. The new code will:
- Accept HEIC files properly
- Create metadata automatically
- Allow you to add tags during upload

## Expected Results

After running the fix:
- All HEIC/HEIF files will appear in the Scanner library
- Files will have auto-generated metadata (formation_name = filename)
- You can edit their metadata to add tags, formations, etc.

## Verification Steps

1. **Check the Console Output**
   - Should show: `"Successfully created metadata for X orphaned files"`
   - Lists the file names that were fixed

2. **Check the Library**
   - Go to Scanner tab
   - You should see all your HEIC files listed
   - Click on them to view and edit metadata

3. **Test New Uploads**
   - Upload a new HEIC file
   - Should appear immediately in the library
   - Metadata should be created automatically

## Example Console Output

```json
{
  "success": true,
  "message": "Successfully created metadata for 11 orphaned files",
  "orphanedCount": 11,
  "createdCount": 11,
  "files": [
    "Cover0.HEIC",
    "Cover1.HEIC",
    "Cover2.HEIC",
    "Cover3.HEIC",
    "Cover4.HEIC",
    "Cover6.HEIC",
    "Form0.HEIC",
    "Form1.HEIC",
    "Form2.HEIC",
    "Form3.HEIC",
    "Form4.HEIC"
  ]
}
```

## Troubleshooting

### Files still not showing after fix
1. Hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Check browser console for errors
3. Verify the files exist in Supabase Storage:
   - Go to Supabase Dashboard
   - Navigate to Storage → Chalkboard Bucket → public folder
   - Confirm HEIC files are there

### Browser HEIC Support
- Modern browsers (Chrome 116+, Safari 11+) support HEIC natively
- If images don't display, the browser may need HEIC support
- Files will still be stored and processable by the AI

### Metadata Issues
If metadata creation fails:
1. Check that the default team exists in your database:
   ```sql
   SELECT * FROM teams WHERE id = '00000000-0000-0000-0000-000000000000';
   ```
2. The fix-orphans endpoint will create it if missing

## Prevention

This issue won't happen again because:
- ✅ POST endpoint now ALWAYS creates metadata when teamId is provided
- ✅ HEIC/HEIF are now recognized file types
- ✅ Multi-file upload properly handles metadata for each file
- ✅ Tags field is properly saved

## Next Steps

1. Run the fix-orphans script above
2. Verify your files appear
3. Add tags to categorize them (Formation, Coverage, Route, etc.)
4. Test the multi-file generation workflow:
   - Multi-select files by tag
   - Click "Unified Play"
   - Enter play description
   - Generate categorized assignments

---

**Need Help?**
If you encounter any issues, check the browser console for error messages and verify the Supabase connection is working.
