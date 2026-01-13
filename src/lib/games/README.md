# Chalkboard Games Backend

A comprehensive backend system for the Chalkboard football IQ gaming platform. This module handles all scoring, XP progression, leaderboards, and game session management.

## 📁 Architecture Overview

```
src/
├── lib/
│   ├── database/
│   │   └── schema.sql          # Complete Postgres schema with RLS
│   ├── games/
│   │   ├── scoring.ts          # Scoring engine & XP calculations
│   │   ├── leaderboard.ts      # Leaderboard computation & caching
│   │   └── README.md           # This file
│   ├── supabase/
│   │   └── client.ts           # Supabase client configuration
│   └── types/
│       └── database.ts         # TypeScript type definitions
└── app/api/games/
    ├── session/
    │   ├── start/route.ts      # POST: Start new game session
    │   ├── submit-attempt/route.ts  # POST: Submit answer
    │   └── finish/route.ts     # POST: Complete session
    ├── summary/route.ts        # GET: Player stats & history
    ├── leaderboard/route.ts    # GET: Rankings
    └── daily-challenge/route.ts # GET/POST: Daily challenges
```

---

## 🎯 Game Types

| Game Type | Description | Default Questions | Time Limit |
|-----------|-------------|-------------------|------------|
| `coverage_recognition` | Identify defensive coverages | 25 | 45s |
| `blitz_id` | Call protections against pressures | 20 | 30s |
| `route_matching` | Identify route concepts | 30 | 25s |
| `formation_memory` | Memorize and recreate formations | 15 | 60s |
| `play_responsibility` | Position-specific assignment quiz | 20 | 40s |
| `red_zone_scenarios` | Decision-making inside the 20 | 18 | 35s |
| `two_minute_drill` | Clock management decisions | 10 | 90s |
| `film_reaction` | Quick film analysis | 35 | 20s |

---

## 📊 Scoring System

### Base Scoring Formula

```typescript
totalPoints = (basePoints + timeBonus) × streakMultiplier × difficultyMultiplier
```

### Components

| Component | Value | Notes |
|-----------|-------|-------|
| Base Points | 100 | Per correct answer |
| Time Bonus | 0-50 | Fast answers (< 2s = max, > 15s = 0) |
| Streak Multiplier | 1.0-2.0 | +0.1 per correct after 3 in a row |
| Difficulty Multiplier | Easy: 1.0, Medium: 1.5, Hard: 2.0, Expert: 2.5 | |
| Mode Multiplier | Train: 1.0, Compete: 1.25 | |

### Time Bonus Calculation

```typescript
function calculateTimeBonus(timeTakenMs: number): number {
  if (timeTakenMs < 500) return 0;           // Anti-bot
  if (timeTakenMs <= 2000) return 50;        // Max bonus
  if (timeTakenMs >= 15000) return 0;        // No bonus
  
  // Linear interpolation
  const ratio = 1 - (timeTakenMs - 2000) / 13000;
  return Math.round(50 * ratio);
}
```

### Streak Multiplier

| Streak Length | Multiplier |
|---------------|------------|
| 1-2 | 1.0× |
| 3 | 1.1× |
| 4 | 1.2× |
| 5 | 1.3× |
| 10+ | 2.0× (max) |

---

## ⭐ XP & Level System

### XP Earning

| Source | XP Amount |
|--------|-----------|
| Base (from score) | `score × 0.1` |
| Game Completion | +50 |
| Perfect Game | +200 |
| First Play of Day | +100 |
| Daily Streak (7+ days) | +200 |
| Daily Challenge | +500 (varies) |

### Level Progression

XP required follows polynomial growth: `XP = 500 × level^1.5`

| Level | Title | Total XP Required |
|-------|-------|-------------------|
| 1-3 | Rookie | 0 - 1,250 |
| 4-6 | Sophomore | 2,250 - 5,750 |
| 7-9 | Varsity | 8,250 - 14,750 |
| 10-12 | Starter | 18,750 - 28,250 |
| 13-15 | All-Conference | 33,750 - 46,250 |
| 16-18 | All-American | 53,250 - 68,750 |
| 19-21 | Pro | 77,250 - 96,250 |
| 22-24 | Elite | 107,250 - 132,250 |
| 25-30 | Hall of Fame / Legend | 146,250+ |
| 31-35 | GOAT | 262,750+ |

