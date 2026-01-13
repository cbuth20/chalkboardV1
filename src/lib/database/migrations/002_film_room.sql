-- ═══════════════════════════════════════════════════════════════════════════
-- FILM ROOM DATABASE SCHEMA
-- Chalkboard Football Intelligence Platform
-- 
-- Tables:
--   - film_clips: Core clip storage
--   - clip_tags: Manual and AI-generated tags
--   - clip_ai_analysis: AI analysis results
--   - telestrator_drawings: Drawing overlays
--   - playbook_links: Links between clips and plays
--   - study_sessions: User study tracking
--   - team_playlists: Shared playlists
-- ═══════════════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FILM CLIPS TABLE
-- Core table for storing video clip metadata
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS film_clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,
    
    -- Storage
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    storage_path TEXT,
    duration_seconds DECIMAL(10, 2) NOT NULL,
    file_size_bytes BIGINT,
    
    -- Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID,
    
    -- Metadata
    opponent TEXT,
    game_date DATE,
    quarter SMALLINT CHECK (quarter >= 1 AND quarter <= 4),
    down SMALLINT CHECK (down >= 1 AND down <= 4),
    distance SMALLINT,
    yard_line SMALLINT CHECK (yard_line >= 0 AND yard_line <= 100),
    hash_mark TEXT CHECK (hash_mark IN ('left', 'middle', 'right')),
    
    -- Study Tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    is_studied BOOLEAN DEFAULT FALSE,
    
    -- Playbook Link
    linked_play_id UUID,
    linked_play_name TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_film_clips_user_id ON film_clips(user_id);
CREATE INDEX idx_film_clips_team_id ON film_clips(team_id);
CREATE INDEX idx_film_clips_created_at ON film_clips(created_at DESC);
CREATE INDEX idx_film_clips_opponent ON film_clips(opponent);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CLIP TAGS TABLE
-- Manual and AI-generated tags for clips
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS clip_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id UUID REFERENCES film_clips(id) ON DELETE CASCADE,
    
    -- Tag Data
    category TEXT NOT NULL CHECK (category IN (
        'formation', 'personnel', 'playName', 'motion', 'playType',
        'front', 'coverage', 'routeConcept', 'assignment',
        'downDistance', 'hash', 'result'
    )),
    value TEXT NOT NULL,
    
    -- AI Metadata
    is_ai_generated BOOLEAN DEFAULT FALSE,
    confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
    is_confirmed BOOLEAN DEFAULT TRUE,
    
    -- Time-stamped tags
    timestamp_seconds DECIMAL(10, 2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_clip_tags_clip_id ON clip_tags(clip_id);
CREATE INDEX idx_clip_tags_category ON clip_tags(category);
CREATE INDEX idx_clip_tags_value ON clip_tags(value);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CLIP AI ANALYSIS TABLE
-- Stores full AI analysis results
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS clip_ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id UUID REFERENCES film_clips(id) ON DELETE CASCADE UNIQUE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'error')),
    error_message TEXT,
    
    -- Detected Elements (stored as JSONB)
    offense_formation JSONB,      -- { value: string, confidence: number, alternates?: [] }
    defensive_front JSONB,
    coverage_shell JSONB,
    concept JSONB,
    personnel JSONB,
    motion JSONB,
    
    -- Detected Routes (array of route objects)
    routes JSONB,                 -- [{ player, routeName, depth, breakPoint, confidence }]
    
    -- Suggested Play Match
    suggested_play JSONB,         -- { playId, playName, matchScore, explanation }
    
    -- Coaching Insights
    coaching_notes JSONB,         -- string[]
    key_reads JSONB,              -- string[]
    assignment_breakdown JSONB,   -- [{ position, assignment, key, coaching }]
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_duration_ms INTEGER
);

