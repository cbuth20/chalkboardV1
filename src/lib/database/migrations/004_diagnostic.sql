-- Diagnostic script to check migration status

-- Check if content_type enum exists
SELECT EXISTS (
  SELECT 1 FROM pg_type WHERE typname = 'content_type'
) AS content_type_enum_exists;

-- Check if content_type column exists in plays table
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'plays' AND column_name = 'content_type'
) AS plays_content_type_column_exists;

-- Check which new tables exist
SELECT
  'playbook_metadata' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playbook_metadata') AS exists
UNION ALL
SELECT
  'formation_definitions',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'formation_definitions')
UNION ALL
SELECT
  'coverage_definitions',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coverage_definitions')
UNION ALL
SELECT
  'reference_content',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reference_content')
UNION ALL
SELECT
  'gpt_analysis_cache',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gpt_analysis_cache');

-- Check if uuid-ossp extension is enabled (required for uuid_generate_v4)
SELECT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
) AS uuid_ossp_extension_exists;

-- Check if playbook_metadata has play_id column if table exists
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'playbook_metadata'
  AND column_name = 'play_id';
