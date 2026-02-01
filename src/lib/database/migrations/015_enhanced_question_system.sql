-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCED QUESTION SYSTEM
-- Expands flashcard_templates to support richer question types and better AI generation
-- ═══════════════════════════════════════════════════════════════════════════

-- Create enum for question types
DO $$ BEGIN
  CREATE TYPE question_type AS ENUM (
    'multiple_choice',    -- Choose one answer from options
    'true_false',         -- True/False question
    'fill_blank',         -- Fill in the blank
    'matching',           -- Match items to each other
    'ordering',           -- Put items in correct order
    'scenario',           -- Scenario-based decision making
    'identification'      -- Identify coverage/formation/concept from description
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for question topics (more granular than category)
DO $$ BEGIN
  CREATE TYPE question_topic AS ENUM (
    -- Alignment & Formation
    'formation_identification',
    'alignment_rules',
    'personnel_groupings',

    -- Assignments & Execution
    'route_running',
    'blocking_assignments',
    'pass_protection',
    'run_fits',

    -- Reads & Keys
    'pre_snap_reads',
    'post_snap_reads',
    'coverage_recognition',
    'hot_routes',

    -- Adjustments & Checks
    'coverage_adjustments',
    'formation_checks',
    'audibles',
    'motion_adjustments',

    -- Concepts & Strategy
    'play_concepts',
    'coverage_concepts',
    'situational_football',
    'game_planning',

    -- General Knowledge
    'terminology',
    'rules',
    'techniques'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to flashcard_templates
ALTER TABLE flashcard_templates
  ADD COLUMN IF NOT EXISTS question_type question_type DEFAULT 'multiple_choice',
  ADD COLUMN IF NOT EXISTS topic question_topic,
  ADD COLUMN IF NOT EXISTS options jsonb DEFAULT '[]'::jsonb, -- For multiple choice: ["option1", "option2", ...]
  ADD COLUMN IF NOT EXISTS distractors jsonb DEFAULT '[]'::jsonb, -- Wrong answers for multiple choice
  ADD COLUMN IF NOT EXISTS scenario_context text, -- For scenario questions: "3rd and 7, we're in trips right..."
  ADD COLUMN IF NOT EXISTS image_url text, -- Optional image for visual questions
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}', -- Tags for filtering: ["3rd_down", "red_zone", "blitz", ...]
  ADD COLUMN IF NOT EXISTS learning_objective text, -- What should player learn from this question
  ADD COLUMN IF NOT EXISTS ai_generation_metadata jsonb DEFAULT '{}'::jsonb, -- Track AI generation details
  ADD COLUMN IF NOT EXISTS requires_position boolean DEFAULT true, -- Whether question is position-specific
  ADD COLUMN IF NOT EXISTS visible_to_positions jsonb DEFAULT '[]'::jsonb; -- Which positions should see this

-- Add comment explaining the enhanced structure
COMMENT ON COLUMN flashcard_templates.question_type IS
  'Type of question: multiple_choice, true_false, fill_blank, matching, ordering, scenario, identification';

COMMENT ON COLUMN flashcard_templates.topic IS
  'Granular topic categorization for better filtering and assignment creation';

COMMENT ON COLUMN flashcard_templates.options IS
  'For multiple choice: array of all options (correct + distractors) in shuffled order';

COMMENT ON COLUMN flashcard_templates.scenario_context IS
  'For scenario questions: the game situation setup (down, distance, field position, etc.)';

COMMENT ON COLUMN flashcard_templates.tags IS
  'Flexible tagging for situations: red_zone, third_down, two_minute, blitz, etc.';

COMMENT ON COLUMN flashcard_templates.learning_objective IS
  'What the player should learn or understand from this question';

COMMENT ON COLUMN flashcard_templates.ai_generation_metadata IS
  'Metadata about AI generation: model, prompt_version, generation_date, etc.';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_flashcards_question_type ON flashcard_templates(question_type);
CREATE INDEX IF NOT EXISTS idx_flashcards_topic ON flashcard_templates(topic);
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON flashcard_templates USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_flashcards_difficulty ON flashcard_templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_flashcards_position_active ON flashcard_templates(position, is_active)
  WHERE is_active = true;

-- Create a view for active questions by position and topic
CREATE OR REPLACE VIEW v_active_questions AS
SELECT
  ft.id,
  ft.play_id,
  ft.position,
  ft.question_type,
  ft.topic,
  ft.category,
  ft.question_prompt,
  ft.difficulty,
  ft.tags,
  ft.learning_objective,
  ft.scenario_context,
  p.name as play_name,
  p.concept,
  p.formation_name,
  p.unit,
  p.playbook_section,
  p.primary_classification
FROM flashcard_templates ft
JOIN plays p ON ft.play_id = p.id
WHERE ft.is_active = true
  AND p.content_status = 'approved'
  AND p.is_published = true;

-- Add helpful comments
COMMENT ON VIEW v_active_questions IS
  'Active questions for approved, published plays with play context';

-- Summary
SELECT
  '✅ Enhanced question system migration complete' as status,
  'Added question_type, topic, scenario support, and better metadata tracking' as changes;
