-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CHALKBOARD — CONTENT TYPES SYSTEM MIGRATION
--
-- Adds support for multiple content types (plays, coverages, formations, reference materials)
-- while maintaining FULL backwards compatibility with existing plays.
--
-- Migration: 004
-- Run this after: 003_playbook_system.sql
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 0: PREREQUISITES
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Ensure UUID extension is enabled (required for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 1: ADD CONTENT TYPE ENUM AND UPDATE EXISTING TABLES
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- Create content type enum (only if it doesn't exist)
-- ───────────────────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
    CREATE TYPE content_type AS ENUM (
      'play',           -- Standard offensive/defensive plays
      'coverage',       -- Defensive coverage schemes
      'formation',      -- Formation reference sheets
      'legend',         -- Symbol/notation legends
      'index',          -- Play index/menu sheets
      'coaching_points', -- Coaching point reference
      'technique',      -- Technique instruction
      'terminology',    -- Terminology definitions
      'reference',      -- General reference material
      'other'           -- Uncategorized
    );
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- Add content_type to plays table (SAFE - defaults to 'play' for existing rows)
-- ───────────────────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Only add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plays' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE plays ADD COLUMN content_type content_type DEFAULT 'play';
  END IF;
END $$;

-- Add index for content type filtering (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_plays_content_type ON plays(content_type);

COMMENT ON COLUMN plays.content_type IS 'Type of content - defaults to play for backwards compatibility';


-- ───────────────────────────────────────────────────────────────────────────────────────────
-- Add optional fields to play_assignments for better organization (SAFE - nullable/defaults)
-- ───────────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE play_assignments
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS source_metadata_ids UUID[] DEFAULT '{}';

-- Create index only if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_play_assignments_category ON play_assignments(category);

COMMENT ON COLUMN play_assignments.category IS 'Assignment category: formation, coverage, route, protection, blocking, run_fits, adjustments, hot_routes, checks, general';
COMMENT ON COLUMN play_assignments.source_metadata_ids IS 'Links to playbook_metadata entries that contributed this assignment data';


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 2: PLAYBOOK METADATA TABLE
-- Central table linking file uploads to their analyzed content
-- ═══════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS playbook_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT,                        -- URL to original uploaded file
  storage_path TEXT,                    -- Path in storage bucket
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),

  -- Content classification
  content_type content_type NOT NULL DEFAULT 'other',
  side_of_ball VARCHAR(20),             -- 'offense', 'defense', 'special_teams', 'general'

  -- Play/formation context
  formation_name VARCHAR(100),
  concept_name VARCHAR(100),
  play_type VARCHAR(50),                -- Can store custom play types beyond enum

  -- Organization
  level VARCHAR(50),                    -- 'youth', 'high_school', 'college', 'pro'
  position_relevance TEXT[],            -- Array of positions this is relevant to
  tags TEXT[],                          -- Custom tags for searching

  -- User annotations
  custom_notes TEXT,
  custom_title VARCHAR(200),            -- User can override AI-generated title

  -- AI analysis metadata
  analyzed_at TIMESTAMPTZ,
  ai_model_version VARCHAR(50),
  ai_confidence_score DECIMAL(3,2),     -- 0.00 to 1.00

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Links to generated content
  play_id UUID REFERENCES plays(id) ON DELETE SET NULL,  -- If converted to a play

  -- Metadata
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playbook_metadata_team_id ON playbook_metadata(team_id);
CREATE INDEX IF NOT EXISTS idx_playbook_metadata_content_type ON playbook_metadata(content_type);
CREATE INDEX IF NOT EXISTS idx_playbook_metadata_side_of_ball ON playbook_metadata(side_of_ball);
CREATE INDEX IF NOT EXISTS idx_playbook_metadata_position_relevance ON playbook_metadata USING GIN(position_relevance);
CREATE INDEX IF NOT EXISTS idx_playbook_metadata_tags ON playbook_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_playbook_metadata_play_id ON playbook_metadata(play_id);
CREATE INDEX IF NOT EXISTS idx_playbook_metadata_active ON playbook_metadata(team_id, is_active) WHERE is_active = TRUE;

COMMENT ON TABLE playbook_metadata IS 'Central registry of all playbook content uploads and their metadata';


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 3: FORMATION DEFINITIONS TABLE
-- Stores formation reference sheets (single or multi-formation)
-- ═══════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS formation_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metadata_id UUID NOT NULL REFERENCES playbook_metadata(id) ON DELETE CASCADE,
  play_id UUID REFERENCES plays(id) ON DELETE SET NULL,  -- Optional link if converted to play

  -- Formation identity
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50),
  personnel VARCHAR(50),                -- '11', '12', '21', etc.
  alignment TEXT,                       -- General alignment description

  -- Single formation content
  description TEXT,
  key_features TEXT[],
  common_plays TEXT[],
  positions JSONB,                      -- { position: { alignment: "..." } }

  -- Multi-formation support
  is_multi_formation BOOLEAN DEFAULT FALSE,
  formations JSONB,                     -- Array of formation objects for sheets with multiple formations

  -- Additional info
  notes TEXT,
  diagram_data JSONB,                   -- Optional diagram coordinates

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formation_definitions_metadata_id ON formation_definitions(metadata_id);
CREATE INDEX IF NOT EXISTS idx_formation_definitions_play_id ON formation_definitions(play_id);
CREATE INDEX IF NOT EXISTS idx_formation_definitions_personnel ON formation_definitions(personnel);
CREATE INDEX IF NOT EXISTS idx_formation_definitions_multi ON formation_definitions(is_multi_formation);

COMMENT ON TABLE formation_definitions IS 'Formation reference sheets - single or multiple formations per sheet';
COMMENT ON COLUMN formation_definitions.formations IS 'Array of formation objects when is_multi_formation = true';


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 4: COVERAGE DEFINITIONS TABLE
-- Stores defensive coverage schemes
-- ═══════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coverage_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metadata_id UUID NOT NULL REFERENCES playbook_metadata(id) ON DELETE CASCADE,
  play_id UUID REFERENCES plays(id) ON DELETE SET NULL,  -- Optional link if converted to play

  -- Coverage identity
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50),
  coverage_type VARCHAR(50),            -- 'man', 'zone', 'match', 'quarters', etc.
  coverage_family VARCHAR(50),          -- 'cover_2', 'cover_3', 'cover_4', 'cover_6', etc.
  front VARCHAR(50),                    -- '4-3', '3-4', 'nickel', 'dime', etc.

  -- Content
  description TEXT,
  key_points TEXT[],
  strengths TEXT[],
  weaknesses TEXT[],
  best_against TEXT[],                  -- What offensive concepts this coverage excels against

  -- Position assignments (defensive)
  positions JSONB,                      -- { position: { alignment, landmark, assignment, read, adjustments: { vsTrips, vs2x2, vsEmpty, vsMotion } } }

  -- Coverage keys/identifiers
  coverage_keys TEXT[],                 -- Pre-snap keys to identify this coverage

  -- Additional info
  coaching_points TEXT[],
  diagram_data JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coverage_definitions_metadata_id ON coverage_definitions(metadata_id);
