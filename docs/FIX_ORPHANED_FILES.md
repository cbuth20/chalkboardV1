# Fix Orphaned Files

## Problem
Files were uploaded to Supabase Storage but metadata records weren't created, so they don't show up in the app.

## Solution
Run the fix-orphans endpoint to automatically create metadata for files without metadata.

## How to Fix

### Option 1: Browser Console
1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
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
  }
})
.catch(err => console.error('❌ Error:', err));
```

### Option 2: cURL Command
```bash
curl -X POST http://localhost:3000/api/playbooks/fix-orphans \
  -H "Content-Type: application/json" \
  -d '{"teamId": "00000000-0000-0000-0000-000000000000"}'
```

### Option 3: Add a Button to the UI (temporary)

Add this button to your SavedPlayLibrary component temporarily:

```tsx
<button
  onClick={async () => {
    const response = await fetch('/api/playbooks/fix-orphans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    });
    const data = await response.json();
    if (data.success) {
      alert(`Fixed ${data.createdCount} orphaned files!`);
      window.location.reload();
    }
  }}
  className="px-4 py-2 bg-yellow-500 text-black rounded-lg"
>
  Fix Orphaned Files
</button>
```

## What It Does
1. Scans all files in Supabase Storage bucket
2. Checks which files don't have metadata records
3. Creates metadata records for those files
4. Returns count of fixed files

## Expected Output
```json
{
  "success": true,
  "message": "Successfully created metadata for 5 orphaned files",
  "orphanedCount": 5,
  "createdCount": 5,
  "files": [
    "file1.png",
    "file2.pdf",
    "file3.jpg"
  ]
}
```

## After Running
1. Refresh your app
2. All files should now appear in the library
3. You can edit their metadata (tags, formation names, etc.)

## Prevention
The upload endpoint has been fixed to ALWAYS create metadata, so this won't happen again for new uploads.
