# Playbook Classification System v1

This document describes the v1 play classification system implementation for enhanced playbook organization.

## Overview

The v1 classification system adds four new fields to the `plays` table to better organize and categorize plays:

1. **Unit** (O / D / ST) - Which side of ball: Offense, Defense, or Special Teams
2. **Playbook Section** - Coach-defined folder (e.g., "Pass Game", "Run Game", "Third Down", "Red Zone")
3. **Primary Classification** - Varies by unit:
   - Offense → RUN | PASS
   - Defense → COVERAGE | PRESSURE | FRONT
   - ST → Phase (KO, Punt, FG, etc.)
4. **Situation** (optional) - Down bucket context (e.g., "1st-2nd Down", "3rd Down", "Red Zone")

## Database Changes

### Migration: `013_play_classification_system.sql`

Location: `src/lib/database/migrations/013_play_classification_system.sql`

This migration:
- Creates `unit_type` enum with values: 'O', 'D', 'ST'
- Adds four new columns to `plays` table:
  - `unit` (unit_type)
  - `playbook_section` (TEXT)
  - `primary_classification` (TEXT)
  - `situation` (TEXT)
- Creates indexes for efficient filtering
- Migrates existing data (defaults offensive plays to 'O' unit with appropriate classifications)

**To apply the migration:**

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f src/lib/database/migrations/013_play_classification_system.sql
```

Or use the Supabase dashboard SQL editor to paste and run the migration.

## Code Changes

### 1. TypeScript Types (`src/lib/api/plays.ts`)

Added new types and fields:
```typescript
export type Unit = 'O' | 'D' | 'ST';

export interface Play {
  // ... existing fields
  // v1 Classification fields
  unit?: Unit;
  playbookSection?: string;
  primaryClassification?: string;
  situation?: string;
}

export interface CreatePlayRequest {
  // ... existing fields
  // v1 Classification fields
  unit?: Unit;
  playbookSection?: string;
  primaryClassification?: string;
  situation?: string;
}
```

### 2. Backend API Updates

**Updated functions:**

- `netlify/functions/plays-list.ts` - Returns new classification fields
- `netlify/functions/plays-get.ts` - Returns new classification fields
- `netlify/functions/plays-create.ts` - Accepts and stores new classification fields

**New function:**

- `netlify/functions/plays-update.ts` - PATCH endpoint to update play metadata including classification fields

### 3. Frontend UI (`src/app/coach/playbook/page.tsx`)

Complete rewrite of the coach playbook page with:

**Two view modes:**
1. **Organized View** (default) - Plays organized by Unit → Section → Classification
   - Collapsible sections for each playbook section
   - Visual cards for each play
   - Unit-specific colors and icons

2. **Table View** - Traditional datatable with all classification fields as columns

**Features:**
- Filter by Unit (O/D/ST)
- Filter by Playbook Section
- Search across play name, concept, formation, and section
- Stats dashboard showing counts by unit
- Multi-select mode for bulk operations
- Responsive design for mobile/tablet/desktop

**Unit Configuration:**
- Offense (O): Blue color, ⚡ icon
- Defense (D): Red color, 🛡️ icon
- Special Teams (ST): Yellow color, ⭐ icon

## Usage

### For Coaches

**Creating a play with classification:**
```typescript
const play = await createPlay({
  orgId: 'xxx',
  playbookMetadataId: 'yyy',
  name: 'Power Right',
  playType: 'RUN',
  unit: 'O',
  playbookSection: 'Run Game',
  primaryClassification: 'RUN',
  situation: '1st-2nd Down',
});
```

**Updating play classification:**
```typescript
// Use the new plays-update endpoint
PATCH /.netlify/functions/plays-update/{playId}
{
  "unit": "O",
  "playbookSection": "Pass Game",
  "primaryClassification": "PASS",
  "situation": "3rd Down"
}
```

### Viewing the Playbook

Navigate to `/coach/playbook` to see the new organized view. Toggle between "Organized View" and "Table View" using the button in the top-right.

**Organized View** shows:
- Plays grouped by Unit (Offense, Defense, Special Teams)
- Within each unit, collapsible sections by Playbook Section
- Within each section, plays grouped by Primary Classification
- Each play displays as a card with key info

**Table View** shows:
- All plays in a traditional table
- Columns for all classification fields
- Sortable and filterable

## Benefits

1. **Better Organization** - Plays are now organized in a coach-friendly folder structure
2. **Flexible Categorization** - Freeform playbook sections allow coaches to organize as they prefer
3. **Enhanced Filtering** - Filter by unit, section, and classification
4. **Scalability** - System works for offense, defense, and special teams
5. **Backward Compatible** - Existing plays without classification still work (shown as "Uncategorized")

## Future Enhancements (v2+)

Potential improvements for future versions:
- Bulk edit classification for multiple plays
- Drag-and-drop to organize plays between sections
- Custom sort order within sections
- Export playbook by section
- Player-facing view filtered by their position group
- Situation-based practice plan generation
- Analytics by classification (e.g., success rate by play type)

## Testing Checklist

- [ ] Run migration successfully
- [ ] Verify new columns exist in plays table
- [ ] Create a play with classification fields
- [ ] View plays in organized view
- [ ] View plays in table view
- [ ] Filter by unit
- [ ] Filter by section
- [ ] Search plays
- [ ] Update play classification
- [ ] Verify backward compatibility with existing plays
- [ ] Test on mobile/tablet

## Support

For questions or issues, please contact the development team or create an issue in the repository.
