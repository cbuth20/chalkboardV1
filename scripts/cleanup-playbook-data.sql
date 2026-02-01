-- ═══════════════════════════════════════════════════════════════════════════
-- PLAYBOOK DATA CLEANUP SCRIPT
--
-- Purpose: Clean up plays, assignments, and questions to start fresh with
--          the new AI question generation system
--
-- What this does:
-- 1. Backs up counts of existing data (for reference)
-- 2. Deletes flashcard_templates (questions)
-- 3. Deletes play_assignments
-- 4. Deletes plays
-- 5. Deletes playbook_metadata
-- 6. Shows final counts
--
-- What this KEEPS:
-- - users
-- - organizations
-- - teams
-- - team_members
-- - org_memberships
-- - quiz_assignments (if you want to keep those)
--
-- IMPORTANT: This is destructive! Make sure you want to delete this data.
-- ═══════════════════════════════════════════════════════════════════════════

-- Show current state
SELECT '=== CURRENT STATE ===' as status;

SELECT 'playbook_metadata' as table_name, COUNT(*) as count FROM playbook_metadata
UNION ALL
SELECT 'plays' as table_name, COUNT(*) as count FROM plays
UNION ALL
SELECT 'play_assignments' as table_name, COUNT(*) as count FROM play_assignments
UNION ALL
SELECT 'flashcard_templates' as table_name, COUNT(*) as count FROM flashcard_templates
ORDER BY table_name;

-- Uncomment the following lines to actually perform the cleanup
-- WARNING: This will DELETE data!

/*

-- Step 1: Delete flashcard_templates (questions)
-- These reference play_assignments and plays
DELETE FROM flashcard_templates;
SELECT 'Deleted flashcard_templates' as status;

-- Step 2: Delete play_assignments
-- These reference plays
DELETE FROM play_assignments;
SELECT 'Deleted play_assignments' as status;

-- Step 3: Delete quiz-related data (if needed)
-- Uncomment if you want to clean up quiz attempts too
-- DELETE FROM quiz_attempt_answers;
-- DELETE FROM quiz_attempts;
-- DELETE FROM quiz_assignment_questions;
-- DELETE FROM quiz_assignments;
-- SELECT 'Deleted quiz data' as status;

-- Step 4: Delete plays
-- These reference playbook_metadata
DELETE FROM plays;
SELECT 'Deleted plays' as status;

-- Step 5: Delete playbook_metadata
-- These are the uploaded files/images
DELETE FROM playbook_metadata;
SELECT 'Deleted playbook_metadata' as status;

-- Step 6: Delete other play-related content (if exists)
-- Uncomment if you have these tables with data
-- DELETE FROM coverage_definitions;
-- DELETE FROM formation_definitions;
-- DELETE FROM reference_content;
-- SELECT 'Deleted additional content' as status;

-- Show final state
SELECT '=== AFTER CLEANUP ===' as status;

SELECT 'playbook_metadata' as table_name, COUNT(*) as count FROM playbook_metadata
UNION ALL
SELECT 'plays' as table_name, COUNT(*) as count FROM plays
UNION ALL
SELECT 'play_assignments' as table_name, COUNT(*) as count FROM play_assignments
UNION ALL
SELECT 'flashcard_templates' as table_name, COUNT(*) as count FROM flashcard_templates
ORDER BY table_name;

SELECT '✅ Cleanup complete! Ready for fresh play uploads.' as status;

*/

-- To use this script:
-- 1. Review the counts in CURRENT STATE
-- 2. Uncomment the deletion block above (remove /* and */)
-- 3. Run the script
-- 4. Upload fresh plays through the UI
