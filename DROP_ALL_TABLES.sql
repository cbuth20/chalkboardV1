-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- COMPLETE DATABASE CLEANUP SCRIPT
-- ⚠️  WARNING: This will DELETE ALL DATA and ALL TABLES
-- ⚠️  Only run this if you want to start completely fresh
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Disable RLS temporarily to avoid policy conflicts
ALTER TABLE IF EXISTS teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS games DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS game_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS xp_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_challenge_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leaderboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leaderboard_snapshots DISABLE ROW LEVEL SECURITY;

-- Drop all views first
DROP VIEW IF EXISTS user_team_stats CASCADE;
DROP VIEW IF EXISTS weekly_leaderboard CASCADE;
DROP VIEW IF EXISTS install_plays_detail_view CASCADE;
DROP VIEW IF EXISTS player_install_mastery_view CASCADE;
DROP VIEW IF EXISTS player_weakest_plays_view CASCADE;
DROP VIEW IF EXISTS due_today_plays_view CASCADE;

-- Drop all functions (including triggers)
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_user_level CASCADE;
DROP FUNCTION IF EXISTS update_user_streak CASCADE;
DROP FUNCTION IF EXISTS update_playbook_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_mastery_on_rep CASCADE;
DROP FUNCTION IF EXISTS calculate_mastery_level CASCADE;
DROP FUNCTION IF EXISTS calculate_next_review CASCADE;
DROP FUNCTION IF EXISTS generate_flashcards_for_play CASCADE;
DROP FUNCTION IF EXISTS auth.is_team_member CASCADE;
DROP FUNCTION IF EXISTS auth.user_id CASCADE;

-- Drop playbook system tables (from migration 003)
DROP TABLE IF EXISTS ai_recommendations CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS player_flashcard_progress CASCADE;
DROP TABLE IF EXISTS player_flashcard_attempts CASCADE;
DROP TABLE IF EXISTS flashcard_templates CASCADE;
DROP TABLE IF EXISTS player_play_mastery CASCADE;
DROP TABLE IF EXISTS play_rep_events CASCADE;
DROP TABLE IF EXISTS player_study_sessions CASCADE;
DROP TABLE IF EXISTS motion_definitions CASCADE;
DROP TABLE IF EXISTS coverage_variants CASCADE;
DROP TABLE IF EXISTS coaching_points CASCADE;
DROP TABLE IF EXISTS play_assignments CASCADE;
DROP TABLE IF EXISTS install_plays CASCADE;
DROP TABLE IF EXISTS installs CASCADE;
DROP TABLE IF EXISTS play_tag_assignments CASCADE;
DROP TABLE IF EXISTS team_plays CASCADE;
DROP TABLE IF EXISTS plays CASCADE;
DROP TABLE IF EXISTS play_tags CASCADE;
DROP TABLE IF EXISTS playbooks CASCADE;
DROP TABLE IF EXISTS personnel_groupings CASCADE;
DROP TABLE IF EXISTS user_position_groups CASCADE;
DROP TABLE IF EXISTS position_groups CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;

-- Drop playbook metadata table
DROP TABLE IF EXISTS playbook_metadata CASCADE;

-- Drop core game tables
DROP TABLE IF EXISTS leaderboard_snapshots CASCADE;
DROP TABLE IF EXISTS leaderboards CASCADE;
DROP TABLE IF EXISTS daily_challenge_completions CASCADE;
DROP TABLE IF EXISTS daily_challenges CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS xp_events CASCADE;
DROP TABLE IF EXISTS player_scores CASCADE;
DROP TABLE IF EXISTS game_attempts CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Drop all custom types (from playbook system)
DROP TYPE IF EXISTS coverage_effectiveness CASCADE;
DROP TYPE IF EXISTS ai_insight_type CASCADE;
DROP TYPE IF EXISTS play_status CASCADE;
DROP TYPE IF EXISTS install_status CASCADE;
DROP TYPE IF EXISTS motion_timing CASCADE;
DROP TYPE IF EXISTS motion_type CASCADE;
DROP TYPE IF EXISTS flashcard_category CASCADE;
DROP TYPE IF EXISTS mastery_level CASCADE;
DROP TYPE IF EXISTS skill_position CASCADE;
DROP TYPE IF EXISTS play_type CASCADE;

-- Drop all custom types (from base schema)
DROP TYPE IF EXISTS time_window CASCADE;
DROP TYPE IF EXISTS leaderboard_scope CASCADE;
DROP TYPE IF EXISTS xp_event_type CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS game_mode CASCADE;
DROP TYPE IF EXISTS game_type CASCADE;
DROP TYPE IF EXISTS football_position CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CLEANUP COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Verify all tables are gone
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- If the above query returns 0 rows, cleanup was successful!
-- Now you can run schema.sql from scratch.
