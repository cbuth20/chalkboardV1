-- =====================================================================
-- Migration 010: Playbook Categorization & Multi-File Assignments
--
-- Adds support for:
-- 1. Tagging playbook files (Formation, Coverage, Route, etc.)
-- 2. Categorizing assignments by type
-- 3. Tracking source files for each assignment
-- =====================================================================

-- 1. Add tags to playbook_metadata
-- Allows tagging files with categories like "Formation", "Coverage", "Route"
ALTER TABLE playbook_metadata
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create GIN index for efficient tag queries
CREATE INDEX IF NOT EXISTS idx_playbook_metadata_tags
ON playbook_metadata USING GIN(tags);

COMMENT ON COLUMN playbook_metadata.tags IS
'Tags for organizing playbook files (e.g., Formation, Coverage, Route, Protection)';


-- 2. Create assignment_category enum
-- Defines categories for grouping position assignments
DO $$ BEGIN
    CREATE TYPE assignment_category AS ENUM (
        'formation',
        'coverage',
        'route',
        'protection',
        'blocking',
        'run_fits',
        'adjustments',
        'hot_routes',
        'checks',
        'general'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add category to play_assignments
-- Categorizes each assignment for better organization
ALTER TABLE play_assignments
ADD COLUMN IF NOT EXISTS category assignment_category DEFAULT 'general';

-- Create index for filtering by category
CREATE INDEX IF NOT EXISTS idx_play_assignments_category
ON play_assignments(category);

COMMENT ON COLUMN play_assignments.category IS
'Category of this assignment (formation, coverage, route, etc.)';


-- 4. Add source tracking to play_assignments
-- Tracks which playbook files contributed to each assignment
ALTER TABLE play_assignments
ADD COLUMN IF NOT EXISTS source_metadata_ids TEXT[] DEFAULT '{}';

COMMENT ON COLUMN play_assignments.source_metadata_ids IS
'Array of playbook_metadata IDs that were used to generate this assignment';


-- 5. Add display_order for assignment sorting within categories
ALTER TABLE play_assignments
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN play_assignments.display_order IS
'Order for displaying assignments within their category';