CREATE INDEX IF NOT EXISTS idx_coverage_definitions_play_id ON coverage_definitions(play_id);
CREATE INDEX IF NOT EXISTS idx_coverage_definitions_type ON coverage_definitions(coverage_type);
CREATE INDEX IF NOT EXISTS idx_coverage_definitions_family ON coverage_definitions(coverage_family);
CREATE INDEX IF NOT EXISTS idx_coverage_definitions_front ON coverage_definitions(front);

COMMENT ON TABLE coverage_definitions IS 'Defensive coverage schemes with position assignments and adjustments';
COMMENT ON COLUMN coverage_definitions.positions IS 'JSONB with position-specific assignments and situation adjustments';


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 5: REFERENCE CONTENT TABLE
-- Stores legends, indexes, terminology, coaching points, and other reference materials
-- ═══════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reference_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metadata_id UUID NOT NULL REFERENCES playbook_metadata(id) ON DELETE CASCADE,

  -- Content identity
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(200),
  content_subtype VARCHAR(50),          -- More specific: 'route_tree', 'symbol_legend', 'play_index', etc.

  -- General content
  description TEXT,

  -- Structured content (flexible JSONB for different types)
  sections JSONB,                       -- Array of { heading, content, keyPoints }
  terminology JSONB,                    -- Array of { term, definition, examples }
  diagrams JSONB,                       -- Array of { description, keyPoints, symbolMeaning }
  coaching_points TEXT[],
  techniques JSONB,                     -- Array of { name, description, steps, keyPoints }

  -- Index/menu specific
  play_references JSONB,                -- Array of { playName, pageNumber, category, description }

  -- Legend specific
  symbols JSONB,                        -- Array of { symbol, meaning, category }

  -- Additional info
  notes TEXT,
  related_play_ids UUID[],              -- Links to plays this content references

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reference_content_metadata_id ON reference_content(metadata_id);
CREATE INDEX IF NOT EXISTS idx_reference_content_subtype ON reference_content(content_subtype);
CREATE INDEX IF NOT EXISTS idx_reference_content_related_plays ON reference_content USING GIN(related_play_ids);

