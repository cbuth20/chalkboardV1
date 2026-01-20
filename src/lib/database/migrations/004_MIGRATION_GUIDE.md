# Migration 004: Content Types System - Migration Guide

## Overview

This migration adds support for multiple content types (plays, coverages, formations, reference materials) while maintaining **100% backwards compatibility** with existing plays.

## What Changed

### ✅ Safe Changes (Backwards Compatible)

1. **Added `content_type` column to `plays` table**
   - Defaults to `'play'` for all existing rows
   - No impact on existing queries

2. **Added optional columns to `play_assignments` table**
   - `category` (defaults to `'general'`)
   - `display_order` (defaults to `0`)
   - `source_metadata_ids` (defaults to `{}`)
   - All have safe defaults, no data migration needed

3. **Created 5 new tables**
   - `playbook_metadata` - Central registry of uploaded content
   - `formation_definitions` - Formation reference sheets
   - `coverage_definitions` - Defensive coverage schemes
   - `reference_content` - Legends, indexes, terminology
   - `gpt_analysis_cache` - Raw GPT analysis cache

### 📊 New Tables Schema

```
playbook_metadata
├── Links to: teams, plays (optional)
└── Purpose: Central registry for all playbook uploads

formation_definitions
├── Links to: playbook_metadata, plays (optional)
└── Purpose: Single or multi-formation reference sheets

coverage_definitions
├── Links to: playbook_metadata, plays (optional)
└── Purpose: Defensive coverage schemes with adjustments

reference_content
├── Links to: playbook_metadata
└── Purpose: Legends, indexes, terminology, coaching points

gpt_analysis_cache
├── Links to: playbook_metadata
└── Purpose: Raw GPT responses for debugging/re-processing
```

## Pre-Migration Checklist

- [ ] Backup your database
- [ ] Review the migration SQL file
- [ ] Test in a development environment first
- [ ] Verify TypeScript types are updated

## Running the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `004_content_types_system.sql`
5. Paste into the SQL editor
6. Click **Run**
7. Verify no errors

### Option 2: Supabase CLI

```bash
# Navigate to your project root
cd /Users/conbuth/Documents/chalkboardV1

# Run the migration
supabase db push --db-url <your-database-url>
```

### Option 3: Direct psql Connection

```bash
psql <your-connection-string> < src/lib/database/migrations/004_content_types_system.sql
```

## Verification Steps

After running the migration, verify it worked:

```sql
-- 1. Check content_type column was added to plays
SELECT content_type, COUNT(*)
FROM plays
GROUP BY content_type;
-- Should show: play | <count of existing plays>

-- 2. Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'playbook_metadata',
    'formation_definitions',
    'coverage_definitions',
    'reference_content',
    'gpt_analysis_cache'
  );
-- Should return all 5 table names

-- 3. Verify play_assignments columns were added
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'play_assignments'
  AND column_name IN ('category', 'display_order', 'source_metadata_ids');
-- Should return 3 rows

-- 4. Check RLS policies are active
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'playbook_metadata',
    'formation_definitions',
    'coverage_definitions',
    'reference_content'
  )
GROUP BY tablename;
-- Should show 2 policies per table (view + manage)
```

## Backwards Compatibility Guarantee

### ✅ Existing Code Will Continue to Work

1. **All existing plays queries** - Work unchanged
   ```typescript
   // This still works exactly as before
   const { data: plays } = await supabase
     .from('plays')
     .select('*')
     .eq('team_id', teamId);
   ```

2. **All existing assignment queries** - Work unchanged
   ```typescript
   // This still works exactly as before
   const { data: assignments } = await supabase
     .from('play_assignments')
     .select('*')
     .eq('play_id', playId);
   ```

3. **Existing flashcard generation** - No changes needed
   - Uses existing `play_assignments` structure
   - New columns are optional

### 🎯 What You Can Now Do (New Features)

1. **Filter plays by content type**
   ```typescript
   // Get only offensive plays
   const { data: plays } = await supabase
     .from('plays')
     .select('*')
     .eq('content_type', 'play')
     .eq('team_id', teamId);

   // Get coverage schemes
   const { data: coverages } = await supabase
     .from('plays')
     .select('*')
     .eq('content_type', 'coverage')
     .eq('team_id', teamId);
   ```

