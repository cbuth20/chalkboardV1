-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- CHALKBOARD — GAMES BACKEND DATABASE SCHEMA
-- 
-- A comprehensive Postgres schema for the football IQ gaming platform.
-- Designed for Supabase with Row-Level Security (RLS) policies.
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- User roles within a team
CREATE TYPE user_role AS ENUM ('player', 'coach', 'admin');

-- Football positions for position-specific content
CREATE TYPE football_position AS ENUM (
  'QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'OG', 'C',  -- Offense
  'DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB', 'CB', 'FS', 'SS',  -- Defense
  'K', 'P', 'LS'  -- Special Teams
);

-- Game types available in the platform
CREATE TYPE game_type AS ENUM (
  'coverage_recognition',
  'blitz_id',
  'route_matching',
  'formation_memory',
  'play_responsibility',
  'red_zone_scenarios',
  'two_minute_drill',
  'film_reaction'
);

-- Game modes
CREATE TYPE game_mode AS ENUM ('train', 'compete');

-- Difficulty levels
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'expert');

-- Session status
CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'abandoned', 'timed_out');

-- XP event types
CREATE TYPE xp_event_type AS ENUM (
  'game_completion',
  'correct_answer',
  'streak_bonus',
  'daily_challenge',
  'first_play_of_day',
  'perfect_game',
  'level_up',
  'achievement'
);

-- Leaderboard scope
CREATE TYPE leaderboard_scope AS ENUM ('team', 'position_room', 'global');

-- Time window for leaderboards
CREATE TYPE time_window AS ENUM ('daily', 'weekly', 'season', 'all_time');

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- CORE TABLES
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Teams Table
-- Each team is a tenant with its own isolated data
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,  -- URL-friendly identifier
  logo_url TEXT,
  
  -- Team settings
  season VARCHAR(20) DEFAULT '2024',  -- Current season (e.g., "2024", "2024-25")
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  
  -- Subscription/tier info (for future monetization)
  tier VARCHAR(50) DEFAULT 'free',  -- free, pro, elite
  max_players INT DEFAULT 100,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table
-- Individual users (players and coaches)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Auth (linked to Supabase Auth)
  auth_id UUID UNIQUE,  -- References auth.users.id
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Profile
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),  -- Optional nickname
  avatar_url TEXT,
  
  -- Football profile
  jersey_number INT,
  
  -- Aggregated stats (denormalized for performance)
  total_xp BIGINT DEFAULT 0,
  current_level INT DEFAULT 1,
  football_iq_rating DECIMAL(5, 2) DEFAULT 100.00,  -- Overall skill score
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members Table
-- Junction table connecting users to teams (users can be on multiple teams)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Role and position
  role user_role NOT NULL DEFAULT 'player',
  position football_position,
  position_group VARCHAR(50),  -- e.g., "WR Room", "Secondary", "O-Line"
  
  -- Team-specific stats
  team_xp BIGINT DEFAULT 0,  -- XP earned for this team
  team_rank INT,  -- Cached rank within team
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, team_id)
);

