# 🔗 CHALKBOARD – GAMES BRIDGE CONTRACT

## Connecting Backend/Logic Agent ↔ Analytics & Coach Reports Agent

**Version:** 1.0  
**Last Updated:** 2024-11-28  
**Status:** ACTIVE

---

## 1️⃣ Agent Ownership Matrix

### A. Games Backend & Logic Agent — "ENGINE"

**Owns:**
- Game definitions and types (`games` table)
- Scoring logic & formulas (`scoring.ts`)
- XP system & levels (`levels` table, `xp_events`)
- Streaks, daily challenges, rewards
- Core data model for gameplay (`game_sessions`, `game_attempts`)
- Write APIs: start, submit, finish sessions

**Responsibilities:**
- Write clean, normalized data
- Ensure `metadata` JSONB contains all fields needed by Analytics
- Maintain scoring formula consistency
- Validate and flag suspicious sessions

### B. Game Analytics & Coach Reports Agent — "INSIGHTS"

**Owns:**
- Football IQ metrics and indices
- Readiness and mastery scores
- Trends, comparisons, rankings
- Coach and player dashboards
- Aggregation views and analytics endpoints

**Responsibilities:**
- Read-only access to core tables
- Create and maintain analytics views
- Never modify gameplay rules or scoring
- Interpret data written by Engine

---

## 2️⃣ Shared Data Contract

### Core Tables (Owned by ENGINE, Read by INSIGHTS)

#### `users`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | → teams.id (via team_members) |
| `position` | football_position | Player position (QB, WR, etc.) |
| `position_group` | VARCHAR | Room grouping (via team_members) |
| `role` | user_role | player, coach, admin |
| `total_xp` | BIGINT | Cumulative XP |
| `current_level` | INT | Derived from total_xp |

#### `teams`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Team display name |
| `slug` | VARCHAR | URL-safe identifier |

#### `games`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `type` | game_type | Enum: coverage_recognition, blitz_id, etc. |
| `name` | VARCHAR | Display name |
| `category` | VARCHAR | **NEW** - coverage, blitz, situational, memory |
| `base_points_per_correct` | INT | Scoring base |

#### `game_sessions`
| Field | Type | Description | Analytics Usage |
|-------|------|-------------|-----------------|
| `id` | UUID | Primary key | Session aggregation |
| `user_id` | UUID | → users.id | Player grouping |
| `team_id` | UUID | → teams.id | Team aggregation |
| `game_id` | UUID | → games.id | Game type filtering |
| `mode` | game_mode | train, compete | Mode breakdown |
| `difficulty` | difficulty_level | easy/medium/hard/expert | Difficulty weighting |
| `started_at` | TIMESTAMPTZ | Session start | Time windows |
| `finished_at` | TIMESTAMPTZ | Session end | Duration calc |
| `final_score` | INT | **TOTAL_SCORE** | Score rankings |
| `xp_earned` | INT | **TOTAL_XP_EARNED** | XP leaderboards |
| `accuracy` | DECIMAL(5,2) | **ACCURACY** (0-100%) | IQ calculation |
| `correct_answers` | INT | Correct count | Accuracy calc |
| `total_questions` | INT | Total questions | Accuracy calc |
| `avg_response_time_ms` | INT | Speed metric | Speed factor |
| `longest_streak` | INT | Best streak | Consistency |

#### `game_attempts`
| Field | Type | Description | Analytics Usage |
|-------|------|-------------|-----------------|
| `id` | UUID | Primary key | Attempt counting |
| `session_id` | UUID | → game_sessions.id | Session grouping |
| `question_id` | UUID | → questions.id | Concept lookup |
| `is_correct` | BOOLEAN | Correctness | Accuracy calc |
| `time_taken_ms` | INT | Response time | Speed factor |
| `difficulty` | difficulty_level | **NEW** - Denormalized | Difficulty weighting |
| `concept_key` | VARCHAR | **NEW** - e.g., COVER_3, MESH | Concept-level IQ |
| `metadata` | JSONB | Extended data | Flexible analytics |

#### `xp_events`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | → users.id |
| `session_id` | UUID | → game_sessions.id |
| `game_type` | game_type | Source game |
| `xp_amount` | INT | XP earned |
| `event_type` | xp_event_type | Source type |
| `created_at` | TIMESTAMPTZ | Timestamp |

---

## 3️⃣ Field Definitions (MUST BE SHARED)

### `final_score` (alias: total_score)
**Definition:** The final numeric score for a session after all multipliers and bonuses.

