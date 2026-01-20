# Multi-File Upload & Category Prompt Implementation

## ✅ Completed Features

### 1. Enhanced File Upload Experience (Scanner)

**File:** `src/components/play-recognition/FileUploadScreen.tsx`

#### Key Features:
- **Multiple File Upload** - Select or drag & drop multiple files at once
- **File List View** - Visual list showing all uploaded files with previews
- **Individual Metadata Editing** - Click any file to edit its specific metadata
- **Tag Support** - Tag files during upload (Formation, Coverage, Route, etc.)
- **Remove Individual Files** - Delete files from the batch before uploading
- **File Counter** - Shows "IMPORT PLAYBOOK (3 files)" in header
- **Add More Files** - Button to add additional files to the batch
- **Batch Upload** - Upload all files at once with one click

#### UI Improvements:
```
┌─────────────────────────────────────────┐
│  IMPORT PLAYBOOK (5 files)              │
├──────────────┬──────────────────────────┤
│  Files (5)   │   Current File Preview   │
│  + Add More  │                          │
│              │   Metadata Editor        │
│  [File 1]▶   │   • Tags                 │
│  [File 2]    │   • Formation            │
│  [File 3]    │   • Concept              │
│  [File 4]    │   • Side of Ball         │
│  [File 5]    │   • Position Relevance   │
│              │   • Additional Info      │
│ UPLOAD ALL(5)│                          │
└──────────────┴──────────────────────────┘
```

#### Technical Details:
- Supports multiple file selection via `<input multiple>`
- Parallel file reading with Promise.all()
- Independent metadata per file
- Preview thumbnails for images and PDF icons
- Tag badges visible on file cards

---

### 2. Generation Prompt Modal

**File:** `src/components/play-recognition/SavedPlayLibrary.tsx`

#### Key Features:
- **Automatic Trigger** - Shows when 2+ files selected for "Unified Play" generation
- **Selected Files Summary** - Displays all selected files with their tags
- **Context Input** - Text area for describing the play
- **Smart AI Context** - User's description passed to AI for better generation

#### User Experience:
```
When user selects multiple files and clicks "Unified Play":

┌───────────────────────────────────────┐
│  Generate Unified Play                │
│  You've selected 3 files...           │
├───────────────────────────────────────┤
│  SELECTED FILES                       │
│  [Trips Formation] Formation          │
│  [Cover 3 Guide] Coverage             │
│  [Route Tree] Route                   │
│                                       │
│  WHAT KIND OF PLAY IS THIS?           │
│  ┌─────────────────────────────────┐ │
│  │ e.g., "Trips Mesh vs Cover 3"   │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                       │
│      [Cancel]  [Generate Play]        │
└───────────────────────────────────────┘
```

#### Prompt Examples:
- "Trips formation running Mesh concept vs Cover 3"
- "Shotgun power run with various protection schemes"
- "4 Verticals passing concept with hot routes vs blitz"

---

### 3. Updated Page Handler

**File:** `src/app/play-recognition/page.tsx`

#### Changes:
- Now accepts array of files instead of single file
- Parallel upload of all files using Promise.all()
- Error handling for failed uploads
- Shows failure count if any uploads fail

```typescript
// Before (single file)
handleUploadComplete(fileData, fileName, fileType, metadata)

// After (multiple files)
handleUploadComplete([
  {fileData, fileName, fileType, metadata},
  {fileData, fileName, fileType, metadata},
  {fileData, fileName, fileType, metadata},
])
```

---

### 4. API Enhancement

**File:** `src/app/api/generate-play-content/route.ts`

#### New Parameter:
- `additionalContext` - User's description of the play

#### Behavior:
```typescript
// If user provides context:
metadataContext += `
--- USER'S PLAY DESCRIPTION ---
Trips formation running Mesh concept vs Cover 3
`

// AI now sees:
// 1. Formation file content
// 2. Coverage file content
// 3. Route file content
// 4. User's description
```

This helps the AI:
- Understand the intended play type
- Generate more accurate categorized assignments
- Create better alignment between files

---

## User Workflows

### Workflow 1: Upload Multiple Files with Metadata

1. Click "File Upload" in Scanner tab
2. Select or drag 5 files
3. Files appear in left panel with thumbnails
4. Click each file to edit its metadata:
   - Tag as "Formation", "Coverage", etc.
   - Add formation/concept names
   - Add additional context
5. Click "UPLOAD ALL (5)"
6. All files saved to library with their individual metadata

### Workflow 2: Generate Unified Play

1. Go to Scanner tab library
2. Click "Multi-Select"
3. Filter by tag: Click "Formation" (1 file)
4. Filter by tag: Click "Coverage" (2 files total)
5. Filter by tag: Click "Route" (3 files total)
6. Click "Unified Play"
7. Modal appears asking "What kind of play?"
8. Enter: "Trips Mesh concept vs Cover 3"
9. Click "Generate Play"
10. AI creates ONE play with categorized assignments from all 3 files

### Workflow 3: Quick Single File Upload

1. Click "File Upload"
2. Select 1 file
3. Edit metadata (optional)
4. Click "UPLOAD ALL (1)"
5. File saved immediately

---

## Technical Improvements

### Before:
- ❌ Upload one file at a time
- ❌ No visual feedback during multi-file selection
- ❌ Couldn't see all uploaded files
- ❌ No way to remove individual files
- ❌ AI had no context about play intent

### After:
- ✅ Upload multiple files in one batch
- ✅ Visual file list with previews
- ✅ Individual metadata per file
- ✅ Remove unwanted files before upload
- ✅ Prompt for play description
- ✅ AI receives user context for better generation

---

## Files Changed

1. `src/components/play-recognition/FileUploadScreen.tsx` - Complete rewrite for multi-file support
2. `src/app/play-recognition/page.tsx` - Updated to handle file arrays
3. `src/components/play-recognition/SavedPlayLibrary.tsx` - Added generation prompt modal
4. `src/app/api/generate-play-content/route.ts` - Added additionalContext parameter

---

## Benefits

### For Coaches:
- **Faster uploads** - Upload entire folders at once
- **Better organization** - Tag files during upload
- **More context** - Describe plays for better AI generation
- **Visual feedback** - See all files before uploading

### For AI:
- **Better understanding** - User's description provides intent
- **More accurate** - Context helps categorize assignments correctly
- **Comprehensive** - Combines multiple files intelligently

### For Users:
- **Cleaner workflow** - No more uploading files one by one
- **Less repetitive** - Set metadata for multiple files
- **More control** - Review and edit before upload