-- Index
CREATE INDEX idx_clip_ai_analysis_clip_id ON clip_ai_analysis(clip_id);
CREATE INDEX idx_clip_ai_analysis_status ON clip_ai_analysis(status);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TELESTRATOR DRAWINGS TABLE
-- Stores drawing overlays for clips
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS telestrator_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id UUID REFERENCES film_clips(id) ON DELETE CASCADE,
    
    -- Timing
    timestamp_seconds DECIMAL(10, 2) NOT NULL,
    duration_seconds DECIMAL(10, 2),
    
    -- Drawing Elements (stored as JSONB array)
    elements JSONB NOT NULL,      -- [{ id, type, points, color, strokeWidth, opacity, text?, playerLabel? }]
    
    -- Metadata
    name TEXT,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    
    -- Ownership
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_telestrator_drawings_clip_id ON telestrator_drawings(clip_id);
CREATE INDEX idx_telestrator_drawings_timestamp ON telestrator_drawings(timestamp_seconds);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEAM PLAYLISTS TABLE
-- Shared playlists and cut-ups
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS team_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    
    -- Type
    type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('cutup', 'install', 'scout', 'personal')),
    
    -- Clips (ordered array of clip IDs)
    clip_ids UUID[] DEFAULT '{}',
    
    -- Ownership & Sharing
    created_by UUID REFERENCES auth.users(id),
    team_id UUID,
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with UUID[] DEFAULT '{}',
    
    -- Categorization
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_team_playlists_created_by ON team_playlists(created_by);
CREATE INDEX idx_team_playlists_team_id ON team_playlists(team_id);
CREATE INDEX idx_team_playlists_type ON team_playlists(type);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STUDY SESSIONS TABLE
-- Track user study activity
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session Data
    clip_id UUID REFERENCES film_clips(id) ON DELETE SET NULL,
    playlist_id UUID REFERENCES team_playlists(id) ON DELETE SET NULL,
    
    -- Duration
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Activity
    clips_viewed INTEGER DEFAULT 0,
    tags_added INTEGER DEFAULT 0,
    notes_added INTEGER DEFAULT 0,
    drawings_created INTEGER DEFAULT 0,
    ai_queries INTEGER DEFAULT 0,
    
    -- Context
    device_type TEXT,
    session_type TEXT CHECK (session_type IN ('free_study', 'install', 'quiz', 'assignment'))
);

-- Indexes
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_started_at ON study_sessions(started_at DESC);
CREATE INDEX idx_study_sessions_clip_id ON study_sessions(clip_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- USER FILM ANALYTICS TABLE
-- Aggregate analytics per user
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS user_film_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Scores (0-100)
    coverage_id_score INTEGER DEFAULT 0,
    formation_id_score INTEGER DEFAULT 0,
    route_recognition_score INTEGER DEFAULT 0,
    assignment_mastery_score INTEGER DEFAULT 0,
    
    -- Study Stats
    total_clips_studied INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_study_date DATE,
    
    -- Mistake Tendencies (JSONB for flexibility)
    mistake_tendencies JSONB DEFAULT '[]',
    
    -- Progress Over Time (daily snapshots)
    score_history JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_film_analytics_user_id ON user_film_analytics(user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ROW LEVEL SECURITY POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable RLS on all tables
ALTER TABLE film_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE telestrator_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_film_analytics ENABLE ROW LEVEL SECURITY;

-- Film Clips: Users can see their own clips and team clips
CREATE POLICY "Users can view own clips" ON film_clips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clips" ON film_clips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clips" ON film_clips
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clips" ON film_clips
    FOR DELETE USING (auth.uid() = user_id);

-- Tags: Follow clip ownership
CREATE POLICY "Users can manage tags on own clips" ON clip_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM film_clips 
            WHERE film_clips.id = clip_tags.clip_id 
            AND film_clips.user_id = auth.uid()
        )
    );

-- AI Analysis: Follow clip ownership
CREATE POLICY "Users can view analysis on own clips" ON clip_ai_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM film_clips 
            WHERE film_clips.id = clip_ai_analysis.clip_id 
            AND film_clips.user_id = auth.uid()
        )
    );

-- Drawings: Follow clip ownership
CREATE POLICY "Users can manage drawings on own clips" ON telestrator_drawings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM film_clips 
            WHERE film_clips.id = telestrator_drawings.clip_id 
            AND film_clips.user_id = auth.uid()
        )
    );

-- Playlists: Users can manage their own
CREATE POLICY "Users can manage own playlists" ON team_playlists
    FOR ALL USING (auth.uid() = created_by);

-- Study Sessions: Users can manage their own
CREATE POLICY "Users can manage own study sessions" ON study_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Analytics: Users can view their own
CREATE POLICY "Users can view own analytics" ON user_film_analytics
    FOR SELECT USING (auth.uid() = user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCTIONS & TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_film_clips_updated_at
    BEFORE UPDATE ON film_clips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_team_playlists_updated_at
    BEFORE UPDATE ON team_playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_telestrator_drawings_updated_at
    BEFORE UPDATE ON telestrator_drawings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_film_analytics_updated_at
    BEFORE UPDATE ON user_film_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment view count function
CREATE OR REPLACE FUNCTION increment_clip_view_count(clip_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE film_clips
    SET view_count = view_count + 1,
        last_viewed_at = NOW()
    WHERE id = clip_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;