2. **Store playbook metadata**
   ```typescript
   // When a user uploads a formation sheet
   const { data: metadata } = await supabase
     .from('playbook_metadata')
     .insert({
       team_id: teamId,
       file_name: 'formation-sheet.pdf',
       file_url: storageUrl,
       content_type: 'formation',
       side_of_ball: 'offense',
       uploaded_by: userId
     })
     .select()
     .single();
   ```

3. **Link formations to metadata**
   ```typescript
   // Store the formation analysis
   const { data: formation } = await supabase
     .from('formation_definitions')
     .insert({
       metadata_id: metadata.id,
       name: 'Gun Trips',
       personnel: '11',
       key_features: ['3x1 formation', 'Trips right'],
       common_plays: ['Mesh', 'Y-Cross', 'Snag']
     });
   ```

## Using the New Schema

### Example 1: Uploading a Formation Sheet

```typescript
import { supabase } from '@/lib/supabase/client';
import { convertGPTFormationToDefinition } from '@/lib/generateQuizQuestions';

async function uploadFormationSheet(file: File, teamId: string, userId: string) {
  // 1. Upload to storage
  const { data: storageData } = await supabase.storage
    .from('playbooks')
    .upload(`${teamId}/${file.name}`, file);

  // 2. Analyze with GPT
  const analysis = await analyzeFormation(storageData.path);

  // 3. Create metadata entry
  const { data: metadata } = await supabase
    .from('playbook_metadata')
    .insert({
      team_id: teamId,
      file_name: file.name,
      storage_path: storageData.path,
      content_type: 'formation',
      side_of_ball: 'offense',
      uploaded_by: userId,
      analyzed_at: new Date().toISOString()
    })
    .select()
    .single();

  // 4. Store formation definition
  const formationDef = convertGPTFormationToDefinition(analysis, metadata.id);

  const { data: formation } = await supabase
    .from('formation_definitions')
    .insert({
      metadata_id: metadata.id,
      ...formationDef
    })
    .select()
    .single();

  return { metadata, formation };
}
```

### Example 2: Querying All Content for a Team

```typescript
async function getTeamContent(teamId: string) {
  // Use the playbook_content_overview view
  const { data } = await supabase
    .from('playbook_content_overview')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Group by content type
  const grouped = data?.reduce((acc, item) => {
    const type = item.content_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, typeof data>);

  return grouped;
}
```

## Rollback Procedure

If you need to rollback this migration:

```sql
-- WARNING: This will delete all data in the new tables!
-- Backup your data first if needed.

-- Drop the view
DROP VIEW IF EXISTS playbook_content_overview;

-- Drop new tables
DROP TABLE IF EXISTS gpt_analysis_cache;
DROP TABLE IF EXISTS reference_content;
DROP TABLE IF EXISTS coverage_definitions;
DROP TABLE IF EXISTS formation_definitions;
DROP TABLE IF EXISTS playbook_metadata;

-- Remove columns from existing tables
ALTER TABLE play_assignments DROP COLUMN IF EXISTS source_metadata_ids;
ALTER TABLE play_assignments DROP COLUMN IF EXISTS display_order;
ALTER TABLE play_assignments DROP COLUMN IF EXISTS category;

ALTER TABLE plays DROP COLUMN IF EXISTS content_type;

-- Drop enum
DROP TYPE IF EXISTS content_type;
```

## Support

If you encounter any issues:

1. Check the verification steps above
2. Review the migration SQL comments
3. Check Supabase logs for errors
4. Ensure RLS policies are correct for your auth setup

## Next Steps

After migration is complete:

1. ✅ Update your TypeScript types (already done in `database.ts`)
2. ✅ Update file upload flow to use `playbook_metadata`
3. ✅ Update GPT analysis to save to appropriate content tables
4. ✅ Update UI to display different content types
5. ✅ Test the full flow: upload → analyze → display

---

**Migration Status**: Ready for Production
**Backwards Compatible**: ✅ Yes
**Data Loss Risk**: ❌ None (all changes are additive)
**Rollback Available**: ✅ Yes