---

## 🏆 Leaderboard System

### Scopes

| Scope | Description |
|-------|-------------|
| `team` | All players on your team |
| `position_room` | Players in your position group (e.g., WR Room) |
| `global` | All Chalkboard users |

### Time Windows

| Window | Reset Frequency |
|--------|-----------------|
| `daily` | Midnight local time |
| `weekly` | Sunday midnight |
| `season` | August 1st |
| `all_time` | Never |

### Ranking Criteria (Tie-breakers)

1. **XP earned** (primary)
2. Accuracy percentage
3. Games played
4. Current streak

### Position Groups

```typescript
const POSITION_GROUPS = {
  'QB Room': ['QB'],
  'RB Room': ['RB', 'FB'],
  'WR Room': ['WR'],
  'TE Room': ['TE'],
  'O-Line': ['OT', 'OG', 'C'],
  'D-Line': ['DE', 'DT', 'NT'],
  'Linebackers': ['OLB', 'ILB', 'MLB'],
  'Secondary': ['CB', 'FS', 'SS'],
  'Special Teams': ['K', 'P', 'LS'],
};
```

---

## 🔒 Multi-Tenant Security

### Row-Level Security (RLS)

All tables have RLS enabled. Key policies:

```sql
-- Users see their own team's data
CREATE POLICY "Team members can view team" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = teams.id AND u.auth_id = auth.uid()
    )
  );

-- Users can only create sessions for themselves
CREATE POLICY "Users can insert own sessions" ON game_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = game_sessions.user_id AND u.auth_id = auth.uid()
    )
  );
```

### Permission Model

| Role | Capabilities |
|------|-------------|
| `player` | Play games, view own stats, view team leaderboard |
| `coach` | All player abilities + create questions, view all player stats |
| `admin` | All coach abilities + manage team settings, invite members |

---

## 🛡️ Anti-Exploit Measures

### Session Validation

```typescript
const ANTI_EXPLOIT = {
  MIN_SESSION_DURATION_SECONDS: 30,
  MAX_GAMES_PER_HOUR: 20,
  SUSPICIOUS_ACCURACY_THRESHOLD: 0.3,
  SUSPICIOUS_AVG_RESPONSE_TIME_MS: 800,
};
```

### Detection Flags

| Flag | Trigger | Penalty |
|------|---------|---------|
| Session too short | < 30 seconds | Invalid session |
| Fast average response | < 800ms average | 50% XP penalty |
| Random guessing | < 30% accuracy + fast | 75% XP penalty |
| Consistent timing | < 100ms std dev | Invalid session |

---

## 📡 API Reference

### Start Session

```http
POST /api/games/session/start
Content-Type: application/json
Authorization: Bearer <token>

{
  "game_type": "coverage_recognition",
  "team_id": "uuid",
  "mode": "train",
  "difficulty": "medium",
  "question_count": 25
}
```

**Response:**
```json
{
  "session": { /* GameSession object */ },
  "questions": [ /* Question objects (answers hidden) */ ]
}
```

### Submit Attempt

```http
POST /api/games/session/submit-attempt
Content-Type: application/json

{
  "session_id": "uuid",
  "question_id": "uuid",
  "selected_answer_id": "opt-2",
  "time_taken_ms": 3500
}
```

**Response:**
```json
{
  "attempt": { /* GameAttempt object */ },
  "is_correct": true,
  "correct_answer_id": "opt-2",
  "explanation": "Correct! This is Cover 3 because...",
  "points_earned": 175,
  "current_streak": 5,
  "session_progress": {
    "current_question": 10,
    "total_questions": 25,
    "current_score": 1450,
    "accuracy": 90
  }
}
```

### Finish Session

```http
POST /api/games/session/finish
Content-Type: application/json

{
  "session_id": "uuid"
}
```

