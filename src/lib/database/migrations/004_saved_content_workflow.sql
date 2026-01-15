-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CHALKBOARD — SAVED CONTENT WORKFLOW MIGRATION
--
-- Extends the playbook system to support coach review workflow:
-- - Links plays to source playbook metadata
-- - Stores AI-generated insights
-- - Tracks content review status and approval
-- - Distinguishes between assignment and knowledge flashcards
--
-- Run this after 003_playbook_system.sql has been applied.
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 1: Extend plays table for AI content and review workflow
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Link to source playbook metadata (where the play image came from)
ALTER TABLE plays
  ADD COLUMN IF NOT EXISTS playbook_metadata_id UUID REFERENCES playbook_metadata(id) ON DELETE SET NULL;

-- Store AI-generated playbook insights as text (markdown format)
ALTER TABLE plays
  ADD COLUMN IF NOT EXISTS ai_insights TEXT DEFAULT NULL;

-- Add review workflow tracking columns
ALTER TABLE plays
  ADD COLUMN IF NOT EXISTS content_status VARCHAR(30) DEFAULT 'draft',  -- 'draft', 'pending_review', 'approved', 'rejected'
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_plays_playbook_metadata_id ON plays(playbook_metadata_id);
CREATE INDEX IF NOT EXISTS idx_plays_content_status ON plays(team_id, content_status);
CREATE INDEX IF NOT EXISTS idx_plays_approved ON plays(team_id, content_status) WHERE content_status = 'approved';

-- Add check constraint to ensure valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_content_status'
  ) THEN
    ALTER TABLE plays
      ADD CONSTRAINT chk_content_status
      CHECK (content_status IN ('draft', 'pending_review', 'approved', 'rejected'));
  END IF;
END$$;


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 2: Extend flashcard_templates table to distinguish card types
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Add card_type column to differentiate between assignment and knowledge cards
ALTER TABLE flashcard_templates
  ADD COLUMN IF NOT EXISTS card_type VARCHAR(30) DEFAULT 'assignment';

-- Create index for efficient filtering by card type
CREATE INDEX IF NOT EXISTS idx_flashcard_templates_card_type ON flashcard_templates(play_id, card_type);

-- Add check constraint to ensure valid card types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_card_type'
  ) THEN
    ALTER TABLE flashcard_templates
      ADD CONSTRAINT chk_card_type
      CHECK (card_type IN ('assignment', 'knowledge'));
  END IF;
END$$;


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 3: Extend flashcard_category enum for general knowledge cards
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Add new flashcard categories for general play knowledge
-- Using DO block to avoid errors if values already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'play_concept' AND enumtypid = 'flashcard_category'::regtype) THEN
    ALTER TYPE flashcard_category ADD VALUE 'play_concept';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'formation_key' AND enumtypid = 'flashcard_category'::regtype) THEN
    ALTER TYPE flashcard_category ADD VALUE 'formation_key';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'coverage_read' AND enumtypid = 'flashcard_category'::regtype) THEN
    ALTER TYPE flashcard_category ADD VALUE 'coverage_read';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'execution_key' AND enumtypid = 'flashcard_category'::regtype) THEN
    ALTER TYPE flashcard_category ADD VALUE 'execution_key';
  END IF;
END$$;


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STEP 4: Add RLS policies for new columns (if RLS is enabled)
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Note: Existing RLS policies on plays and flashcard_templates tables should automatically
-- cover the new columns. No additional policies needed unless there are specific access
-- restrictions for the review workflow.

-- Coaches/admins can update content_status and review fields
-- (This assumes existing policies allow coaches to UPDATE plays for their team)


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Summary of changes:
-- ✓ plays table extended with: playbook_metadata_id, ai_insights, content_status, reviewed_by, reviewed_at, review_notes
-- ✓ flashcard_templates extended with: card_type
-- ✓ flashcard_category enum extended with: play_concept, formation_key, coverage_read, execution_key
-- ✓ Indexes created for efficient querying
-- ✓ Check constraints added for data integrity
