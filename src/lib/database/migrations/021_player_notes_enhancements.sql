-- =====================================================================
-- Migration 021: Player Notes Enhancements
--
-- Adds additional fields to player_playbook_metadata to support
-- the My Notes feature with better categorization and metadata.
--
-- New Fields:
-- - note_type: Type of note (playbook_pdf, defensive_scheme, etc.)
-- - file_category: Category grouping (notes, reference, playbook_pdf)
-- - page_count: Number of pages in PDF files
-- =====================================================================

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 1: ADD NEW COLUMNS
-- ═══════════════════════════════════════════════════════════════════

-- Add note_type column for categorizing different types of notes
ALTER TABLE player_playbook_metadata
  ADD COLUMN IF NOT EXISTS note_type TEXT;

-- Add file_category column for high-level grouping
ALTER TABLE player_playbook_metadata
  ADD COLUMN IF NOT EXISTS file_category TEXT;

-- Add page_count column for PDF files
ALTER TABLE player_playbook_metadata
  ADD COLUMN IF NOT EXISTS page_count INTEGER;

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 2: ADD CHECK CONSTRAINTS (Optional - for data validation)
-- ═══════════════════════════════════════════════════════════════════

-- Constraint for note_type values
ALTER TABLE player_playbook_metadata
  ADD CONSTRAINT chk_note_type
  CHECK (note_type IS NULL OR note_type IN (
    'playbook_pdf',
    'defensive_scheme',
    'route_tree',
    'study_guide',
    'reference',
    'other'
  ));

-- Constraint for file_category values
ALTER TABLE player_playbook_metadata
  ADD CONSTRAINT chk_file_category
  CHECK (file_category IS NULL OR file_category IN (
    'notes',
    'reference',
    'playbook_pdf'
  ));

-- Constraint for page_count (must be positive if provided)
ALTER TABLE player_playbook_metadata
  ADD CONSTRAINT chk_page_count_positive
  CHECK (page_count IS NULL OR page_count > 0);

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 3: ADD INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════

-- Index for filtering by note_type
CREATE INDEX IF NOT EXISTS idx_player_playbook_metadata_note_type
  ON player_playbook_metadata(note_type)
  WHERE note_type IS NOT NULL;

-- Index for filtering by file_category
CREATE INDEX IF NOT EXISTS idx_player_playbook_metadata_file_category
  ON player_playbook_metadata(file_category)
  WHERE file_category IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 4: ADD COLUMN COMMENTS
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON COLUMN player_playbook_metadata.note_type IS 'Type of note content: playbook_pdf, defensive_scheme, route_tree, study_guide, reference, or other';
COMMENT ON COLUMN player_playbook_metadata.file_category IS 'High-level category: notes, reference, or playbook_pdf';
COMMENT ON COLUMN player_playbook_metadata.page_count IS 'Number of pages in PDF files (NULL for non-PDF files)';

-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON SCHEMA public IS 'Migration 021: Player Notes Enhancements - Added note_type, file_category, and page_count fields';