```
final_score = (raw_score × difficulty_multiplier) + time_bonus + streak_bonus

Where:
- raw_score = Σ(attempt.total_points)
- difficulty_multiplier = { easy: 1.0, medium: 1.5, hard: 2.0, expert: 2.5 }
- time_bonus = bonus for fast overall completion
- streak_bonus = bonus accumulated from answer streaks
```

### `xp_earned` (alias: total_xp_earned)
**Definition:** XP granted from that session after all bonuses.

```
xp_earned = base_xp + completion_bonus + perfect_bonus + first_play_bonus + streak_bonus

Where:
- base_xp = final_score × 0.1
- completion_bonus = 50 XP
- perfect_bonus = 200 XP (if 100% accuracy and 5+ questions)
- first_play_bonus = 100 XP (first game of day)
- streak_bonus = [0, 0, 25, 50, 75, 100, 150, 200, 250][min(streak_days, 8)]

Minimum: 25 XP per completed game
```

### `accuracy`
**Definition:** Percentage of correct answers (0-100 scale).

```
accuracy = (correct_answers / total_questions) × 100

Note: Stored as DECIMAL(5,2) to support values like 87.50%
```

### `concept_key`
**Definition:** Identifier for the specific football concept being tested.

**Format:** `UPPERCASE_SNAKE_CASE`

**Examples by Game Type:**
| Game Type | Concept Keys |
|-----------|--------------|
| coverage_recognition | `COVER_0`, `COVER_1`, `COVER_2`, `COVER_3`, `COVER_4`, `COVER_6`, `QUARTERS`, `MATCH` |
| blitz_id | `ZONE_BLITZ`, `MAN_BLITZ`, `ZONE_DOG`, `FIRE_ZONE`, `OVERLOAD`, `A_GAP`, `B_GAP` |
| route_matching | `MESH`, `DRIVE`, `SMASH`, `MILLS`, `DAGGER`, `FLOOD`, `LEVELS` |
| formation_memory | `EMPTY`, `PISTOL`, `SHOTGUN`, `I_FORM`, `SINGLEBACK`, `TRIPS`, `BUNCH` |
| play_responsibility | `HOT_ROUTE`, `PROTECTION`, `MOTION_KEY`, `ASSIGNMENT` |
| red_zone_scenarios | `REDZONE_GL`, `REDZONE_10`, `REDZONE_20` |
| two_minute_drill | `2MIN_TRAILING`, `2MIN_TIED`, `2MIN_LEADING`, `CLOCK_MGMT` |
| film_reaction | `FILM_COV`, `FILM_BLITZ`, `FILM_ROUTE` |

### `category` (on games table)
**Definition:** High-level grouping of game types for analytics.

| Category | Game Types |
|----------|------------|
| `coverage` | coverage_recognition, film_reaction (coverage) |
| `blitz` | blitz_id |
| `routes` | route_matching |
| `memory` | formation_memory |
| `situational` | red_zone_scenarios, two_minute_drill |
| `assignment` | play_responsibility |

---

## 4️⃣ IQ Score Computation

### Overall Football IQ (0-100)

```typescript
Football_IQ = (
  accuracy_factor × 0.35 +     // 35% weight
  speed_factor × 0.20 +        // 20% weight
  difficulty_factor × 0.25 +   // 25% weight
  consistency_factor × 0.10 +  // 10% weight
  engagement_factor × 0.10     // 10% weight
) × 100
```

### Coverage IQ

**Source Data:**
- `game_sessions` WHERE `game_id` → `games.type` IN ('coverage_recognition', 'film_reaction')
- `game_attempts` WHERE `concept_key` LIKE 'COVER_%' OR 'QUARTERS' OR 'MATCH'

**Formula:**
```sql
Coverage_IQ = (
  (AVG(accuracy) / 100) * 0.70 +     -- 70% accuracy
  speed_score * 0.30                  -- 30% speed
) * 100

WHERE:
  speed_score = CASE
    WHEN AVG(avg_response_time_ms) < 3000 THEN 1.0
    WHEN AVG(avg_response_time_ms) < 6000 THEN 0.7
    WHEN AVG(avg_response_time_ms) < 10000 THEN 0.5
    ELSE 0.3
  END
```

### Blitz IQ

**Source Data:**
- `game_sessions` WHERE `game_id` → `games.type` = 'blitz_id'
- `game_attempts` WHERE `concept_key` LIKE '%_BLITZ' OR '%_GAP' OR 'OVERLOAD'