-- Create indexes for team_members
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_position ON team_members(team_id, position);
CREATE INDEX idx_team_members_position_group ON team_members(team_id, position_group);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- GAME DEFINITIONS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Games Table
-- Static definitions of each game type
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Game identity
  type game_type UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  subtitle VARCHAR(100),
  description TEXT,
  icon VARCHAR(50),  -- Icon identifier for frontend
  color VARCHAR(50),  -- Theme color for frontend
  
  -- Game configuration
  default_time_limit_seconds INT,  -- NULL = no time limit
  default_question_count INT DEFAULT 10,
  min_questions INT DEFAULT 5,
  max_questions INT DEFAULT 50,
  
  -- Scoring configuration
  base_points_per_correct INT DEFAULT 100,
  time_bonus_enabled BOOLEAN DEFAULT TRUE,
  max_time_bonus INT DEFAULT 50,  -- Maximum bonus for fast answers
  
  -- Targeting
  applicable_positions football_position[],  -- NULL = all positions
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions Table
-- Individual questions/scenarios for each game
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,  -- NULL = global question
  
  -- Question content
  prompt TEXT NOT NULL,  -- The question text
  media_url TEXT,  -- Optional image/video URL
  media_type VARCHAR(20),  -- 'image', 'video', 'formation'
  
  -- Answer options (JSONB for flexibility)
  options JSONB NOT NULL,  -- Array of {id, text, isCorrect}
  correct_answer_id VARCHAR(50) NOT NULL,
  explanation TEXT,  -- Shown after answering
  
  -- Classification
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  category VARCHAR(100),  -- Sub-category within game (e.g., "Cover 2", "Cover 3")
  tags TEXT[],  -- Searchable tags
  
  -- Position targeting
  target_positions football_position[],  -- NULL = all positions
  
  -- Metadata
  times_shown INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  avg_response_time_ms INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for questions
CREATE INDEX idx_questions_game_id ON questions(game_id);
CREATE INDEX idx_questions_team_id ON questions(team_id);
CREATE INDEX idx_questions_difficulty ON questions(game_id, difficulty);
CREATE INDEX idx_questions_category ON questions(game_id, category);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- GAME SESSIONS & ATTEMPTS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Game Sessions Table
-- Each time a user plays a game
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  
  -- Session configuration
  mode game_mode NOT NULL DEFAULT 'train',
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  question_count INT NOT NULL,
  time_limit_seconds INT,  -- NULL = no limit
  
  -- Session state
  status session_status DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  
  -- Results (updated on completion)
  total_questions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  incorrect_answers INT DEFAULT 0,
  skipped_answers INT DEFAULT 0,
  
  -- Scoring
  raw_score INT DEFAULT 0,  -- Sum of points from attempts
  time_bonus INT DEFAULT 0,  -- Bonus for fast completion
  streak_bonus INT DEFAULT 0,  -- Bonus from answer streaks
  difficulty_multiplier DECIMAL(3, 2) DEFAULT 1.00,
  final_score INT DEFAULT 0,  -- raw_score * difficulty_multiplier + bonuses
  
  -- Performance metrics
  total_time_seconds INT,  -- Actual time taken
  accuracy DECIMAL(5, 2),  -- Percentage correct
  avg_response_time_ms INT,  -- Average time per question
  longest_streak INT DEFAULT 0,  -- Best consecutive correct streak
  
  -- XP awarded
  xp_earned INT DEFAULT 0,
  
  -- Anti-cheat / validation
  client_version VARCHAR(50),
  is_valid BOOLEAN DEFAULT TRUE,  -- Set to false if suspicious
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for game_sessions
CREATE INDEX idx_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_sessions_team_id ON game_sessions(team_id);
CREATE INDEX idx_sessions_game_id ON game_sessions(game_id);
CREATE INDEX idx_sessions_user_team ON game_sessions(user_id, team_id);
CREATE INDEX idx_sessions_started_at ON game_sessions(started_at DESC);
CREATE INDEX idx_sessions_for_leaderboard ON game_sessions(team_id, started_at DESC, final_score DESC);

