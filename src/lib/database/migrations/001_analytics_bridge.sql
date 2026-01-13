-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CHALKBOARD — ANALYTICS BRIDGE MIGRATION
-- 
-- Migration to add fields required by the Analytics & Coach Reports Agent
-- as defined in the Bridge Contract.
-- 
-- Run this after the base schema.sql has been applied.
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 1. ADD CATEGORY TO GAMES TABLE
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Add category column for analytics grouping
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Set categories based on game type
UPDATE games SET category = 'coverage' WHERE type IN ('coverage_recognition', 'film_reaction');
UPDATE games SET category = 'blitz' WHERE type = 'blitz_id';
UPDATE games SET category = 'routes' WHERE type = 'route_matching';
UPDATE games SET category = 'memory' WHERE type = 'formation_memory';
UPDATE games SET category = 'assignment' WHERE type = 'play_responsibility';
UPDATE games SET category = 'situational' WHERE type IN ('red_zone_scenarios', 'two_minute_drill');

-- Add index for category queries
CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 2. ADD CONCEPT_KEY TO GAME_ATTEMPTS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Add concept_key for concept-level analytics
ALTER TABLE game_attempts
ADD COLUMN IF NOT EXISTS concept_key VARCHAR(100);

-- Add denormalized difficulty for faster queries
ALTER TABLE game_attempts
ADD COLUMN IF NOT EXISTS difficulty difficulty_level;

-- Add user_id denormalized for faster queries (avoid join through session)
ALTER TABLE game_attempts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_attempts_concept_key ON game_attempts(concept_key);
CREATE INDEX IF NOT EXISTS idx_attempts_user_concept ON game_attempts(user_id, concept_key);
CREATE INDEX IF NOT EXISTS idx_attempts_difficulty ON game_attempts(difficulty);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 3. ADD CONCEPT_KEY TO QUESTIONS TABLE
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Add concept_key to questions for easier reference
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS concept_key VARCHAR(100);

-- Add concept_family for grouping (zone, man, match, pressure, etc.)
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS concept_family VARCHAR(50);

-- Create index
CREATE INDEX IF NOT EXISTS idx_questions_concept_key ON questions(concept_key);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 4. CREATE ANALYTICS VIEWS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Player Game Stats View
-- Aggregates player performance by game type
CREATE OR REPLACE VIEW player_game_stats_view AS
SELECT 
  gs.user_id,
  gs.team_id,
  g.type AS game_type,
  g.category,
  COUNT(gs.id) AS games_played,
  AVG(gs.accuracy) AS avg_accuracy,
  AVG(gs.final_score) AS avg_score,
  SUM(gs.xp_earned) AS total_xp,
  AVG(gs.avg_response_time_ms) AS avg_response_time,
  MAX(gs.longest_streak) AS best_streak,
  COALESCE(STDDEV(gs.accuracy), 0) AS accuracy_variance,
  MIN(gs.started_at) AS first_played,
  MAX(gs.started_at) AS last_played
FROM game_sessions gs
JOIN games g ON gs.game_id = g.id
WHERE gs.status = 'completed' AND gs.is_valid = TRUE
GROUP BY gs.user_id, gs.team_id, g.type, g.category;