**Formula:**
```sql
Blitz_IQ = (
  (AVG(accuracy) / 100) * 0.70 +
  speed_score * 0.30
) * 100
```

### Situational IQ

**Source Data:**
- `game_sessions` WHERE `game_id` → `games.type` IN ('red_zone_scenarios', 'two_minute_drill')

**Formula:**
```sql
Situational_IQ = (
  (AVG(accuracy) / 100) * 0.60 +    -- Accuracy matters less
  speed_score * 0.20 +               -- Speed under pressure
  difficulty_bonus * 0.20            -- Harder scenarios weighted more
) * 100
```

---

## 5️⃣ Metadata Requirements

### game_attempts.metadata (Written by ENGINE)

The ENGINE must write this JSONB on each attempt for INSIGHTS to compute concept-level analytics:

```json
{
  "concept_key": "COVER_3",           // REQUIRED - for concept grouping
  "concept_family": "zone",           // REQUIRED - zone, man, match, pressure
  "difficulty": "medium",             // REQUIRED - denormalized for speed
  "question_category": "coverage",    // REQUIRED - high-level category
  "formation": "3x1",                 // OPTIONAL - if applicable
  "down_distance": "3rd_and_7",       // OPTIONAL - situational context
  "field_position": "own_35",         // OPTIONAL - field context
  "time_remaining": null,             // OPTIONAL - clock context
  "response_confidence": null         // FUTURE - player confidence rating
}
```

### game_sessions.metadata (Written by ENGINE)

```json
{
  "concepts_tested": ["COVER_2", "COVER_3", "QUARTERS"],
  "concept_accuracy": {
    "COVER_2": 1.0,
    "COVER_3": 0.8,
    "QUARTERS": 0.5
  },
  "difficulty_breakdown": {
    "easy": { "total": 5, "correct": 5 },
    "medium": { "total": 10, "correct": 7 },
    "hard": { "total": 5, "correct": 3 }
  },
  "streak_history": [1, 2, 3, 4, 0, 1, 2],
  "client_info": {
    "platform": "web",
    "version": "1.2.0"
  }
}
```

---

## 6️⃣ Analytics Views (Owned by INSIGHTS)

### `player_game_stats_view`

Aggregates player performance by game type.

```sql
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
  STDDEV(gs.accuracy) AS accuracy_variance
FROM game_sessions gs
JOIN games g ON gs.game_id = g.id
WHERE gs.status = 'completed'
GROUP BY gs.user_id, gs.team_id, g.type, g.category;
```

### `player_concept_mastery_view`

Tracks mastery per concept.

```sql
CREATE OR REPLACE VIEW player_concept_mastery_view AS
SELECT 
  ga.user_id,
  gs.team_id,
  ga.concept_key,
  g.type AS game_type,
  COUNT(*) AS total_reps,
  SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) AS correct_reps,
  (SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100 AS accuracy,
  AVG(ga.time_taken_ms) AS avg_response_time,
  MAX(ga.answered_at) AS last_practiced
FROM game_attempts ga
JOIN game_sessions gs ON ga.session_id = gs.id
JOIN games g ON gs.game_id = g.id
WHERE ga.concept_key IS NOT NULL
GROUP BY ga.user_id, gs.team_id, ga.concept_key, g.type;
```

### `player_iq_scores_view`

Computes IQ scores per player.