-- Game Attempts Table
-- Individual question attempts within a session
CREATE TABLE game_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Attempt details
  attempt_number INT NOT NULL,  -- Order within session (1, 2, 3...)
  selected_answer_id VARCHAR(50),  -- NULL if skipped
  is_correct BOOLEAN,
  
  -- Timing
  time_taken_ms INT NOT NULL,  -- How long user took to answer
  started_at TIMESTAMPTZ NOT NULL,
  answered_at TIMESTAMPTZ,
  
  -- Scoring
  base_points INT DEFAULT 0,
  time_bonus INT DEFAULT 0,  -- Bonus for fast answer
  streak_multiplier DECIMAL(3, 2) DEFAULT 1.00,  -- Current streak bonus
  total_points INT DEFAULT 0,  -- base_points * streak_multiplier + time_bonus
  
  -- Streak tracking
  current_streak INT DEFAULT 0,  -- Consecutive correct at time of answer
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for game_attempts
CREATE INDEX idx_attempts_session_id ON game_attempts(session_id);
CREATE INDEX idx_attempts_question_id ON game_attempts(question_id);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- XP & PROGRESSION
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- XP Events Table
-- Granular log of all XP-earning activities
CREATE TABLE xp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,  -- NULL for global events
  
  -- Event details
  event_type xp_event_type NOT NULL,
  xp_amount INT NOT NULL,
  
  -- Context
  session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  game_type game_type,
  description TEXT,
  metadata JSONB,  -- Flexible data (streak length, level reached, etc.)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for xp_events
CREATE INDEX idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX idx_xp_events_team_id ON xp_events(team_id);
CREATE INDEX idx_xp_events_created_at ON xp_events(created_at DESC);
CREATE INDEX idx_xp_events_user_team_date ON xp_events(user_id, team_id, created_at);

-- Levels Table
-- Defines XP thresholds for each level
CREATE TABLE levels (
  level INT PRIMARY KEY,
  xp_required BIGINT NOT NULL,  -- Total XP needed to reach this level
  xp_to_next BIGINT NOT NULL,  -- XP needed to advance to next level
  title VARCHAR(100),  -- Optional title (e.g., "Rookie", "Pro", "Elite")
  badge_url TEXT,  -- Badge image for this level
  perks JSONB  -- Any unlocks at this level
);

-- Insert level definitions (exponential curve)
INSERT INTO levels (level, xp_required, xp_to_next, title) VALUES
(1, 0, 500, 'Rookie'),
(2, 500, 750, 'Rookie'),
(3, 1250, 1000, 'Rookie'),
(4, 2250, 1500, 'Sophomore'),
(5, 3750, 2000, 'Sophomore'),
(6, 5750, 2500, 'Sophomore'),
(7, 8250, 3000, 'Varsity'),
(8, 11250, 3500, 'Varsity'),
(9, 14750, 4000, 'Varsity'),
(10, 18750, 4500, 'Starter'),
(11, 23250, 5000, 'Starter'),
(12, 28250, 5500, 'Starter'),
(13, 33750, 6000, 'All-Conference'),
(14, 39750, 6500, 'All-Conference'),
(15, 46250, 7000, 'All-Conference'),
(16, 53250, 7500, 'All-American'),
(17, 60750, 8000, 'All-American'),
(18, 68750, 8500, 'All-American'),
(19, 77250, 9000, 'Pro'),
(20, 86250, 10000, 'Pro'),
(21, 96250, 11000, 'Pro'),
(22, 107250, 12000, 'Elite'),
(23, 119250, 13000, 'Elite'),
(24, 132250, 14000, 'Elite'),
(25, 146250, 15000, 'Hall of Fame'),
(26, 161250, 16000, 'Hall of Fame'),
(27, 177250, 18000, 'Hall of Fame'),
(28, 195250, 20000, 'Legend'),
(29, 215250, 22500, 'Legend'),
(30, 237750, 25000, 'Legend'),
(31, 262750, 30000, 'GOAT'),
(32, 292750, 35000, 'GOAT'),
(33, 327750, 40000, 'GOAT'),
(34, 367750, 50000, 'GOAT'),
(35, 417750, 0, 'GOAT');  -- Max level

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- STREAKS & DAILY CHALLENGES
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- User Streaks Table
-- Tracks daily play streaks per user/team
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Current streak
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  
  -- Tracking
  last_play_date DATE NOT NULL,  -- Date of last game played
  streak_start_date DATE,  -- When current streak started
  
  -- Freeze tokens (optional feature)
  freeze_tokens INT DEFAULT 0,  -- Allows skipping a day
  
  UNIQUE(user_id, team_id)
);

