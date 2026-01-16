-- Migration: Add RLS policies to allow content clearing
-- This allows the anon key to delete generated content (plays, assignments, flashcards)

-- ============================================================================
-- RLS Policies for play_assignments
-- ============================================================================

-- Allow anyone to select play_assignments (needed for reading)
CREATE POLICY "Allow public read access to play_assignments"
  ON play_assignments
  FOR SELECT
  USING (true);

-- Allow anyone to insert play_assignments (needed for content generation)
CREATE POLICY "Allow public insert to play_assignments"
  ON play_assignments
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update play_assignments (needed for editing)
CREATE POLICY "Allow public update to play_assignments"
  ON play_assignments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete play_assignments (needed for clearing content)
CREATE POLICY "Allow public delete from play_assignments"
  ON play_assignments
  FOR DELETE
  USING (true);

-- ============================================================================
-- RLS Policies for flashcard_templates
-- ============================================================================

-- Allow anyone to select flashcard_templates
CREATE POLICY "Allow public read access to flashcard_templates"
  ON flashcard_templates
  FOR SELECT
  USING (true);

-- Allow anyone to insert flashcard_templates
CREATE POLICY "Allow public insert to flashcard_templates"
  ON flashcard_templates
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update flashcard_templates
CREATE POLICY "Allow public update to flashcard_templates"
  ON flashcard_templates
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete flashcard_templates
CREATE POLICY "Allow public delete from flashcard_templates"
  ON flashcard_templates
  FOR DELETE
  USING (true);

-- ============================================================================
-- RLS Policies for plays
-- ============================================================================

-- Allow anyone to select plays
CREATE POLICY "Allow public read access to plays"
  ON plays
  FOR SELECT
  USING (true);

-- Allow anyone to insert plays
CREATE POLICY "Allow public insert to plays"
  ON plays
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update plays
CREATE POLICY "Allow public update to plays"
  ON plays
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete plays
CREATE POLICY "Allow public delete from plays"
  ON plays
  FOR DELETE
  USING (true);

-- ============================================================================
-- NOTE: These are permissive policies for development/demo purposes
-- In production, you should restrict these to:
-- - Team members only (using team_id)
-- - Authenticated users only (using auth.uid())
-- - Specific roles (using custom claims)
-- ============================================================================
