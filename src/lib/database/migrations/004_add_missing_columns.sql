-- Add missing columns for backwards compatibility with existing API code

-- Add file_paths to playbook_metadata
ALTER TABLE playbook_metadata
ADD COLUMN IF NOT EXISTS file_paths TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_playbook_metadata_file_paths ON playbook_metadata USING GIN(file_paths);

COMMENT ON COLUMN playbook_metadata.file_paths IS 'Array of file paths for this playbook content';

-- Add content_status to plays table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plays' AND column_name = 'content_status'
  ) THEN
    -- First create the enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status_enum') THEN
      CREATE TYPE content_status_enum AS ENUM ('pending_review', 'approved', 'rejected');
    END IF;

    -- Add the column with a default
    ALTER TABLE plays ADD COLUMN content_status content_status_enum DEFAULT 'approved';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plays_content_status ON plays(content_status);

COMMENT ON COLUMN plays.content_status IS 'Review status of the play content';

-- Add playbook_metadata_id to plays table for backwards compatibility
ALTER TABLE plays
ADD COLUMN IF NOT EXISTS playbook_metadata_id UUID REFERENCES playbook_metadata(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_plays_playbook_metadata_id ON plays(playbook_metadata_id);

COMMENT ON COLUMN plays.playbook_metadata_id IS 'Link to playbook metadata (legacy - prefer using playbook_metadata.play_id)';
