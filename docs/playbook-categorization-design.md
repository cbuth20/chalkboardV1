# Playbook Categorization & Multi-File Assignment Generation

## Overview
This design enables coaches to:
1. Tag playbook files (e.g., "Formations", "Coverages", "Routes")
2. Select multiple files by tags during assignment generation
3. AI generates unified assignments that reference all selected files
4. Assignments are categorized (Formation, Coverage, Route, Protection, etc.)

## Database Schema Changes

### 1. Add `tags` column to `playbook_metadata`
```sql
ALTER TABLE playbook_metadata
ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE INDEX idx_playbook_metadata_tags ON playbook_metadata USING GIN(tags);
```

### 2. Add `category` column to `play_assignments`
```sql
-- Define assignment categories enum
CREATE TYPE assignment_category AS ENUM (
  'formation',
  'coverage',
  'route',
  'protection',
  'blocking',
  'run_fits',
  'adjustments',
  'hot_routes',
  'checks'
);

ALTER TABLE play_assignments
ADD COLUMN category assignment_category DEFAULT 'formation';

-- Add index for filtering by category
CREATE INDEX idx_play_assignments_category ON play_assignments(category);
```

### 3. Add `source_files` to track which files contributed to each assignment
```sql
ALTER TABLE play_assignments
ADD COLUMN source_metadata_ids TEXT[] DEFAULT '{}';

COMMENT ON COLUMN play_assignments.source_metadata_ids IS
'Array of playbook_metadata IDs that were used to generate this assignment';
```

## UI Workflow

### Phase 1: Tagging Files
- **Location**: SavedPlayLibrary.tsx metadata form
- **UI Component**: Tag selector (multi-select chips)
- **Available Tags**: Formation, Coverage, Route, Protection, Blocking, Run Fits, Adjustments, Hot Routes, Checks
- **Storage**: Saved in `playbook_metadata.tags[]`

### Phase 2: Generating Assignments
**Option A: Multi-Select with Tag Filter** (Recommended)
1. Enter multi-select mode
2. Add tag filter buttons (e.g., "Formation", "Coverage")
3. Selecting a tag highlights/filters files with that tag
4. Coaches can select files individually or "Select All [Tag]"
5. Click "Generate" → AI receives all selected files

**Option B: Pure Tag-Based** (Alternative)
1. New "Generate from Tags" button
2. Modal opens with tag checkboxes
3. Select tags (e.g., Formation + Coverage + Route)
4. AI receives ALL files with those tags

### Phase 3: Review & Organize
- **PlayContentReviewModal** groups assignments by category
- Collapsible sections: Formation, Coverage, Route, etc.
- Each assignment card shows:
  - Position (QB, X, Z, etc.)
  - Category badge
  - Assignment details
  - Source files indicator (which files contributed)

## AI Prompt Strategy

### Input to AI:
```
You are generating position assignments for a football playbook.

CONTEXT:
- Formation Info: [content from Formation-tagged files]
- Coverage Info: [content from Coverage-tagged files]
- Route Info: [content from Route-tagged files]
- Protection Info: [content from Protection-tagged files]
- Additional Context: [metadata custom_notes from all files]

TASK:
Generate comprehensive position assignments that synthesize ALL the provided information.
For each position, specify:
1. Alignment (Formation category)
2. Route/Assignment (Route/Coverage category)
3. Blocking/Protection (Protection category)
4. Adjustments (Adjustments category)
5. Hot routes/Checks (Hot Routes/Checks category)

Format each assignment with its appropriate category.
```

### AI Response Format:
```json
{
  "assignments": [
    {
      "position": "QB",
      "category": "formation",
      "alignment": "Under center",
      "assignment": "...",
      "sourceFiles": ["formations-1", "..."]}
    },
    {
      "position": "QB",
      "category": "coverage",
      "assignment": "Read Cover 2 vs Cover 3...",
      "sourceFiles": ["coverage-guide"]
    },
    {
      "position": "X",
      "category": "route",
      "routeId": "Post",
      "depth": 15,
      "assignment": "15-yard post vs inside leverage",
      "sourceFiles": ["route-tree"]
    }
  ]
}
```

## Implementation Phases

### Phase 1: Database (30 min)
- [ ] Create migration for tags column
- [ ] Create migration for category enum and column
- [ ] Create migration for source_metadata_ids column
- [ ] Update database.ts types

### Phase 2: Metadata Tagging UI (45 min)
- [ ] Add tag selector to SavedPlayLibrary.tsx metadata form
- [ ] Update metadata save/update APIs to handle tags
- [ ] Add tag badges to play list items

### Phase 3: Multi-Select with Tag Filtering (1 hour)
- [ ] Add tag filter buttons above play list
- [ ] Implement "Select All [Tag]" functionality
- [ ] Visual indicator for tag-filtered files
- [ ] Update "Generate" button to show selected file count

### Phase 4: AI Generation Updates (2 hours)
- [ ] Update generate-play-content API to accept multiple metadata IDs
- [ ] Fetch and combine content from all selected files
- [ ] Update AI prompt to include categorized context
- [ ] Update AI response parsing to extract category
- [ ] Store source_metadata_ids in assignments

### Phase 5: Review Modal Updates (1 hour)
- [ ] Group assignments by category in PlayContentReviewModal
- [ ] Add category badges to assignment cards
- [ ] Add collapsible category sections
- [ ] Show source file indicators

## Example User Flow

1. **Coach uploads files:**
   - "Trips Formation.png" → tags: Formation
   - "Cover 3 Guide.pdf" → tags: Coverage
   - "WR Route Tree.png" → tags: Route
   - "Protection Schemes.pdf" → tags: Protection, Blocking

2. **Generate assignments:**
   - Click "Multi-Select" mode
   - Click "Formation" tag filter → highlights 1 file
   - Click "Coverage" tag filter → highlights 2 files total
   - Click "Route" tag filter → highlights 3 files total
   - Click "Generate" → AI receives all 3 files

3. **AI generates unified assignments:**
   ```
   QB - Formation: "Under center in Trips Right"
   QB - Coverage: "Read Cover 3: Check X on post, work to Z on dig"
   QB - Protection: "5-step drop, slide left"

   X - Formation: "Trips formation, #1 to boundary"
   X - Route: "Post route, 15 yards, inside release vs press"
   X - Adjustments: "Hot vs blitz: 5-yard slant"
   ```

4. **Review modal:**
   - Assignments grouped by category (Formation, Coverage, Route, etc.)
   - QB has 3 cards (one for each category)
   - X has 3 cards
   - Easy to see which files contributed to each assignment

## Benefits

✅ **Organized like a real playbook** - Categories match how coaches think
✅ **Flexible file reuse** - Same "Cover 3" file used across multiple plays
✅ **Comprehensive assignments** - One position might have 5+ assignments across categories
✅ **Clear attribution** - Know which source files contributed to each assignment
✅ **Scalable** - Easy to add more tags/categories later
