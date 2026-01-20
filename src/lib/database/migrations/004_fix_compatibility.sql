-- Fix compatibility issues with existing API code

-- 1. Make file_name nullable (it can be derived from file_paths)
ALTER TABLE playbook_metadata
ALTER COLUMN file_name DROP NOT NULL;

-- 2. Add is_built_play column that existing code expects
ALTER TABLE playbook_metadata
ADD COLUMN IF NOT EXISTS is_built_play BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_playbook_metadata_is_built_play ON playbook_metadata(is_built_play);

COMMENT ON COLUMN playbook_metadata.is_built_play IS 'Whether this is a built/generated play vs uploaded content';

-- 2b. Add play_data column for storing additional play information
ALTER TABLE playbook_metadata
ADD COLUMN IF NOT EXISTS play_data JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_playbook_metadata_play_data ON playbook_metadata USING GIN(play_data);

COMMENT ON COLUMN playbook_metadata.play_data IS 'Additional play data and metadata (JSONB)';

-- 3. Create a trigger to auto-populate file_name from file_paths if not provided
CREATE OR REPLACE FUNCTION set_file_name_from_paths()
RETURNS TRIGGER AS $$
BEGIN
  -- If file_name is null but file_paths has values, extract filename from first path
  IF NEW.file_name IS NULL AND NEW.file_paths IS NOT NULL AND array_length(NEW.file_paths, 1) > 0 THEN
    -- Extract filename from path (e.g., 'public/Cover0.JPG' -> 'Cover0.JPG')
    NEW.file_name := (string_to_array(NEW.file_paths[1], '/'))[array_length(string_to_array(NEW.file_paths[1], '/'), 1)];
  END IF;

  -- If still null, set a default
  IF NEW.file_name IS NULL THEN
    NEW.file_name := 'Untitled-' || NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_file_name_trigger ON playbook_metadata;
CREATE TRIGGER set_file_name_trigger
  BEFORE INSERT OR UPDATE ON playbook_metadata
  FOR EACH ROW
  EXECUTE FUNCTION set_file_name_from_paths();

-- 4. Update existing rows that might have null file_name
UPDATE playbook_metadata
SET file_name = COALESCE(
  -- Try to extract from file_paths
  (CASE
    WHEN file_paths IS NOT NULL AND array_length(file_paths, 1) > 0
    THEN (string_to_array(file_paths[1], '/'))[array_length(string_to_array(file_paths[1], '/'), 1)]
    ELSE NULL
  END),
  -- Fallback to ID-based name
  'Untitled-' || id
)
WHERE file_name IS NULL;
