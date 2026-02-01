-- ═══════════════════════════════════════════════════════════════════════════
-- Add Missing Flashcard Category Enum Values
-- Adds: blocking, motion, progression
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Add 'blocking' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'blocking'
    AND enumtypid = 'flashcard_category'::regtype
  ) THEN
    ALTER TYPE flashcard_category ADD VALUE 'blocking';
    RAISE NOTICE 'Added flashcard_category value: blocking';
  ELSE
    RAISE NOTICE 'Flashcard_category value already exists: blocking';
  END IF;

  -- Add 'motion' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'motion'
    AND enumtypid = 'flashcard_category'::regtype
  ) THEN
    ALTER TYPE flashcard_category ADD VALUE 'motion';
    RAISE NOTICE 'Added flashcard_category value: motion';
  ELSE
    RAISE NOTICE 'Flashcard_category value already exists: motion';
  END IF;

  -- Add 'progression' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'progression'
    AND enumtypid = 'flashcard_category'::regtype
  ) THEN
    ALTER TYPE flashcard_category ADD VALUE 'progression';
    RAISE NOTICE 'Added flashcard_category value: progression';
  ELSE
    RAISE NOTICE 'Flashcard_category value already exists: progression';
  END IF;

  RAISE NOTICE 'Migration complete: flashcard_category enum values added';
END $$;

-- Verify the enum values
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'flashcard_category'::regtype
ORDER BY enumlabel;