COMMENT ON TABLE reference_content IS 'Reference materials: legends, indexes, terminology, coaching points, techniques';
COMMENT ON COLUMN reference_content.sections IS 'General-purpose sections with headings and content';
COMMENT ON COLUMN reference_content.terminology IS 'Term definitions with optional examples';
COMMENT ON COLUMN reference_content.play_references IS 'For index pages: list of plays with page numbers';
COMMENT ON COLUMN reference_content.symbols IS 'For legend pages: symbol definitions';


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 6: RAW GPT ANALYSIS CACHE TABLE (Optional - for debugging/auditing)
-- ═══════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gpt_analysis_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metadata_id UUID NOT NULL REFERENCES playbook_metadata(id) ON DELETE CASCADE,

  -- Request info
  model_version VARCHAR(50) NOT NULL,
  prompt_version VARCHAR(50),
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Response
  raw_response JSONB NOT NULL,          -- Full GPT response
  response_tokens INT,
  processing_time_ms INT,

  -- Status
  is_successful BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gpt_analysis_cache_metadata_id ON gpt_analysis_cache(metadata_id);
CREATE INDEX IF NOT EXISTS idx_gpt_analysis_cache_timestamp ON gpt_analysis_cache(request_timestamp DESC);

COMMENT ON TABLE gpt_analysis_cache IS 'Caches raw GPT analysis responses for debugging and re-processing';


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 7: UPDATED_AT TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_playbook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for new tables
DROP TRIGGER IF EXISTS update_playbook_metadata_updated_at ON playbook_metadata;
CREATE TRIGGER update_playbook_metadata_updated_at
  BEFORE UPDATE ON playbook_metadata
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

DROP TRIGGER IF EXISTS update_formation_definitions_updated_at ON formation_definitions;
CREATE TRIGGER update_formation_definitions_updated_at
  BEFORE UPDATE ON formation_definitions
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

DROP TRIGGER IF EXISTS update_coverage_definitions_updated_at ON coverage_definitions;
CREATE TRIGGER update_coverage_definitions_updated_at
  BEFORE UPDATE ON coverage_definitions
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();

DROP TRIGGER IF EXISTS update_reference_content_updated_at ON reference_content;
CREATE TRIGGER update_reference_content_updated_at
  BEFORE UPDATE ON reference_content
  FOR EACH ROW EXECUTE FUNCTION update_playbook_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 8: ROW-LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Enable RLS on new tables
ALTER TABLE playbook_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_analysis_cache ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Playbook Metadata Policies
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Team members can view playbook metadata" ON playbook_metadata;
CREATE POLICY "Team members can view playbook metadata" ON playbook_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = playbook_metadata.team_id AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can manage playbook metadata" ON playbook_metadata;
CREATE POLICY "Coaches can manage playbook metadata" ON playbook_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = playbook_metadata.team_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Formation Definitions Policies
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Team members can view formation definitions" ON formation_definitions;
CREATE POLICY "Team members can view formation definitions" ON formation_definitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playbook_metadata pm
      JOIN team_members tm ON tm.team_id = pm.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE pm.id = formation_definitions.metadata_id AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can manage formation definitions" ON formation_definitions;
CREATE POLICY "Coaches can manage formation definitions" ON formation_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM playbook_metadata pm
      JOIN team_members tm ON tm.team_id = pm.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE pm.id = formation_definitions.metadata_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Coverage Definitions Policies
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Team members can view coverage definitions" ON coverage_definitions;
CREATE POLICY "Team members can view coverage definitions" ON coverage_definitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playbook_metadata pm
      JOIN team_members tm ON tm.team_id = pm.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE pm.id = coverage_definitions.metadata_id AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can manage coverage definitions" ON coverage_definitions;