-- Create index for streaks
CREATE INDEX idx_user_streaks_user_team ON user_streaks(user_id, team_id);

-- Daily Challenges Table
-- Special challenges available each day
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Challenge definition
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Configuration
  game_type game_type NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'hard',
  question_count INT NOT NULL,
  time_limit_seconds INT NOT NULL,
  required_accuracy DECIMAL(5, 2),  -- Minimum accuracy to pass (e.g., 80.00)
  max_mistakes INT DEFAULT 0,  -- 0 = no mistakes allowed
  
  -- Rewards
  xp_reward INT NOT NULL DEFAULT 500,
  bonus_xp_for_perfect INT DEFAULT 250,  -- Extra XP for 100% accuracy
  
  -- Scheduling
  available_date DATE NOT NULL,  -- Date this challenge is active
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,  -- NULL = global challenge
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for daily_challenges
CREATE INDEX idx_daily_challenges_date ON daily_challenges(available_date);
CREATE INDEX idx_daily_challenges_team_date ON daily_challenges(team_id, available_date);

-- User Daily Challenge Completions
CREATE TABLE daily_challenge_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  
  -- Result
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  was_successful BOOLEAN NOT NULL,
  was_perfect BOOLEAN DEFAULT FALSE,
  xp_earned INT NOT NULL,
  
  -- Prevent multiple completions
  UNIQUE(user_id, challenge_id)
);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- LEADERBOARDS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Leaderboard Snapshots Table
-- Cached/materialized leaderboard data for performance
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scope
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,  -- NULL = global
  position_group VARCHAR(50),  -- NULL = all positions
  time_window time_window NOT NULL,
  season VARCHAR(20),  -- For seasonal leaderboards
  
  -- Time range
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Rankings (JSONB array)
  rankings JSONB NOT NULL,  -- Array of {user_id, rank, xp, games_played, accuracy, streak}
  
  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for each leaderboard type
  UNIQUE(team_id, position_group, time_window, window_start)
);

-- Create index for leaderboard lookups
CREATE INDEX idx_leaderboard_snapshots_lookup ON leaderboard_snapshots(team_id, time_window, computed_at DESC);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- SEASON HISTORY
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Season Archives Table
-- Stores end-of-season snapshots for historical records
CREATE TABLE season_archives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season VARCHAR(20) NOT NULL,  -- e.g., "2024", "2024-25"
  
  -- Final standings
  final_rankings JSONB NOT NULL,  -- Complete leaderboard at season end
  
  -- Aggregate stats
  total_games_played INT NOT NULL,
  total_xp_earned BIGINT NOT NULL,
  top_performers JSONB,  -- Highlighted players
  
  -- Position-specific leaders
  position_leaders JSONB,  -- {position: {user_id, xp, accuracy}}
  
  -- Metadata
  season_start DATE NOT NULL,
  season_end DATE NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, season)
);

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- VIEWS FOR COMMON QUERIES
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- User Stats View (per team)
CREATE OR REPLACE VIEW user_team_stats AS
SELECT 
  tm.user_id,
  tm.team_id,
  u.first_name,
  u.last_name,
  u.display_name,
  u.avatar_url,
  tm.position,
  tm.position_group,
  tm.role,
  u.current_level,
  tm.team_xp,
  COALESCE(us.current_streak, 0) AS current_streak,
  COALESCE(us.longest_streak, 0) AS longest_streak,
  COUNT(DISTINCT gs.id) AS total_games,
  COALESCE(AVG(gs.accuracy), 0) AS avg_accuracy,
  COALESCE(SUM(gs.final_score), 0) AS total_score
FROM team_members tm
JOIN users u ON tm.user_id = u.id
LEFT JOIN user_streaks us ON tm.user_id = us.user_id AND tm.team_id = us.team_id
LEFT JOIN game_sessions gs ON tm.user_id = gs.user_id AND tm.team_id = gs.team_id AND gs.status = 'completed'
GROUP BY tm.user_id, tm.team_id, u.id, tm.position, tm.position_group, tm.role, us.current_streak, us.longest_streak;