-- Player Concept Mastery View
-- Tracks mastery per football concept
CREATE OR REPLACE VIEW player_concept_mastery_view AS
SELECT 
  COALESCE(ga.user_id, gs.user_id) AS user_id,
  gs.team_id,
  ga.concept_key,
  g.type AS game_type,
  g.category,
  COUNT(*) AS total_reps,
  SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) AS correct_reps,
  ROUND(
    (SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS accuracy,
  AVG(ga.time_taken_ms) AS avg_response_time,
  MAX(ga.answered_at) AS last_practiced,
  -- Readiness calculation
  CASE
    WHEN COUNT(*) >= 20 AND 
         (SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) >= 0.95 
    THEN 'mastered'
    WHEN COUNT(*) >= 10 AND 
         (SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) >= 0.85 
    THEN 'proficient'
    WHEN COUNT(*) >= 5 
    THEN 'learning'
    ELSE 'not_started'
  END AS mastery_level
FROM game_attempts ga
JOIN game_sessions gs ON ga.session_id = gs.id
JOIN games g ON gs.game_id = g.id
WHERE ga.concept_key IS NOT NULL
  AND gs.status = 'completed'
  AND gs.is_valid = TRUE
GROUP BY COALESCE(ga.user_id, gs.user_id), gs.team_id, ga.concept_key, g.type, g.category;

-- Player IQ Scores View
-- Computes Football IQ scores per player
CREATE OR REPLACE VIEW player_iq_scores_view AS
WITH category_stats AS (
  SELECT 
    user_id,
    team_id,
    category,
    AVG(avg_accuracy) AS accuracy,
    AVG(avg_response_time) AS response_time,
    SUM(games_played) AS games,
    AVG(accuracy_variance) AS variance
  FROM player_game_stats_view
  GROUP BY user_id, team_id, category
),
speed_scores AS (
  SELECT 
    user_id,
    team_id,
    category,
    accuracy,
    response_time,
    variance,
    CASE
      WHEN response_time < 3000 THEN 1.0
      WHEN response_time < 6000 THEN 0.7
      WHEN response_time < 10000 THEN 0.5
      ELSE 0.3
    END AS speed_factor,
    games
  FROM category_stats
  WHERE games >= 3  -- Minimum games for reliable score
)
SELECT 
  user_id,
  team_id,
  -- Category IQs (0-100 scale)
  COALESCE(MAX(CASE WHEN category = 'coverage' 
    THEN LEAST(100, ROUND(accuracy * 0.7 + speed_factor * 30)) END), 50) AS coverage_iq,
  COALESCE(MAX(CASE WHEN category = 'blitz' 
    THEN LEAST(100, ROUND(accuracy * 0.7 + speed_factor * 30)) END), 50) AS blitz_iq,
  COALESCE(MAX(CASE WHEN category = 'situational' 
    THEN LEAST(100, ROUND(accuracy * 0.6 + speed_factor * 40)) END), 50) AS situational_iq,
  COALESCE(MAX(CASE WHEN category = 'routes' 
    THEN LEAST(100, ROUND(accuracy * 0.7 + speed_factor * 30)) END), 50) AS route_iq,
  COALESCE(MAX(CASE WHEN category = 'memory' 
    THEN LEAST(100, ROUND(accuracy * 0.7 + speed_factor * 30)) END), 50) AS formation_iq,
  COALESCE(MAX(CASE WHEN category = 'assignment' 
    THEN LEAST(100, ROUND(accuracy * 0.7 + speed_factor * 30)) END), 50) AS assignment_iq,
  -- Overall Football IQ (weighted average of categories)
  LEAST(100, ROUND(
    COALESCE(MAX(CASE WHEN category = 'coverage' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.25 +
    COALESCE(MAX(CASE WHEN category = 'blitz' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.20 +
    COALESCE(MAX(CASE WHEN category = 'situational' THEN accuracy * 0.6 + speed_factor * 40 END), 50) * 0.15 +
    COALESCE(MAX(CASE WHEN category = 'routes' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.15 +
    COALESCE(MAX(CASE WHEN category = 'memory' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.10 +
    COALESCE(MAX(CASE WHEN category = 'assignment' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.15
  )) AS football_iq,
  -- Confidence based on sample size
  CASE
    WHEN SUM(games) >= 50 THEN 'high'
    WHEN SUM(games) >= 20 THEN 'medium'
    ELSE 'low'
  END AS confidence,
  SUM(games) AS total_games
FROM speed_scores
GROUP BY user_id, team_id;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 5. CREATE ANALYTICS SNAPSHOT TABLE
-- ───────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly'
  
  -- Aggregate metrics
  total_sessions INT DEFAULT 0,
  total_xp_earned BIGINT DEFAULT 0,
  active_players INT DEFAULT 0,
  average_accuracy DECIMAL(5,2),
  average_football_iq INT,
  
  -- Position breakdown (JSONB)
  position_breakdown JSONB,
  
  -- Top performers (JSONB array)
  top_performers JSONB,
  
  -- At-risk players (JSONB array)
  at_risk_players JSONB,
  
  -- Most improved (JSONB)
  most_improved JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, snapshot_date, snapshot_type)
);

-- Index for snapshot queries
CREATE INDEX IF NOT EXISTS idx_team_snapshots_lookup 
ON team_analytics_snapshots(team_id, snapshot_date DESC);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 6. CREATE COACH REPORTS CACHE TABLE
-- ───────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coach_reports_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'dashboard', 'position_room', 'player_detail'
  report_key VARCHAR(255), -- e.g., 'WR_Room', 'player_uuid'
  
  -- Cached data
  report_data JSONB NOT NULL,
  
  -- Cache management
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_stale BOOLEAN DEFAULT FALSE,
  
  UNIQUE(team_id, report_type, report_key)
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_coach_reports_cache_lookup 
ON coach_reports_cache(team_id, report_type, expires_at);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 7. ENABLE RLS ON NEW TABLES
-- ───────────────────────────────────────────────────────────────────────────────────────────

ALTER TABLE team_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_reports_cache ENABLE ROW LEVEL SECURITY;

-- Coaches and admins can view team analytics
CREATE POLICY "Team members can view analytics snapshots" ON team_analytics_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = team_analytics_snapshots.team_id 
        AND u.auth_id = auth.uid()
    )
  );

-- Only coaches can manage cache
CREATE POLICY "Coaches can view reports cache" ON coach_reports_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = coach_reports_cache.team_id 
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- 8. HELPER FUNCTIONS FOR ANALYTICS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Function to calculate Football IQ for a single player
CREATE OR REPLACE FUNCTION calculate_player_football_iq(p_user_id UUID, p_team_id UUID)
RETURNS INT AS $$
DECLARE
  v_iq INT;
BEGIN
  SELECT football_iq INTO v_iq
  FROM player_iq_scores_view
  WHERE user_id = p_user_id AND team_id = p_team_id;
  
  RETURN COALESCE(v_iq, 50); -- Default to 50 if no data
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get player's weakest category
CREATE OR REPLACE FUNCTION get_player_weakest_category(p_user_id UUID, p_team_id UUID)
RETURNS TABLE(category VARCHAR, score INT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pgs.category,
    ROUND(pgs.avg_accuracy)::INT AS score
  FROM player_game_stats_view pgs
  WHERE pgs.user_id = p_user_id 
    AND pgs.team_id = p_team_id
    AND pgs.games_played >= 3
  ORDER BY pgs.avg_accuracy ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to identify at-risk players
CREATE OR REPLACE FUNCTION get_at_risk_players(p_team_id UUID)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  risk_level VARCHAR,
  days_inactive INT,
  accuracy_drop DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH player_activity AS (
    SELECT 
      u.id AS user_id,
      COALESCE(u.display_name, u.first_name || ' ' || u.last_name) AS display_name,
      EXTRACT(DAY FROM NOW() - MAX(gs.started_at))::INT AS days_inactive,
      AVG(CASE WHEN gs.started_at >= NOW() - INTERVAL '7 days' THEN gs.accuracy END) AS this_week_accuracy,
      AVG(CASE WHEN gs.started_at >= NOW() - INTERVAL '14 days' 
               AND gs.started_at < NOW() - INTERVAL '7 days' THEN gs.accuracy END) AS last_week_accuracy
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    LEFT JOIN game_sessions gs ON gs.user_id = u.id AND gs.team_id = tm.team_id AND gs.status = 'completed'
    WHERE tm.team_id = p_team_id AND tm.is_active = TRUE
    GROUP BY u.id, u.display_name, u.first_name, u.last_name
  )
  SELECT 
    pa.user_id,
    pa.display_name,
    CASE
      WHEN pa.days_inactive >= 7 OR (pa.last_week_accuracy - pa.this_week_accuracy) >= 20 THEN 'high'
      WHEN pa.days_inactive >= 3 OR (pa.last_week_accuracy - pa.this_week_accuracy) >= 10 THEN 'medium'
      ELSE 'low'
    END AS risk_level,
    COALESCE(pa.days_inactive, 999) AS days_inactive,
    COALESCE(pa.last_week_accuracy - pa.this_week_accuracy, 0) AS accuracy_drop
  FROM player_activity pa
  WHERE pa.days_inactive >= 3 
     OR (pa.last_week_accuracy - pa.this_week_accuracy) >= 10
  ORDER BY 
    CASE
      WHEN pa.days_inactive >= 7 OR (pa.last_week_accuracy - pa.this_week_accuracy) >= 20 THEN 1
      WHEN pa.days_inactive >= 3 OR (pa.last_week_accuracy - pa.this_week_accuracy) >= 10 THEN 2
      ELSE 3
    END,
    pa.days_inactive DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- MIGRATION COMPLETE
-- ───────────────────────────────────────────────────────────────────────────────────────────

COMMENT ON VIEW player_game_stats_view IS 'Analytics view: Player performance aggregated by game type';
COMMENT ON VIEW player_concept_mastery_view IS 'Analytics view: Player mastery level per football concept';
COMMENT ON VIEW player_iq_scores_view IS 'Analytics view: Football IQ scores per player';
COMMENT ON TABLE team_analytics_snapshots IS 'Periodic snapshots of team analytics for dashboard performance';
COMMENT ON TABLE coach_reports_cache IS 'Cached coach reports for fast dashboard loading';