```sql
CREATE OR REPLACE VIEW player_iq_scores_view AS
WITH category_stats AS (
  SELECT 
    user_id,
    team_id,
    category,
    AVG(avg_accuracy) AS accuracy,
    AVG(avg_response_time) AS response_time,
    SUM(games_played) AS games
  FROM player_game_stats_view
  GROUP BY user_id, team_id, category
),
speed_scores AS (
  SELECT 
    user_id,
    team_id,
    category,
    accuracy,
    CASE
      WHEN response_time < 3000 THEN 1.0
      WHEN response_time < 6000 THEN 0.7
      WHEN response_time < 10000 THEN 0.5
      ELSE 0.3
    END AS speed_factor,
    games
  FROM category_stats
)
SELECT 
  user_id,
  team_id,
  -- Category IQs
  MAX(CASE WHEN category = 'coverage' 
    THEN ROUND((accuracy * 0.7 + speed_factor * 30)) END) AS coverage_iq,
  MAX(CASE WHEN category = 'blitz' 
    THEN ROUND((accuracy * 0.7 + speed_factor * 30)) END) AS blitz_iq,
  MAX(CASE WHEN category = 'situational' 
    THEN ROUND((accuracy * 0.6 + speed_factor * 40)) END) AS situational_iq,
  MAX(CASE WHEN category = 'routes' 
    THEN ROUND((accuracy * 0.7 + speed_factor * 30)) END) AS route_iq,
  MAX(CASE WHEN category = 'memory' 
    THEN ROUND((accuracy * 0.7 + speed_factor * 30)) END) AS formation_iq,
  MAX(CASE WHEN category = 'assignment' 
    THEN ROUND((accuracy * 0.7 + speed_factor * 30)) END) AS assignment_iq,
  -- Overall Football IQ (weighted average)
  ROUND(
    COALESCE(MAX(CASE WHEN category = 'coverage' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.25 +
    COALESCE(MAX(CASE WHEN category = 'blitz' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.20 +
    COALESCE(MAX(CASE WHEN category = 'situational' THEN accuracy * 0.6 + speed_factor * 40 END), 50) * 0.15 +
    COALESCE(MAX(CASE WHEN category = 'routes' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.15 +
    COALESCE(MAX(CASE WHEN category = 'memory' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.10 +
    COALESCE(MAX(CASE WHEN category = 'assignment' THEN accuracy * 0.7 + speed_factor * 30 END), 50) * 0.15
  ) AS football_iq,
  SUM(games) AS total_games
FROM speed_scores
GROUP BY user_id, team_id;
```

### `team_analytics_snapshot`

Periodic snapshots for dashboard performance.

```sql
CREATE TABLE team_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id),
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly'
  
  -- Aggregate metrics
  total_sessions INT,
  total_xp_earned BIGINT,
  active_players INT,
  average_accuracy DECIMAL(5,2),
  average_football_iq INT,
  
  -- Position breakdown (JSONB)
  position_breakdown JSONB,
  
  -- Top performers
  top_performers JSONB,
  
  -- At-risk players
  at_risk_players JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, snapshot_date, snapshot_type)
);
```

---

## 7️⃣ API Division

### ENGINE APIs (Write-Heavy)

```
POST /api/games/session/start
  → Creates game_session, returns questions
  
POST /api/games/session/submit-attempt
  → Creates game_attempt with concept_key & metadata
  → Updates session running totals
  
POST /api/games/session/finish
  → Finalizes game_session
  → Creates xp_events
  → Updates user totals
  
GET /api/games/summary
  → Basic player XP/level info
```

### INSIGHTS APIs (Read-Heavy)

```
GET /api/analytics/player/:id/summary
  → Football IQ, category breakdown, recent trends
  
GET /api/analytics/player/:id/trends
  → Time-series data for charts
  
GET /api/analytics/player/:id/readiness
  → Install readiness scores by concept
  
GET /api/analytics/team/:teamId/dashboard
  → KPIs, rankings, call-outs, position rooms
  
GET /api/analytics/team/:teamId/position/:group
  → Position room deep-dive
  
GET /api/analytics/recommendations/:playerId
  → Suggested focus areas
```

---

## 8️⃣ Coordination Checklist

### When Adding a New Game Type

1. **ENGINE:**
   - [ ] Add to `game_type` enum
   - [ ] Create `games` row with `category`
   - [ ] Define `concept_key` values
   - [ ] Implement scoring logic
   - [ ] Write metadata on attempts

2. **INSIGHTS:**
   - [ ] Map game to IQ category
   - [ ] Update IQ calculation weights
   - [ ] Add to dashboards
   - [ ] Update recommendations

### When Changing Scoring

1. **ENGINE:**
   - [ ] Update `scoring.ts`
   - [ ] Document formula change
   - [ ] Notify INSIGHTS

2. **INSIGHTS:**
   - [ ] Review IQ impact
   - [ ] Adjust normalization if needed
   - [ ] Update trend baselines

---

## 9️⃣ Confirmation of Shared Meanings

| Term | ENGINE Definition | INSIGHTS Usage | ✓ |
|------|-------------------|----------------|---|
| `final_score` | Sum of attempt points × difficulty + bonuses | Rankings, performance comparison | ✓ |
| `accuracy` | correct / total × 100 | IQ calculation, risk detection | ✓ |
| `concept_key` | Football concept identifier | Concept-level mastery tracking | ✓ |
| `category` | High-level game grouping | IQ category routing | ✓ |
| `xp_earned` | XP from session including bonuses | Leaderboards, progression | ✓ |

---

## 🔒 Contract Signatures

**Games Backend & Logic Agent:** ✅ Confirmed  
**Game Analytics & Coach Reports Agent:** ✅ Confirmed

---

*This contract is the source of truth for all Games module development.*