-- Weekly XP Leaderboard View
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT 
  tm.user_id,
  tm.team_id,
  u.first_name,
  u.last_name,
  u.display_name,
  u.avatar_url,
  tm.position,
  tm.position_group,
  u.current_level,
  COALESCE(SUM(xe.xp_amount), 0) AS weekly_xp,
  COUNT(DISTINCT gs.id) AS games_this_week,
  COALESCE(us.current_streak, 0) AS current_streak,
  RANK() OVER (PARTITION BY tm.team_id ORDER BY COALESCE(SUM(xe.xp_amount), 0) DESC) AS team_rank
FROM team_members tm
JOIN users u ON tm.user_id = u.id
LEFT JOIN xp_events xe ON tm.user_id = xe.user_id 
  AND tm.team_id = xe.team_id 
  AND xe.created_at >= DATE_TRUNC('week', CURRENT_DATE)
LEFT JOIN game_sessions gs ON tm.user_id = gs.user_id 
  AND tm.team_id = gs.team_id 
  AND gs.started_at >= DATE_TRUNC('week', CURRENT_DATE)
  AND gs.status = 'completed'
LEFT JOIN user_streaks us ON tm.user_id = us.user_id AND tm.team_id = us.team_id
WHERE tm.is_active = TRUE
GROUP BY tm.user_id, tm.team_id, u.id, tm.position, tm.position_group, us.current_streak;

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION get_level_from_xp(total_xp BIGINT)
RETURNS INT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT level FROM levels WHERE xp_required <= total_xp ORDER BY level DESC LIMIT 1),
    1
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user's total XP and level
CREATE OR REPLACE FUNCTION update_user_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's total XP
  UPDATE users 
  SET 
    total_xp = total_xp + NEW.xp_amount,
    current_level = get_level_from_xp(total_xp + NEW.xp_amount),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Update team-specific XP if team_id is set
  IF NEW.team_id IS NOT NULL THEN
    UPDATE team_members
    SET team_xp = team_xp + NEW.xp_amount
    WHERE user_id = NEW.user_id AND team_id = NEW.team_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update XP on new xp_event
CREATE TRIGGER trigger_update_user_xp
AFTER INSERT ON xp_events
FOR EACH ROW
EXECUTE FUNCTION update_user_xp();

-- Function to update streak on game completion
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  streak_record user_streaks%ROWTYPE;
  today DATE := CURRENT_DATE;
BEGIN
  -- Only process completed sessions
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Get or create streak record
  SELECT * INTO streak_record
  FROM user_streaks
  WHERE user_id = NEW.user_id AND team_id = NEW.team_id;
  
  IF streak_record IS NULL THEN
    -- First time playing for this team
    INSERT INTO user_streaks (user_id, team_id, current_streak, longest_streak, last_play_date, streak_start_date)
    VALUES (NEW.user_id, NEW.team_id, 1, 1, today, today);
  ELSE
    IF streak_record.last_play_date = today THEN
      -- Already played today, no streak update needed
      NULL;
    ELSIF streak_record.last_play_date = today - INTERVAL '1 day' THEN
      -- Consecutive day, increment streak
      UPDATE user_streaks
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_play_date = today
      WHERE user_id = NEW.user_id AND team_id = NEW.team_id;
    ELSE
      -- Streak broken, reset to 1
      UPDATE user_streaks
      SET 
        current_streak = 1,
        last_play_date = today,
        streak_start_date = today
      WHERE user_id = NEW.user_id AND team_id = NEW.team_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak on session completion
CREATE TRIGGER trigger_update_user_streak
AFTER INSERT OR UPDATE ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

-- ───────────────────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY POLICIES
-- ───────────────────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Team members can see their team data
CREATE POLICY "Team members can view team" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = teams.id AND u.auth_id = auth.uid()
    )
  );