**Response:**
```json
{
  "session": { /* Completed GameSession */ },
  "xp_events": [ /* XPEvent objects */ ],
  "level_up": true,
  "new_level": 25,
  "streak_updated": true,
  "new_streak": 8,
  "achievements_unlocked": ["coverage_master", "perfect_10"]
}
```

### Get Summary

```http
GET /api/games/summary?team_id=uuid
```

**Response:**
```json
{
  "user": { /* User object */ },
  "team_stats": { /* UserTeamStats object */ },
  "streak": { /* UserStreak object */ },
  "recent_sessions": [ /* Last 10 sessions */ ],
  "level_progress": {
    "current_level": 24,
    "current_xp": 8750,
    "xp_for_level": 132250,
    "xp_to_next": 14000,
    "progress_percent": 62.5
  },
  "game_stats": [ /* Per-game type stats */ ]
}
```

### Get Leaderboard

```http
GET /api/games/leaderboard?team_id=uuid&scope=team&time_window=weekly&limit=25
```

**Response:**
```json
{
  "entries": [ /* LeaderboardEntry objects */ ],
  "user_rank": 3,
  "total_participants": 45,
  "time_window": "weekly",
  "window_start": "2024-01-14T00:00:00Z",
  "window_end": "2024-01-20T23:59:59Z"
}
```

### Get Daily Challenge

```http
GET /api/games/daily-challenge?team_id=uuid
```

**Response:**
```json
{
  "challenge": { /* DailyChallenge object */ },
  "user_completion": null,
  "expires_at": "2024-01-15T23:59:59Z",
  "time_remaining_seconds": 52341
}
```

---

## 🚀 Getting Started

### 1. Set up Supabase

1. Create a new Supabase project
2. Run `schema.sql` in the SQL editor
3. Add environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 3. Enable Real Client

Uncomment the client creation functions in `src/lib/supabase/client.ts`.

### 4. Test the APIs

```bash
# Start dev server
npm run dev

# Test start session
curl -X POST http://localhost:3000/api/games/session/start \
  -H "Content-Type: application/json" \
  -d '{"game_type": "coverage_recognition", "team_id": "test-team"}'
```

---

## 📈 Performance Considerations

### Indexes

Key indexes are defined in `schema.sql` for:
- Leaderboard queries (`team_id`, `started_at`, `final_score`)
- User lookups (`user_id`, `team_id`)
- Question filtering (`game_id`, `difficulty`, `category`)

### Caching Strategy

| Data | TTL | Strategy |
|------|-----|----------|
| Daily leaderboard | 5 min | In-memory / Redis |
| Weekly leaderboard | 15 min | Materialized view |
| Season leaderboard | 1 hour | Materialized view |
| All-time leaderboard | 6 hours | Materialized view |

### Triggers

Database triggers automatically:
- Update user XP when `xp_events` are inserted
- Update streaks when sessions complete
- Recalculate levels based on XP

---

## 🧪 Testing

### Unit Tests

```typescript
import { ScoringEngine } from '@/lib/games/scoring';

describe('ScoringEngine', () => {
  test('calculates time bonus correctly', () => {
    expect(ScoringEngine.calculateTimeBonus(1500)).toBe(50);  // Fast
    expect(ScoringEngine.calculateTimeBonus(8500)).toBe(25);  // Medium
    expect(ScoringEngine.calculateTimeBonus(20000)).toBe(0);  // Slow
  });
  
  test('calculates streak multiplier', () => {
    expect(ScoringEngine.calculateStreakMultiplier(2)).toBe(1.0);
    expect(ScoringEngine.calculateStreakMultiplier(5)).toBe(1.3);
    expect(ScoringEngine.calculateStreakMultiplier(15)).toBe(2.0);
  });
});
```

---

## 📋 Future Enhancements

- [ ] Achievement system with badges
- [ ] Team-wide challenges
- [ ] Head-to-head multiplayer mode
- [ ] Custom question uploads for coaches
- [ ] Analytics dashboard for coaches
- [ ] Seasonal rewards and titles
- [ ] Position-specific IQ ratings
- [ ] Integration with play-designer for custom formations

---

Built with 🏈 for Chalkboard








