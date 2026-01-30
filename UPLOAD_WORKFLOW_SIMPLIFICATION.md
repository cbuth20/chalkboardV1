# Upload Workflow Simplification

This document describes the changes made to simplify the FileUploadScreen by removing redundant fields and auto-inferring values from the Unit selection.

## Changes Made

### Fields Removed from UI

The following fields were **removed from the user interface** but are still populated automatically:

1. **Side of Ball** - Now auto-inferred from Unit selection
2. **Content Type** - Auto-set to 'single_play' (default for most uploads)
3. **Concept Name** - Removed entirely (can be added in notes if needed)

### Fields Retained

The following fields remain in the upload form:

1. **Tags** - For multi-file organization (Formation, Coverage, Route, etc.)
2. **Formation Name** - Still useful for identifying plays
3. **Unit** (NEW/Required) - O/D/ST selection
4. **Play Type** (Conditional) - Only for Offense: PASS/RUN/RPO/SCREEN
5. **Playbook Section** - Coach-defined folder (e.g., "Pass Game", "Third Down")
6. **Primary Classification** - Type within unit (dynamic based on unit)
7. **Situation** - Optional context (e.g., "3rd Down", "Red Zone")
8. **Position Relevance** - Which positions this applies to
9. **Additional Notes** - Freeform context for AI

## Auto-Population Logic

### Unit → Side of Ball Mapping

When a user selects a Unit, the system automatically sets `side_of_ball`:

```typescript
const unitToSideOfBall = {
  'O': 'offense',
  'D': 'defense',
  'ST': 'special_teams',
};
```

### Default Values

- `content_type` is automatically set to `'play'` (database enum value) for all uploads
- `position_relevance` defaults to `['all']` and resets when Unit changes
- `primary_classification` resets when Unit changes

**Note:** The frontend previously used 'single_play' but this has been changed to 'play' to match the database enum directly. The backend `playbooks.ts` also includes a mapping function to handle any legacy frontend values.

## Implementation Details

### New Handler Function

```typescript
const handleUnitChange = (unit: Unit) => {
  const unitToSideOfBall: Record<Unit, SideOfBall> = {
    'O': 'offense',
    'D': 'defense',
    'ST': 'special_teams',
  };

  handleUpdateMetadata({
    unit: unit,
    side_of_ball: unitToSideOfBall[unit],
    position_relevance: ['all'],
    primary_classification: undefined,
    content_type: 'play', // Database enum value
  });
};
```

### Updated Initial Metadata

Files now initialize with:
```typescript
metadata: {
  position_relevance: ['all'],
  tags: [],
  content_type: 'play', // Database enum value
}
```

## Updated UI Flow

### Before (Old Workflow)
1. Select Side of Ball → Enables position selection
2. Select Content Type
3. Enter Formation Name
4. Enter Concept Name
5. Fill out classification fields
6. Select positions
7. Add notes

### After (New Workflow)
1. Select Tags (multi-file grouping)
2. Enter Formation Name
3. **Select Unit** (O/D/ST) → Auto-sets side_of_ball and content_type
4. Select Play Type (if Offense)
5. Enter Playbook Section
6. Select Primary Classification (dynamic based on unit)
7. Enter Situation (optional)
8. Select Positions (enabled after Unit selection)
9. Add Notes (optional)

## Benefits

1. **Simplified User Experience** - 3 fewer fields to fill out
2. **Less Confusion** - Unit is more intuitive than "Side of Ball"
3. **Automatic Inference** - Backend fields populated automatically
4. **Better Organization** - Unit is the primary organizational method
5. **Backward Compatible** - Backend still receives all required fields

## Database Schema

No changes to database schema needed. The following fields are still populated in both `playbook_metadata` and `plays` tables:

- `side_of_ball` (auto-inferred from unit)
- `content_type` (auto-set to 'play' - database enum value)
- `unit` (user-selected)
- `playbook_section` (user-entered)
- `primary_classification` (user-selected)
- `situation` (user-entered, optional)
- `play_type` (user-selected for offense)

**Important:** The database `content_type` enum values are: `play`, `coverage`, `formation`, `legend`, `index`, `coaching_points`, `technique`, `terminology`, `reference`, `other`. The frontend now uses `'play'` directly instead of `'single_play'`.

## Testing Checklist

- [ ] Upload a file without errors
- [ ] Select Unit 'O' → Verify side_of_ball set to 'offense'
- [ ] Select Unit 'D' → Verify side_of_ball set to 'defense'
- [ ] Select Unit 'ST' → Verify side_of_ball set to 'special_teams'
- [ ] Verify Play Type field only shows for Offense
- [ ] Verify Position Relevance updates when Unit changes
- [ ] Verify Primary Classification options change based on Unit
- [ ] Verify content_type is 'play' in database
- [ ] Upload multiple files and verify all work correctly
- [ ] Check that plays appear correctly in coach playbook view

## Migration Notes

**No database migration needed** - This is purely a UI simplification. All backend fields remain the same and are populated automatically from the Unit selection.

## Future Considerations

- Consider removing `side_of_ball` from database entirely and always deriving it from `unit`
- Add validation to require Unit field before submission
- Add unit-specific validation (e.g., require play_type for Offense)
- Consider renaming `side_of_ball` to `unit` in database for consistency
