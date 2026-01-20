-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 012: Expand Flashcard Categories for Content Types
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Purpose: Add content-type specific flashcard categories to support dynamic
--          quiz card generation for different content types (coverage, formation,
--          legend, coaching points, technique, terminology, reference, etc.)
--
-- Current categories: alignment, assignment, coverage, read, terminology,
--                     play_concept, formation_key, coverage_read, execution_key
--
-- New categories: Content-type specific categories for generating targeted
--                 flashcards that test understanding of different football concepts
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add new enum values for flashcard_category
-- Note: Enum values cannot be added inside a transaction, so we use a DO block

DO $$
DECLARE
  new_categories TEXT[] := ARRAY[
    -- Play content categories (new)
    'situational',

    -- Coverage content categories
    'coverage_recognition',
    'defender_responsibility',
    'adjustment_rule',
    'strength_weakness',
    'keys_reads',

    -- Formation content categories
    'formation_identification',
    'personnel',
    'play_compatibility',

    -- Legend content categories
    'symbol_recognition',
    'symbol_meaning',
    'usage_context',
    'diagram_reading',

    -- Index content categories
    'play_organization',
    'naming_convention',
    'navigation',
    'categorization',

    -- Coaching points content categories
    'teaching_point',
    'application',
    'common_mistake',
    'execution',

    -- Technique content categories
    'execution_steps',
    'body_mechanics',
    'common_errors',

    -- Terminology content categories
    'definition',
    'related_terms',

    -- Reference content categories
    'key_concept',
    'importance',
    'game_usage',

    -- Other/general content categories
    'general_knowledge'
  ];
  category TEXT;
BEGIN
  -- Loop through each new category and add it if it doesn't exist
  FOREACH category IN ARRAY new_categories
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumlabel = category
      AND enumtypid = 'flashcard_category'::regtype
    ) THEN
      EXECUTE format('ALTER TYPE flashcard_category ADD VALUE %L', category);
      RAISE NOTICE 'Added flashcard_category value: %', category;
    ELSE
      RAISE NOTICE 'Flashcard_category value already exists: %', category;
    END IF;
  END LOOP;
END $$;

-- Verify the enum has been updated
DO $$
DECLARE
  enum_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO enum_count
  FROM pg_enum
  WHERE enumtypid = 'flashcard_category'::regtype;

  RAISE NOTICE 'Total flashcard_category enum values: %', enum_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration Summary
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Added 35+ new flashcard category values to support:
-- - Coverage scheme testing (recognition, responsibilities, adjustments)
-- - Formation identification and usage
-- - Symbol/legend comprehension
-- - Play organization and navigation
-- - Coaching points and teaching
-- - Technique execution and mechanics
-- - Football terminology
-- - Reference material understanding
-- - General knowledge for uncategorized content
--
-- These categories align with the content-generation-prompts.ts system
-- to generate targeted flashcards based on content_type
--
-- ═══════════════════════════════════════════════════════════════════════════════
