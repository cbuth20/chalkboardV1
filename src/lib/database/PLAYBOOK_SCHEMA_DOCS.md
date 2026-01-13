# Chalkboard Playbook System — Database Schema Documentation

> **Version:** 1.0  
> **Last Updated:** December 2024  
> **Migration File:** `migrations/003_playbook_system.sql`

This document provides complete documentation for the Playbook, Installs, Reps/Mastery, Flashcards, and AI Coach Insights database schema.

---

## Table of Contents

1. [Entity List](#1-entity-list)
2. [Schema Definition](#2-schema-definition)
3. [ERD Relationships](#3-erd-relationships)
4. [Key Queries](#4-key-queries)
5. [Scalability Notes](#5-scalability-notes)

---

## 1. Entity List

### Accounts & Teams Extensions

| Table | Description |
|-------|-------------|
| `seasons` | Team seasons (e.g., "2025 Varsity Season") - one active season per team |
| `position_groups` | Position group definitions (WR Room, QB Room, O-Line, etc.) |
| `user_position_groups` | Junction table linking players to their position groups |

### Playbooks, Plays & Tags

| Table | Description |
|-------|-------------|
| `personnel_groupings` | Personnel package definitions (11, 12, 21, etc.) with breakdown |
| `play_tags` | Tag definitions for categorizing plays (global or team-specific) |
| `playbooks` | Named collections of plays ("Base Offense", "Red Zone Package") |
| `plays` | Core reusable play definitions - the master play template |
| `team_plays` | Team-specific customizations layered on base plays |
| `play_tag_assignments` | Junction table linking plays to their tags |

### Installs

| Table | Description |
|-------|-------------|
| `installs` | Weekly install schedules managed by coaches |
| `install_plays` | Junction table: plays in an install with ordering, category, emphasis |

### Assignments & Coaching Detail

| Table | Description |
|-------|-------------|
| `play_assignments` | Position-specific assignments per play (alignment, read, etc.) |
| `coaching_points` | Key coaching bullets per play (global or position-specific) |
| `coverage_variants` | How plays adjust vs different coverages |
| `motion_definitions` | Pre-snap motion/shift rules for plays |

### Player Study & Mastery

| Table | Description |
|-------|-------------|
| `player_study_sessions` | Session-level tracking when a player studies |
| `play_rep_events` | Raw event log for individual reps/activities |
| `player_play_mastery` | Aggregated mastery summary per player per play |

### Flashcards & Quizzing

| Table | Description |
|-------|-------------|
| `flashcard_templates` | Flashcard definitions per play (auto-generated or manual) |
| `player_flashcard_attempts` | Individual flashcard attempt history |
| `player_flashcard_progress` | Per-player, per-flashcard spaced repetition state |

### AI Coach Insights

| Table | Description |
|-------|-------------|
| `ai_insights` | Persisted AI analysis outputs (cached) |
| `ai_recommendations` | Specific play/action recommendations from AI |

---

## 2. Schema Definition

### 2.1 Seasons

```sql
CREATE TABLE seasons (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  name VARCHAR(100) NOT NULL,           -- "2025 Varsity Season"
  year VARCHAR(20) NOT NULL,            -- "2025" or "2024-25"
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT FALSE,      -- Only one active per team
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(team_id, year, name)
);
```

**Purpose:** Allows teams to organize playbooks and installs by season. Only one season can be active per team at a time.

---

### 2.2 Position Groups

```sql
CREATE TABLE position_groups (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  name VARCHAR(50) NOT NULL,            -- "WR Room"
  code VARCHAR(10) NOT NULL,            -- "WR"
  display_order INT DEFAULT 0,
  color VARCHAR(20),
  positions skill_position[] NOT NULL,  -- ['X', 'Z', 'H']
  created_at TIMESTAMPTZ,
  UNIQUE(team_id, code)
);
```

**Purpose:** Groups positions into "rooms" for coaching and analytics. A position group contains multiple skill positions (e.g., WR Room = X, Z, H).

---

### 2.3 Plays (Master Template)

```sql
CREATE TABLE plays (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),    -- NULL = global library play
  source_play_id UUID REFERENCES plays(id), -- If derived from library
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50),
  play_type play_type NOT NULL,         -- PASS, RUN, RPO, etc.
  concept VARCHAR(100),
  personnel_id UUID REFERENCES personnel_groupings(id),
  personnel_code VARCHAR(10),
  formation_id VARCHAR(50),
  formation_name VARCHAR(100),
  diagram_type VARCHAR(20) DEFAULT 'pass',
  diagram_data JSONB,
  coaching_points JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Purpose:** The core play definition that can be reused across teams, seasons, and installs. Global plays have `team_id = NULL`.

**Key Design Decisions:**
- `source_play_id` enables play library imports with tracking
- `diagram_data` JSONB stores complete diagram coordinates/routes
- `coaching_points` stored as JSONB array for flexibility

---

### 2.4 Team Plays (Customization Layer)

```sql
CREATE TABLE team_plays (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  play_id UUID NOT NULL REFERENCES plays(id),
  season_id UUID REFERENCES seasons(id),
  custom_name VARCHAR(100),             -- Override name
  custom_coaching_points JSONB,         -- Override coaching points
  team_notes TEXT,
  playbook_id UUID REFERENCES playbooks(id),
  install_week INT,
  install_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  is_emphasis BOOLEAN DEFAULT FALSE,
  emphasis_reason TEXT,
  default_rep_target INT DEFAULT 10,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(team_id, play_id, season_id)
);
```

**Purpose:** Team-specific customizations layered on top of base plays. Allows coaches to modify coaching points and add team notes without altering the original play definition.

---

### 2.5 Play Assignments

```sql
CREATE TABLE play_assignments (
  id UUID PRIMARY KEY,
  play_id UUID NOT NULL REFERENCES plays(id),
  position skill_position NOT NULL,
  
  -- Core assignment fields (all quizzable)
  alignment TEXT NOT NULL,
  split_depth TEXT,
  landmark TEXT NOT NULL,
  first_step TEXT,
  assignment TEXT NOT NULL,
  read_progression JSONB DEFAULT '[]',
  run_track TEXT,
  blocking_assignment TEXT,
  
  -- Route info
  route_id VARCHAR(50),
  route_depth INT,
  route_landmarks TEXT,
  
  -- Key read
  key_read TEXT NOT NULL,
  
  -- Coverage adjustments
  coverage_adjustments JSONB DEFAULT '{
    "vs_man": "",
    "vs_zone": "",
    "vs_cover_2": "",
    "vs_cover_3": "",
    "vs_cover_4": "",
    "vs_blitz": "",
    "vs_fire_zone": ""
  }',
  
  -- Motion
  motion JSONB,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(play_id, position)
);
```

**Purpose:** Stores position-specific assignments for each play. One row per (play, position) combination. All fields are quizzable for flashcard generation.

---

### 2.6 Installs

```sql
CREATE TABLE installs (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  season_id UUID REFERENCES seasons(id),
  week_number INT NOT NULL,
  week_label VARCHAR(100) NOT NULL,     -- "Week 4 - Red Zone RPO"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status install_status DEFAULT 'upcoming',
  rep_targets JSONB DEFAULT '{
    "default": 10,
    "by_position": {},
    "by_play_id": {}
  }',
  coach_notes TEXT,
  focus_areas JSONB DEFAULT '[]',
  opponent_name VARCHAR(100),
  game_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(team_id, season_id, week_number)
);
```

**Purpose:** Weekly install schedules. Rep targets can be set globally, by position, or per play via the JSONB structure.

---

### 2.7 Install Plays (Junction)

```sql
CREATE TABLE install_plays (
  id UUID PRIMARY KEY,
  install_id UUID NOT NULL REFERENCES installs(id),
  play_id UUID NOT NULL REFERENCES plays(id),
  team_play_id UUID REFERENCES team_plays(id),
  display_order INT DEFAULT 0,
  category VARCHAR(30) DEFAULT 'NORMAL',
  is_emphasis BOOLEAN DEFAULT FALSE,
  emphasis_reason TEXT,
  rep_target_override INT,
  added_at TIMESTAMPTZ,
  added_by UUID REFERENCES users(id),
  UNIQUE(install_id, play_id)
);
```

**Purpose:** Links plays to installs with ordering and categorization. Supports coach-defined emphasis and per-play rep target overrides.

---

### 2.8 Player Play Mastery

```sql
CREATE TABLE player_play_mastery (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  play_id UUID NOT NULL REFERENCES plays(id),
  position skill_position NOT NULL,
  
  -- Rep tracking
  reps_completed INT DEFAULT 0,
  reps_target INT DEFAULT 10,
  physical_reps INT DEFAULT 0,
  
  -- Mastery metrics
  mastery_score INT DEFAULT 0,          -- 0-100
  mastery_level mastery_level DEFAULT 'new',
  
  -- Quiz performance
  quiz_attempts INT DEFAULT 0,
  quiz_correct INT DEFAULT 0,
  quiz_accuracy DECIMAL(5,2) DEFAULT 0,
  avg_response_time_ms INT,
  
  -- Category breakdown
  category_scores JSONB DEFAULT '{
    "alignment": 0,
    "landmark": 0,
    "assignment": 0,
    "read": 0,
    "adjustment": 0
  }',
  
  -- Spaced repetition (SM-2)
  last_studied_at TIMESTAMPTZ,
  next_due_date DATE,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval_days INT DEFAULT 0,
  
  -- Status flags
  is_starred BOOLEAN DEFAULT FALSE,
  is_emphasis BOOLEAN DEFAULT FALSE,
  needs_review BOOLEAN DEFAULT FALSE,
  
  current_install_id UUID REFERENCES installs(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, team_id, play_id, position)
);
```

**Purpose:** Aggregated mastery tracking per player per play. Updated automatically via trigger when rep events are logged.

---

### 2.9 Flashcard Templates

```sql
CREATE TABLE flashcard_templates (
  id UUID PRIMARY KEY,
  play_id UUID NOT NULL REFERENCES plays(id),
  assignment_id UUID REFERENCES play_assignments(id),
  position skill_position NOT NULL,
  category flashcard_category NOT NULL,
  question_prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  hints JSONB DEFAULT '[]',
  explanation TEXT,
  difficulty VARCHAR(20) DEFAULT 'intermediate',
  is_auto_generated BOOLEAN DEFAULT TRUE,
  team_id UUID REFERENCES teams(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Purpose:** Flashcard definitions that can be auto-generated from play assignments or manually created by coaches.

---

### 2.10 AI Insights & Recommendations

```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  install_id UUID REFERENCES installs(id),
  play_id UUID REFERENCES plays(id),
  insight_type ai_insight_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  text_summary TEXT NOT NULL,
  structured_payload JSONB DEFAULT '{}',
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  is_actioned BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  insight_id UUID REFERENCES ai_insights(id),
  install_id UUID REFERENCES installs(id),
  recommended_play_id UUID REFERENCES plays(id),
  recommended_action VARCHAR(50),
  reason TEXT NOT NULL,
  reason_category VARCHAR(50),
  priority_rank INT DEFAULT 0,
  priority_score DECIMAL(5,2),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

**Purpose:** Persists AI-generated insights and recommendations so they can be displayed without recomputation.

---

## 3. ERD Relationships

### 3.1 One-to-Many Relationships

```
teams ─────┬───────> seasons (1:N)
           ├───────> position_groups (1:N)
           ├───────> playbooks (1:N)
           ├───────> plays (1:N, team-specific plays)
           ├───────> team_plays (1:N)
           ├───────> installs (1:N)
           └───────> play_tags (1:N, team-specific tags)

seasons ───────────> playbooks (1:N)
                ├──> team_plays (1:N)
                └──> installs (1:N)

playbooks ─────────> team_plays (1:N)

plays ─────────────> play_assignments (1:N, one per position)
                ├──> coaching_points (1:N)
                ├──> coverage_variants (1:N, one per coverage)
                ├──> motion_definitions (1:N)
                ├──> flashcard_templates (1:N)
                └──> play_tag_assignments (1:N)

installs ──────────> install_plays (1:N)

users ─────────────> player_study_sessions (1:N)
                ├──> play_rep_events (1:N)
                ├──> player_play_mastery (1:N)
                ├──> player_flashcard_attempts (1:N)
                ├──> player_flashcard_progress (1:N)
                ├──> ai_insights (1:N)
                └──> ai_recommendations (1:N)
```

### 3.2 Many-to-Many Relationships

```
users <───> position_groups
            via: user_position_groups

plays <───> installs
            via: install_plays

plays <───> play_tags
            via: play_tag_assignments

plays <───> teams (customization)
            via: team_plays
```

### 3.3 Self-Referential Relationships

```
plays.source_play_id ───> plays.id
(Tracks when a play was imported/derived from a library play)
```

---

## 4. Key Queries

### 4.1 Get All Plays in an Install (Grouped by Category)

```sql
SELECT 
  ip.category,
  p.id AS play_id,
  p.name,
  p.short_name,
  p.play_type,
  p.concept,
  p.personnel_code,
  ip.display_order,
  ip.is_emphasis,
  COALESCE(ip.rep_target_override, (i.rep_targets->>'default')::INT) AS rep_target
FROM install_plays ip
JOIN installs i ON ip.install_id = i.id
JOIN plays p ON ip.play_id = p.id
WHERE ip.install_id = $1
ORDER BY 
  CASE ip.category 
    WHEN 'RPO' THEN 1 
    WHEN 'PASS' THEN 2 
    WHEN 'RUN' THEN 3 
    WHEN 'TRICK' THEN 4 
    ELSE 5 
  END,
  ip.display_order;
```

### 4.2 Get Player Mastery for an Install

```sql
SELECT 
  ppm.play_id,
  p.name AS play_name,
  ppm.position,
  ppm.reps_completed,
  ppm.reps_target,
  ROUND((ppm.reps_completed::DECIMAL / NULLIF(ppm.reps_target, 0)) * 100, 1) AS rep_progress_pct,
  ppm.mastery_score,
  ppm.mastery_level,
  ppm.quiz_accuracy,
  ppm.last_studied_at,
  ppm.next_due_date
FROM player_play_mastery ppm
JOIN plays p ON ppm.play_id = p.id
JOIN install_plays ip ON ip.play_id = p.id
WHERE ppm.user_id = $1
  AND ip.install_id = $2
ORDER BY ppm.mastery_score ASC;
```

### 4.3 Get Weakest Plays/Concepts for a Player

```sql
SELECT 
  ppm.play_id,
  p.name AS play_name,
  p.concept,
  ppm.mastery_score,
  ppm.mastery_level,
  ppm.category_scores
FROM player_play_mastery ppm
JOIN plays p ON ppm.play_id = p.id
WHERE ppm.user_id = $1
  AND ppm.team_id = $2
  AND ppm.mastery_level != 'mastered'
ORDER BY ppm.mastery_score ASC
LIMIT 5;
```

### 4.4 Get Assignments with Coverage Variants

```sql
SELECT 
  pa.position,
  pa.alignment,
  pa.assignment,
  pa.key_read,
  pa.coverage_adjustments,
  cv.coverage_id,
  cv.coverage_name,
  cv.play_adjustment,
  cv.position_adjustments
FROM play_assignments pa
LEFT JOIN coverage_variants cv ON cv.play_id = pa.play_id
WHERE pa.play_id = $1
ORDER BY pa.position, cv.coverage_id;
```

### 4.5 Get Due Flashcards for a Player

```sql
SELECT 
  ft.id,
  ft.play_id,
  p.name AS play_name,
  ft.position,
  ft.category,
  ft.question_prompt,
  ft.correct_answer,
  ft.hints,
  ft.difficulty,
  pfp.due_date,
  pfp.times_shown,
  pfp.times_correct
FROM flashcard_templates ft
JOIN plays p ON ft.play_id = p.id
JOIN player_flashcard_progress pfp ON pfp.flashcard_id = ft.id
WHERE pfp.user_id = $1
  AND pfp.due_date <= CURRENT_DATE
  AND ft.is_active = TRUE
ORDER BY pfp.due_date ASC
LIMIT 25;
```

---

## 5. Scalability Notes

### 5.1 JSONB Columns for Flexibility

The schema uses JSONB in several places for flexibility:

| Table | Column | Purpose |
|-------|--------|---------|
| `plays` | `diagram_data` | Full diagram coordinates/routes |
| `plays` | `coaching_points` | Array of coaching point strings |
| `play_assignments` | `read_progression` | Ordered list of reads |
| `play_assignments` | `coverage_adjustments` | Coverage-specific adjustments |
| `player_play_mastery` | `category_scores` | Per-category mastery breakdown |
| `installs` | `rep_targets` | Flexible rep target configuration |
| `ai_insights` | `structured_payload` | Flexible AI output data |

**Recommendation:** Create GIN indexes on frequently-queried JSONB fields:

```sql
CREATE INDEX idx_plays_coaching_points ON plays USING GIN (coaching_points);
CREATE INDEX idx_play_assignments_coverage ON play_assignments USING GIN (coverage_adjustments);
```

### 5.2 Multi-Tenant Pattern

The schema follows a multi-tenant pattern where:

- All team-scoped tables have a `team_id` foreign key
- Row-Level Security (RLS) policies enforce tenant isolation
- Global resources (plays, tags) have `team_id = NULL`

**Recommendation:** Consider table partitioning by `team_id` if you expect >1M rows in high-volume tables like `play_rep_events`.

### 5.3 Soft Deletes

Currently, the schema uses hard deletes with `ON DELETE CASCADE`. For production:

**Recommendation:** Add `deleted_at` columns for soft deletes on:
- `plays`
- `team_plays`
- `installs`
- `flashcard_templates`

```sql
ALTER TABLE plays ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_plays_deleted ON plays(deleted_at) WHERE deleted_at IS NULL;
```

### 5.4 Audit Columns

All tables include `created_at` and most include `updated_at`. 

**Recommendation:** Add full audit trails for compliance:

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,  -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.5 Denormalization Strategy

The schema uses strategic denormalization for performance:

| Table | Denormalized Column | Source |
|-------|---------------------|--------|
| `plays` | `personnel_code` | `personnel_groupings.code` |
| `plays` | `formation_name` | Domain lookup |
| `player_play_mastery` | `mastery_level` | Calculated from `mastery_score` |
| `install_plays_detail_view` | `effective_rep_target` | Computed from hierarchy |

### 5.6 Index Strategy

The migration includes indexes on:

- All foreign keys
- Frequently filtered columns (`team_id`, `user_id`, `install_id`)
- Composite indexes for common query patterns
- Partial indexes for status flags (`WHERE is_emphasis = TRUE`)

**High-traffic tables to monitor:**
- `play_rep_events` (high write volume)
- `player_flashcard_attempts` (high write volume)
- `player_play_mastery` (frequent reads/updates)

### 5.7 Future Considerations

1. **Read Replicas**: Route read-heavy queries (analytics, dashboards) to read replicas
2. **Caching Layer**: Add Redis caching for:
   - Install plays list
   - Player mastery summaries
   - Due flashcards count
3. **Background Jobs**: Process mastery recalculations asynchronously
4. **Archive Strategy**: Move completed season data to archive tables

---

## Appendix A: Enum Definitions

```sql
CREATE TYPE play_type AS ENUM ('PASS', 'RUN', 'RPO', 'SCREEN', 'TRICK', 'SPECIAL');

CREATE TYPE skill_position AS ENUM (
  'QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE',
  'LT', 'LG', 'C', 'RG', 'RT'
);

CREATE TYPE mastery_level AS ENUM ('new', 'learning', 'proficient', 'mastered');

CREATE TYPE flashcard_category AS ENUM (
  'alignment', 'assignment', 'coverage', 'motion', 
  'read', 'progression', 'terminology', 'blocking'
);

CREATE TYPE motion_type AS ENUM (
  'jet', 'orbit', 'shift', 'trade', 'stack', 'empty', 'bunch', 'zip'
);

CREATE TYPE motion_timing AS ENUM (
  'pre_huddle', 'at_line', 'on_cadence', 'on_snap', 'post_snap'
);

CREATE TYPE install_status AS ENUM ('upcoming', 'active', 'completed');

CREATE TYPE ai_insight_type AS ENUM (
  'weak_concept', 'progress_update', 'study_recommendation',
  'install_readiness', 'coverage_gap', 'assignment_gap',
  'streak_milestone', 'mastery_achieved'
);

CREATE TYPE coverage_effectiveness AS ENUM ('excellent', 'good', 'neutral', 'poor');
```

---

## Appendix B: Mastery Calculation Formula

```typescript
mastery_score = (
  quiz_accuracy * 0.40 +              // 40% weight
  rep_completion_pct * 0.25 +         // 25% weight  
  category_balance * 0.20 +           // 20% weight
  recency_score * 0.15                // 15% weight
)

Where:
- quiz_accuracy = (quiz_correct / quiz_attempts) * 100
- rep_completion_pct = MIN(100, (reps_completed / reps_target) * 100)
- category_balance = (MIN(category_scores) * 0.4 + AVG(category_scores) * 0.6)
- recency_score = MAX(0, 100 - (days_since_last_study * 5))

Mastery Levels:
- new: 0-20
- learning: 21-50
- proficient: 51-80
- mastered: 81-100
```

---

## Appendix C: Spaced Repetition (SM-2) Parameters

```typescript
// Initial values
ease_factor = 2.5
interval = 0

// After correct answer
if (interval === 0) interval = 1
else if (interval === 1) interval = 3
else interval = ROUND(interval * ease_factor)
ease_factor = MAX(1.3, ease_factor + 0.1)

// After incorrect answer
interval = 1
ease_factor = MAX(1.3, ease_factor - 0.2)

// Next due date
next_due_date = CURRENT_DATE + interval
```

---

*This schema supports all functional requirements specified in `PLAYBOOK_SPEC.md` and integrates cleanly with the existing Games and Film Room schemas.*




