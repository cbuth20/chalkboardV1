# File Upload Screen - Classification Fields Update

This document summarizes the updates made to add v1 classification fields to the file upload workflow.

## Overview

The FileUploadScreen component and backend API have been updated to capture and store the new v1 classification fields during file upload. These fields are stored in **both** the `playbook_metadata` table and the `plays` table.

## Frontend Changes

### 1. Updated Types (`src/types/playbook-metadata.ts`)

**Added new type:**
```typescript
export type Unit = 'O' | 'D' | 'ST';
```

**Extended `PlaybookMetadataInput` interface:**
```typescript
export interface PlaybookMetadataInput {
  // ... existing fields
  // v1 Classification fields
  unit?: Unit;
  playbook_section?: string;
  primary_classification?: string;
  situation?: string;
  play_type?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
}
```

**Added helper constants:**
- `UNIT_LABELS` - Display labels for units
- `PLAY_TYPE_LABELS` - Display labels for play types
- `OFFENSE_CLASSIFICATIONS` - Primary classifications for offense (PASS, RUN)
- `DEFENSE_CLASSIFICATIONS` - Primary classifications for defense (COVERAGE, PRESSURE, FRONT)
- `SPECIAL_TEAMS_CLASSIFICATIONS` - Primary classifications for special teams
- `SUGGESTED_SECTIONS` - Common playbook section names
- `SUGGESTED_SITUATIONS` - Common situational contexts

**Added helper function:**
- `getPrimaryClassificationsForUnit(unit)` - Returns appropriate classifications based on selected unit

### 2. Updated FileUploadScreen Component (`src/components/play-recognition/FileUploadScreen.tsx`)

**New UI Section: "Play Classification"**

Located after the "Side of Ball & Content Type" section, includes:

1. **Unit Dropdown** (Required)
   - Options: Offense (O), Defense (D), Special Teams (ST)
   - Resets primary classification when changed

2. **Play Type Dropdown** (Conditional - only for Offense)
   - Options: Pass, Run, RPO, Screen
   - Only visible when unit is 'O'

3. **Playbook Section Input** (Text with datalist)
   - Freeform text input
   - Suggestions from `SUGGESTED_SECTIONS`
   - Examples: "Pass Game", "Run Game", "Third Down", "Red Zone"

4. **Primary Classification Dropdown** (Conditional)
   - Options dynamically populated based on selected unit
   - Offense: PASS, RUN
   - Defense: COVERAGE, PRESSURE, FRONT
   - Special Teams: Kickoff, Punt, Field Goal, etc.

5. **Situation Input** (Optional text with datalist)
   - Freeform text input
   - Suggestions from `SUGGESTED_SITUATIONS`
   - Examples: "3rd Down", "Red Zone", "Goal Line"

## Backend Changes

### 1. Database Migrations

**Migration 014: `014_playbook_metadata_classification.sql`**

Adds classification fields to `playbook_metadata` table:
- `unit` (unit_type) - References the enum created in migration 013
- `playbook_section` (TEXT)
- `primary_classification` (TEXT)
- `situation` (TEXT)
- `play_type` (TEXT)

**To apply both migrations:**
```bash
# Run in order:
psql -f src/lib/database/migrations/013_play_classification_system.sql
psql -f src/lib/database/migrations/014_playbook_metadata_classification.sql
```

Or use Supabase dashboard SQL editor.

### 2. Updated Backend Functions

**`netlify/functions/playbooks.ts`**
- Updated metadata save to include all classification fields
- Fields saved to `playbook_metadata` table during file upload

**`netlify/functions/playbook-metadata.ts`**
- Updated `POST` endpoint to accept and save classification fields
- Updated `PUT` endpoint to update classification fields

**`netlify/functions/process-play-content-background.ts`**
- Updated to read classification fields from metadata
- Populates `plays` table with classification fields during AI processing
- Falls back to deriving unit from `side_of_ball` if not explicitly set

**`netlify/functions/plays-list.ts`** (previously updated)
- Returns classification fields in play list response

**`netlify/functions/plays-get.ts`** (previously updated)
- Returns classification fields in single play response

**`netlify/functions/plays-create.ts`** (previously updated)
- Accepts classification fields when creating plays directly

## Data Flow

### Upload Flow

1. **User uploads file** → FileUploadScreen
2. **User fills out metadata** including classification fields
3. **File submitted** → `playbooks.ts` endpoint
4. **Metadata saved** to `playbook_metadata` table with:
   - Standard fields (formation_name, concept_name, etc.)
   - Classification fields (unit, playbook_section, primary_classification, situation, play_type)
5. **Play record created** (if auto-processing enabled)
6. **Background processing** reads metadata and populates `plays` table with classification fields

### Classification Field Population

Both `playbook_metadata` and `plays` tables will contain:
- `unit` - Which side of ball (O/D/ST)
- `playbook_section` - Coach-defined folder
- `primary_classification` - Type within unit
- `situation` - Optional context
- `play_type` - For offense plays (PASS/RUN/RPO/SCREEN)

## Usage Examples

### Creating a Play via Upload

```typescript
// User selects file and fills out form:
{
  fileName: "trips-mesh.png",
  fileData: "base64...",
  metadata: {
    formation_name: "Trips Right",
    concept_name: "Mesh",
    side_of_ball: "offense",
    content_type: "single_play",
    position_relevance: ["QB", "X", "Y", "Z", "H"],
    // v1 Classification fields
    unit: "O",
    playbook_section: "Pass Game",
    primary_classification: "PASS",
    situation: "3rd Down",
    play_type: "PASS",
  },
  orgId: "xxx"
}
```

### Viewing Classified Plays

Navigate to `/coach/playbook` to see plays organized by:
- Unit (Offense/Defense/Special Teams)
- Playbook Section (collapsible folders)
- Primary Classification (subsections)

## Testing Checklist

- [ ] Apply both database migrations (013 and 014)
- [ ] Upload a new file via FileUploadScreen
- [ ] Fill out all classification fields
- [ ] Verify metadata saved to `playbook_metadata` table
- [ ] Verify play created in `plays` table with classification fields
- [ ] View play in coach playbook page
- [ ] Confirm play appears in correct unit/section/classification
- [ ] Test filtering by unit and section
- [ ] Test with different units (O/D/ST)
- [ ] Verify conditional play type field only shows for offense

## Backward Compatibility

- All new fields are **optional** in the database
- Existing plays without classification will still work
- Existing metadata records will show NULL for new fields
- Unit can be derived from `side_of_ball` if not explicitly set
- Coach playbook page handles plays without classification (shows as "Uncategorized")

## Future Enhancements

- Add validation to require unit field for new uploads
- Auto-populate primary_classification based on play_type
- Bulk edit classification for existing plays
- Import/export classification schemas
- Position-specific filtering in player view

## Support

For questions or issues with the upload flow, check:
1. Browser console for frontend errors
2. Netlify function logs for backend errors
3. Supabase logs for database issues
4. Ensure both migrations are applied in order