CREATE POLICY "Coaches can manage coverage definitions" ON coverage_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM playbook_metadata pm
      JOIN team_members tm ON tm.team_id = pm.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE pm.id = coverage_definitions.metadata_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Reference Content Policies
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Team members can view reference content" ON reference_content;
CREATE POLICY "Team members can view reference content" ON reference_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playbook_metadata pm
      JOIN team_members tm ON tm.team_id = pm.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE pm.id = reference_content.metadata_id AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can manage reference content" ON reference_content;
CREATE POLICY "Coaches can manage reference content" ON reference_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM playbook_metadata pm
      JOIN team_members tm ON tm.team_id = pm.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE pm.id = reference_content.metadata_id
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- GPT Analysis Cache Policies
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Team members can view analysis cache" ON gpt_analysis_cache;
CREATE POLICY "Team members can view analysis cache" ON gpt_analysis_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playbook_metadata pm
      JOIN team_members tm ON tm.team_id = pm.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE pm.id = gpt_analysis_cache.metadata_id AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert analysis cache" ON gpt_analysis_cache;
CREATE POLICY "System can insert analysis cache" ON gpt_analysis_cache
  FOR INSERT WITH CHECK (true);  -- Allow system to cache responses


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 9: HELPER VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- View: All playbook content with metadata
-- Only create if the required tables exist
-- ───────────────────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS playbook_content_overview;

DO $$
BEGIN
  -- Only create view if all required tables exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'playbook_metadata'
  ) THEN
    EXECUTE '
CREATE VIEW playbook_content_overview AS
SELECT
  pm.id AS metadata_id,
  pm.team_id,
  pm.file_name,
  pm.content_type,
  pm.side_of_ball,
  pm.formation_name,
  pm.concept_name,
  pm.custom_title,
  pm.position_relevance,
  pm.tags,
  pm.is_active,
  pm.play_id,
  pm.uploaded_by,
  pm.created_at,

  -- Play info if linked
  p.name AS play_name,
  p.short_name AS play_short_name,

  -- Formation info if exists
  fd.name AS formation_def_name,
  fd.is_multi_formation,

  -- Coverage info if exists
  cd.name AS coverage_def_name,
  cd.coverage_family,

  -- Reference info if exists
  rc.title AS reference_title,
  rc.content_subtype

FROM playbook_metadata pm
LEFT JOIN plays p ON pm.play_id = p.id
LEFT JOIN formation_definitions fd ON fd.metadata_id = pm.id
LEFT JOIN coverage_definitions cd ON cd.metadata_id = pm.id
LEFT JOIN reference_content rc ON rc.metadata_id = pm.id
    ';

    EXECUTE 'COMMENT ON VIEW playbook_content_overview IS ''Overview of all playbook content with joined metadata''';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SECTION 10: BACKWARDS COMPATIBILITY VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- This section documents that all existing functionality remains intact:
--
-- ✅ plays table: content_type column added with DEFAULT 'play' - all existing rows get 'play'
-- ✅ play_assignments: new columns are nullable/have defaults - no existing data affected
-- ✅ All existing foreign keys remain unchanged
-- ✅ No existing columns dropped or modified
-- ✅ All new tables are separate and isolated
-- ✅ All existing queries will continue to work without modification
-- ✅ RLS policies on existing tables unchanged
--
-- Migration is SAFE for production deployment.


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- ROLLBACK SCRIPT (if needed)
-- ═══════════════════════════════════════════════════════════════════════════════════════════

/*
-- To rollback this migration, run:

DROP VIEW IF EXISTS playbook_content_overview;

DROP TABLE IF EXISTS gpt_analysis_cache;
DROP TABLE IF EXISTS reference_content;
DROP TABLE IF EXISTS coverage_definitions;
DROP TABLE IF EXISTS formation_definitions;
DROP TABLE IF EXISTS playbook_metadata;

ALTER TABLE play_assignments DROP COLUMN IF EXISTS source_metadata_ids;
ALTER TABLE play_assignments DROP COLUMN IF EXISTS display_order;
ALTER TABLE play_assignments DROP COLUMN IF EXISTS category;

ALTER TABLE plays DROP COLUMN IF EXISTS content_type;

DROP TYPE IF EXISTS content_type;
*/


-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════════════════