-- Team member policies
CREATE POLICY "Users can view team members of their teams" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members my_teams
      JOIN users u ON my_teams.user_id = u.id
      WHERE my_teams.team_id = team_members.team_id AND u.auth_id = auth.uid()
    )
  );

-- Game sessions - users see their own and teammates' sessions
CREATE POLICY "Users can view own sessions" ON game_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = game_sessions.user_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can view team sessions" ON game_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = game_sessions.team_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sessions" ON game_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = game_sessions.user_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sessions" ON game_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = game_sessions.user_id AND u.auth_id = auth.uid()
    )
  );

-- Games are globally readable
CREATE POLICY "Games are publicly readable" ON games
  FOR SELECT USING (is_active = TRUE);

-- Questions - global questions or team-specific
CREATE POLICY "Questions are readable by team members or global" ON questions
  FOR SELECT USING (
    team_id IS NULL -- Global questions
    OR EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = questions.team_id AND u.auth_id = auth.uid()
    )
  );

-- Coaches can manage team questions
CREATE POLICY "Coaches can manage team questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = questions.team_id 
        AND u.auth_id = auth.uid()
        AND tm.role IN ('coach', 'admin')
    )
  );

-- Leaderboards - team members can view their team's leaderboards
CREATE POLICY "Team members can view team leaderboards" ON leaderboard_snapshots
  FOR SELECT USING (
    team_id IS NULL  -- Global leaderboards
    OR EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = leaderboard_snapshots.team_id AND u.auth_id = auth.uid()
    )
  );

-- XP Events - users can view their own
CREATE POLICY "Users can view own XP events" ON xp_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = xp_events.user_id AND u.auth_id = auth.uid()
    )
  );

-- Streaks - users can view their own and teammates'
CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = user_streaks.user_id AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view team streaks" ON user_streaks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = user_streaks.team_id AND u.auth_id = auth.uid()
    )
  );

-- Daily challenges
CREATE POLICY "Team members can view daily challenges" ON daily_challenges
  FOR SELECT USING (
    team_id IS NULL  -- Global challenges
    OR EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = daily_challenges.team_id AND u.auth_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Game Definitions
-- ═══════════════════════════════════════════════════════════════════════════════════════════

INSERT INTO games (type, name, subtitle, description, icon, color, default_time_limit_seconds, default_question_count, base_points_per_correct) VALUES
('coverage_recognition', 'COVERAGE ID', 'Recognition Test', 'Flash pre-snap looks and identify coverage schemes. Cov 1, 2, 3, 4, Quarters, Match, and more.', 'shield', 'teal', 45, 25, 100),
('blitz_id', 'BLITZ ID', 'Protection Challenge', 'Read fronts and pressures. Call the right protection: Slide, Full Slide, Man, RB Scan.', 'flame', 'orange', 30, 20, 120),
('route_matching', 'ROUTE TAG', 'Pattern Recognition', 'Identify route tags and concepts. From basic slants to advanced Mesh and Mills.', 'route', 'ice', 25, 30, 80),
('formation_memory', 'FORMATION', 'Memory Game', 'Study the formation for 10 seconds, then recreate it. Drag players to their positions.', 'grid', 'gold', 60, 15, 150),
('play_responsibility', 'ASSIGNMENT', 'Responsibility Quiz', 'Position-specific play knowledge. What''s your assignment on this play?', 'clipboard', 'teal', 40, 20, 100),
('red_zone_scenarios', 'RED ZONE', 'Scenario Decisions', 'Quick situational decisions inside the 20. Make the right read under pressure.', 'target', 'orange', 35, 18, 130),
('two_minute_drill', 'TWO-MINUTE', 'Mental Clock', 'Clock management decisions under pressure. Timeouts, tempo, and optimal outcomes.', 'clock', 'ice', 90, 10, 200),
('film_reaction', 'FILM CLIP', 'Reaction Game', 'Watch short clips and quickly identify the defense or answer strategic questions.', 'film', 'gold', 20, 35, 90);








